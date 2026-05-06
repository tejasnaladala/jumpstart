// Autoresearch observer. Runs the eval suite on a fixed cadence and
// records the score to experiments/autoresearch.jsonl. Trends are
// computed by the metrics emitter.
//
// In stub mode (no ANTHROPIC_API_KEY), evals fall back to local
// heuristic checks via the existing runner contract — the goal here
// is to keep the signal warm so a regression in eval logic is caught
// the moment it lands.
//
// Modes:
//   bun run research            - one eval cycle, exit
//   bun run research:loop       - run forever with HARNESS_RESEARCH_PAUSE_MS
//                                 between cycles (default 5 min)

import { existsSync, mkdirSync, appendFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const LOG_DIR = path.resolve(__dirname, "..", "..", "experiments");
const LOG = path.join(LOG_DIR, "autoresearch.jsonl");

function ensureDir(): void {
  if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });
}

function logEvent(event: Record<string, unknown>): void {
  ensureDir();
  appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...event }) + "\n", "utf-8");
}

const PAUSE_MS = Number.parseInt(process.env.HARNESS_RESEARCH_PAUSE_MS || "300000", 10);

// Run `bun run eval` and capture the METRIC lines + pass/fail counts.
async function runEvalCycle(cycle: number): Promise<{
  pass_rate: number;
  total: number;
  passed: number;
  duration_ms: number;
  ok: boolean;
}> {
  const start = Date.now();
  return new Promise((resolve) => {
    const child = spawn("bun", ["run", "eval"], {
      cwd: path.resolve(__dirname, "..", ".."),
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    child.stdout?.on("data", (d) => (out += d.toString()));
    child.stderr?.on("data", (d) => (out += d.toString()));
    child.on("exit", (code) => {
      const passMatch = /METRIC\s+eval_pass_rate=(\d+)/.exec(out);
      const totalMatch = /METRIC\s+eval_total=(\d+)/.exec(out);
      const passedMatch = /METRIC\s+eval_passed=(\d+)/.exec(out);
      const result = {
        pass_rate: passMatch ? Number.parseInt(passMatch[1] as string, 10) : 0,
        total: totalMatch ? Number.parseInt(totalMatch[1] as string, 10) : 0,
        passed: passedMatch ? Number.parseInt(passedMatch[1] as string, 10) : 0,
        duration_ms: Date.now() - start,
        ok: code === 0,
      };
      logEvent({ event: "eval_cycle", cycle, ...result });
      resolve(result);
    });
  });
}

// Lightweight trend: read the last N cycles, classify direction.
function classifyTrend(): "improving" | "stable" | "degrading" | "unknown" {
  if (!existsSync(LOG)) return "unknown";
  const lines = readFileSync(LOG, "utf-8")
    .split("\n")
    .filter((l) => l.trim())
    .slice(-10)
    .map((l) => {
      try {
        return JSON.parse(l) as { event?: string; pass_rate?: number };
      } catch {
        return null;
      }
    })
    .filter(
      (x): x is { event: string; pass_rate: number } =>
        x !== null && x.event === "eval_cycle" && typeof x.pass_rate === "number"
    );
  if (lines.length < 3) return "unknown";
  const recent = lines.slice(-3).map((x) => x.pass_rate);
  const earlier = lines.slice(0, -3).map((x) => x.pass_rate);
  if (earlier.length === 0) return "unknown";
  const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
  const avgEarlier = earlier.reduce((a, b) => a + b, 0) / earlier.length;
  if (avgRecent > avgEarlier + 5) return "improving";
  if (avgRecent < avgEarlier - 5) return "degrading";
  return "stable";
}

async function modeOnce(): Promise<void> {
  const result = await runEvalCycle(1);
  const trend = classifyTrend();
  logEvent({ event: "summary", trend, pass_rate: result.pass_rate });
  console.log(
    `[autoresearch] eval ${result.passed}/${result.total} = ${result.pass_rate}% (trend ${trend}, ${result.duration_ms}ms)`
  );
}

async function modeLoop(): Promise<void> {
  let cycle = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    cycle += 1;
    const result = await runEvalCycle(cycle);
    const trend = classifyTrend();
    logEvent({ event: "summary", cycle, trend, pass_rate: result.pass_rate });
    console.log(
      `[autoresearch] cycle ${cycle}: eval ${result.passed}/${result.total} = ${result.pass_rate}% (trend ${trend}, ${result.duration_ms}ms)`
    );
    if (PAUSE_MS <= 0) break;
    await new Promise((r) => setTimeout(r, PAUSE_MS));
  }
}

async function main(): Promise<void> {
  const arg = process.argv[2] || "once";
  if (arg === "loop") {
    await modeLoop();
  } else {
    await modeOnce();
  }
}

main().catch((e) => {
  logEvent({ event: "error", message: e instanceof Error ? e.message : String(e) });
  process.exit(1);
});
