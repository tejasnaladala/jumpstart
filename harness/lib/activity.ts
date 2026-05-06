// Append-only activity log. Every persona event lands here as JSONL,
// timestamped, with a stable schema so the maintenance loop can
// compute METRIC lines (signups OK, intros sent, intros blocked,
// meetings scheduled). Single file is fine for closed-beta scale; if
// we ever run thousands of personas, switch to per-day rotation.

import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import type { ActivityEntry } from "../types";

const LOG_DIR = path.resolve(__dirname, "..", "..", "experiments");
const LOG_FILE = path.join(LOG_DIR, "harness-activity.jsonl");

function ensureDir(): void {
  if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });
}

export function logActivity(entry: Omit<ActivityEntry, "ts">): void {
  ensureDir();
  const full: ActivityEntry = { ts: new Date().toISOString(), ...entry };
  appendFileSync(LOG_FILE, JSON.stringify(full) + "\n", "utf-8");
}

export const ACTIVITY_LOG_PATH = LOG_FILE;
