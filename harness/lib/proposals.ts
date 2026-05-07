// Proposal generation. Each finding becomes one proposed change. We
// keep this deterministic for now: a finding's kind maps to a set of
// candidate edits with structured before/after diffs. The reviewer
// layer (codex + fool) decides whether to apply.
//
// This deliberately does NOT call an LLM to generate the patch - the
// risk of hallucinated edits at the file level is too high. LLMs are
// scoped to the review layer, where they evaluate proposed edits
// rather than author them. Token-max, but token-safely.

import type { Finding } from "./findings";

export type Proposal = {
  id: string;
  finding_id: string;
  description: string;
  // Each edit is path + content_replace (literal old/new). Coordinator
  // applies via Edit tool semantics. Empty edits[] = "no auto-fix
  // available, escalate to human queue".
  edits: { file: string; old_string: string; new_string: string }[];
  scope: {
    files_touched: number;
    loc_delta_estimate: number;
    risk: "low" | "medium" | "high";
  };
  // Whether this proposal modifies any frontend files (src/app/,
  // src/components/). If true, the auto-applier will refuse.
  frontend: boolean;
  // Free-form rationale the reviewer reads.
  rationale: string;
};

const FRONTEND_PREFIXES = ["src/app/", "src/components/", "src\\app\\", "src\\components\\"];

function isFrontend(file: string): boolean {
  const norm = file.replace(/^\.\//, "");
  return FRONTEND_PREFIXES.some((p) => norm.startsWith(p));
}

export function proposeFor(finding: Finding): Proposal | null {
  const id = `proposal:${finding.id}:${Date.now()}`;
  switch (finding.kind) {
    case "assertion_failing":
      return proposeAssertionFix(finding, id);
    case "persona_error_pattern":
      return proposePersonaFix(finding, id);
    case "low_acceptance_rate":
      return proposeAcceptanceFix(finding, id);
    case "slow_api":
    case "console_error_pattern":
    case "selector_drift":
      // No deterministic auto-fix today; queue for human review.
      return {
        id,
        finding_id: finding.id,
        description: `No deterministic auto-fix for ${finding.kind}. Logging for human review.`,
        edits: [],
        scope: { files_touched: 0, loc_delta_estimate: 0, risk: "low" },
        frontend: false,
        rationale: finding.evidence,
      };
    default:
      return null;
  }
}

function proposeAssertionFix(finding: Finding, id: string): Proposal | null {
  // For now, we don't auto-rewrite assertions or app code. We log the
  // failure and let the human decide. The coordinator's value here is
  // surfacing the persistent failure to the queue.
  return {
    id,
    finding_id: finding.id,
    description: `Persistent assertion failure: ${(finding.context.assertion_name as string) || finding.id}`,
    edits: [],
    scope: { files_touched: 0, loc_delta_estimate: 0, risk: "low" },
    frontend: false,
    rationale: `${finding.evidence}\n\nThe coordinator does not auto-rewrite invariant tests or app code; that is a human-judgement zone. Surfacing for review.`,
  };
}

function proposePersonaFix(finding: Finding, id: string): Proposal | null {
  // Persona errors usually mean a session.ts selector or flow drift.
  // We surface the failing persona's last error stage but don't write
  // a code edit - that's a human triage call.
  const personaId = finding.context.persona_id as string;
  return {
    id,
    finding_id: finding.id,
    description: `Persona ${personaId} hit repeated errors. Likely session.ts selector drift or flow change.`,
    edits: [],
    scope: { files_touched: 0, loc_delta_estimate: 0, risk: "low" },
    frontend: false,
    rationale: `${finding.evidence}\n\nLook at experiments/harness-runs/<latest>/${personaId}/telemetry.json and screenshots. If a selector regex needs updating, edit harness/lib/session.ts.`,
  };
}

function proposeAcceptanceFix(finding: Finding, id: string): Proposal | null {
  // Acceptance rate is a matchmaker-quality signal, not a coordinator
  // decision-rule signal. We log a hint pointing at the right surface
  // (matchmaker prompt or stub-mode local-drop scoring) but the actual
  // tuning is a /autoresearch loop's job, not a single edit.
  return {
    id,
    finding_id: finding.id,
    description: `Low acceptance rate suggests matchmaker is producing weak matches.`,
    edits: [],
    scope: { files_touched: 0, loc_delta_estimate: 0, risk: "low" },
    frontend: false,
    rationale: `${finding.evidence}\n\nCandidates to tune: src/lib/match/local-drop.ts (stub-mode scoring) or src/lib/agents/matchmaker.ts (real-mode prompt). Run /autoresearch on either to find a winning configuration.`,
  };
}

export function isFrontendProposal(p: Proposal): boolean {
  return p.edits.some((e) => isFrontend(e.file)) || p.frontend;
}

export function ensureSafeScope(p: Proposal): { ok: boolean; reason?: string } {
  if (isFrontendProposal(p)) {
    return { ok: false, reason: "frontend changes require human approval" };
  }
  if (p.scope.files_touched > 5) {
    return { ok: false, reason: `touches ${p.scope.files_touched} files (max 5)` };
  }
  if (p.scope.loc_delta_estimate > 100) {
    return { ok: false, reason: `LOC delta ${p.scope.loc_delta_estimate} > 100 (max 100)` };
  }
  return { ok: true };
}
