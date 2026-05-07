// Continuous invariant assertion runner. Calls runAssertions every
// HARNESS_ASSERT_PAUSE_MS (default 5 min) so the assertion log stays
// fresh and the verify-stack threshold has clean recent data.
//
// Without this, assertions only run when the founder manually invokes
// scripts/harness-loop.sh - which means a stale-build regression
// shows up in the dashboard hours after it lands.

import { runAssertions } from "../lib/assertions";
import { existsSync, mkdirSync, appendFileSync } from "node:fs";
import path from "node:path";

const LOG_DIR = path.resolve(__dirname, "..", "..", "experiments");
const LOG = path.join(LOG_DIR, "assertion-loop.jsonl");

function ensureDir(): void {
  if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });
}

function logEvent(event: Record<string, unknown>): void {
  ensureDir();
  appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...event }) + "\n", "utf-8");
}

const PAUSE_MS = Number.parseInt(process.env.HARNESS_ASSERT_PAUSE_MS || "300000", 10);

async function modeLoop(): Promise<void> {
  let cycle = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    cycle += 1;
    const start = Date.now();
    try {
      const { total, passed, failed } = await runAssertions();
      const rate = total > 0 ? Math.round((passed / total) * 100) : 0;
      logEvent({
        event: "cycle",
        cycle,
        total,
        passed,
        failed_count: failed.length,
        pass_rate: rate,
        duration_ms: Date.now() - start,
      });
      console.log(`[assertion-loop] cycle ${cycle}: ${passed}/${total} = ${rate}% (${Date.now() - start}ms)`);
    } catch (e) {
      logEvent({
        event: "error",
        cycle,
        message: e instanceof Error ? e.message : String(e),
      });
    }
    if (PAUSE_MS <= 0) break;
    await new Promise((r) => setTimeout(r, PAUSE_MS));
  }
}

modeLoop().catch((e) => {
  logEvent({ event: "fatal", message: e instanceof Error ? e.message : String(e) });
  process.exit(1);
});
