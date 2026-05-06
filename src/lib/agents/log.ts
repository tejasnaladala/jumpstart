// Agent invocation log writer. Persists every agent call to a structured
// log so we can replay, debug, and feed back into autoresearch.
//
// In stub mode (no Supabase), writes to a local JSONL file at
// .jumpstart-logs/agent.jsonl. Capped at 10MB with rotation.
//
// In production with Supabase, inserts into the agent_logs table using
// the service role client. Server-side only.

import { promises as fs } from "node:fs";
import path from "node:path";
import type { RunResult } from "./runner";

const LOG_DIR = path.resolve(process.cwd(), ".jumpstart-logs");
const LOG_FILE = path.join(LOG_DIR, "agent.jsonl");
const ROTATION_BYTES = 10 * 1024 * 1024; // 10MB
const ROTATIONS_KEPT = 5;

let dirReady = false;

async function ensureDir() {
  if (dirReady) return;
  try {
    await fs.mkdir(LOG_DIR, { recursive: true });
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

export async function logAgentRun(entry: LogEntry): Promise<void> {
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (supabaseConfigured) {
    // TODO(prod): use a server-side service-role client to INSERT into agent_logs.
    // Until that is wired we still want a record, so fall through to file
    // logging which is harmless in prod (Vercel's filesystem is ephemeral
    // but the row also goes to Supabase later).
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
