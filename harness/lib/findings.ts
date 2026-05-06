// Pain extraction from the live harness logs. Deterministic, no LLM.
// Reads the activity, assertions, and meetings logs; computes rolling
// metrics; emits a list of "findings" (concrete pain signals) that the
// coordinator can turn into proposals.
//
// Findings are ranked by confidence + severity. The coordinator pulls
// the top-N (default 3) per cycle so we focus on what's most painful
// rather than thrashing on every signal.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const ACTIVITY = path.resolve(__dirname, "..", "..", "experiments", "harness-activity.jsonl");
const ASSERTIONS = path.resolve(__dirname, "..", "..", "experiments", "harness-assertions.jsonl");
const RUNS_DIR = path.resolve(__dirname, "..", "..", "experiments", "harness-runs");

export type Finding = {
  id: string;                    // stable id so coordinator can dedupe
  kind:
    | "assertion_failing"        // an invariant assertion is failing
    | "persona_error_pattern"    // a persona errors repeatedly
    | "low_acceptance_rate"      // matchmaker producing weak matches
    | "slow_api"                 // an /api/* endpoint is slow
    | "console_error_pattern"    // a console error fires repeatedly
    | "selector_drift";          // a UI selector is missing
  severity: "critical" | "high" | "medium" | "low";
  confidence: number;            // 0..1, deterministic heuristic confidence
  evidence: string;              // human-readable summary
  context: Record<string, unknown>;  // structured detail for proposals
};

type ActivityRow = {
  ts: string;
  persona_id: string;
  event: string;
  detail?: Record<string, unknown>;
};
type AssertionRow = { ts: string; name: string; passed: boolean; detail?: string };

function readJsonl<T>(fp: string, sinceMs?: number): T[] {
  if (!existsSync(fp)) return [];
  const out: T[] = [];
  const raw = readFileSync(fp, "utf-8");
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line) as { ts?: string };
      if (sinceMs && row.ts && Date.parse(row.ts) < sinceMs) continue;
      out.push(row as T);
    } catch {
      // skip
    }
  }
  return out;
}

