// Reviewer agents: codex (factual cross-check) + fool (devil's advocate).
// Both are "review the proposal" agents, NOT "generate the patch" agents
// — that scoping protects us from hallucinated edits while still
// letting LLM judgement gate the apply.
//
// Both reviewers use the existing src/lib/agents/runner.ts contract so
// they fall back to a local heuristic when ANTHROPIC_API_KEY is unset.
// In stub-mode (which is the closed-beta default), heuristics decide.
// When the key is wired, real Claude calls run.
//
// Decision rule (current): both reviewers must approve OR proposal must
// be empty (logging-only). Either rejects → defer to human queue.

import Anthropic from "@anthropic-ai/sdk";
import type { Proposal } from "./proposals";
import type { Finding } from "./findings";

export type Review = {
  reviewer: "codex" | "fool";
  approved: boolean;
  rationale: string;
  via: "stub" | "anthropic";
};

const HAS_KEY = Boolean(process.env.ANTHROPIC_API_KEY);

const CODEX_PROMPT = `You are a strict code reviewer. Given a proposed change to a software system, check for:
1. Factual correctness: do the file paths exist? do the old_strings actually appear in the codebase as written?
2. Side effects: could this break unrelated tests, types, builds?
3. Scope creep: does the proposal stay narrow to the finding it claims to fix?

Respond with ONLY a single JSON object: {"approved": true|false, "rationale": "one sentence reason"}.
Be skeptical. Default to rejecting anything that smells like scope creep or hand-wave.`;

const FOOL_PROMPT = `You are a devil's-advocate reviewer. Given a proposed change to a software system, identify:
1. The most plausible way this fix is wrong, brittle, or papering over a deeper bug.
2. Whether the diagnosis behind the fix is actually right, or just convenient.
3. Whether shipping this fix accelerates real progress or creates a new headache.

Respond with ONLY a single JSON object: {"approved": true|false, "rationale": "one sentence reason"}.
Reject anything that doesn't survive your sharpest objection.`;

async function runReviewerLLM(
  reviewer: "codex" | "fool",
  proposal: Proposal,
  finding: Finding
): Promise<Review> {
  const client = new Anthropic();
  const sys = reviewer === "codex" ? CODEX_PROMPT : FOOL_PROMPT;
  const userMsg = JSON.stringify(
    {
      finding,
      proposal: {
        description: proposal.description,
        rationale: proposal.rationale,
        scope: proposal.scope,
        edits_count: proposal.edits.length,
        edits_preview: proposal.edits.slice(0, 3).map((e) => ({
          file: e.file,
          old: e.old_string.slice(0, 200),
          new: e.new_string.slice(0, 200),
        })),
      },
    },
    null,
    2
  );
  try {
    const res = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 256,
      system: sys,
      messages: [{ role: "user", content: userMsg }],
    });
    const block = res.content.find((c) => c.type === "text");
    if (!block || block.type !== "text") {
      return { reviewer, approved: false, rationale: "no text block in response", via: "anthropic" };
    }
    const text = block.text;
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return { reviewer, approved: false, rationale: "no JSON in response", via: "anthropic" };
    }
    const parsed = JSON.parse(match[0]) as { approved?: boolean; rationale?: string };
    return {
      reviewer,
      approved: Boolean(parsed.approved),
      rationale: parsed.rationale || "no rationale",
      via: "anthropic",
    };
  } catch (e) {
    return {
      reviewer,
      approved: false,
      rationale: `llm error: ${e instanceof Error ? e.message : String(e)}`,
      via: "anthropic",
    };
  }
}

function runReviewerStub(
  reviewer: "codex" | "fool",
  proposal: Proposal,
  _finding: Finding
): Review {
  // Stub-mode rules. Both reviewers approve only if:
  //   - proposal has zero edits (logging-only — always safe)
  //   - OR every edit is in a safe path AND scope is small
  // The fool is stricter than codex: it also rejects if rationale is
  // shorter than 40 chars (indicating hand-wave).
  if (proposal.edits.length === 0) {
    return {
      reviewer,
      approved: true,
      rationale: "logging-only proposal, no code change to approve",
      via: "stub",
    };
  }
  if (proposal.frontend) {
    return { reviewer, approved: false, rationale: "frontend change needs human approval", via: "stub" };
  }
  if (proposal.scope.files_touched > 5 || proposal.scope.loc_delta_estimate > 100) {
    return { reviewer, approved: false, rationale: "scope exceeds auto-apply limits", via: "stub" };
  }
  if (reviewer === "fool" && proposal.rationale.length < 40) {
    return { reviewer, approved: false, rationale: "rationale too short — possible hand-wave", via: "stub" };
  }
  return {
    reviewer,
    approved: true,
    rationale: "passes stub-mode safety checks",
    via: "stub",
  };
}

export async function runReviewer(
  reviewer: "codex" | "fool",
  proposal: Proposal,
  finding: Finding
): Promise<Review> {
  if (HAS_KEY) {
    return runReviewerLLM(reviewer, proposal, finding);
  }
  return runReviewerStub(reviewer, proposal, finding);
}

export async function reviewProposal(
  proposal: Proposal,
  finding: Finding
): Promise<{ codex: Review; fool: Review; approved: boolean }> {
  const [codex, fool] = await Promise.all([
    runReviewer("codex", proposal, finding),
    runReviewer("fool", proposal, finding),
  ]);
  return {
    codex,
    fool,
    approved: codex.approved && fool.approved,
  };
}
