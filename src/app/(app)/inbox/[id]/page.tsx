"use client";
import { TopBar } from "@/components/TopBar";
import { Avatar } from "@/components/primitive/Avatar";
import { Button } from "@/components/primitive/Button";
import { Textarea } from "@/components/primitive/Input";
import { useToast } from "@/components/primitive/Toast";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { loadMe } from "@/lib/mock/me";
import {
  appendMessage,
  findThread,
  type Thread,
} from "@/lib/inbox/threads";

export default function ThreadPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [thread, setThread] = useState<Thread | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const meRef = useRef(loadMe());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!params.id) return;
    const t = findThread(params.id);
    if (t) setThread(t);
  }, [params.id]);

  useEffect(() => {
    // Pin scroll to bottom when messages change so the latest line is
    // always in view — same shape as iMessage / Instagram DMs.
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [thread?.messages.length]);

  if (!thread) {
    return (
      <>
        <TopBar back={{ href: "/inbox" }} title="Loading..." />
        <div className="container-app py-10 text-sm text-muted">
          Looking up the thread...
        </div>
      </>
    );
  }

  if (thread.status !== "accepted") {
    return (
      <>
        <TopBar back={{ href: "/inbox" }} title={thread.other.name} />
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
        from_user_id: meRef.current.user_id,
        text,
        ts: new Date().toISOString(),
      });
      if (updated) setThread(updated);
      setDraft("");
    } catch {
      toast.push("Could not send. Try again.", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <TopBar back={{ href: "/inbox" }} title={thread.other.name} subtitle={thread.other.location} />
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
              {thread.messages.map((m, i) => {
                const mine = m.from_user_id === meRef.current.user_id;
                return (
                  <div
                    key={i}
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
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-border bg-surface px-4 py-3">
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
      </section>
    </>
  );
}