export function extractFindings(windowMinutes = 30): Finding[] {
  const sinceMs = Date.now() - windowMinutes * 60 * 1000;
  const acts = readJsonl<ActivityRow>(ACTIVITY, sinceMs);
  const asserts = readJsonl<AssertionRow>(ASSERTIONS, sinceMs);

  const findings: Finding[] = [];

  // 1) Assertion failures. Group by name; if any assertion has 3+
  //    failures in the window, surface as a finding.
  const assertGroups = new Map<string, AssertionRow[]>();
  for (const a of asserts) {
    if (!assertGroups.has(a.name)) assertGroups.set(a.name, []);
    assertGroups.get(a.name)!.push(a);
  }
  for (const [name, rows] of assertGroups) {
    const fails = rows.filter((r) => !r.passed);
    if (fails.length >= 3) {
      findings.push({
        id: `assertion:${name}`,
        kind: "assertion_failing",
        severity: name.startsWith("api_intros_") ? "high" : "critical",
        confidence: Math.min(1, fails.length / Math.max(1, rows.length)),
        evidence: `${name} failed ${fails.length}/${rows.length} times in last ${windowMinutes}m. Last detail: ${fails[fails.length - 1]?.detail || "n/a"}`,
        context: {
          assertion_name: name,
          fails,
          last_detail: fails[fails.length - 1]?.detail,
        },
      });
    }
  }

  // 2) Persona error patterns. If a single persona errors 2+ times, flag.
  const personaErrors = new Map<string, ActivityRow[]>();
  for (const a of acts.filter((x) => x.event === "error")) {
    if (!personaErrors.has(a.persona_id)) personaErrors.set(a.persona_id, []);
    personaErrors.get(a.persona_id)!.push(a);
  }
  for (const [pid, errs] of personaErrors) {
    if (errs.length >= 2) {
      findings.push({
        id: `persona_err:${pid}`,
        kind: "persona_error_pattern",
        severity: "high",
        confidence: Math.min(1, errs.length / 5),
        evidence: `${pid} hit ${errs.length} errors. Last stage: ${errs[errs.length - 1]?.detail?.stage}`,
        context: {
          persona_id: pid,
          errors: errs.map((e) => e.detail),
        },
      });
    }
  }

  // 3) Low acceptance rate. If we have 5+ decisions in window and
  //    acceptance < 30%, the matchmaker is producing weak matches.
  const accepts = acts.filter((a) => a.event === "accepted_intro").length;
  const declines = acts.filter((a) => a.event === "declined_intro").length;
  const total = accepts + declines;
  if (total >= 5) {
    const rate = accepts / total;
    if (rate < 0.3) {
      findings.push({
        id: `low_acceptance:${total}_${accepts}`,
        kind: "low_acceptance_rate",
        severity: "medium",
        confidence: 0.8,
        evidence: `Acceptance rate ${Math.round(rate * 100)}% (${accepts}/${total}) over ${windowMinutes}m. Threshold is 30%.`,
        context: { accepts, declines, total, rate },
      });
    }
  }

  // 4) Console error patterns. Pull recent run telemetry, count console
  //    errors by message; if any single message fires 3+ times across
  //    personas in the window, surface it.
  const consoleErrCounts = new Map<string, number>();
  if (existsSync(RUNS_DIR)) {
    // Walk run dirs (just the latest 3 to keep this cheap).
    try {
      const runs = readdirSync(RUNS_DIR).sort().slice(-3);
      for (const run of runs) {
        const runPath = path.join(RUNS_DIR, run);
        if (!statSync(runPath).isDirectory()) continue;
        const personas = readdirSync(runPath).filter((p) => p.startsWith("p_"));
        for (const persona of personas) {
          const telPath = path.join(runPath, persona, "telemetry.json");
          if (!existsSync(telPath)) continue;
          try {
            const tel = JSON.parse(readFileSync(telPath, "utf-8")) as {
              console_errors?: { text: string }[];
            };
            for (const ce of tel.console_errors || []) {
              const key = ce.text.slice(0, 120);
              consoleErrCounts.set(key, (consoleErrCounts.get(key) || 0) + 1);
            }
          } catch {
            // skip
          }
        }
      }
    } catch {
      // skip
    }
  }
  for (const [msg, count] of consoleErrCounts) {
    if (count >= 3) {
      findings.push({
        id: `console_err:${Buffer.from(msg).toString("base64").slice(0, 32)}`,
        kind: "console_error_pattern",
        severity: "medium",
        confidence: Math.min(1, count / 10),
        evidence: `Console error fired ${count} times across recent runs: "${msg.slice(0, 80)}"`,
        context: { message: msg, count },
      });
    }
  }

  // 5) Slow API. If a /api/* endpoint exceeded 500ms 5+ times in window,
  //    flag. Read from per-run telemetry.
  const slowCounts = new Map<string, { count: number; max_ms: number }>();
  if (existsSync(RUNS_DIR)) {
    try {
      const runs = readdirSync(RUNS_DIR).sort().slice(-3);
      for (const run of runs) {
        const runPath = path.join(RUNS_DIR, run);
        if (!statSync(runPath).isDirectory()) continue;
        const personas = readdirSync(runPath).filter((p) => p.startsWith("p_"));
        for (const persona of personas) {
          const telPath = path.join(runPath, persona, "telemetry.json");
          if (!existsSync(telPath)) continue;
          try {
            const tel = JSON.parse(readFileSync(telPath, "utf-8")) as {
              slow_calls?: { url: string; latency_ms: number }[];
            };
            for (const slow of tel.slow_calls || []) {
              const key = slow.url.replace(/\?.*$/, "").replace(/\d+/g, ":id");
              const cur = slowCounts.get(key) || { count: 0, max_ms: 0 };
              slowCounts.set(key, {
                count: cur.count + 1,
                max_ms: Math.max(cur.max_ms, slow.latency_ms),
              });
            }
          } catch {
            // skip
          }
        }
      }
    } catch {
      // skip
    }
  }
  for (const [url, stat] of slowCounts) {
    if (stat.count >= 5) {
      findings.push({
        id: `slow_api:${url}`,
        kind: "slow_api",
        severity: "low",
        confidence: 0.6,
        evidence: `${url} exceeded 500ms in ${stat.count} calls (max ${stat.max_ms}ms).`,
        context: { url, count: stat.count, max_ms: stat.max_ms },
      });
    }
  }

  // Sort by severity then confidence.
  const sevWeight = { critical: 4, high: 3, medium: 2, low: 1 };
  findings.sort((a, b) => {
    const sa = sevWeight[a.severity];
    const sb = sevWeight[b.severity];
    if (sa !== sb) return sb - sa;
    return b.confidence - a.confidence;
  });

  return findings;
}
