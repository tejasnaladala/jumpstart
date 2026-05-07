// Delegation loop. Polls GitHub for issues with status:ready and
// mukund-claude ownership, posts a comment that nudges Mukund's Claude
// to pick it up, and tracks who's working on what in
// experiments/delegation.jsonl. Runs every 5 minutes.
//
// Why a loop and not a webhook:
//   - Closed-beta-of-2 (Tejas + Mukund). A polling loop is fine.
//   - Both Claudes need to share state across machines via GitHub. Issues
//     are the canonical state; this script just keeps the conversation
//     warm and produces a local audit log.
//
// Storage: experiments/delegation.jsonl - one line per coordination event.
//
// Safety: uses execFileSync with array args (no shell expansion) and
// passes comment bodies via stdin so issue titles can never be
// shell-interpreted.

import { existsSync, mkdirSync, appendFileSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

type Issue = {
  number: number;
  title: string;
  labels: { name: string }[];
  state: string;
  updatedAt: string;
};

const PAUSE_MS = Number.parseInt(process.env.HARNESS_DELEGATION_PAUSE_MS ?? "300000", 10);
const LOG = path.resolve(__dirname, "..", "..", "experiments", "delegation.jsonl");
const MUKUND_HANDLE = process.env.JUMPSTART_MUKUND_HANDLE ?? null;

function log(event: Record<string, unknown>): void {
  const dir = path.dirname(LOG);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  appendFileSync(
    LOG,
    JSON.stringify({ ts: new Date().toISOString(), ...event }) + "\n",
    "utf-8"
  );
}

function gh(args: string[], stdin?: string): string {
  return execFileSync("gh", args, {
    encoding: "utf-8",
    maxBuffer: 8 * 1024 * 1024,
    input: stdin,
  });
}

function listOpenReadyIssues(): Issue[] {
  // gh CLI's --label flag doesn't match labels containing colons (which all
  // our coordination labels do). Pull all open issues and filter the names
  // client-side.
  try {
    const json = gh([
      "issue",
      "list",
      "--state",
      "open",
      "--json",
      "number,title,labels,state,updatedAt",
      "--limit",
      "100",
    ]);
    const all = JSON.parse(json) as Issue[];
    return all.filter((issue) => {
      const names = new Set(issue.labels.map((l) => l.name));
      return names.has("status:ready") && names.has("owner:mukund-claude");
    });
  } catch (e) {
    log({ event: "list_failed", error: (e as Error).message });
    return [];
  }
}

function lastNudgeMs(issueNumber: number): number {
  try {
    const raw = gh([
      "api",
      `repos/{owner}/{repo}/issues/${issueNumber}/comments`,
      "--paginate",
    ]);
    const comments = JSON.parse(raw) as { body: string; created_at: string }[];
    let latest = 0;
    for (const c of comments) {
      if (c.body.startsWith("[delegation-loop]")) {
        latest = Math.max(latest, new Date(c.created_at).getTime());
      }
    }
    return latest;
  } catch (e) {
    log({
      event: "list_comments_failed",
      number: issueNumber,
      error: (e as Error).message,
    });
    return 0;
  }
}

function nudgeIssue(issue: Issue): void {
  const oneDayMs = 24 * 60 * 60 * 1000;
  const last = lastNudgeMs(issue.number);
  if (last > 0 && Date.now() - last < oneDayMs) {
    log({ event: "nudge_skipped", number: issue.number, reason: "recent_nudge" });
    return;
  }

  const mention = MUKUND_HANDLE ? `@${MUKUND_HANDLE} ` : "";
  const body = [
    `[delegation-loop] ${mention}This issue is \`status:ready\` and owned by \`mukund-claude\`.`,
    "",
    "When you pick it up:",
    "1. Switch label to `status:in-progress`",
    "2. Branch from `implementation/v1` as `claude/mukund/<short-slug>`",
    "3. Read the **Brief** section above; it's self-contained.",
    "4. Run `/codex` on your diff before pushing the PR.",
    "5. Tag the PR with `status:review` and request a review from Tejas's Claude.",
    "",
    "Tejas's autonomous stack will not pick this up.",
  ].join("\n");

  try {
    gh(["issue", "comment", String(issue.number), "--body-file", "-"], body);
    log({ event: "nudged", number: issue.number, title: issue.title });
  } catch (e) {
    log({ event: "nudge_failed", number: issue.number, error: (e as Error).message });
  }
}

async function tick(): Promise<void> {
  const issues = listOpenReadyIssues();
  log({ event: "tick", ready_for_mukund: issues.length });
  for (const issue of issues) {
    nudgeIssue(issue);
  }
}

async function main(): Promise<void> {
  const mode = process.argv[2] ?? "loop";
  if (mode === "once") {
    await tick();
    return;
  }
  log({ event: "loop_start", pause_ms: PAUSE_MS });
  while (true) {
    try {
      await tick();
    } catch (e) {
      log({ event: "tick_error", error: (e as Error).message });
    }
    await new Promise((r) => setTimeout(r, PAUSE_MS));
  }
}

main().catch((e) => {
  log({ event: "fatal", error: (e as Error).message });
  process.exit(1);
});
