// Agent runner. Calls the Anthropic API if ANTHROPIC_API_KEY is present,
// otherwise routes to the local heuristic stubs so the dev experience is
// fully functional without keys.

import Anthropic from "@anthropic-ai/sdk";
import type { AgentDef } from "./types";

let client: Anthropic | null = null;

function getClient() {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  client = new Anthropic({ apiKey });
  return client;
}

const MODEL_MAP: Record<AgentDef<unknown, unknown>["model"], string> = {
  "claude-sonnet-4-5": "claude-sonnet-4-5",
  "claude-haiku-4-5": "claude-haiku-4-5",
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
};

export async function runAgent<I, O>(
  agent: AgentDef<I, O>,
  input: I
): Promise<RunResult<O>> {
  const start = Date.now();
  const c = getClient();

  if (!c) {
    return {
      ok: false,
      output: null,
      raw: "",
      error: "ANTHROPIC_API_KEY not set, falling back to local stub",
      tokens_in: 0,
      tokens_out: 0,
      latency_ms: 0,
      cost_usd: 0,
      via: "stub",
    };
  }

  try {
    const response = await c.messages.create({
      model: MODEL_MAP[agent.model],
      max_tokens: 2048,
      system: agent.system(),
      messages: [{ role: "user", content: agent.user(input) }],
    });

    const raw = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    const output = agent.parse(raw);
    const tokensIn = response.usage?.input_tokens ?? 0;
    const tokensOut = response.usage?.output_tokens ?? 0;

    return {
      ok: true,
      output,
      raw,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      latency_ms: Date.now() - start,
      cost_usd: estimateCost(agent.model, tokensIn, tokensOut),
      via: "claude",
    };
  } catch (err) {
    return {
      ok: false,
      output: null,
      raw: "",
      error: err instanceof Error ? err.message : String(err),
      tokens_in: 0,
      tokens_out: 0,
      latency_ms: Date.now() - start,
      cost_usd: 0,
      via: "error",
    };
  }
}

// Pricing rough estimate per million tokens.
const PRICE_PER_MTOK: Record<AgentDef<unknown, unknown>["model"], { in: number; out: number }> = {
  "claude-sonnet-4-5": { in: 3.0, out: 15.0 },
  "claude-haiku-4-5": { in: 0.8, out: 4.0 },
};

function estimateCost(
  model: AgentDef<unknown, unknown>["model"],
  tokensIn: number,
  tokensOut: number
): number {
  const p = PRICE_PER_MTOK[model];
  return (tokensIn * p.in + tokensOut * p.out) / 1_000_000;
}
