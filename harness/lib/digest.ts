// Founder-readable proposal digest. The coordinator writes one row
// per consensus decision in plain English so the founder can scan
// what the autonomous stack is proposing without parsing JSONL.
//
// Contract per founder direction (May 7 2026):
//   "Any and all features / design changes must be presented to me in
//    simple plain English like 'multi agent consensus that we want
//    feature X or thing Y'."
//
// Output: experiments/founder-digest.md - reverse-chronological list
// of consensus moments the founder should know about. Auto-applied
// safe fixes show up too (so the founder sees what changed without
// reading commit messages). Frontend / scope-blocked proposals show
// up with the rejection reason so the founder can decide whether to
// override.
//
// Entry shape (markdown bullet list, top of file):
//   ## YYYY-MM-DD HH:MM PT
//   - **AUTO-APPLIED** Files: a.ts, b.ts. <one sentence why>
//   - **NEEDS YOUR CALL** <one sentence what>. Blocked because <reason>.
//     Read at `experiments/coordinator-human-queue.jsonl`.
//   - **CONSENSUS NOTE** <plain-english observation>. <one sentence>

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const DIGEST = path.resolve(__dirname, "..", "..", "experiments", "founder-digest.md");

function ensureDir(): void {
  const dir = path.dirname(DIGEST);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

const HEADER = `# Founder digest

Plain-English summary of every proposal the autonomous stack reaches
consensus on. Newest at top. Read when convenient. The autonomous loop
keeps running between your visits.

Each entry says: what was proposed, what the multi-agent review (codex
+ fool) decided, and what (if anything) shipped. Frontend / scope-
blocked proposals are flagged for your call.

---

`;

export type DigestEntry = {
  level: "auto_applied" | "needs_call" | "consensus_note";
  summary: string;
  detail?: string;
  refs?: string[]; // file paths or jsonl keys to read
};

function entryToMarkdown(e: DigestEntry, ts: string): string {
  const tag =
    e.level === "auto_applied"
      ? "**AUTO-APPLIED**"
      : e.level === "needs_call"
      ? "**NEEDS YOUR CALL**"
      : "**CONSENSUS NOTE**";
  const refs = e.refs && e.refs.length > 0 ? ` _(see ${e.refs.join(", ")})_` : "";
  return `## ${ts}\n- ${tag} ${e.summary}${refs}${e.detail ? `\n  - ${e.detail}` : ""}\n\n`;
}

export function appendDigest(entry: DigestEntry): void {
  ensureDir();
  const ts = new Date().toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }) + " PT";

  let existing = "";
  if (existsSync(DIGEST)) {
    existing = readFileSync(DIGEST, "utf-8");
    // Strip the header from the existing file so we don't duplicate it.
    if (existing.startsWith(HEADER)) {
      existing = existing.slice(HEADER.length);
    }
  }
  const next = HEADER + entryToMarkdown(entry, ts) + existing;
  writeFileSync(DIGEST, next, "utf-8");
}

export const DIGEST_PATH = DIGEST;
