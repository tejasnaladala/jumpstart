"use client";
import { Avatar } from "@/components/primitive/Avatar";
import { Pill } from "@/components/primitive/Pill";
import type { Match } from "@/lib/types";
import { MATCH_TYPE_LABEL } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion, SPRING_TIGHT } from "@/components/motion";

type Props = {
  match: Match;
  index: number;
};

export function MatchCard({ match, index }: Props) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      transition={SPRING_TIGHT}
      className="rounded-lg"
    >
    <Link
      href={`/match/${match.id}`}
      className={cn(
        "block surface p-4 card-interactive"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-xxs font-mono text-muted">{index}</span>
          <Avatar name={match.candidate.name} size={44} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {/* h2 not h3: TopBar gives the page h1, so the match card is the
                section's primary subhead. Fixes the May 7 a11y rotor jump
                (h1 → h3 skip flagged by both design-review and architecture
                audits). */}
            <h2 className="text-base font-semibold text-ink truncate">
              {match.candidate.name}
            </h2>
            <span className="text-xs text-muted">{match.candidate.location}</span>
          </div>
          <p className="text-sm text-ink/80 mt-0.5 line-clamp-1">
            {match.candidate.building_summary}
          </p>
          <div className="mt-2.5 rounded-md bg-accent-soft border border-accent-edge px-3 py-2">
            <p className="text-xxs uppercase tracking-wider text-accent font-semibold mb-0.5">
              Why you should meet
            </p>
            <p className="text-sm text-ink leading-snug line-clamp-2">{match.explanation}</p>
          </div>
          <div className="flex items-center justify-between mt-2.5 gap-2">
            <div className="flex flex-wrap gap-1">
              {match.candidate.tags.slice(0, 3).map((t) => (
                <Pill key={t} size="sm">{t}</Pill>
              ))}
            </div>
            <Pill size="sm" accent>
              {MATCH_TYPE_LABEL[match.match_type]}
            </Pill>
          </div>
        </div>
      </div>
    </Link>
    </motion.div>
  );
}
