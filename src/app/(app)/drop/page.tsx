"use client";
import { TopBar } from "@/components/TopBar";
import { MatchCard } from "@/components/MatchCard";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/primitive/Button";
import { DropCountdown } from "@/components/DropCountdown";
import { useEffect, useState } from "react";
import { loadMe } from "@/lib/mock/me";
import { generateSingleDrop } from "@/lib/match/local-drop";
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

  // Hydrate eligibility + match. If the user has no eligible drop set
  // (because they onboarded before this feature shipped, or storage was
  // wiped), compute one now from the current time.
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
      // Drop is live. Compute the match and mark consumed (rolls
      // eligible_at to the next slot for the post-drop countdown).
      const m = generateSingleDrop(me);
      setMatch(m);
      setHasDrop(true);
      const consumed = consumeDrop();
      if (consumed) {
        setEligibleAt(consumed.next_at);
      }
      // Fire browser + in-tab notification once per drop.
      const elIso = elig.toISOString();
      if (shouldNotifyForDrop(elIso) && m) {
        fireDropNotification({
          title: "Your match is in",
          body: `${m.candidate.name} is your pick for tonight. Read the four lines and decide.`,
          url: "/drop",
        });
      }
    }

    setHydrating(false);
  }, []);

  // Crossing-zero handler from the live countdown. When the timer hits
  // zero, re-run the eligibility check + match render. This avoids a
  // full page reload while still respecting the same code path.
  const onArrived = () => {
    const me = loadMe();
    const m = generateSingleDrop(me);
    if (!m) return;
    setMatch(m);
    setHasDrop(true);
    const consumed = consumeDrop();
    if (consumed) setEligibleAt(consumed.next_at);
    fireDropNotification({
      title: "Your match is in",
      body: `${m.candidate.name} is your pick for tonight. Read the four lines and decide.`,
      url: "/drop",
    });
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
      <section className="container-app pt-5 pb-10">
        {hydrating ? (
          <div className="surface p-6 animate-pulse">
            <div className="h-3 w-1/3 skeleton mb-3" />
            <div className="h-3 w-2/3 skeleton" />
            <div className="h-24 w-full skeleton mt-4" />
          </div>
        ) : hasDrop && match ? (
          <DeliveredMatch match={match} meName={meName} eligibleAt={eligibleAt} />
        ) : eligibleAt ? (
          <WaitingForDrop
            eligibleAt={eligibleAt}
            onArrived={onArrived}
            permState={permState}
            askingPerm={askingPerm}
            onAskPerm={askPerm}
            hasAsked={hasAsked()}
          />
        ) : null}
      </section>
    </>
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
  return (
    <>
      <div className="ed-rule pt-3 pb-4">
        <div className="flex items-center justify-between gap-2">
          <span className="ed-serial">This drop / 1 pick</span>
          <span className="ed-serial">{deliveredLabel}</span>
        </div>
        <h2 className="font-display text-3xl text-ink mt-3 leading-tight">
          One match,{" "}
          <span className="italic text-accent">scored for {meName.split(" ")[0] || "you"}</span>.
        </h2>
        <p className="text-sm text-muted mt-2 leading-relaxed">
          The matchmaker spent the last 48 hours scoring the cohort against your card. Read the
          four lines, decide in 30 seconds. Drops land Mon, Wed, Fri at 9pm PT.
        </p>
      </div>

      <motion.ul
        className="flex flex-col gap-3 pt-2"
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
          <p className="font-display text-2xl text-ink leading-tight">
            {formatDropLabel(eligibleAt)}
          </p>
          <p className="text-sm text-muted mt-2 max-w-xs leading-relaxed">
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
      <div className="ed-rule pt-3 pb-4">
        <div className="flex items-center justify-between gap-2">
          <span className="ed-serial">Drop pending</span>
          <span className="ed-serial">1 pick incoming</span>
        </div>
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
