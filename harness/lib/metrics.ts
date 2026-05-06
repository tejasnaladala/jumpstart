// Round-level metrics aggregator. Reads experiments/harness-activity.jsonl
// and experiments/harness-assertions.jsonl, computes the founder-facing
// summary, and emits METRIC lines for autoresearch / scripts/loop.sh
// to parse.
//
// Metrics shipped per round:
//   harness_signups_total
//   harness_intros_requested_total
//   harness_intros_accepted_total
//   harness_intros_declined_total
//   harness_meetings_scheduled_total
//   harness_errors_total
//   harness_assertions_passed
//   harness_assertions_total
//   harness_assertion_pass_rate (0-100)
//   harness_active_personas (personas with at least one event today)
//   harness_acceptance_rate (accepts / (accepts + declines))
//
// Two windows:
//   --since-iso=<iso>   compute since a given ISO timestamp
//   default              compute over the most recent run only

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ACTIVITY = path.resolve(__dirname, "..", "..", "experiments", "harness-activity.jsonl");
const ASSERTIONS = path.resolve(__dirname, "..", "..", "experiments", "harness-assertions.jsonl");

type ActivityRow = {
  ts: string;
  persona_id: string;
  event: string;
  detail?: Record<string, unknown>;
};
type AssertionRow = { ts: string; name: string; passed: boolean };

function readJsonl<T>(fp: string, sinceIso?: string): T[] {
  if (!existsSync(fp)) return [];
  const since = sinceIso ? Date.parse(sinceIso) : 0;
  const out: T[] = [];
  const raw = readFileSync(fp, "utf-8");
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line) as { ts?: string };
      if (since && row.ts && Date.parse(row.ts) < since) continue;
      out.push(row as T);
    } catch {
      // skip
    }
  }
  return out;
}

export function computeMetrics(sinceIso?: string): {
  signups: number;
  drops_seen: number;
  intros_requested: number;
  intros_accepted: number;
  intros_declined: number;
  meetings_scheduled: number;
  errors: number;
  assertions_passed: number;
  assertions_total: number;
  assertion_pass_rate: number;
  active_personas: number;
  acceptance_rate: number;
} {
  const acts = readJsonl<ActivityRow>(ACTIVITY, sinceIso);
  const asserts = readJsonl<AssertionRow>(ASSERTIONS, sinceIso);

  const counts = {
    signups: 0,
    drops_seen: 0,
    intros_requested: 0,
    intros_accepted: 0,
    intros_declined: 0,
    meetings_scheduled: 0,
    errors: 0,
  };
  const active = new Set<string>();
  for (const a of acts) {
    active.add(a.persona_id);
    switch (a.event) {
      case "signed_up":
        counts.signups += 1;
        break;
      case "viewed_drop":
        counts.drops_seen += 1;
        break;
      case "requested_intro":
        counts.intros_requested += 1;
        break;
      case "accepted_intro":
        counts.intros_accepted += 1;
        break;
      case "declined_intro":
        counts.intros_declined += 1;
        break;
      case "scheduled_meeting":
        counts.meetings_scheduled += 1;
        break;
      case "error":
        counts.errors += 1;
        break;
    }
  }

  const assertions_passed = asserts.filter((r) => r.passed).length;
  const assertions_total = asserts.length;
  const assertion_pass_rate = assertions_total > 0 ? Math.round((assertions_passed / assertions_total) * 100) : 100;

  const decisionTotal = counts.intros_accepted + counts.intros_declined;
  const acceptance_rate = decisionTotal > 0 ? Math.round((counts.intros_accepted / decisionTotal) * 100) : 0;

  return {
    ...counts,
    assertions_passed,
    assertions_total,
    assertion_pass_rate,
    active_personas: active.size,
    acceptance_rate,
  };
}

export function emitMetricLines(m: ReturnType<typeof computeMetrics>): void {
  console.log(`METRIC harness_signups_total=${m.signups}`);
  console.log(`METRIC harness_drops_seen_total=${m.drops_seen}`);
  console.log(`METRIC harness_intros_requested_total=${m.intros_requested}`);
  console.log(`METRIC harness_intros_accepted_total=${m.intros_accepted}`);
  console.log(`METRIC harness_intros_declined_total=${m.intros_declined}`);
  console.log(`METRIC harness_meetings_scheduled_total=${m.meetings_scheduled}`);
  console.log(`METRIC harness_errors_total=${m.errors}`);
  console.log(`METRIC harness_active_personas=${m.active_personas}`);
  console.log(`METRIC harness_assertions_passed=${m.assertions_passed}`);
  console.log(`METRIC harness_assertions_total=${m.assertions_total}`);
  console.log(`METRIC harness_assertion_pass_rate=${m.assertion_pass_rate}`);
  console.log(`METRIC harness_acceptance_rate=${m.acceptance_rate}`);
}

if (require.main === module) {
  const sinceArg = process.argv.find((a) => a.startsWith("--since-iso="));
  const since = sinceArg ? sinceArg.split("=")[1] : undefined;
  const m = computeMetrics(since);
  emitMetricLines(m);
  console.log("");
  console.log("Harness summary:");
  console.log(`  signups:            ${m.signups}`);
  console.log(`  drops seen:         ${m.drops_seen}`);
  console.log(`  intros requested:   ${m.intros_requested}`);
  console.log(`  intros accepted:    ${m.intros_accepted}`);
  console.log(`  intros declined:    ${m.intros_declined}`);
  console.log(`  meetings scheduled: ${m.meetings_scheduled}`);
  console.log(`  errors:             ${m.errors}`);
  console.log(`  active personas:    ${m.active_personas}`);
  console.log(`  acceptance rate:    ${m.acceptance_rate}%`);
  console.log(`  assertion pass:     ${m.assertions_passed} / ${m.assertions_total} (${m.assertion_pass_rate}%)`);
}
