"use client";
import { TopBar } from "@/components/TopBar";
import { MatchCard } from "@/components/MatchCard";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/primitive/Button";
import { DropCountdown } from "@/components/DropCountdown";
import { useEffect, useState } from "react";
import { loadMe } from "@/lib/mock/me";
import type { Match } from "@/lib/types";
import { motion, fadeUpItem, staggerList } from "@/components/motion";
import {
  consumeDrop,
  getEligibleDrop,
  getLastDelivered,
  setEligibleDrop,
  shouldNotifyForDrop,
} from "@/lib/drop/eligibility";
import {
  fireDropNotification,
  hasAsked,
  notificationState,
  requestNotificationPermission,
} from "@/lib/drop/notification";
import { eligibleDropFor, formatDropLabel } from "@/lib/drop/schedule";

export default function DropPage() {
  const [match, setMatch] = useState<Match | null>(null);
  const [meName, setMeName] = useState<string>("");
  const [hydrating, setHydrating] = useState(true);
  const [eligibleAt, setEligibleAt] = useState<Date | null>(null);
  const [hasDrop, setHasDrop] = useState(false);
  const [askingPerm, setAskingPerm] = useState(false);
  const [permState, setPermState] = useState<string>("default");

  // Hydrate eligibility. Closed-beta posture (May 7 2026): the founder
  // curates each match manually for the first ~50 users. There is NO
  // auto-generation when the countdown reaches zero. The page renders
  // a "preparing" state until the founder delivers a match into
  // localStorage at jumpstart.drop.delivered_match.<dropIso>. The 6-hour
  // buffer (3pm PT cutoff) gives the founder time to curate.
  useEffect(() => {
    const me = loadMe();
    setMeName(me.name);

    let elig = getEligibleDrop();
    if (!elig) {
      elig = eligibleDropFor(new Date());
      setEligibleDrop(elig);
    }
    setEligibleAt(elig);
    setPermState(notificationState());

    const now = new Date();
    if (now >= elig) {
      // Drop time has passed. Look for a manually-curated match the
      // founder dropped into localStorage. No automatic generation.
      const elIso = elig.toISOString();
      const deliveredKey = `jumpstart.drop.delivered_match.${elIso}`;
      try {
        const raw = window.localStorage.getItem(deliveredKey);
        if (raw) {
          const m = JSON.parse(raw) as Match;
          setMatch(m);
          setHasDrop(true);
          const consumed = consumeDrop();
          if (consumed) setEligibleAt(consumed.next_at);
          if (shouldNotifyForDrop(elIso) && m) {
            fireDropNotification({
              title: "Your match is in",
              body: `${m.candidate.name} is your pick. Read the four lines and decide.`,
              url: "/drop",
            });
          }
        }
        // No delivered match yet -> stays in "preparing" state below.
      } catch {
        // malformed delivery, treat as no-match
      }
    }

    setHydrating(false);
  }, []);

  // Crossing-zero handler from the live countdown. We do NOT auto-
  // generate a match. The page flips to "preparing" state and waits
  // for the founder to deliver a manually-curated pick.
  const onArrived = () => {
    // Re-check storage in case the founder just dropped a match in.
    if (!eligibleAt) return;
    const elIso = eligibleAt.toISOString();
    try {
      const raw = window.localStorage.getItem(
        `jumpstart.drop.delivered_match.${elIso}`
      );
      if (raw) {
        const m = JSON.parse(raw) as Match;
        setMatch(m);
        setHasDrop(true);
        const consumed = consumeDrop();
        if (consumed) setEligibleAt(consumed.next_at);
        fireDropNotification({
          title: "Your match is in",
          body: `${m.candidate.name} is your pick. Read the four lines and decide.`,
          url: "/drop",
        });
      }
    } catch {
      // skip
    }
  };

  async function askPerm() {
    setAskingPerm(true);
    const next = await requestNotificationPermission();
    setPermState(next);
    setAskingPerm(false);
  }

  const today = new Date();
  const longDate = today.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <>
      <TopBar
        title="Your Drop"
        subtitle={longDate}
        right={<Logo size={22} withWord={false} href="/" />}
      />
      {/* Single canonical column for every drop state. TopBar already
          carries the page hero (Your Drop / longDate); each section
          flows underneath at the same width as the rest of the app. */}
      {hydrating ? (
        <section className="container-app pt-6 pb-12 sm:pt-8 lg:pt-10">
          <div className="surface p-6 animate-pulse">
            <div className="h-3 w-1/3 skeleton mb-3" />
            <div className="h-3 w-2/3 skeleton" />
            <div className="h-24 w-full skeleton mt-4" />
          </div>
        </section>
      ) : hasDrop && match ? (
        <section className="container-app pt-6 pb-12 sm:pt-8 lg:pt-10">
          <DeliveredMatch match={match} meName={meName} eligibleAt={eligibleAt} />
        </section>
      ) : eligibleAt && new Date() >= eligibleAt ? (
        <section className="container-app pt-6 pb-12 sm:pt-8 lg:pt-10">
          <PreparingMatch eligibleAt={eligibleAt} />
        </section>
      ) : eligibleAt ? (
        <section className="container-app pt-6 pb-12 sm:pt-8 lg:pt-10">
          <WaitingForDrop
            eligibleAt={eligibleAt}
            onArrived={onArrived}
            permState={permState}
            askingPerm={askingPerm}
            onAskPerm={askPerm}
            hasAsked={hasAsked()}
          />
        </section>
      ) : null}
    </>
  );
}

