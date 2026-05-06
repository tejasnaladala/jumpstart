"use client";
import { TopBar } from "@/components/TopBar";
import { MatchCard } from "@/components/MatchCard";
import { Logo } from "@/components/Logo";
import { Pill } from "@/components/primitive/Pill";
import { useEffect, useState } from "react";
import { loadMe } from "@/lib/mock/me";
import { generateLocalDrop } from "@/lib/match/local-drop";
import type { Match } from "@/lib/types";
import { motion, staggerList, fadeUpItem } from "@/components/motion";

export default function DropPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [meName, setMeName] = useState<string>("");
  const [hydrating, setHydrating] = useState(true);

  useEffect(() => {
    const me = loadMe();
    setMeName(me.name);
    const drop = generateLocalDrop(me);
    setMatches(drop);
    setHydrating(false);
  }, []);

  const today = new Date();
  const longDate = today.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
  const isoStamp = today.toISOString().slice(0, 16).replace("T", " ");
  // Cadence: drops land Monday, Wednesday, Friday at 09:00 PT.
  // Compute the next drop day from "now" so the press-card stays accurate
  // without a server round-trip.
  const nextDropLabel = computeNextDropLabel(today);

  return (
    <>
      <TopBar
        title="Your Drop"
        subtitle={longDate}
        right={<Logo size={22} withWord={false} href="/" />}
      />
      <section className="container-app pt-5 pb-6">
        {/* Editorial masthead for the drop, like a press release filing */}
        <div className="ed-rule pt-3 pb-4">
          <div className="flex items-center justify-between gap-2">
<span className="ed-serial">This week / 3 picks</span>
            <span className="ed-serial">{isoStamp} UTC</span>
          </div>
          <h2 className="font-display text-3xl text-ink mt-3 leading-tight">
            This week&apos;s picks,{" "}
            <span className="italic text-accent">scored for {meName.split(" ")[0] || "you"}</span>.
          </h2>
          <p className="text-sm text-muted mt-2 leading-relaxed">
            One match per drop, Monday, Wednesday, Friday at 09:00 PT. Tap any card for the full
            briefing. Request intro and you both get a single email with contact and a calendar
            link on accept.
          </p>
        </div>

        {hydrating ? (
          <div className="flex flex-col gap-3 pt-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="surface p-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-full skeleton" />
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="h-3 w-1/3 skeleton" />
                    <div className="h-3 w-2/3 skeleton" />
                    <div className="h-12 w-full skeleton mt-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.ul
            className="flex flex-col gap-3 pt-2"
            variants={staggerList}
            initial="hidden"
            animate="visible"
          >
            {matches.map((m, i) => (
              <motion.li key={m.id} variants={fadeUpItem} className="relative">
                <span className="ed-serial absolute -left-1 -top-2 z-10 bg-bg px-1">
                  {String(i + 1).padStart(2, "0")} / 03
                </span>
                <MatchCard match={m} index={i + 1} />
              </motion.li>
            ))}
          </motion.ul>
        )}

        {/* Next drop press-card */}
        <div className="mt-10 surface p-6 bg-gradient-to-b from-surface to-accent-soft border-accent-edge relative overflow-hidden">
          <span className="ed-serial absolute top-3 right-4">Next filing</span>
          <p className="font-display text-2xl text-ink leading-tight">
            {nextDropLabel.dayName}, <span className="italic">09:00 PT</span>.
          </p>
          <p className="text-sm text-muted mt-2 max-w-xs leading-relaxed">
            One new pick. The matchmaker is scoring the cohort against your card between drops.
          </p>
        </div>
      </section>
    </>
  );
}

// Cadence helper. Drops land on Monday, Wednesday, Friday at 09:00 PT.
// Returns a friendly label for the press-card given the user's local time
// reference. Computed client-side so it stays in sync without a fetch.
function computeNextDropLabel(now: Date): { dayName: string; iso: string } {
  // Drop days: 1=Mon, 3=Wed, 5=Fri (JS getDay weekday indices).
  const DROP_DAYS = [1, 3, 5] as const;
  const cursor = new Date(now);
  // If today is a drop day and the local clock is before 09:00 PT, that
  // is the next drop. Otherwise, advance day-by-day until we hit one.
  // We approximate "PT" as the user's local 09:00 since this is just a
  // human-readable label, not a real schedule trigger.
  for (let i = 0; i < 7; i++) {
    const day = cursor.getDay();
    const isDropDay = DROP_DAYS.includes(day as 1 | 3 | 5);
    const isFutureToday = i === 0 && now.getHours() < 9;
    if (isDropDay && (i > 0 || isFutureToday)) {
      const dayName = cursor.toLocaleDateString(undefined, { weekday: "long" });
      return { dayName, iso: cursor.toISOString().slice(0, 10) };
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return { dayName: "Monday", iso: cursor.toISOString().slice(0, 10) };
}
