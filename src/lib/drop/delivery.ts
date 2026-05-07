// Manual match delivery. The founder curates each match by hand for
// the first ~50 users, then writes the chosen Match record into
// localStorage at jumpstart.drop.delivered_match.<dropIso>. /drop
// reads from this exact key and renders the match when present.
//
// Closed-beta posture: localStorage-bound, so the admin's curation
// only reaches users in the same browser session. Real multi-user
// curation requires PocketBase or similar backend (queued).
//
// This module isolates the storage shape so /admin/curate and /drop
// stay in sync as the schema evolves.

import type { FounderCard, Match, MatchType } from "@/lib/types";

export type PendingDelivery = {
  user_id: string;
  user_name: string;
  user_card: FounderCard | null;
  drop_iso: string;
  storage_key: string;
};

export function deliveryKeyFor(dropIso: string): string {
  return `jumpstart.drop.delivered_match.${dropIso}`;
}

// Build a Match from a chosen candidate. Mirrors what generateSingleDrop
// would produce, but the founder picks the candidate + reasoning.
export function buildCuratedMatch(args: {
  me: FounderCard;
  candidate: FounderCard;
  match_type?: MatchType;
  explanation: string;
  suggested_opener: string;
  drop_iso: string;
}): Match {
  return {
    id: `match_${args.candidate.id}_curated_${Date.now().toString(36)}`,
    drop_id: `drop_${args.drop_iso}`,
    user_id: args.me.user_id,
    candidate: args.candidate,
    match_type: args.match_type || "domain_peer",
    score: 100, // hand-curated => max score
    reasoning_trace: `manual curation by founder at ${new Date().toISOString()}`,
    explanation: args.explanation,
    suggested_opener: args.suggested_opener,
    position: 1,
    shown_at: new Date().toISOString(),
    action: null,
  };
}

export function deliverMatch(dropIso: string, match: Match): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(deliveryKeyFor(dropIso), JSON.stringify(match));
  } catch {
    // non-fatal
  }
}

export function loadDeliveredMatch(dropIso: string): Match | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(deliveryKeyFor(dropIso));
    if (!raw) return null;
    return JSON.parse(raw) as Match;
  } catch {
    return null;
  }
}

// Find every drop_iso the current browser has an eligible_at for that
// is in the past but undelivered. Closed-beta: just looks at the one
// jumpstart.drop.next_at key for the founder's own browser. With real
// auth this scans every user.
export function findPendingDeliveries(me: FounderCard): PendingDelivery[] {
  if (typeof window === "undefined") return [];
  const out: PendingDelivery[] = [];
  // The eligible_at key holds the NEXT drop. If now >= eligible_at and
  // no delivered match exists for it, it's pending.
  try {
    const nextAt = window.localStorage.getItem("jumpstart.drop.next_at");
    if (!nextAt) return [];
    const at = new Date(nextAt);
    if (Number.isNaN(at.getTime())) return [];
    if (Date.now() < at.getTime()) return []; // not yet due
    const key = deliveryKeyFor(at.toISOString());
    if (window.localStorage.getItem(key)) return []; // already delivered
    out.push({
      user_id: me.user_id,
      user_name: me.name,
      user_card: me,
      drop_iso: at.toISOString(),
      storage_key: key,
    });
  } catch {
    // non-fatal
  }
  return out;
}
