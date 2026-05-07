// Coordinator. The thing that turns N independent persona sessions into
// a population that interacts. Without it, twelve personas would each
// do their own onboarding and never see each other.
//
// What it does:
//   1. Onboards every persona (signup → identity → verification → intent
//      → card) so each one writes their own Founder Card to localStorage
//      in their own browser context. This is what populates the cohort
//      from the harness's POV.
//   2. Schedules visits per persona using their cadence config (sampled
//      uniformly between pollMinSec and pollMaxSec). One scheduling tick
//      decides who acts next.
//   3. Routes intros: when persona A requests an intro to persona B's
//      candidate id, the coordinator records a pretend "received" event
//      on persona B's state. B then runs their decision rule (responsive
//      accepts fast, ghoster ignores, picky filters by tag overlap).
//   4. On accept, the coordinator emits a meetings.jsonl row with a
//      pretend Calendly slot 7-21 days out, capped by the event date
//      (2026-07-25). This is the "scheduled meeting" metric.
//
// All cross-persona communication runs through the app's intro API. The
// coordinator's role is bookkeeping: pair the personas, sample the
// schedule, decide accepts/declines, log the pretend meeting. The app
// stays the single source of truth for what was actually sent.

import type { Persona, PersonaState, ActivityEntry } from "../types";
import { PERSONAS, findPersona } from "../personas/seed";
import { loadState, saveState } from "./state";
import { logActivity } from "./activity";
import {
  browseCohort,
  chaosClick,
  closeSharedBrowser,
  fillIdentity,
  fillIntent,
  fillVerification,
  openSession,
  requestIntroVia,
  reviewAndSaveCard,
  signOut,
  signUp,
  visitDrop,
  visitYouAndShare,
  type PersonaSession,
} from "./session";
import { maybeAbandon, maybeIdle, maybeScrollAround } from "./realism";
import { existsSync, mkdirSync, appendFileSync } from "node:fs";
import path from "node:path";

const MEETINGS_LOG = path.resolve(__dirname, "..", "..", "experiments", "harness-meetings.jsonl");

// Event date cap: pretend meetings can be scheduled any time between 2 days
// from now and the SS event date 2026-07-25, whichever window is smaller.
// We pick a date in that window weighted toward "before SS so we have time
// to actually call".
const EVENT_DATE_ISO = "2026-07-25T16:00:00Z";

