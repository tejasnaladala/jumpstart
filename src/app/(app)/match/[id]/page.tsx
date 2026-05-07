"use client";
import { TopBar } from "@/components/TopBar";
import { Avatar } from "@/components/primitive/Avatar";
import { Pill } from "@/components/primitive/Pill";
import { Button } from "@/components/primitive/Button";
import { Sheet } from "@/components/primitive/Sheet";
import { Textarea } from "@/components/primitive/Input";
import { useToast } from "@/components/primitive/Toast";
import { DraftIndicator } from "@/components/primitive/DraftIndicator";
import { useDraftState } from "@/lib/hooks/useDraftState";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { loadMe } from "@/lib/mock/me";
import { generateLocalDrop, getMatchById } from "@/lib/match/local-drop";
import { MATCH_TYPE_LABEL } from "@/lib/types";
import type { Match } from "@/lib/types";
import { createOutgoingThread } from "@/lib/inbox/threads";

export default function MatchDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [match, setMatch] = useState<Match | null>(null);
  // notFound: the URL referenced a match id that doesn't exist in the
  // local drop. We previously substituted the first match in the drop
  // which silently sent a stranger to the user - closing security/match
  // agent finding "stranger substitution on stale URLs".
  const [notFound, setNotFound] = useState(false);
  const [opener, setOpener] = useState("");
  const [requestOpen, setRequestOpen] = useState(false);
  // Note (the personalized intro request body) is auto-saved per-match so a
  // user typing a thoughtful opener doesn't lose it on accidental nav-away.
  // Keyed by match id so each conversation has its own draft.
  const [note, setNote, noteStatus, clearNote] = useDraftState<string>(
    `jumpstart.intro.note.${params.id}`,
    "",
    { debounceMs: 350, maxAgeMs: 7 * 24 * 60 * 60 * 1000 }
  );
  const [sending, setSending] = useState(false);
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    const me = loadMe();
    const m = getMatchById(params.id!, me);
    if (m) {
      setMatch(m);
      setOpener(m.suggested_opener);
      setNotFound(false);
    } else {
      // Stale or invalid match id (drop has rotated, user pasted a
      // shared URL from a different cohort, link was tampered with).
      // Show a real not-found surface instead of substituting the first
      // match in the current drop - that would expose a stranger as if
      // the user had been matched with them.
      setNotFound(true);
    }
  }, [params.id]);

  // Humanized opener variants. Per user feedback ("the reaching out
  // responses feel AI generated"), these are written to sound like an
  // actual person typing on a Saturday morning, not a templated outreach
  // bot. No "Curious if a quick chat makes sense for you", no "30 min
  // sometime soon", no "I came across your card" framing. Each variant
  // names a specific shared thing and proposes one concrete next step.
  function regenerateOpener() {
    if (!match) return;
    const candidate = match.candidate;
    const firstName = candidate.name.split(" ")[0] || candidate.name;
    const overlapTag = candidate.tags.find((t) => loadMe().tags.includes(t));
    const candidateTag = candidate.tags[0];

    const variants: string[] = [match.suggested_opener];

    // Variant 2: builds on shared tag if there's overlap, falls back to
    // the candidate's first tag with a more conversational frame.
    if (overlapTag) {
      variants.push(
        `${firstName} - we both put ${overlapTag.replace(/-/g, " ")} on our cards. I'd love to compare notes for 20 min before SS. Free this week or next?`
      );
    } else if (candidateTag) {
      // Avoid the awkward "the angle on ai-agents is interesting" issue
      // by addressing the candidate's work directly without the slug.
      variants.push(
        `Hey ${firstName} - the way you described what you're building grabbed me. Worth a 20-min call? I'll keep it tight.`
      );
    }

    // Variant 3: in-person at the event, leaning into the user's framing
    // that the 2-day event is the culmination.
    variants.push(
      `${firstName} - if you're at Chase Center either day of SS, want to grab 15 min between sessions? Easier in person, but happy to do video before too.`
    );

    // Variant 4: short and direct, for founders who hate preamble.
    variants.push(
      `${firstName}, Jumpstart paired us. Worth a call?`
    );

    const next = variants[(variants.indexOf(opener) + 1) % variants.length]!;
    setOpener(next);
  }

  async function sendRequest() {
    if (!match) return;
    setSending(true);
    try {
      // If the user left the note blank, send the suggested opener so
      // the recipient sees the Pass-pulled phrasing. The Sheet copy
      // already says "Leave blank if the suggested opener feels right";
      // honor that instead of sending an empty intro note that gives
      // the recipient zero context. The Safety Classifier still runs
      // on whatever text we send.
      const trimmed = note.trim();
      const finalNote = trimmed.length > 0 ? trimmed : opener;
      const res = await fetch("/api/intros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          match_id: match.id,
          recipient_id: match.candidate.user_id,
          note: finalNote,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        const code = body.code as string | undefined;
        if (code === "SAFETY_BLOCK") {
          toast.push("Your note was flagged. Try without sales language or links.", "error");
        } else if (code === "RATE_LIMITED") {
          toast.push("Too many requests right now. Try later.", "error");
        } else {
          toast.push(body.error || "Could not send the request.", "error");
        }
        return;
      }
      setRequestOpen(false);
      setRequested(true);
      // Successful send: clear the auto-saved draft so it doesn't haunt
      // the next time this match is opened.
      clearNote();
      // Create a Thread in the user's inbox in pending_outgoing state
      // so they can see it under the Sent tab and pick up the convo
      // when the recipient accepts. Replaces the prior "we'll email
      // you" flow - see docs/launch-playbook.md "no-DMs hardline"
      // retirement note.
      try {
        if (match) {
          createOutgoingThread({
            other: match.candidate,
            request_note: finalNote,
            match_id: match.id,
          });
        }
      } catch {
        // localStorage failure is non-fatal - the API send already succeeded
      }
      toast.push("Request sent. Track it in your inbox.", "success");
    } catch {
      toast.push("Network issue. Try again.", "error");
    } finally {
      setSending(false);
    }
  }

  const overlapTags = useMemo(() => {
    if (!match) return [];
    const me = loadMe();
    return me.tags.filter((t) => match.candidate.tags.includes(t));
  }, [match]);

  if (notFound) {
    return (
      <>
        <TopBar back={{ href: "/drop" }} title="Match not found" />
        <section className="container-app py-12">
          <div className="surface p-6 max-w-lg">
            <p className="text-xxs uppercase tracking-wider text-muted font-semibold">
              Stale link
            </p>
            <h1 className="font-display text-2xl text-ink leading-tight mt-1">
              This match isn't in your current drop
            </h1>
            <p className="text-sm text-muted mt-3 leading-relaxed">
              Drops rotate at 09:00 PT on Mon, Wed, and Fri. The match you're looking for
              has already cycled out, or the link was for a different account.
            </p>
            <div className="mt-5 flex gap-2">
              <Button onClick={() => router.push("/drop")}>Back to today's drop</Button>
              <Button variant="ghost" onClick={() => router.push("/browse")}>
                Browse cohort
              </Button>
            </div>
          </div>
        </section>
      </>
    );
  }

  if (!match) {
    return (
      <>
        <TopBar back={{ href: "/drop" }} title="Loading..." />
        <div className="container-app py-10 text-sm text-muted">Finding this match...</div>
      </>
    );
  }

  return (
    <>
      <TopBar back={{ href: "/drop" }} title="Match" />

      <section className="container-app pt-5 pb-10">
        <div className="surface p-5">
          <div className="flex items-start gap-4">
            <Avatar name={match.candidate.name} size={56} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="font-sans text-xl font-semibold tracking-tight text-ink">{match.candidate.name}</h1>
                <Pill size="sm" accent>{MATCH_TYPE_LABEL[match.match_type]}</Pill>
              </div>
              <p className="text-sm text-muted">{match.candidate.location}</p>
            </div>
          </div>

          <div className="mt-5 rounded-lg bg-accent-soft border border-accent-edge p-4">
            <p className="text-xxs uppercase tracking-wider text-accent font-semibold mb-1.5">
              Why you should meet
            </p>
            <p className="text-sm text-ink leading-relaxed">{match.explanation}</p>
          </div>

          <SectionLine label="Building">
            {match.candidate.building_summary}
          </SectionLine>
          <SectionLine label="Looking for">
            {match.candidate.looking_for}
          </SectionLine>
          <SectionLine label="Talk to them if">
            <span className="italic">{match.candidate.talk_to_me_if}</span>
          </SectionLine>

          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-xxs uppercase tracking-wider text-muted font-semibold mb-2">
              Shared tags
            </p>
            <div className="flex flex-wrap gap-1.5">
              {match.candidate.tags.map((t) => (
                <Pill key={t} size="sm" active={overlapTags.includes(t)}>
                  {t}
                </Pill>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 surface p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xxs uppercase tracking-wider text-muted font-semibold">
              Suggested opener
            </p>
            <button
              onClick={regenerateOpener}
              className="text-xs text-accent hover:underline inline-flex items-center gap-1"
            >
              <Refresh /> Regenerate
            </button>
          </div>
          <p className="text-sm text-ink leading-relaxed bg-bg border border-border rounded-md p-3 italic">
            "{opener}"
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.clipboard) {
                  navigator.clipboard.writeText(opener);
                  toast.push("Opener copied", "info");
                }
              }}
            >
              Copy opener
            </Button>
            <Button variant="ghost" size="sm" onClick={regenerateOpener}>
              Regenerate
            </Button>
          </div>
        </div>

        <div className="mt-5 flex items-stretch gap-2">
          <Button
            variant={requested ? "secondary" : "primary"}
            block
            disabled={requested}
            onClick={() => setRequestOpen(true)}
          >
            {requested ? "Request sent" : "Request intro"}
          </Button>
          <Button variant="ghost" onClick={() => toast.push("Saved for later", "info")}>
            Save
          </Button>
        </div>
        <p className="text-xs text-muted mt-3 leading-relaxed">
          On accept, the conversation opens in your inbox. Low-friction, in-app, no email forwarding
          to manage. They have a per-week intro cap, so respect it if no answer comes back.
        </p>

        <div className="mt-7 flex flex-wrap gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              toast.push("Marked not relevant. Future drops will avoid this shape.", "info");
              router.push("/drop");
            }}
          >
            Not relevant
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/drop")}
          >
            Skip
          </Button>
        </div>
      </section>

      <Sheet
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        title={`Request intro to ${match.candidate.name}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRequestOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendRequest} loading={sending}>
              Send
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted mb-3">
          Add a one-line note. Leave blank if the suggested opener feels right.
        </p>
        <Textarea
          rows={4}
          placeholder={opener}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          showCounter
        />
        <div className="flex items-center justify-between gap-2 mt-2">
          <DraftIndicator status={noteStatus} />
          <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted">
            Auto-saved per match
          </span>
        </div>
        <p className="text-xs text-muted mt-3 leading-relaxed">
          The Safety Classifier reads every intro note before it sends. Spam, harassment, and
          obvious fakes get flagged.
        </p>
      </Sheet>
    </>
  );
}

function SectionLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 pt-4 border-t border-border first:mt-5">
      <p className="text-xxs uppercase tracking-wider text-muted font-semibold mb-1">{label}</p>
      <p className="text-sm text-ink leading-relaxed">{children}</p>
    </div>
  );
}

function Refresh() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
      <path
        d="M2 6a4 4 0 016.5-3.1M10 6a4 4 0 01-6.5 3.1M9.5 1v2.5H7M2.5 11V8.5H5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
