// Persona state persistence. One JSON file per persona at
// harness/state/<persona_id>.json. Atomic-ish writes via tmp+rename
// so a crash mid-write doesn't corrupt the file.

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { PersonaState } from "../types";

const STATE_DIR = path.resolve(__dirname, "..", "state");

function ensureDir(): void {
  if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true });
}

function statePath(personaId: string): string {
  return path.join(STATE_DIR, `${personaId}.json`);
}

export function loadState(personaId: string): PersonaState {
  ensureDir();
  const fp = statePath(personaId);
  if (!existsSync(fp)) {
    return defaultState(personaId);
  }
  try {
    const raw = readFileSync(fp, "utf-8");
    const parsed = JSON.parse(raw) as PersonaState;
    // Defensive: re-merge with defaults so old state files pick up new fields.
    return { ...defaultState(personaId), ...parsed };
  } catch {
    return defaultState(personaId);
  }
}

export function saveState(state: PersonaState): void {
  ensureDir();
  const fp = statePath(state.persona_id);
  const tmp = `${fp}.tmp`;
  writeFileSync(tmp, JSON.stringify(state, null, 2), "utf-8");
  renameSync(tmp, fp);
}

export function defaultState(personaId: string): PersonaState {
  return {
    persona_id: personaId,
    signed_up: false,
    onboarded: false,
    drops_seen: 0,
    matches_requested: [],
    intros_received: [],
    intros_accepted: [],
    intros_declined: [],
    meetings_scheduled: [],
    last_visit: null,
    last_action: null,
    notes: [],
  };
}
