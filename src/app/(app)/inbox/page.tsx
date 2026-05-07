"use client";
import { TopBar } from "@/components/TopBar";
import { Avatar } from "@/components/primitive/Avatar";
import { Pill } from "@/components/primitive/Pill";
import { Button } from "@/components/primitive/Button";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadMe } from "@/lib/mock/me";
import { MOCK_COHORT } from "@/lib/mock/cohort";
import {
  acceptThread,
  declineThread,
  loadThreads,
  seedDemoThreadsIfNeeded,
  type Thread,
} from "@/lib/inbox/threads";

export default function InboxPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [tab, setTab] = useState<"requests" | "active" | "sent">("requests");

  useEffect(() => {
    // Seed two demo incoming requests on first visit so the accept UX
    // is testable in single-browser dogfood mode. Idempotent.
    const me = loadMe();
    const candidates = MOCK_COHORT.filter(
      (c) => c.id !== me.id && c.user_id !== me.user_id
    ).slice(0, 2);
    seedDemoThreadsIfNeeded(candidates);
    setThreads(loadThreads());
  }, []);

  const refresh = () => setThreads(loadThreads());

  const incoming = useMemo(
    () => threads.filter((t) => t.status === "pending_incoming"),
    [threads]
  );
  const outgoing = useMemo(
    () => threads.filter((t) => t.status === "pending_outgoing"),
    [threads]
  );
  const active = useMemo(
    () =>
      threads
        .filter((t) => t.status === "accepted")
        .sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || "")),
    [threads]
  );

  function onAccept(id: string) {
    const me = loadMe();
    acceptThread(id, me.user_id);
    refresh();
  }
  function onDecline(id: string) {
    declineThread(id);
    refresh();
  }

  return (
    <>
      <TopBar title="Inbox" subtitle="Requests, accepted, sent" />
      <section className="container-app pt-6 pb-12">
        <div className="flex items-center gap-2 mb-5">
          <TabBtn active={tab === "requests"} onClick={() => setTab("requests")} count={incoming.length}>
            Requests
          </TabBtn>
          <TabBtn active={tab === "active"} onClick={() => setTab("active")} count={active.length}>
            Active
          </TabBtn>
          <TabBtn active={tab === "sent"} onClick={() => setTab("sent")} count={outgoing.length}>
            Sent
          </TabBtn>
        </div>

        {tab === "requests" ? (
          incoming.length === 0 ? (
            <EmptyState
              title="No incoming requests"
              body="When someone wants to talk to you, their request lands here. Accept and you can start a conversation."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {incoming.map((t) => (
                <RequestCard key={t.id} thread={t} onAccept={onAccept} onDecline={onDecline} />
              ))}
            </div>
          )
        ) : null}

        {tab === "active" ? (
          active.length === 0 ? (
            <EmptyState
              title="No active conversations"
              body="Accept a request or wait for someone to accept yours. Conversations land here once both sides agree to talk."
            />
          ) : (
            <div className="flex flex-col gap-2">
              {active.map((t) => (
                <ActiveRow key={t.id} thread={t} />
              ))}
            </div>
          )
        ) : null}

        {tab === "sent" ? (
          outgoing.length === 0 ? (
            <EmptyState
              title="No requests sent"
              body="Hit Request intro on someone's match card. Their accept lands here."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {outgoing.map((t) => (
                <SentCard key={t.id} thread={t} />
              ))}
            </div>
          )
        ) : null}
      </section>
    </>
  );
}

function TabBtn({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
        active
          ? "bg-ink text-bg border-ink"
          : "bg-bg text-muted border-border hover:text-ink"
      }`}
    >
      {children}
      {count > 0 ? (
        <span className="ml-1.5 font-mono text-[10px] opacity-80">({count})</span>
      ) : null}
    </button>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="surface p-6 text-center">
      <p className="text-sm font-semibold text-ink mb-1">{title}</p>
      <p className="text-xs text-muted leading-relaxed max-w-sm mx-auto">{body}</p>
    </div>
  );
}

function RequestCard({
  thread,
  onAccept,
  onDecline,
}: {
  thread: Thread;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  return (
    <div className="surface p-4">
      <div className="flex items-start gap-3">
        <Avatar name={thread.other.name} size={44} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-ink truncate">
              {thread.other.name}
            </p>
            <Pill size="sm">wants to talk</Pill>
          </div>
          <p className="text-xs text-muted truncate">{thread.other.location}</p>
        </div>
      </div>
      <p className="text-sm text-ink mt-3 leading-relaxed italic bg-bg/60 border border-border rounded-md p-3">
        &quot;{thread.request_note}&quot;
      </p>
      <div className="flex items-center justify-end gap-2 mt-3">
        <Button variant="ghost" size="sm" onClick={() => onDecline(thread.id)}>
          Decline
        </Button>
        <Button size="sm" onClick={() => onAccept(thread.id)}>
          Accept and start convo
        </Button>
      </div>
    </div>
  );
}

function ActiveRow({ thread }: { thread: Thread }) {
  const last = thread.messages[thread.messages.length - 1];
  return (
    <Link
      href={`/inbox/${thread.id}`}
      className="surface p-3 flex items-center gap-3 hover:border-ink/40 transition-colors"
    >
      <Avatar name={thread.other.name} size={40} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink truncate">{thread.other.name}</p>
        <p className="text-xs text-muted truncate">
          {last
            ? `${last.from_user_id === thread.other.user_id ? "" : "You: "}${last.text}`
            : "No messages yet - say hi"}
        </p>
      </div>
      <span className="text-xxs text-muted font-mono whitespace-nowrap">
        {timeAgo(thread.updated_at)}
      </span>
    </Link>
  );
}

function SentCard({ thread }: { thread: Thread }) {
  return (
    <div className="surface p-4">
      <div className="flex items-start gap-3">
        <Avatar name={thread.other.name} size={40} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-ink truncate">
              {thread.other.name}
            </p>
            <Pill size="sm">waiting</Pill>
          </div>
          <p className="text-xs text-muted truncate">{thread.other.location}</p>
        </div>
      </div>
      <p className="text-xs text-muted mt-3 leading-relaxed italic">
        Your note: &quot;{thread.request_note}&quot;
      </p>
      <p className="text-xxs text-muted mt-2 font-mono">
        Sent {timeAgo(thread.created_at)}
      </p>
    </div>
  );
}

function timeAgo(iso: string): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h`;
  const days = Math.round(hr / 24);
  return `${days}d`;
}
