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

  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });

  return (
    <>
      <TopBar
        title="Your Drop"
        subtitle={today}
        right={<Logo size={22} withWord={false} href="/" />}
      />
      <section className="container-app pt-5 pb-6">
        <div className="flex items-center gap-2 mb-4">
          <Pill accent size="sm">3 worth meeting</Pill>
          <span className="text-xs text-muted">curated for {meName.split(" ")[0] || "you"}</span>
        </div>

        {hydrating ? (
          <div className="flex flex-col gap-3">
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
            className="flex flex-col gap-3"
            variants={staggerList}
            initial="hidden"
            animate="visible"
          >
            {matches.map((m, i) => (
              <motion.li key={m.id} variants={fadeUpItem}>
                <MatchCard match={m} index={i + 1} />
              </motion.li>
            ))}
          </motion.ul>
        )}

        <div className="mt-7 surface p-5 text-center bg-gradient-to-b from-surface to-accent-soft border-accent-edge">
          <p className="text-xxs uppercase tracking-wider text-accent font-semibold">Next drop</p>
          <p className="text-sm font-medium text-ink mt-1">Wednesday at 9:00 AM</p>
          <p className="text-xs text-muted mt-1.5 max-w-xs mx-auto">
            New three. We are matching the cohort against your card all week.
          </p>
        </div>
      </section>
    </>
  );
}
