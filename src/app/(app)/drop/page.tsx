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
            <span className="ed-serial">Drop No. 14 / 3 of 3</span>
            <span className="ed-serial">{isoStamp} UTC</span>
          </div>
          <h2 className="font-display text-3xl text-ink mt-3 leading-tight">
            Three worth meeting,{" "}
            <span className="italic text-accent">picked for {meName.split(" ")[0] || "you"}</span>.
          </h2>
          <p className="text-sm text-muted mt-2 leading-relaxed">
            Tap a card for the full briefing. Request intro and you both get a single email with
            contact and a calendar link on accept.
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
            Wednesday, <span className="italic">09:00 PT</span>.
          </p>
          <p className="text-sm text-muted mt-2 max-w-xs leading-relaxed">
            New three. The matchmaker is scoring the cohort against your card all week.
          </p>
        </div>
      </section>
    </>
  );
}
