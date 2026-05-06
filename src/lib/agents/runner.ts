// Agent runner. Calls the Anthropic API if ANTHROPIC_API_KEY is present and
// not gated by JUMPSTART_FORCE_STUBS, otherwise routes to local heuristic
// stubs. In production, refuses to start in stub mode without an explicit
// opt-in env var.
//
// Production hardening:
// - Jittered exponential backoff retry up to 3 times
// - 30 second hard timeout per call (Sonnet) / 15 seconds (Haiku)
// - Prompt caching on system blocks (large and identical per agent)
// - JSON-mode discipline via assistant prefill
// - Single logAgentRun() writer to agent_logs (file-backed in dev,
//   Supabase-backed in prod)

import Anthropic from "@anthropic-ai/sdk";
import type { AgentDef } from "./types";
import { logAgentRun } from "./log";

let client: Anthropic | null = null;

function getClient() {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  if (process.env.JUMPSTART_FORCE_STUBS === "1") return null;
  client = new Anthropic({ apiKey });
  return client;
}

const MODEL_MAP: Record<AgentDef<unknown, unknown>["model"], string> = {
  "claude-sonnet-4-5": "claude-sonnet-4-5",
  "claude-haiku-4-5": "claude-haiku-4-5",
};

const TIMEOUT_MS: Record<AgentDef<unknown, unknown>["model"], number> = {
  "claude-sonnet-4-5": 30_000,
  "claude-haiku-4-5": 15_000,
};

const MAX_TOKENS_OUT: Record<AgentDef<unknown, unknown>["model"], number> = {
  "claude-sonnet-4-5": 2048,
  "claude-haiku-4-5": 1024,
};

export type RunResult<O> = {
  ok: boolean;
  output: O | null;
  raw: string;
  error?: string;
  tokens_in: number;
  tokens_out: number;
  latency_ms: number;
  cost_usd: number;
  via: "claude" | "stub" | "error";
  attempts: number;
};

export async function runAgent<I, O>(
  agent: AgentDef<I, O>,
  input: I,
  ctx: { user_id?: string } = {}
): Promise<RunResult<O>> {
  const start = Date.now();
  const c = getClient();

  if (!c) {
    if (process.env.NODE_ENV === "production" && process.env.JUMPSTART_FORCE_STUBS !== "1") {
      throw new Error(
        "ANTHROPIC_API_KEY is required in production. Set JUMPSTART_FORCE_STUBS=1 to override."
      );
    }
    const result: RunResult<O> = {
      ok: false,
      output: null,
      raw: "",
      error: "Anthropic key missing, using local stub",
      tokens_in: 0,
      tokens_out: 0,
      latency_ms: 0,
      cost_usd: 0,
      via: "stub",
      attempts: 0,
    };
    await logAgentRun({
      agent_name: agent.name,
      user_id: ctx.user_id,
      result,
      input_summary: summarize(input),
    });
    return result;
  }

  const timeout = TIMEOUT_MS[agent.model];
  const maxRetries = 3;
  let lastErr: unknown = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      type MessageLike = {
        content: Array<{ type: string; text?: string }>;
        usage?: { input_tokens?: number; output_tokens?: number };
      };

      const response = (await Promise.race([
        c.messages.create({
          model: MODEL_MAP[agent.model],
          max_tokens: MAX_TOKENS_OUT[agent.model],
          system: [{ type: "text", text: agent.system(), cache_control: { type: "ephemeral" } }] as unknown as string,
          messages: [
            { role: "user", content: agent.user(input) },
            { role: "assistant", content: "{" }, // JSON prefill
          ],
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new TimeoutError(`agent ${agent.name} timed out after ${timeout}ms`)), timeout)
        ),
      ])) as unknown as MessageLike;

      const text = response.content
        .filter((b) => b.type === "text")
        .map((b) => (b as { type: "text"; text: string }).text)
        .join("");

      // The prefill { is the start of the JSON. Re-prepend it.
      const raw = "{" + text;
      const output = agent.parse(raw);
      const tokens_in = response.usage?.input_tokens ?? 0;
      const tokens_out = response.usage?.output_tokens ?? 0;
      const cost_usd = estimateCost(agent.model, tokens_in, tokens_out);

      const result: RunResult<O> = {
        ok: true,
        output,
        raw,
        tokens_in,
        tokens_out,
        latency_ms: Date.now() - start,
        cost_usd,
        via: "claude",
        attempts: attempt,
      };

      await logAgentRun({
        agent_name: agent.name,
        user_id: ctx.user_id,
        result,
        input_summary: summarize(input),
      });

      return result;
    } catch (err) {
      lastErr = err;
      const transient = isTransient(err);
      if (!transient || attempt === maxRetries) break;
      const delay = backoffMs(attempt);
      await sleep(delay);
    }
  }

  const result: RunResult<O> = {
    ok: false,
    output: null,
    raw: "",
    error: lastErr instanceof Error ? lastErr.message : String(lastErr),
    tokens_in: 0,
    tokens_out: 0,
    latency_ms: Date.now() - start,
    cost_usd: 0,
    via: "error",
    attempts: maxRetries,
  };

  await logAgentRun({
    agent_name: agent.name,
    user_id: ctx.user_id,
    result,
    input_summary: summarize(input),
  });

  return result;
}

class TimeoutError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "TimeoutError";
  }
}

function isTransient(err: unknown): boolean {
  if (err instanceof TimeoutError) return true;
  if (err instanceof Error) {
    const m = err.message.toLowerCase();
    if (m.includes("rate") || m.includes("overload") || m.includes("529") || m.includes("503") || m.includes("timeout") || m.includes("etimedout")) return true;
  }
  if (typeof err === "object" && err !== null && "status" in err) {
    const s = (err as { status?: number }).status;
    if (s === 408 || s === 429 || s === 500 || s === 502 || s === 503 || s === 504 || s === 529) return true;
  }
  return false;
}

function backoffMs(attempt: number): number {
  // jittered exponential, capped at 4 seconds
  const base = Math.min(1000 * 2 ** (attempt - 1), 4000);
  const jitter = Math.random() * 0.4 + 0.8;
  return Math.floor(base * jitter);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function summarize(input: unknown): string {
  try {
    const s = JSON.stringify(input);
    return s.length > 240 ? s.slice(0, 240) + "..." : s;
  } catch {
    return String(input);
  }
}

// Anthropic price card per the public docs (https://docs.claude.com/en/docs/about-claude/pricing).
// Closes the Codex CEO-review finding that the original Haiku 4.5 prices
// (0.8 / 4.0) were stale. Sonnet 4.5 unchanged. Update this table when the
// list price moves.
const PRICE_PER_MTOK: Record<AgentDef<unknown, unknown>["model"], { in: number; out: number }> = {
  "claude-sonnet-4-5": { in: 3.0, out: 15.0 },
  "claude-haiku-4-5": { in: 1.0, out: 5.0 },
};

function estimateCost(
  model: AgentDef<unknown, unknown>["model"],
  tokens_in: number,
  tokens_out: number
): number {
  const p = PRICE_PER_MTOK[model];
  return (tokens_in * p.in + tokens_out * p.out) / 1_000_000;
}
