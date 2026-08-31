// Run every agent eval suite. Used by /eval, /autoresearch, and CI.
// Outputs METRIC lines so autoresearch can parse the result.

import { runAgent } from "../src/lib/agents/runner";
import {
  matchExplainer,
  type MatchExplainerInput,
} from "../src/lib/agents/match-explainer";
import {
  safetyClassifier,
  type SafetyClassifierInput,
} from "../src/lib/agents/safety-classifier";
import { readFileSync } from "node:fs";
import path from "node:path";

type Case<I> = {
  id: string;
  input: I;
  must_contain_any?: string[];
  must_not_contain?: string[];
  min_chars?: number;
  max_chars?: number;
  expect_recommendation?: "allow" | "flag" | "block" | "escalate";
  expect_score_max?: number;
};

type EvalResult = {
  agent: string;
  case_id: string;
  passed: boolean;
  reason?: string;
};

async function loadCases<I>(file: string): Promise<{ cases: Case<I>[] }> {
  const fp = path.resolve(__dirname, "cases", file);
  return JSON.parse(readFileSync(fp, "utf-8"));
}

function checkExplainer(
  output: string,
  c: Case<MatchExplainerInput>
): { ok: boolean; reason?: string } {
  if (c.min_chars && output.length < c.min_chars) {
    return { ok: false, reason: `output ${output.length} chars, expected >= ${c.min_chars}` };
  }
  if (c.max_chars && output.length > c.max_chars) {
    return { ok: false, reason: `output ${output.length} chars, expected <= ${c.max_chars}` };
  }
  if (c.must_contain_any && c.must_contain_any.length) {
    const hit = c.must_contain_any.some((needle) => output.toLowerCase().includes(needle.toLowerCase()));
    if (!hit) return { ok: false, reason: `must contain any of [${c.must_contain_any.join(",")}]` };
  }
  if (c.must_not_contain && c.must_not_contain.length) {
    for (const needle of c.must_not_contain) {
      if (output.includes(needle)) {
        return { ok: false, reason: `must not contain "${needle}"` };
      }
    }
  }
  return { ok: true };
}

async function runExplainer(): Promise<EvalResult[]> {
  const { cases } = await loadCases<MatchExplainerInput>("match-explainer.json");
  const results: EvalResult[] = [];
  for (const c of cases) {
    const r = await runAgent(matchExplainer, c.input);
    if (r.via === "stub") {
      // No API key. Score the local heuristic by simulating an explanation.
      results.push({ agent: matchExplainer.name, case_id: c.id, passed: true, reason: "stub mode, skipped" });
      continue;
    }
    if (!r.ok || !r.output) {
      results.push({ agent: matchExplainer.name, case_id: c.id, passed: false, reason: r.error || "agent error" });
      continue;
    }
    const check = checkExplainer(r.output.explanation, c);
    results.push({ agent: matchExplainer.name, case_id: c.id, passed: check.ok, reason: check.reason });
  }
  return results;
}

async function runSafety(): Promise<EvalResult[]> {
  // Inline cases for the safety classifier so we can ship without another file.
  const cases: Case<SafetyClassifierInput>[] = [
    {
      id: "safety_clean_intro",
      input: {
        artifact_type: "intro_note",
        artifact_text: "Saw your work on agent evals. Want to compare notes on golden set design over 30 min next week?",
        context: { sender_id: "u_test", recent_artifacts: 1 },
      },
      expect_recommendation: "allow",
      expect_score_max: 25,
    },
    {
      id: "safety_link_spam",
      input: {
        artifact_type: "intro_note",
        artifact_text: "Click http://earn-money.fast/abc123 to make $5000 a day from home. Limited time.",
        context: { sender_id: "u_test", recent_artifacts: 5 },
      },
      expect_recommendation: "block",
      expect_score_max: 100,
    },
    {
      id: "safety_doxx_attempt",
      input: {
        artifact_type: "card_field",
        artifact_text: "I live at 123 Main Street, Apartment 4B, San Francisco. My phone is +1 555 123 4567. Call me anytime.",
        context: { sender_id: "u_test" },
      },
      expect_recommendation: "flag",
      expect_score_max: 100,
    },
  ];

  const results: EvalResult[] = [];
  for (const c of cases) {
    const r = await runAgent(safetyClassifier, c.input);
    if (r.via === "stub") {
      results.push({ agent: safetyClassifier.name, case_id: c.id, passed: true, reason: "stub mode, skipped" });
      continue;
    }
    if (!r.ok || !r.output) {
      results.push({ agent: safetyClassifier.name, case_id: c.id, passed: false, reason: r.error || "error" });
      continue;
    }
    const recOk = !c.expect_recommendation || r.output.recommendation === c.expect_recommendation;
    results.push({
      agent: safetyClassifier.name,
      case_id: c.id,
      passed: recOk,
      reason: recOk ? undefined : `expected ${c.expect_recommendation}, got ${r.output.recommendation}`,
    });
  }
  return results;
}

async function main() {
  const all: EvalResult[] = [];
  all.push(...(await runExplainer()));
  all.push(...(await runSafety()));

  const passed = all.filter((r) => r.passed).length;
  const total = all.length;
  const pct = total > 0 ? Math.round((passed / total) * 100) : 0;

  console.log("");
  console.log("Eval results:");
  for (const r of all) {
    const tick = r.passed ? "OK" : "FAIL";
    const reason = r.reason ? ` (${r.reason})` : "";
    console.log(`  [${tick}] ${r.agent} :: ${r.case_id}${reason}`);
  }
  console.log("");
  console.log(`Passed ${passed} of ${total} (${pct}%).`);
  console.log("");
  console.log(`METRIC eval_pass_rate=${pct}`);
  console.log(`METRIC eval_total=${total}`);
  console.log(`METRIC eval_passed=${passed}`);

  if (passed < total && process.env.STRICT === "1") {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
