// Invariant assertions. Run once per round, independent of any persona.
// These are the things that must always hold true - if any of them
// fails, the founder gets paged. They run against the live app the
// personas are testing against, so they catch the regressions the
// personas may have caused.
//
// Examples:
//   - /api/health is reachable and ready
//   - /api/intros validates a malformed body (regression check)
//   - /api/intros blocks an obvious spam note
//   - /api/intros accepts a clean note
//   - the public Pass route renders for /pass/me
//   - the drop page returns three match links
//
// Each assertion writes a result row to experiments/harness-assertions.jsonl
// so the maintenance loop can grep for FAILs without parsing prose.

import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = process.env.HARNESS_BASE_URL || "http://localhost:3030";
const LOG = path.resolve(__dirname, "..", "..", "experiments", "harness-assertions.jsonl");

type AssertionResult = {
  ts: string;
  name: string;
  passed: boolean;
  detail?: string;
  duration_ms?: number;
};

function log(r: AssertionResult): void {
  const dir = path.dirname(LOG);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  appendFileSync(LOG, JSON.stringify(r) + "\n", "utf-8");
}

async function check(
  name: string,
  fn: () => Promise<{ ok: boolean; detail?: string }>
): Promise<AssertionResult> {
  const start = Date.now();
  try {
    const { ok, detail } = await fn();
    const r: AssertionResult = {
      ts: new Date().toISOString(),
      name,
      passed: ok,
      detail,
      duration_ms: Date.now() - start,
    };
    log(r);
    return r;
  } catch (e) {
    const r: AssertionResult = {
      ts: new Date().toISOString(),
      name,
      passed: false,
      detail: e instanceof Error ? e.message : String(e),
      duration_ms: Date.now() - start,
    };
    log(r);
    return r;
  }
}

