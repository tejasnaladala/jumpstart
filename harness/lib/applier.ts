// Scoped patch applier. Takes an approved Proposal, applies its edits
// to disk, and returns a result row. Hard rules:
//   - never touches src/app/, src/components/ (frontend zone)
//   - never touches public/, .env*, secrets
//   - file must already exist
//   - old_string must be present exactly once (literal match, not regex)
//   - on any failure, rolls back the entire proposal (atomic)

import { readFileSync, writeFileSync, existsSync, copyFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import type { Proposal } from "./proposals";

const FRONTEND_PREFIXES = ["src/app/", "src/components/", "src\\app\\", "src\\components\\"];
const FORBIDDEN_PREFIXES = ["public/", "public\\", ".env", "secrets/", "secrets\\"];

const REPO_ROOT = path.resolve(__dirname, "..", "..");

export type ApplyResult = {
  proposal_id: string;
  applied: boolean;
  reason: string;
  files_modified: string[];
  errors: string[];
};

function isSafe(file: string): { ok: boolean; reason?: string } {
  const norm = file.replace(/\\/g, "/").replace(/^\.\//, "");
  for (const p of FRONTEND_PREFIXES.map((x) => x.replace(/\\/g, "/"))) {
    if (norm.startsWith(p)) return { ok: false, reason: `frontend path: ${p}` };
  }
  for (const p of FORBIDDEN_PREFIXES.map((x) => x.replace(/\\/g, "/"))) {
    if (norm.startsWith(p)) return { ok: false, reason: `forbidden path: ${p}` };
  }
  return { ok: true };
}

export function applyProposal(p: Proposal): ApplyResult {
  if (p.edits.length === 0) {
    return {
      proposal_id: p.id,
      applied: true,
      reason: "no-op (logging-only proposal)",
      files_modified: [],
      errors: [],
    };
  }

  const errors: string[] = [];
  for (const e of p.edits) {
    const safe = isSafe(e.file);
    if (!safe.ok) {
      errors.push(`${e.file}: ${safe.reason}`);
      continue;
    }
    const abs = path.resolve(REPO_ROOT, e.file);
    if (!existsSync(abs)) {
      errors.push(`${e.file}: does not exist`);
      continue;
    }
  }
  if (errors.length > 0) {
    return {
      proposal_id: p.id,
      applied: false,
      reason: `pre-flight failed: ${errors.join("; ")}`,
      files_modified: [],
      errors,
    };
  }

  // Stage 1: snapshot every target file to a tmp backup so we can roll
  // back atomically on any single edit failure.
  const backups: { abs: string; tmp: string }[] = [];
  try {
    for (const e of p.edits) {
      const abs = path.resolve(REPO_ROOT, e.file);
      const tmp = `${abs}.applier.backup`;
      copyFileSync(abs, tmp);
      backups.push({ abs, tmp });
    }

    // Stage 2: apply each edit. If any old_string isn't present
    // exactly once, abort and rollback.
    const modified: string[] = [];
    for (const e of p.edits) {
      const abs = path.resolve(REPO_ROOT, e.file);
      const content = readFileSync(abs, "utf-8");
      const matches = content.split(e.old_string).length - 1;
      if (matches === 0) {
        throw new Error(`${e.file}: old_string not found`);
      }
      if (matches > 1) {
        throw new Error(`${e.file}: old_string matches ${matches} times (not unique)`);
      }
      const next = content.replace(e.old_string, e.new_string);
      writeFileSync(abs, next, "utf-8");
      modified.push(e.file);
    }

    // Success. Clean up backups.
    for (const b of backups) {
      try {
        unlinkSync(b.tmp);
      } catch {
        // tolerable
      }
    }
    return {
      proposal_id: p.id,
      applied: true,
      reason: "ok",
      files_modified: modified,
      errors: [],
    };
  } catch (err) {
    // Rollback: restore from backups.
    for (const b of backups) {
      try {
        copyFileSync(b.tmp, b.abs);
      } catch {
        errors.push(`rollback failed for ${b.abs}`);
      }
      try {
        unlinkSync(b.tmp);
      } catch {
        // tolerable
      }
    }
    errors.push(err instanceof Error ? err.message : String(err));
    return {
      proposal_id: p.id,
      applied: false,
      reason: `apply failed (rolled back): ${err instanceof Error ? err.message : String(err)}`,
      files_modified: [],
      errors,
    };
  }
}
