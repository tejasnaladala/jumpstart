"use client";
import { TopBar } from "@/components/TopBar";
import { Avatar } from "@/components/primitive/Avatar";
import { Button } from "@/components/primitive/Button";
import { Textarea } from "@/components/primitive/Input";
import { useToast } from "@/components/primitive/Toast";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { loadMe } from "@/lib/mock/me";
import {
  appendMessage,
  findThread,
  type Thread,
} from "@/lib/inbox/threads";
import { playSent } from "@/lib/inbox/sound";
import { blockUser, enqueue } from "@/lib/moderation/queue";

export default function ThreadPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [thread, setThread] = useState<Thread | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [me] = useState(loadMe);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!params.id) return;
    const t = findThread(params.id);
    if (t) setThread(t);
  }, [params.id]);

  useEffect(() => {
    // Pin scroll to bottom when messages change so the latest line is
    // always in view - same shape as iMessage / Instagram DMs.
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [thread?.messages.length]);

  if (!thread) {
    return (
      <>
        <TopBar variant="compact" back={{ href: "/inbox" }} title="Loading..." />
        <div className="container-app pt-6 pb-12 text-sm text-muted">
          Looking up the thread...
        </div>
      </>
    );
  }

  if (thread.status !== "accepted") {
    return (
      <>
        <TopBar variant="compact" back={{ href: "/inbox" }} title={thread.other.name} />
        <section className="container-app pt-5">
          <div className="surface p-5">
            <p className="text-xxs uppercase tracking-wider text-muted font-semibold mb-1">
              Not accepted yet
            </p>
            <p className="text-sm text-ink leading-relaxed">
              {thread.status === "pending_incoming"
                ? "Accept the request from the inbox to start the conversation."
                : thread.status === "pending_outgoing"
                ? `${thread.other.name.split(" ")[0]} hasn't accepted yet. We'll move this to active the moment they do.`
                : "This conversation was declined."}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => router.push("/inbox")}
            >
              Back to inbox
            </Button>
          </div>
        </section>
      </>
    );
  }

  async function send() {
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    try {
      const updated = appendMessage(thread!.id, {
        from_user_id: me.user_id,
        text,
        ts: new Date().toISOString(),
      });
      if (updated) setThread(updated);
      setDraft("");
      playSent();
    } catch {
      toast.push("Could not send. Try again.", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <TopBar
        variant="compact"
        back={{ href: "/inbox" }}
        title={thread.other.name}
        subtitle={thread.other.location}
        right={
          <ThreadMenu
            otherName={thread.other.name}
            otherUserId={thread.other.user_id}
            onBlock={() => {
              blockUser(thread.other.user_id);
              toast.push(`Blocked ${thread.other.name}. They will not see your Pass or be able to message you.`, "info");
              router.push("/inbox");
            }}
            onReport={(reason) => {
              const lastMsg = thread.messages[thread.messages.length - 1];
              enqueue({
                kind: "reported_message",
                triggered_by: me.user_id,
                target_id: lastMsg?.text || thread.id,
                target_kind: "message",
                target_label: `${thread.other.name} in your inbox`,
                target_snippet: lastMsg?.text.slice(0, 140) ?? thread.request_note.slice(0, 140),
                reasons: [reason],
                severity: "medium",
              });
              toast.push("Reported. An admin will review.", "info");
            }}
          />
        }
      />
      {/* Single column for messages AND compose so they share the same
          horizontal axis. Previously compose was full-width while
          messages were centered, which read as misaligned at laptop
          resolutions. Both now live in container-app (440px on phone,
          720px on lg+). */}
      <section className="flex flex-col" style={{ height: "calc(100svh - 56px)" }}>
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto container-app pt-4 pb-2"
        >
          {/* Original request note rendered as the conversation seed */}
          <div className="surface p-3 mb-4 bg-bg/60">
            <p className="text-xxs uppercase tracking-wider text-muted font-semibold mb-1">
              Original request
            </p>
            <p className="text-sm text-ink leading-relaxed italic">
              &quot;{thread.request_note}&quot;
            </p>
          </div>

          {thread.messages.length === 0 ? (
            <p className="text-xs text-muted text-center py-6">
              No messages yet. Say hi.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <AnimatePresence initial={false}>
                {thread.messages.map((m, i) => {
                  const mine = m.from_user_id === me.user_id;
                  return (
                    <motion.div
                      key={`${m.ts}-${i}`}
                      // iMessage-style pop: bubble inflates from a small
                      // origin point + tiny upward drift. Spring config
                      // mimics the Apple Messages "tritone" cadence.
                      initial={{ opacity: 0, scale: 0.7, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 520,
                        damping: 26,
                        mass: 0.7,
                      }}
                      style={{
                        transformOrigin: mine ? "right center" : "left center",
                      }}
                      className={`flex ${mine ? "justify-end" : "justify-start"} items-end gap-2`}
                    >
                      {!mine ? <Avatar name={thread.other.name} size={28} /> : null}
                      <div
                        className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                          mine
                            ? "bg-ink text-bg rounded-br-sm"
                            : "bg-bg border border-border text-ink rounded-bl-sm"
                        }`}
                      >
                        {m.text}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="border-t border-border bg-surface">
          <div className="container-app py-3">
            <div className="flex items-end gap-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message"
                rows={1}
                maxLength={1000}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
              />
              <Button onClick={send} loading={sending} disabled={!draft.trim()}>
                Send
              </Button>
            </div>
            <p className="text-xxs text-muted mt-1.5">
              Enter to send. Shift-Enter for a new line.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function ThreadMenu({
  otherName,
  otherUserId,
  onBlock,
  onReport,
}: {
  otherName: string;
  otherUserId: string;
  onBlock: () => void;
  onReport: (reason: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-muted hover:text-ink transition-colors px-2 py-1 rounded-md"
        aria-label="Thread options"
      >
        ⋯
      </button>
      {open ? (
        <div
          className="absolute right-0 top-full mt-1 z-30 surface p-1 min-w-[180px]"
          onMouseLeave={() => setOpen(false)}
        >
          <button
            onClick={() => {
              setOpen(false);
              const reason = window.prompt(
                `Why are you reporting ${otherName}? (one short sentence)`
              );
              if (reason && reason.trim()) onReport(reason.trim());
            }}
            className="block w-full text-left text-xs px-3 py-2 rounded hover:bg-bg/60 text-ink"
          >
            Report
          </button>
          <button
            onClick={() => {
              setOpen(false);
              const ok = window.confirm(
                `Block ${otherName}? They will not see your Pass or be able to message you.`
              );
              if (ok) onBlock();
            }}
            className="block w-full text-left text-xs px-3 py-2 rounded hover:bg-error/10 text-error"
          >
            Block
          </button>
          <span className="block text-xxs text-muted px-3 pt-1 pb-2 font-mono">
            {otherUserId.slice(0, 12)}
          </span>
        </div>
      ) : null}
    </div>
  );
}