function PreparingMatch({ eligibleAt }: { eligibleAt: Date }) {
  // Drop time has passed but the founder hasn't delivered a curated
  // match yet. Closed-beta-of-10 posture: every match in the first 50
  // is hand-curated, so there's a window between the timer hitting
  // zero and the founder finishing the pick. This screen says so
  // honestly without filler.
  return (
    <div className="surface p-6 sm:p-8 text-center bg-bg/60 mt-2">
      <div aria-hidden className="h-px bg-accent mx-auto mb-5 w-12" />
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-semibold">
        Match being prepared
      </p>
      <p className="font-display italic text-2xl sm:text-3xl text-ink leading-tight mt-3">
        {eligibleAt.toLocaleDateString("en-US", {
          timeZone: "America/Los_Angeles",
          weekday: "long",
          month: "short",
          day: "numeric",
        })}{" "}
        is filed.
      </p>
      <p className="text-xs text-muted mt-3 leading-relaxed max-w-md mx-auto">
        Every match in the first cohort window is curated by hand. Your
        pick lands here the moment the founder finishes scoring the
        cohort against your card. Refresh in a few minutes.
      </p>
      <div aria-hidden className="h-px bg-accent mx-auto mt-7 w-12" />
    </div>
  );
}

function DeliveredMatch({
  match,
  meName,
  eligibleAt,
}: {
  match: Match;
  meName: string;
  eligibleAt: Date | null;
}) {
  const lastDelivered = getLastDelivered();
  const deliveredLabel = lastDelivered
    ? lastDelivered.toLocaleString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
      })
    : "Today";
  // Page hero h1 lives in the TopBar (font-display, text-3xl+). This
  // section is the body: an ed-serial meta line, the match card, and
  // the next-filing block. No competing h2.
  return (
    <>
      <div className="flex items-center justify-between gap-2 mb-4">
        <span className="ed-serial">This drop / 1 pick</span>
        <span className="ed-serial">{deliveredLabel}</span>
      </div>
      <p className="text-sm text-muted leading-relaxed mb-6 max-w-prose">
        Scored for{" "}
        <span className="font-display italic text-ink">
          {meName.split(" ")[0] || "you"}
        </span>
        . Read the four lines, decide in 30 seconds. Drops land Mon, Wed, Fri at 9pm PT.
      </p>

      <motion.ul
        className="flex flex-col gap-3"
        variants={staggerList}
        initial="hidden"
        animate="visible"
      >
        <motion.li variants={fadeUpItem} className="relative">
          <span className="ed-serial absolute -left-1 -top-2 z-10 bg-bg px-1">
            01 / 01
          </span>
          <MatchCard match={match} index={1} />
        </motion.li>
      </motion.ul>

      {eligibleAt ? (
        <div className="mt-10 surface p-6 bg-gradient-to-b from-surface to-accent-soft border-accent-edge relative overflow-hidden">
          <span className="ed-serial absolute top-3 right-4">Next filing</span>
          <p className="font-display text-2xl sm:text-3xl text-ink leading-tight">
            {formatDropLabel(eligibleAt)}
          </p>
          <p className="text-sm text-muted mt-2 max-w-md leading-relaxed">
            One new pick. The matchmaker is scoring the cohort against your card between drops.
          </p>
        </div>
      ) : null}
    </>
  );
}

function WaitingForDrop({
  eligibleAt,
  onArrived,
  permState,
  askingPerm,
  onAskPerm,
  hasAsked: askedAlready,
}: {
  eligibleAt: Date;
  onArrived: () => void;
  permState: string;
  askingPerm: boolean;
  onAskPerm: () => Promise<void>;
  hasAsked: boolean;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-2 mb-6">
        <span className="ed-serial">Drop pending</span>
        <span className="ed-serial">1 pick incoming</span>
      </div>

      <DropCountdown targetIso={eligibleAt.toISOString()} onArrived={onArrived} />

      {/* Permission prompt for browser notifications. Asks once after
          the user has had a moment to absorb the countdown; users who
          deny see the rationale ("you'll get a notif and a toast")
          regardless. */}
      {permState !== "granted" && !askedAlready && permState !== "unsupported" ? (
        <div className="mt-6 surface p-4 flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm text-ink font-semibold mb-1">
              Get notified when your match drops
            </p>
            <p className="text-xs text-muted leading-relaxed">
              We will fire one browser notification at 9pm PT on drop nights. No
              spam, no daily digest, no "we miss you" emails.
            </p>
          </div>
          <Button onClick={onAskPerm} loading={askingPerm} size="sm">
            Allow
          </Button>
        </div>
      ) : null}
      {permState === "denied" ? (
        <div className="mt-6 surface p-4">
          <p className="text-xs text-muted leading-relaxed">
            Browser notifications are off. You will still see your match in the
            web app the moment the drop lands. Re-enable in your browser
            settings if you change your mind.
          </p>
        </div>
      ) : null}
    </>
  );
}
