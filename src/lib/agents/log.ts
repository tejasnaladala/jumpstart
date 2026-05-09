// Agent invocation log writer. Persists every agent call to a structured
// log so we can replay, debug, and feed back into autoresearch.
//
// In stub mode (no Supabase), writes to a local JSONL file at
// .jumpstart-logs/agent.jsonl. Capped at 10MB with rotation.
//
// In production with Supabase, inserts into the agent_logs table using
// the service role client AND continues to file-log as a belt-and-suspenders
// trail. The Supabase insert is best-effort and never throws.

import { promises as fs } from "node:fs";
import path from "node:path";
import type { RunResult } from "./runner";
import { getServiceRoleClient } from "@/lib/supabase/server";

const LOG_DIR = path.resolve(process.cwd(), ".jumpstart-logs");
const LOG_FILE = path.join(LOG_DIR, "agent.jsonl");
const ROTATION_BYTES = 10 * 1024 * 1024; // 10MB
const ROTATIONS_KEPT = 5;

let dirReady = false;

async function ensureDir() {
  if (dirReady) return;
  try {
    await fs.mkdir(LOG_DIR, { recursive: true });
    // Containment: realpath both the log dir and the project root and
    // refuse to use the dir if it escapes (symlink trick). Fool CP2 #3.
    const realLog = await fs.realpath(LOG_DIR);
    const realRoot = await fs.realpath(process.cwd());
    if (!realLog.startsWith(realRoot)) {
      return;
    }
    dirReady = true;
  } catch {
    // best effort; if we cannot create the dir, log writes silently no-op
  }
}

async function rotateIfNeeded() {
  try {
    const stat = await fs.stat(LOG_FILE);
    if (stat.size < ROTATION_BYTES) return;
    // shift existing rotations
    for (let i = ROTATIONS_KEPT - 1; i >= 1; i--) {
      const from = `${LOG_FILE}.${i}`;
      const to = `${LOG_FILE}.${i + 1}`;
      try {
        await fs.rename(from, to);
      } catch {
        // ignore missing
      }
    }
    await fs.rename(LOG_FILE, `${LOG_FILE}.1`);
  } catch {
    // file does not exist yet; nothing to rotate
  }
}

type LogEntry = {
  agent_name: string;
  user_id?: string;
  result: RunResult<unknown>;
  input_summary: string;
};

// Structured safety-block writer. Used by the intros route when the safety
// classifier flags or escalates. Goes to the same log file so the founder
// dashboard sees it without spreading across 5 files.
export async function recordSafetyBlock(info: {
  requester_id: string;
  recipient_id: string;
  risk_score: number;
  reasons: string[];
}): Promise<void> {
  await ensureDir();
  if (!dirReady) return;
  const line =
    JSON.stringify({
      ts: new Date().toISOString(),
      kind: "safety_block",
      requester_id: info.requester_id,
      recipient_id: info.recipient_id,
      risk_score: info.risk_score,
      reasons: info.reasons,
    }) + "\n";
  try {
    await rotateIfNeeded();
    await fs.appendFile(LOG_FILE, line, "utf-8");
  } catch {
    // never throw from a log writer
  }
}

export async function logAgentRun(entry: LogEntry): Promise<void> {
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (supabaseConfigured) {
    // Best-effort persistence. Failure here must never throw — the caller
    // is in the hot path of an agent invocation and we have a file fallback.
    try {
      const svc = getServiceRoleClient();
      await svc.from("agent_logs").insert({
        agent_name: entry.agent_name,
        user_id: entry.user_id ?? null,
        prompt: entry.input_summary,
        response: typeof entry.result.raw === "string" ? entry.result.raw : null,
        model: null,
        tokens_in: entry.result.tokens_in,
        tokens_out: entry.result.tokens_out,
        latency_ms: entry.result.latency_ms,
        cost_usd: Number(entry.result.cost_usd.toFixed(6)),
        feedback_signal: {
          ok: entry.result.ok,
          via: entry.result.via,
          attempts: entry.result.attempts ?? 1,
          error: entry.result.error ?? null,
        },
      });
    } catch {
      // Swallow. File log below still runs.
    }
  }

  await ensureDir();
  if (!dirReady) return;

  const line =
    JSON.stringify({
      ts: new Date().toISOString(),
      agent: entry.agent_name,
      user_id: entry.user_id ?? null,
      ok: entry.result.ok,
      via: entry.result.via,
      tokens_in: entry.result.tokens_in,
      tokens_out: entry.result.tokens_out,
      cost_usd: Number(entry.result.cost_usd.toFixed(6)),
      latency_ms: entry.result.latency_ms,
      attempts: entry.result.attempts ?? 1,
      error: entry.result.error ?? null,
      input_summary: entry.input_summary,
    }) + "\n";

  try {
    await rotateIfNeeded();
    await fs.appendFile(LOG_FILE, line, "utf-8");
  } catch {
    // never throw from a log writer
  }
}
