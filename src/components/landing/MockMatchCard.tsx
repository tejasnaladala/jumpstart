"use client";
import { Avatar } from "@/components/primitive/Avatar";
import type { MockMatch } from "./mockMatches";

// Mock match card for the landing-page social-proof bento. NOT the same
// as the in-app MatchCard (which links to /match/[id] and uses real
// data). These are illustrative examples that demonstrate the matching
// surface to a cold visitor.
//
// Voice: founder-coded, technical. "AI infra founder needs frontend
// killer" beats "Sara is a thoughtful engineer interested in AI." The
// audience reads dozens of YC Demo Day blurbs a week; this is that
// register.
//
// Data lives in ./mockMatches.ts (pure data module) so Server Components
// can import MOCK_MATCHES without tripping Next 16's client-reference
// wrapping at SSR.

type Props = {
  match: MockMatch;
  className?: string;
};

export function MockMatchCard({ match, className }: Props): React.JSX.Element {
  const featured = match.featured;
  return (
    <div
      className={
        "group relative overflow-hidden border transition-colors duration-300 " +
        (featured
          ? "bg-ink text-bg border-ink/20 hover:border-accent/60"
          : "surface bg-bg/70 border-border hover:border-ink/30") +
        " " +
        (className || "")
      }
    >
      {/* match-score chip top-right (terminal-style mono number) */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        <span
          aria-hidden
          className={
            "h-1.5 w-1.5 rounded-full " +
            (featured ? "bg-accent" : "bg-accent")
          }
        />
        <span
          className={
            "font-mono text-[10px] uppercase tracking-[0.18em] tabular-nums " +
            (featured ? "text-bg/80" : "text-muted")
          }
        >
          match {match.matchScore}
        </span>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <Avatar name={match.name} size={40} />
          <div className="flex-1 min-w-0">
            <p
              className={
                "font-display text-lg leading-tight truncate " +
                (featured ? "text-bg" : "text-ink")
              }
            >
              {match.name}
            </p>
            <p
              className={
                "font-mono text-[10px] uppercase tracking-[0.18em] mt-1 " +
                (featured ? "text-bg/70" : "text-muted")
              }
            >
              {match.city} · {match.tz} · stage {match.stage}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <p
            className={
              "font-mono text-[11px] uppercase tracking-[0.2em] mb-1 " +
              // featured = espresso card → orange has 5:1 contrast there
              // (large enough on dark bg). Non-featured = cream card →
              // need accent-text (#A33800) for WCAG AA on small caps.
              (featured ? "text-accent" : "text-accent-text")
            }
          >
            building
          </p>
          <p
            className={
              "text-sm leading-snug " +
              (featured ? "text-bg/90" : "text-ink/90")
            }
          >
            {match.building}
          </p>
        </div>

        <div className="mt-4">
          <p
            className={
              "font-mono text-[11px] uppercase tracking-[0.2em] mb-1 " +
              (featured ? "text-bg/60" : "text-muted")
            }
          >
            needs
          </p>
          <p
            className={
              "text-sm leading-snug " +
              (featured ? "text-bg" : "text-ink")
            }
          >
            <span className="font-display italic text-accent">
              {match.needs}
            </span>
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {match.tags.map((t) => (
            <span
              key={t}
              className={
                "font-mono text-[11px] uppercase tracking-[0.14em] px-2 py-1 rounded-sm border " +
                (featured
                  ? "border-bg/30 text-bg/80"
                  : "border-border text-muted")
              }
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* hover spotlight: subtle cream glow on cream cards / accent on featured */}
      <div
        aria-hidden
        className={
          "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 " +
          (featured
            ? "bg-gradient-to-tr from-accent/10 via-transparent to-transparent"
            : "bg-gradient-to-tr from-accent/[0.04] via-transparent to-transparent")
        }
      />
    </div>
  );
}
