"use client";
import { TopBar } from "@/components/TopBar";
import { Avatar } from "@/components/primitive/Avatar";
import { Pill } from "@/components/primitive/Pill";
import { Button } from "@/components/primitive/Button";
import { Sheet } from "@/components/primitive/Sheet";
import { Textarea } from "@/components/primitive/Input";
import { useToast } from "@/components/primitive/Toast";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { loadMe } from "@/lib/mock/me";
import { generateLocalDrop, getMatchById } from "@/lib/match/local-drop";
import { MATCH_TYPE_LABEL } from "@/lib/types";
import type { Match } from "@/lib/types";

export default function MatchDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [match, setMatch] = useState<Match | null>(null);
  const [opener, setOpener] = useState("");
  const [requestOpen, setRequestOpen] = useState(false);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    const me = loadMe();
    const m = getMatchById(params.id!, me) || generateLocalDrop(me)[0];
    if (m) {
      setMatch(m);
      setOpener(m.suggested_opener);
    }
  }, [params.id]);

  function regenerateOpener() {
    if (!match) return;
    const variants = [
      match.suggested_opener,
      `Hey ${match.candidate.name.split(" ")[0]}, Jumpstart matched us this week. Curious if a quick chat about your work makes sense for you?`,
      `Saw your card on Jumpstart. The angle on ${match.candidate.tags[0] ?? "your space"} is interesting. 20 min sometime soon?`,
    ];
    const next = variants[(variants.indexOf(opener) + 1) % variants.length]!;
    setOpener(next);
  }

  async function sendRequest() {
    setSending(true);
    await new Promise((r) => setTimeout(r, 800));
    setSending(false);
    setRequestOpen(false);
    setRequested(true);
    toast.push("Request sent. We will email you when they accept.", "success");
  }

  const overlapTags = useMemo(() => {
    if (!match) return [];
    const me = loadMe();
    return me.tags.filter((t) => match.candidate.tags.includes(t));
  }, [match]);

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
                <h1 className="text-xl font-semibold">{match.candidate.name}</h1>
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
          On accept, both of you get an email with each other&apos;s contact and a calendar link. No
          chat to manage, no DMs to hunt. They have a per-week intro cap, so respect it if no answer
          comes back.
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
        />
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
