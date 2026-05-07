// Autonomous coordinator. The intelligent layer that closes the harness
// loop - turns observations into proposals, runs the codex+fool review,
// applies what's safe, and queues the rest for human triage.
//
// Modes:
//   bun run coord            - one round, exit
//   bun run coord:loop       - run forever with HARNESS_COORD_PAUSE_MS
//                              between rounds (default 60s)
//
// All actions land in experiments/coordinator.jsonl as a single JSONL
// stream with stable schema, so the watchdog can detect liveness via
// mtime and the founder can grep for any decision in the audit trail.

import { existsSync, mkdirSync, appendFileSync } from "node:fs";
import path from "node:path";
import { extractFindings } from "../lib/findings";
import { proposeFor, ensureSafeScope } from "../lib/proposals";
import { reviewProposal } from "../lib/reviewers";
import { applyProposal } from "../lib/applier";
import { appendDigest } from "../lib/digest";

const LOG_DIR = path.resolve(__dirname, "..", "..", "experiments");
const LOG = path.join(LOG_DIR, "coordinator.jsonl");
const QUEUE = path.join(LOG_DIR, "coordinator-human-queue.jsonl");

function ensureDir(): void {
  if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });
}

type Event =
  | { event: "round_start"; round: number }
  | { event: "round_done"; round: number; findings: number; applied: number; queued: number; duration_ms: number }
  | { event: "finding"; finding_id: string; severity: string; evidence: string }
  | { event: "proposal"; proposal_id: string; description: string; edits: number }
  | { event: "review"; proposal_id: string; codex_approved: boolean; fool_approved: boolean; codex_reason: string; fool_reason: string; via: string }
  | { event: "applied"; proposal_id: string; files: string[] }
  | { event: "queued"; proposal_id: string; reason: string }
  | { event: "rejected"; proposal_id: string; reason: string }
  | { event: "error"; stage: string; message: string };

function logEvent(e: Event): void {
  ensureDir();
  appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...e }) + "\n", "utf-8");
}

function queueForHuman(payload: Record<string, unknown>): void {
  ensureDir();
  appendFileSync(
    QUEUE,
    JSON.stringify({ ts: new Date().toISOString(), ...payload }) + "\n",
    "utf-8"
  );
}

const COORD_TOP_N = Number.parseInt(process.env.HARNESS_COORD_TOP_N || "3", 10);
const COORD_WINDOW_MIN = Number.parseInt(process.env.HARNESS_COORD_WINDOW_MIN || "60", 10);
const COORD_PAUSE_MS = Number.parseInt(process.env.HARNESS_COORD_PAUSE_MS || "60000", 10);

async function runRound(roundIdx: number): Promise<void> {
  const start = Date.now();
  logEvent({ event: "round_start", round: roundIdx });

  let applied = 0;
  let queued = 0;

  try {
    const findings = extractFindings(COORD_WINDOW_MIN);
    const top = findings.slice(0, COORD_TOP_N);
    for (const f of top) {
      logEvent({
        event: "finding",
        finding_id: f.id,
        severity: f.severity,
        evidence: f.evidence,
      });

      const p = proposeFor(f);
      if (!p) continue;

      logEvent({
        event: "proposal",
        proposal_id: p.id,
        description: p.description,
        edits: p.edits.length,
      });

      const safety = ensureSafeScope(p);
      if (!safety.ok && p.edits.length > 0) {
        logEvent({ event: "queued", proposal_id: p.id, reason: safety.reason || "scope-rejected" });
        queueForHuman({
          finding: f,
          proposal: p,
          rejected_by: "scope-guard",
          reason: safety.reason,
        });
        appendDigest({
          level: "needs_call",
          summary: `Multi-agent flagged: ${p.description}`,
          detail: `Did not auto-apply because ${safety.reason}. Founder review needed.`,
          refs: ["experiments/coordinator-human-queue.jsonl"],
        });
        queued += 1;
        continue;
      }

      let review;
      try {
        review = await reviewProposal(p, f);
      } catch (e) {
        logEvent({
          event: "error",
          stage: "review",
          message: e instanceof Error ? e.message : String(e),
        });
        continue;
      }

      logEvent({
        event: "review",
        proposal_id: p.id,
        codex_approved: review.codex.approved,
        fool_approved: review.fool.approved,
        codex_reason: review.codex.rationale,
        fool_reason: review.fool.rationale,
        via: review.codex.via,
      });

      if (!review.approved) {
        logEvent({
          event: "rejected",
          proposal_id: p.id,
          reason: `codex=${review.codex.approved} (${review.codex.rationale}), fool=${review.fool.approved} (${review.fool.rationale})`,
        });
        queueForHuman({
          finding: f,
          proposal: p,
          rejected_by: "review",
          codex: review.codex,
          fool: review.fool,
        });
        // Both reviewers rejected = strong consensus signal worth
        // surfacing. Either one rejected = "fool was skeptical" or
        // "codex spotted an issue" - still worth founder eye.
        const bothRejected = !review.codex.approved && !review.fool.approved;
        appendDigest({
          level: "needs_call",
          summary: bothRejected
            ? `Multi-agent consensus REJECTED: ${p.description}`
            : `Multi-agent split on: ${p.description}`,
          detail: `codex: ${review.codex.rationale}. fool: ${review.fool.rationale}.`,
          refs: ["experiments/coordinator-human-queue.jsonl"],
        });
        queued += 1;
        continue;
      }

      // Approved. Apply.
      try {
        const result = applyProposal(p);
        if (result.applied) {
          logEvent({
            event: "applied",
            proposal_id: p.id,
            files: result.files_modified,
          });
          if (result.files_modified.length > 0) {
            // Real edits shipped to disk
            appendDigest({
              level: "auto_applied",
              summary: `Multi-agent consensus shipped: ${p.description}`,
              detail: `Files: ${result.files_modified.join(", ")}.`,
              refs: ["git log"],
            });
          } else if (f.severity === "critical" || f.severity === "high") {
            // Logging-only proposal but the underlying finding is
            // serious. Surface as a consensus note so the founder
            // sees it. Includes the evidence so they can act.
            appendDigest({
              level: "consensus_note",
              summary: `Multi-agent observed [${f.severity}]: ${p.description}`,
              detail: f.evidence,
              refs: ["experiments/coordinator.jsonl"],
            });
          }
          applied += 1;
        } else {
          logEvent({
            event: "rejected",
            proposal_id: p.id,
            reason: `apply failed: ${result.reason}`,
          });
          queueForHuman({
            finding: f,
            proposal: p,
            rejected_by: "applier",
            apply_result: result,
          });
          queued += 1;
        }
      } catch (e) {
        logEvent({
          event: "error",
          stage: "apply",
          message: e instanceof Error ? e.message : String(e),
        });
      }
    }

    logEvent({
      event: "round_done",
      round: roundIdx,
      findings: top.length,
      applied,
      queued,
      duration_ms: Date.now() - start,
    });
  } catch (e) {
    logEvent({
      event: "error",
      stage: "round",
      message: e instanceof Error ? e.message : String(e),
    });
  }
}

async function modeOnce(): Promise<void> {
  await runRound(1);
}

async function modeLoop(): Promise<void> {
  let i = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    i += 1;
    await runRound(i);
    if (COORD_PAUSE_MS <= 0) break;
    await new Promise((r) => setTimeout(r, COORD_PAUSE_MS));
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
  logEvent({
    event: "error",
    stage: "main",
    message: e instanceof Error ? e.message : String(e),
  });
  process.exit(1);
});
