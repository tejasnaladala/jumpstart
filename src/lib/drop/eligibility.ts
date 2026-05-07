// Per-user eligibility: when's the user's next match drop, and have
// they already received it? Stored in localStorage (jumpstart.drop.*)
// alongside the rest of the per-user state. Closed-beta posture; this
// promotes to a Postgres column at v1.5+.
//
// On onboarding finalize, we compute eligibleDropFor(now) and store
// the resulting ISO timestamp. /drop reads this and either renders the
// countdown (now < eligible) or the single match (now >= eligible).
// When the match is consumed (user views or acts on it), the stored
// timestamp rolls forward to the NEXT drop after the consumed one so
// the countdown resumes for the following Mon/Wed/Fri.

import { eligibleDropFor, nextDropAfter } from "./schedule";

const KEY_NEXT = "jumpstart.drop.next_at";
const KEY_DELIVERED = "jumpstart.drop.delivered_at";
const KEY_NOTIFIED = "jumpstart.drop.notified_at";

export function setEligibleDrop(at: Date = eligibleDropFor()): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY_NEXT, at.toISOString());
  } catch {
    // privacy mode / quota; non-fatal
  }
}

export function getEligibleDrop(): Date | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY_NEXT);
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Drop has arrived for the user. Mark it delivered and roll the
// countdown forward to the NEXT drop slot. Idempotent: calling twice
// in the same drop window is a no-op.
export function consumeDrop(): { delivered_at: Date; next_at: Date } | null {
  if (typeof window === "undefined") return null;
  const cur = getEligibleDrop();
  if (!cur) return null;
  const now = new Date();
  if (now < cur) return null; // not yet
  const delivered = new Date();
  const next = nextDropAfter(new Date(cur.getTime() + 60_000));
  try {
    window.localStorage.setItem(KEY_DELIVERED, cur.toISOString());
    window.localStorage.setItem(KEY_NEXT, next.toISOString());
  } catch {
    // non-fatal
  }
  return { delivered_at: delivered, next_at: next };
}

export function getLastDelivered(): Date | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY_DELIVERED);
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Notification idempotency: only fire the browser/email notification
// once per drop. Returns true if the caller should send the notification
// (and writes the marker so the next call returns false for that drop).
export function shouldNotifyForDrop(dropIso: string): boolean {
  if (typeof window === "undefined") return false;
  const last = window.localStorage.getItem(KEY_NOTIFIED);
  if (last === dropIso) return false;
  try {
    window.localStorage.setItem(KEY_NOTIFIED, dropIso);
  } catch {
    // non-fatal
  }
  return true;
}
