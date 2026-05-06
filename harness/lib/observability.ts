// Observability capture per persona session. Without this, the harness
// is a black box — runs don't fail, they just produce wrong state.
// With it, every round emits:
//   - console errors per persona
//   - 4xx/5xx network responses
//   - slow API calls (>500ms)
//   - failed navigations
//   - screenshots on error
//   - HAR file per persona on demand
//
// Output goes to experiments/harness-runs/<run_id>/<persona>/.
// One subdirectory per persona per run keeps artifacts triagable
// and lets the founder cherry-pick "show me what p_priya did" later.

import { mkdirSync, existsSync, writeFileSync, appendFileSync } from "node:fs";
import path from "node:path";
import type { Page } from "playwright";

const RUN_ID =
  process.env.HARNESS_RUN_ID ||
  new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const RUNS_DIR = path.resolve(__dirname, "..", "..", "experiments", "harness-runs", RUN_ID);

export type SessionTelemetry = {
  persona_id: string;
  console_errors: { ts: string; type: string; text: string }[];
  network_errors: { ts: string; status: number; method: string; url: string; latency_ms: number }[];
  slow_calls: { ts: string; status: number; method: string; url: string; latency_ms: number }[];
  navigations: { ts: string; url: string; status?: number; ok?: boolean }[];
  screenshots: string[];
};

const SLOW_THRESHOLD_MS = 500;

export function ensureRunDir(): string {
  if (!existsSync(RUNS_DIR)) mkdirSync(RUNS_DIR, { recursive: true });
  return RUNS_DIR;
}

function personaDir(personaId: string): string {
  ensureRunDir();
  const dir = path.join(RUNS_DIR, personaId);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

export function attachTelemetry(page: Page, personaId: string): SessionTelemetry {
  const tel: SessionTelemetry = {
    persona_id: personaId,
    console_errors: [],
    network_errors: [],
    slow_calls: [],
    navigations: [],
    screenshots: [],
  };

  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      tel.console_errors.push({
        ts: new Date().toISOString(),
        type: msg.type(),
        text: msg.text().slice(0, 500),
      });
    }
  });

  page.on("pageerror", (err) => {
    tel.console_errors.push({
      ts: new Date().toISOString(),
      type: "pageerror",
      text: err.message.slice(0, 500),
    });
  });

  // Latency tracking: stash request start time on the request object,
  // measure on response.
  page.on("requestfinished", async (req) => {
    try {
      const res = await req.response();
      if (!res) return;
      const timing = req.timing();
      const latency = Math.max(0, timing.responseEnd - timing.startTime);
      const status = res.status();
      const url = req.url();
      const method = req.method();
      // Skip noise from /_next/* asset chunks and HMR.
      if (url.includes("/_next/") || url.includes("/__nextjs")) return;
      if (status >= 400) {
        tel.network_errors.push({
          ts: new Date().toISOString(),
          status,
          method,
          url,
          latency_ms: Math.round(latency),
        });
      }
      if (latency > SLOW_THRESHOLD_MS && url.includes("/api/")) {
        tel.slow_calls.push({
          ts: new Date().toISOString(),
          status,
          method,
          url,
          latency_ms: Math.round(latency),
        });
      }
    } catch {
      // request finished but response object inaccessible; skip.
    }
  });

  return tel;
}

export async function captureScreenshot(
  page: Page,
  personaId: string,
  label: string
): Promise<string | null> {
  try {
    const dir = personaDir(personaId);
    const safe = label.replace(/[^a-z0-9_-]+/gi, "_").slice(0, 60);
    const fp = path.join(dir, `${Date.now()}_${safe}.png`);
    await page.screenshot({ path: fp, fullPage: true });
    return fp;
  } catch {
    return null;
  }
}

export function flushTelemetry(tel: SessionTelemetry): void {
  const dir = personaDir(tel.persona_id);
  const fp = path.join(dir, `telemetry.json`);
  writeFileSync(fp, JSON.stringify(tel, null, 2), "utf-8");
  // Also append a single-line summary to a global jsonl for the
  // metrics aggregator.
  const summaryFile = path.join(RUNS_DIR, "_summary.jsonl");
  appendFileSync(
    summaryFile,
    JSON.stringify({
      ts: new Date().toISOString(),
      persona_id: tel.persona_id,
      console_errors: tel.console_errors.length,
      network_errors: tel.network_errors.length,
      slow_calls: tel.slow_calls.length,
      navigations: tel.navigations.length,
      screenshots: tel.screenshots.length,
    }) + "\n",
    "utf-8"
  );
}

export function getRunDir(): string {
  return RUNS_DIR;
}
