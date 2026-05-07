// Moderation queue. Single localStorage-backed surface that holds:
//   - pending cohort verifications (founder approves/rejects manually
//     up to 50 users, per founder direction)
//   - flagged posts/comments (auto-flagged at create time by the
//     content classifier)
//   - reported messages (user-initiated reports from inbox threads)
//   - blocked users (per-user; affects what they can see)
//
// Admin dashboard at /admin/moderation reads from here. Single source
// of truth so /admin/* and per-user surfaces stay consistent.

export type ModItemKind =
  | "verification"
  | "flagged_post"
  | "flagged_comment"
  | "reported_message"
  | "reported_post";

export type ModStatus = "pending" | "approved" | "rejected" | "removed" | "dismissed";

export type ModerationItem = {
  id: string;
  kind: ModItemKind;
  status: ModStatus;
  // Who triggered the moderation. For verification this is the user
  // who signed up; for flagged_* it's auto-flagged (author = trigger);
  // for reported_* it's the reporter.
  triggered_by: string; // user_id or "auto"
  // Subject of the moderation. For verification this is the new user;
  // for flagged_*, the post/comment id; for reported_*, the
  // message/post id.
  target_id: string;
  target_kind: "user" | "post" | "comment" | "message";
  target_label: string;     // e.g. "Tejas N." or "Show: AI agent eval harness"
  target_snippet?: string;  // first ~140 chars of body or a one-liner
  reasons?: string[];       // from classifier or reporter
  severity?: "low" | "medium" | "high";
  created_at: string;
  resolved_at?: string;
  resolution_note?: string;
};

const KEY = "jumpstart.moderation.queue";
const BLOCK_KEY = "jumpstart.moderation.blocked";

export function loadQueue(): ModerationItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ModerationItem[]) : [];
  } catch {
    return [];
  }
}

export function saveQueue(items: ModerationItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // non-fatal
  }
}

export function enqueue(item: Omit<ModerationItem, "id" | "created_at" | "status">): ModerationItem {
  const full: ModerationItem = {
    ...item,
    id: `mod_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    status: "pending",
    created_at: new Date().toISOString(),
  };
  const all = loadQueue();
  all.unshift(full);
  saveQueue(all);
  return full;
}

export function setStatus(id: string, status: ModStatus, note?: string): ModerationItem | undefined {
  const all = loadQueue();
  const i = all.findIndex((x) => x.id === id);
  if (i < 0) return undefined;
  all[i].status = status;
  all[i].resolved_at = new Date().toISOString();
  if (note) all[i].resolution_note = note;
  saveQueue(all);
  return all[i];
}

// Block list. Local to the current user. Affects what they see in
// inbox + forum (decline future requests, hide posts/comments from
// blocked authors).
export function loadBlocks(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(BLOCK_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed as string[]) : new Set();
  } catch {
    return new Set();
  }
}

export function saveBlocks(blocks: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BLOCK_KEY, JSON.stringify(Array.from(blocks)));
  } catch {
    // non-fatal
  }
}

export function blockUser(userId: string): void {
  const b = loadBlocks();
  b.add(userId);
  saveBlocks(b);
}

export function unblockUser(userId: string): void {
  const b = loadBlocks();
  b.delete(userId);
  saveBlocks(b);
}

export function isBlocked(userId: string): boolean {
  return loadBlocks().has(userId);
}
