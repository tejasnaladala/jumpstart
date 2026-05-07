"use client";
import { Pill } from "@/components/primitive/Pill";
import { Button } from "@/components/primitive/Button";
import { Avatar } from "@/components/primitive/Avatar";
import { useEffect, useMemo, useState } from "react";
import {
  loadQueue,
  loadBlocks,
  setStatus,
  type ModerationItem,
  type ModItemKind,
} from "@/lib/moderation/queue";
import { MOCK_COHORT } from "@/lib/mock/cohort";
import { loadMe } from "@/lib/mock/me";

// Admin moderation surface. Reads from the per-browser
// localStorage-backed queue (same store as the user-facing inbox).
// Closed-beta posture: founder is the admin, founder's browser holds
// the canonical queue. Promotes to a Postgres table at v1.5+.
//
// Tabs:
//   Pending      everything still status="pending"
//   Verifications  per-user verification submissions, manual approve
//   Reports        user-initiated reports of posts/messages
//   Auto-flagged   classifier-flagged content
//   Members        every user we know about (for the "see all members" ask)
//   History        resolved items, last 50

type Tab = "pending" | "verifications" | "reports" | "flagged" | "members" | "history";

export default function ModerationQueuePage() {
  const [tab, setTab] = useState<Tab>("pending");
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [blocks, setBlocks] = useState<Set<string>>(new Set());

  function refresh() {
    setItems(loadQueue());
    setBlocks(loadBlocks());
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    switch (tab) {
      case "pending":
        return items.filter((i) => i.status === "pending");
      case "verifications":
        return items.filter((i) => i.kind === "verification");
      case "reports":
        return items.filter((i) =>
          i.kind === "reported_post" || i.kind === "reported_message"
        );
      case "flagged":
        return items.filter((i) =>
          i.kind === "flagged_post" || i.kind === "flagged_comment"
        );
      case "history":
        return items.filter((i) => i.status !== "pending").slice(0, 50);
      default:
        return [];
    }
  }, [items, tab]);

  function decide(id: string, status: "approved" | "rejected" | "removed" | "dismissed") {
    setStatus(id, status);
    refresh();
  }

  return (
    <div className="container-wide">
      <div className="flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <p className="text-xxs uppercase tracking-wider text-accent font-semibold">
            Trust and safety
          </p>
          <h1 className="font-display text-4xl text-ink leading-tight mt-1">
            Moderation queue
          </h1>
          <p className="text-sm text-muted mt-2 max-w-xl">
            Closed-beta posture: founder is sole admin. Manual cohort verification up to 50 users.
            Auto-flagged content lands here on create. User reports land here on submit.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted font-mono">
          <span>{items.filter((i) => i.status === "pending").length} pending</span>
          <span className="opacity-50">·</span>
          <span>{blocks.size} blocked</span>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2">
        {(
          [
            ["pending", "Pending"],
            ["verifications", "Verifications"],
            ["reports", "Reports"],
            ["flagged", "Auto-flagged"],
            ["members", "Members"],
            ["history", "History"],
          ] as [Tab, string][]
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
              tab === k
                ? "bg-ink text-bg border-ink"
                : "bg-bg text-muted border-border hover:text-ink"
            }`}
          >
            {label}
            {k === "pending" || k === "verifications" || k === "reports" || k === "flagged" ? (
              <span className="ml-1.5 font-mono opacity-80">
                (
                {
                  items.filter((i) => {
                    if (k === "pending") return i.status === "pending";
                    if (k === "verifications") return i.kind === "verification";
                    if (k === "reports")
                      return i.kind === "reported_post" || i.kind === "reported_message";
                    if (k === "flagged")
                      return i.kind === "flagged_post" || i.kind === "flagged_comment";
                    return false;
                  }).length
                }
                )
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === "members" ? (
        <MembersList />
      ) : filtered.length === 0 ? (
        <div className="surface p-6 text-center mt-2 max-w-3xl">
          <p className="text-sm text-ink mb-1">Empty.</p>
          <p className="text-xs text-muted">
            {tab === "pending"
              ? "No pending items. The classifier and reporters are quiet."
              : tab === "history"
              ? "Nothing resolved yet."
              : "Nothing in this category."}
          </p>
        </div>
      ) : (
        <ul className="mt-2 max-w-4xl flex flex-col gap-3">
          {filtered.map((item) => (
            <ModRow key={item.id} item={item} onDecide={decide} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ModRow({
  item,
  onDecide,
}: {
  item: ModerationItem;
  onDecide: (id: string, status: "approved" | "rejected" | "removed" | "dismissed") => void;
}) {
  const isPending = item.status === "pending";
  const sevColor =
    item.severity === "high"
      ? "text-error"
      : item.severity === "medium"
      ? "text-accent"
      : "text-muted";

  return (
    <li className="surface p-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Pill size="sm" accent>
          {labelForKind(item.kind)}
        </Pill>
        {item.severity ? (
          <span className={`text-xxs font-mono uppercase tracking-wider ${sevColor}`}>
            {item.severity}
          </span>
        ) : null}
        <span className="text-xxs text-muted font-mono">{relativeFor(item.created_at)}</span>
        <span className="text-xxs text-muted font-mono opacity-50">{item.id.slice(0, 14)}</span>
        <span className={`ml-auto text-xxs font-mono uppercase tracking-wider ${
          item.status === "pending" ? "text-accent" : "text-muted"
        }`}>
          {item.status}
        </span>
      </div>

      <div className="mt-3">
        <p className="text-sm font-semibold text-ink">{item.target_label}</p>
        {item.target_snippet ? (
          <p className="text-sm text-muted mt-1.5 italic leading-relaxed bg-bg/50 border border-border rounded-md p-3">
            {item.target_snippet}
          </p>
        ) : null}
      </div>

      <div className="mt-3 flex items-center gap-3 flex-wrap text-xxs text-muted font-mono">
        <span>triggered_by: {item.triggered_by}</span>
        {item.reasons && item.reasons.length > 0 ? (
          <span>reasons: {item.reasons.join(", ")}</span>
        ) : null}
      </div>

      {isPending ? (
        <div className="mt-4 pt-3 border-t border-border flex items-center gap-2 flex-wrap">
          {item.kind === "verification" ? (
            <>
              <Button size="sm" onClick={() => onDecide(item.id, "approved")}>
                Verify
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onDecide(item.id, "rejected")}>
                Reject
              </Button>
            </>
          ) : item.kind === "flagged_post" || item.kind === "reported_post" ? (
            <>
              <Button size="sm" onClick={() => onDecide(item.id, "approved")}>
                Approve content
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-error hover:bg-error/5"
                onClick={() => onDecide(item.id, "removed")}
              >
                Remove post
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onDecide(item.id, "dismissed")}>
                Dismiss
              </Button>
            </>
          ) : item.kind === "flagged_comment" ? (
            <>
              <Button size="sm" onClick={() => onDecide(item.id, "approved")}>
                Approve
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-error hover:bg-error/5"
                onClick={() => onDecide(item.id, "removed")}
              >
                Remove comment
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" onClick={() => onDecide(item.id, "dismissed")}>
                Dismiss
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-error hover:bg-error/5"
                onClick={() => onDecide(item.id, "removed")}
              >
                Take action
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="mt-3 pt-3 border-t border-border text-xxs text-muted font-mono">
          resolved {item.resolved_at ? relativeFor(item.resolved_at) : ""}{" "}
          {item.resolution_note ? `· ${item.resolution_note}` : ""}
        </div>
      )}
    </li>
  );
}

function MembersList() {
  // Closed-beta posture: members are the seeded mock cohort plus the
  // current user. Once real auth + PocketBase land, this pulls every
  // user row.
  const me = loadMe();
  const all = [me, ...MOCK_COHORT.filter((c) => c.id !== me.id && c.user_id !== me.user_id)];
  return (
    <ul className="mt-2 max-w-4xl flex flex-col gap-2">
      {all.map((c) => (
        <li key={c.id} className="surface p-3 flex items-center gap-3">
          <Avatar name={c.name} size={36} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-ink truncate">{c.name}</span>
              <Pill size="sm" accent={c.trust_tier === "verified"}>
                {c.trust_tier}
              </Pill>
            </div>
            <p className="text-xs text-muted truncate">
              {c.location}{" "}
              {c.public_link ? (
                <span className="opacity-60 font-mono">· {c.public_link}</span>
              ) : null}
            </p>
          </div>
          <span className="text-xxs text-muted font-mono opacity-70">{c.user_id}</span>
        </li>
      ))}
    </ul>
  );
}

function labelForKind(k: ModItemKind): string {
  const map: Record<ModItemKind, string> = {
    verification: "Verification",
    flagged_post: "Auto-flag · Post",
    flagged_comment: "Auto-flag · Comment",
    reported_post: "Report · Post",
    reported_message: "Report · Message",
  };
  return map[k] || k;
}

function relativeFor(iso: string) {
  if (!iso) return "unknown";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "unknown";
  const diff = Math.max(0, Date.now() - t);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}
