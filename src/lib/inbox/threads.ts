// Inbox / threads model. Replaces the email-on-accept flow with an
// in-app, low-latency message surface modeled on Instagram DMs:
//   - Sender hits "Request intro" → a Thread is created in pending_outgoing.
//   - Recipient sees it in their inbox under "Incoming requests".
//   - Recipient accepts → status flips to accepted, both can message.
//   - Decline → status flips to declined, hidden from main inbox.
//
// Storage: localStorage at "jumpstart.threads" as a JSON array. Single
// source of truth; all reads/writes go through this module so the
// schema can evolve without scattered access. Closed-beta-of-10 stays
// browser-local; v1.5+ promotes this to a Supabase table.
//
// Stub-mode bilateral state limitation: in single-browser-session
// testing, accepting an outgoing request you sent yourself won't make
// "the other side" do anything (there is no other side in this
// browser). To make the accept flow visible during dogfooding, the
// inbox seeds 2 demo incoming requests on first visit so the founder
// can poke at accept/decline without needing two browsers.

import type { FounderCard } from "@/lib/types";

export type ThreadStatus = "pending_incoming" | "pending_outgoing" | "accepted" | "declined";

export type Message = {
  from_user_id: string;
  text: string;
  ts: string;
};

export type Thread = {
  id: string;
  // The other person in this thread (full snapshot of their card at
  // request time). The "me" side is implied by ownership of the inbox.
  other: FounderCard;
  status: ThreadStatus;
  // The opening note — the request body. Always preserved even after
  // accept so the convo has context.
  request_note: string;
  // Who initiated. "me" = current user sent the request; "them" =
  // current user received it.
  initiated_by: "me" | "them";
  messages: Message[];
  created_at: string;
  updated_at: string;
};

const KEY = "jumpstart.threads";
const SEED_FLAG = "jumpstart.inbox.seeded";

export function loadThreads(): Thread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Thread[];
  } catch {
    return [];
  }
}

export function saveThreads(threads: Thread[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(threads));
  } catch {
    // quota or privacy mode — non-fatal, the user just loses persistence
  }
}

export function findThread(id: string): Thread | undefined {
  return loadThreads().find((t) => t.id === id);
}

export function upsertThread(thread: Thread): void {
  const all = loadThreads();
  const i = all.findIndex((t) => t.id === thread.id);
  if (i >= 0) {
    all[i] = thread;
  } else {
    all.push(thread);
  }
  saveThreads(all);
}

export function createOutgoingThread(args: {
  other: FounderCard;
  request_note: string;
  match_id?: string;
}): Thread {
  const now = new Date().toISOString();
  const id = `thr_${args.other.user_id}_${Date.now().toString(36)}`;
  const thread: Thread = {
    id,
    other: args.other,
    status: "pending_outgoing",
    request_note: args.request_note,
    initiated_by: "me",
    messages: [],
    created_at: now,
    updated_at: now,
  };
  upsertThread(thread);
  return thread;
}

export function acceptThread(id: string, currentUserId: string): Thread | undefined {
  const all = loadThreads();
  const thread = all.find((t) => t.id === id);
  if (!thread) return undefined;
  thread.status = "accepted";
  thread.updated_at = new Date().toISOString();
  // No automatic system message — thread starts clean. Sender's
  // request_note is rendered as the first item in the thread view so
  // context is preserved without polluting the message log.
  void currentUserId;
  upsertThread(thread);
  return thread;
}

export function declineThread(id: string): Thread | undefined {
  const all = loadThreads();
  const thread = all.find((t) => t.id === id);
  if (!thread) return undefined;
  thread.status = "declined";
  thread.updated_at = new Date().toISOString();
  upsertThread(thread);
  return thread;
}

export function appendMessage(id: string, msg: Message): Thread | undefined {
  const all = loadThreads();
  const thread = all.find((t) => t.id === id);
  if (!thread) return undefined;
  thread.messages.push(msg);
  thread.updated_at = msg.ts;
  upsertThread(thread);
  return thread;
}

// Demo seed: on first inbox visit, drop in 2 incoming requests so the
// founder can see what the accept/decline UX feels like without
// needing a second browser. Idempotent via SEED_FLAG. Only fires
// once per browser. Removed when real-user-to-real-user threading is
// wired (the bilateral state is the right substrate then).
export function seedDemoThreadsIfNeeded(demoCards: FounderCard[]): void {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(SEED_FLAG) === "1") return;
  if (demoCards.length === 0) return;
  const now = Date.now();
  const seeds: Thread[] = demoCards.slice(0, 2).map((card, i) => ({
    id: `thr_seed_${card.user_id}_${(now - (i + 1) * 60_000).toString(36)}`,
    other: card,
    status: "pending_incoming",
    request_note:
      i === 0
        ? `Hey, saw the matchmaker paired us. Want to swap notes for 20 min before SS? I keep coming back to a few of the same problems and would value a second take.`
        : `Pinging because we'll both be at Chase Center day 1. Worth a 15 minute walk between sessions? Easy in person.`,
    initiated_by: "them",
    messages: [],
    created_at: new Date(now - (i + 1) * 60_000).toISOString(),
    updated_at: new Date(now - (i + 1) * 60_000).toISOString(),
  }));
  const existing = loadThreads();
  saveThreads([...existing, ...seeds]);
  window.localStorage.setItem(SEED_FLAG, "1");
}