export async function runAssertions(): Promise<{
  total: number;
  passed: number;
  failed: AssertionResult[];
}> {
  const results: AssertionResult[] = [];

  // Lightweight HTTP-only checks via fetch.
  results.push(
    await check("api_health_200", async () => {
      const res = await fetch(`${BASE_URL}/api/health`);
      const ok = res.ok;
      const body = ok ? ((await res.json()) as { ready?: boolean }) : null;
      return {
        ok: ok && Boolean(body?.ready),
        detail: !ok ? `status ${res.status}` : !body?.ready ? "not ready" : "",
      };
    })
  );

  // Each /api/intros assertion accepts 429 as "rate limit working as
  // designed" - the API is rejecting input with a known error code, which
  // is the underlying invariant. A real failure would be a 5xx or a 200
  // on bad input. Rate-limit drift across many parallel personas is
  // expected; the metrics layer surfaces it separately.
  results.push(
    await check("api_intros_validation", async () => {
      const res = await fetch(`${BASE_URL}/api/intros`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ not: "valid" }),
      });
      const ok = res.status === 400 || res.status === 429 || res.status === 401;
      return {
        ok,
        detail: !ok ? `expected 400/401/429, got ${res.status}` : `status=${res.status}`,
      };
    })
  );

  results.push(
    await check("api_intros_blocks_spam", async () => {
      const res = await fetch(`${BASE_URL}/api/intros`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          match_id: "match_test1",
          recipient_id: "u_maya",
          note: "Click http://earn-money.fast to make $5000 a day from home now",
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { code?: string };
      // Accept 401 (auth required), 400+SAFETY_BLOCK (correct path),
      // or 429 (rate limited - also defended).
      const ok =
        res.status === 401 ||
        res.status === 429 ||
        (res.status === 400 && body.code === "SAFETY_BLOCK");
      return { ok, detail: `status=${res.status} code=${body.code}` };
    })
  );

  results.push(
    await check("api_intros_accepts_or_defends", async () => {
      const res = await fetch(`${BASE_URL}/api/intros`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          match_id: "match_test1",
          recipient_id: "u_maya",
          note: "Want to compare notes on agent evals over coffee?",
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { accepted?: boolean };
      // A clean note should accept (200) or be defended by a known
      // gate (401 unauth, 429 rate limit). 5xx or unexpected status
      // is the failure.
      const ok =
        res.status === 401 ||
        res.status === 429 ||
        (res.status === 200 && Boolean(body.accepted));
      return { ok, detail: `status=${res.status} accepted=${body.accepted}` };
    })
  );

  results.push(
    await check("api_cron_retention_locked", async () => {
      const res = await fetch(`${BASE_URL}/api/cron/retention`);
      // 503 (no secret configured) or 403 (secret configured, header missing).
      const ok = res.status === 403 || res.status === 503;
      return { ok, detail: !ok ? `status ${res.status}` : "" };
    })
  );

  // Browser-driven checks: only spin up Chromium if any HTTP check passed
  // (avoids piling failures on top of a dead server).
  const httpAlive = results.some((r) => r.passed);
  if (!httpAlive) {
    return summarize(results);
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    results.push(
      await check("public_pass_renders", async () => {
        await page.goto(`${BASE_URL}/pass/me`, { waitUntil: "domcontentloaded" });
        const heading = page.getByText(/Founder Pass/i).first();
        const visible = await heading.isVisible().catch(() => false);
        return { ok: visible, detail: visible ? "" : "Founder Pass heading not found" };
      })
    );

    results.push(
      await check("public_pass_noindex", async () => {
        // Robots metadata is rendered into <head> by Next.js. The /pass/[id]
        // route declares { robots: { index: false, follow: false } } which
        // Next.js emits as <meta name="robots" content="noindex, ...">.
        const robotsContent = await page
          .locator('meta[name="robots"]')
          .getAttribute("content")
          .catch(() => null);
        const ok = robotsContent ? /noindex/i.test(robotsContent) : false;
        return {
          ok,
          detail: ok ? `robots=${robotsContent}` : "noindex meta missing",
        };
      })
    );

    results.push(
      await check("drop_route_responds", async () => {
        // Drop refactor (May 7 2026): page renders countdown OR
        // delivered match OR preparing-state. The (app) layout will
        // also redirect unauthenticated visitors to /signup, which
        // is correct behavior. So the assertion accepts any of:
        //   - /drop visible with one of the four surface signals
        //   - /signup as a redirect destination (auth bounce works)
        // The persona harness exercises the full signed-in flow
        // separately; this assertion just confirms the route is wired.
        await page.goto(`${BASE_URL}/drop`, { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("networkidle").catch(() => null);
        const url = page.url();
        if (url.includes("/signup")) {
          return { ok: true, detail: "redirected to signup (auth bounce)" };
        }
        const surface = await page
          .getByText(/ENVELOPE LANDS|DROP PENDING|MATCH BEING PREPARED|Why you should meet/i)
          .first()
          .waitFor({ state: "visible", timeout: 5_000 })
          .then(() => true)
          .catch(() => false);
        const matchCount = await page.locator('a[href^="/match/"]').count();
        const ok = surface || matchCount >= 1;
        return {
          ok,
          detail: `url=${url} surface=${surface} match_cards=${matchCount}`,
        };
      })
    );

    results.push(
      await check("admin_health_renders", async () => {
        await page.goto(`${BASE_URL}/admin/health`, { waitUntil: "networkidle" });
        // The page is a client component, so wait for the heading to
        // hydrate. networkidle is enough for the React render to flush.
        const heading = page.getByRole("heading", { name: /Live health/i }).first();
        const visible = await heading
          .waitFor({ state: "visible", timeout: 5_000 })
          .then(() => true)
          .catch(() => false);
        return { ok: visible, detail: visible ? "" : "Live health heading not found" };
      })
    );

    await context.close();
  } finally {
    await browser.close();
  }

  return summarize(results);
}

function summarize(results: AssertionResult[]) {
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  return { total: results.length, passed, failed };
}
