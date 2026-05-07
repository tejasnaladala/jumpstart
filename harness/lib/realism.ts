// Realism layer. Wraps deterministic persona actions with the kinds of
// noise real users introduce: typos, abandonment, refresh mid-form,
// hitting Continue with whitespace-only input (validation testing),
// long pauses, off-the-happy-path navigation. Without this, the harness
// only exercises clean paths and misses production failure modes.
//
// Each function returns a Promise so the caller can compose it with
// other actions. The shape is "do X, sometimes do Y instead, sometimes
// do Z first" - biased coin flips driven by HARNESS_REALISM intensity.

import type { PersonaSession } from "./session";

const REALISM = Number.parseFloat(process.env.HARNESS_REALISM || "0.3");

function chance(p: number): boolean {
  return Math.random() < p * REALISM;
}

export async function maybeRefresh(s: PersonaSession): Promise<void> {
  if (chance(0.2)) {
    await s.page.reload().catch(() => null);
    await s.page.waitForTimeout(500);
  }
}

export async function maybeAbandon(s: PersonaSession): Promise<boolean> {
  // Returns true if the persona "abandoned" - caller should bail.
  if (chance(0.1)) {
    await s.page.goto(`${process.env.HARNESS_BASE_URL || "http://localhost:3030"}/`);
    return true;
  }
  return false;
}

export async function maybeIdle(s: PersonaSession): Promise<void> {
  if (chance(0.5)) {
    const ms = 500 + Math.floor(Math.random() * 2000);
    await s.page.waitForTimeout(ms);
  }
}

export async function maybeScrollAround(s: PersonaSession): Promise<void> {
  if (chance(0.4)) {
    const dy = 200 + Math.floor(Math.random() * 800);
    await s.page.mouse.wheel(0, dy).catch(() => null);
    await s.page.waitForTimeout(150);
    if (chance(0.6)) {
      await s.page.mouse.wheel(0, -dy / 2).catch(() => null);
      await s.page.waitForTimeout(100);
    }
  }
}

// Intentional bad input: feed the validator junk to make sure the
// blocked-reason copy fires. Exercises the speed-runner finding fix.
export function junkText(): string {
  const variants = [
    "       ",                  // whitespace-only
    "asdf",                     // garbage but typed
    "...",                      // punctuation only
    "test test test",           // looks-like-a-real-string but useless
    "a",                        // too short
  ];
  return variants[Math.floor(Math.random() * variants.length)] as string;
}

// Intentional spam pattern: feed the safety classifier known triggers
// to verify it stays loud. The harness expects these to be blocked;
// the assertion suite confirms.
export function spamNote(): string {
  const variants = [
    "Click http://earn-money.fast to make $5000 a day from home now",
    "Hi! Crypto giveaway at http://bit.ly/btc-fast-money - limited time, claim now",
    "Wire transfer immediate - Nigerian prince has $4M for you, contact me",
  ];
  return variants[Math.floor(Math.random() * variants.length)] as string;
}