function ensureMeetingsLog(): void {
  const dir = path.dirname(MEETINGS_LOG);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function writeMeeting(record: {
  ts: string;
  match_id: string;
  requester_id: string;
  recipient_id: string;
  meeting_at: string;
  modality: "call" | "in_person";
}): void {
  ensureMeetingsLog();
  appendFileSync(MEETINGS_LOG, JSON.stringify(record) + "\n", "utf-8");
}

function pickMeetingTime(): string {
  const now = Date.now();
  const eventTs = Date.parse(EVENT_DATE_ISO);
  // 2 to 21 days out, capped by event date.
  const minTs = now + 2 * 24 * 60 * 60 * 1000;
  const maxTs = Math.min(now + 21 * 24 * 60 * 60 * 1000, eventTs - 60 * 60 * 1000);
  if (maxTs <= minTs) return new Date(minTs).toISOString();
  const t = minTs + Math.random() * (maxTs - minTs);
  // Snap to a 30-minute grid so it looks like a real calendar slot.
  const snapped = Math.round(t / (30 * 60 * 1000)) * (30 * 60 * 1000);
  return new Date(snapped).toISOString();
}

// Decide whether a persona accepts an inbound intro request, given
// their decision style and the requester's affinity hint.
function decideAccept(persona: Persona, requesterId: string): "accept" | "decline" | "ignore" {
  const affinity = persona.affinityHints?.[requesterId] ?? 0.3;
  switch (persona.decisionStyle) {
    case "responsive":
      return Math.random() < 0.7 + affinity * 0.3 ? "accept" : "decline";
    case "eager":
      return Math.random() < 0.6 + affinity * 0.4 ? "accept" : "decline";
    case "scheduler":
      return Math.random() < 0.55 + affinity * 0.35 ? "accept" : "decline";
    case "chatty":
      return Math.random() < 0.5 + affinity * 0.4 ? "accept" : "decline";
    case "picky":
      return Math.random() < 0.25 + affinity * 0.5 ? "accept" : "decline";
    case "minimal":
      return Math.random() < 0.4 + affinity * 0.4 ? "accept" : "decline";
    case "ghoster":
      // Ghosters ignore most. Returns "ignore" so coordinator does
      // not log a decision either way.
      return Math.random() < 0.15 ? "accept" : "ignore";
    default:
      return "decline";
  }
}

export async function onboardPersona(persona: Persona): Promise<PersonaState> {
  const state = loadState(persona.id);
  if (state.signed_up && state.onboarded) {
    return state;
  }
  const session = await openSession(persona);
  try {
    if (!state.signed_up) {
      await signUp(session);
      state.signed_up = true;
      state.last_action = new Date().toISOString();
      // Save IMMEDIATELY after signup so a mid-onboard failure doesn't
      // re-trigger signup on the next call. Closes the partial-state
      // bug spotted on the first harness round (Omar/Yusuf/Jordan
      // double-signup when their onboard step blew up).
      saveState(state);
      logActivity({ persona_id: persona.id, event: "signed_up" });
    }
    if (!state.onboarded) {
      await fillIdentity(session);
      await fillVerification(session);
      await fillIntent(session);
      await reviewAndSaveCard(session);
      state.onboarded = true;
      state.last_action = new Date().toISOString();
      saveState(state);
      logActivity({ persona_id: persona.id, event: "onboarded" });
    }
    return state;
  } finally {
    await session.close();
  }
}

export async function tickPersona(persona: Persona): Promise<void> {
  const state = loadState(persona.id);
  if (!state.signed_up || !state.onboarded) {
    await onboardPersona(persona);
  }
  const session = await openSession(persona);
  try {
    state.last_visit = new Date().toISOString();

    // Realism: sometimes the persona pokes around before settling on
    // the drop. Browse cohort, share Pass, scroll around, occasionally
    // abandon entirely. Captures the production-quality testing the
    // founder asked for: not just happy path, but realistic noise.
    if (Math.random() < 0.3) {
      // Detour through /browse first.
      await browseCohort(session).catch(() => 0);
      await maybeScrollAround(session);
      if (await maybeAbandon(session)) {
        saveState(state);
        return;
      }
    }
    if (Math.random() < 0.15) {
      // Detour through /you, click Share.
      await visitYouAndShare(session).catch(() => false);
      await maybeIdle(session);
    }

    // Action gate: cadence-driven action rate decides whether this tick
    // results in an action or a passive view.
    if (Math.random() > persona.cadence.actionRate) {
      // Lurk: just open the drop and bounce.
      await visitDrop(session).catch(() => null);
      state.drops_seen += 1;
      logActivity({ persona_id: persona.id, event: "viewed_drop" });
      // Light chaos pass on lurk visits - exercises defensive paths
      // that scripted flows skip. Bounded so it doesn't dominate the
      // round time.
      if (Math.random() < 0.1) {
        await chaosClick(session, 1500).catch(() => null);
      }
      saveState(state);
      return;
    }

    const matchIds = await visitDrop(session).catch(() => [] as string[]);
    state.drops_seen += 1;
    logActivity({
      persona_id: persona.id,
      event: "viewed_drop",
      detail: { count: matchIds.length, mobile: session.mobile },
    });

    if (matchIds.length === 0) {
      saveState(state);
      return;
    }

    // Decision: pick at most one match to request based on style.
    const targetId = pickMatch(persona, matchIds);
    if (!targetId) {
      saveState(state);
      return;
    }
    if (state.matches_requested.includes(targetId)) {
      // Already requested this one; skip to avoid duplicates.
      saveState(state);
      return;
    }

    const result = await requestIntroVia(session, targetId);
    state.last_action = new Date().toISOString();

    if (result.ok && result.body && (result.body as { accepted?: boolean }).accepted) {
      state.matches_requested.push(targetId);
      logActivity({
        persona_id: persona.id,
        event: "requested_intro",
        detail: { match_id: targetId, status: result.status, mobile: session.mobile },
      });
      // Route the intro to the recipient persona, if they exist in
      // the harness pool. The candidate id may be a fc_/u_ - we map
      // this to the persona by scanning seeded personas.
      const recipientPersonaId = recipientFromMatchId(targetId);
      if (recipientPersonaId) {
        await routeIntro({
          requesterId: persona.id,
          recipientId: recipientPersonaId,
          matchId: targetId,
        });
      }
    } else {
      logActivity({
        persona_id: persona.id,
        event: "error",
        detail: { stage: "request_intro", status: result.status, body: result.body },
      });
    }
    saveState(state);
  } finally {
    await session.close();
  }
}

function pickMatch(persona: Persona, matchIds: string[]): string | undefined {
  if (matchIds.length === 0) return undefined;
  switch (persona.decisionStyle) {
    case "eager":
      return matchIds[0];
    case "responsive":
      return matchIds[0];
    case "minimal":
      return matchIds[0];
    case "scheduler":
      return matchIds[0];
    case "chatty":
      return matchIds[Math.floor(Math.random() * matchIds.length)];
    case "picky":
      // Picky: skip first if there is a second; only act 30% of the time.
      return Math.random() < 0.3 ? matchIds[1] || matchIds[0] : undefined;
    case "ghoster":
      return Math.random() < 0.15 ? matchIds[0] : undefined;
    default:
      return matchIds[0];
  }
}

function recipientFromMatchId(matchId: string): string | undefined {
  // Try to map the candidate id back to a seeded persona by checking
  // each persona's intent.tags / identity for proximity. The simplest
  // proxy: the match id encodes the candidate's card id (fc_xxx) or
  // user id (u_xxx). We don't have a persona<->fc_id map yet because
  // stub mode generates random fc_ ids per session. So we sample
  // randomly here - coordinator's pretend graph is best-effort. A
  // future iteration can stash the persona-to-card mapping during
  // onboardPersona and read it back here.
  const candidates = PERSONAS;
  if (candidates.length === 0) return undefined;
  const idx = Math.floor(Math.random() * candidates.length);
  return candidates[idx]?.id;
}

export async function routeIntro(args: {
  requesterId: string;
  recipientId: string;
  matchId: string;
}): Promise<void> {
  const recipient = findPersona(args.recipientId);
  if (!recipient) return;
  const recipientState = loadState(recipient.id);
  recipientState.intros_received.push(args.matchId);
  logActivity({
    persona_id: recipient.id,
    event: "received_intro",
    detail: { from: args.requesterId, match_id: args.matchId },
  });

  const decision = decideAccept(recipient, args.requesterId);
  if (decision === "accept") {
    recipientState.intros_accepted.push(args.matchId);
    logActivity({
      persona_id: recipient.id,
      event: "accepted_intro",
      detail: { from: args.requesterId, match_id: args.matchId },
    });
    // Schedule a pretend meeting on accept. This is the metric that
    // closes the loop: signup → drop → intro → accept → meeting.
    const meetingAt = pickMeetingTime();
    writeMeeting({
      ts: new Date().toISOString(),
      match_id: args.matchId,
      requester_id: args.requesterId,
      recipient_id: recipient.id,
      meeting_at: meetingAt,
      modality: recipient.intent.open_to_in_person ? "in_person" : "call",
    });
    recipientState.meetings_scheduled.push(args.matchId);
    logActivity({
      persona_id: recipient.id,
      event: "scheduled_meeting",
      detail: { with: args.requesterId, at: meetingAt },
    });
  } else if (decision === "decline") {
    recipientState.intros_declined.push(args.matchId);
    logActivity({
      persona_id: recipient.id,
      event: "declined_intro",
      detail: { from: args.requesterId, match_id: args.matchId },
    });
  }
  // If "ignore", we leave it in intros_received so a future tick
  // could pick it back up - that simulates the ghoster pattern of
  // re-deciding later.

  saveState(recipientState);
}

export async function shutdown(): Promise<void> {
  await closeSharedBrowser();
}
