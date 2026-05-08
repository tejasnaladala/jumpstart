"use client";
import { Avatar } from "@/components/primitive/Avatar";
import type { MockMatch } from "./mockMatches";

// ComprehensiveMatchCard — replaces the small 6-up bento with a big,
// magazine-profile-shaped card that shows personality, not just a
// transaction. Founder said the smaller cards read like "what I'm
// building / what I need" repeated six times = transactional. This
// version reads like the four lines a friend would forward to you,
// expanded to the full profile.
//
// Layout (lg+): 12-column internal grid.
//   - Left col (col-span-5): identity panel — avatar, name, city/tz,
//     stage, match score, tag chips, working style, weird interest.
//   - Right col (col-span-7): build + ask panel — building (2-3 lines),
//     shipping next, needs (italic accent), offers back, reads, and
//     the matchmaker's reason for picking them for YOU.
// Mobile: single column, sections stack with hairline dividers.
//
// Two visual variants via `featured`:
//   - true: espresso bg + cream text (high-contrast Maya card)
//   - false: cream surface + ink text (warmer secondary card)
//
// Tone-aware: every text-color decision flips based on `featured` so the
// same component reads correctly on dark or light tone.

type Props = {
  match: MockMatch;
  className?: string;
};

export function ComprehensiveMatchCard({
  match,
  className,
}: Props): React.JSX.Element {
  const featured = !!match.featured;

  // Tone-aware token shortcuts so the JSX below stays readable.
  const t = {
    cardBg: featured ? "bg-ink text-bg" : "bg-surface text-ink",
    cardBorder: featured ? "border-ink/20" : "border-border",
    hover: featured
      ? "hover:border-accent/60"
      : "hover:border-ink/30",
    name: featured ? "text-bg" : "text-ink",
    sub: featured ? "text-bg/70" : "text-muted",
    body: featured ? "text-bg/90" : "text-ink/90",
    label: featured ? "text-accent" : "text-accent-text",
    rule: featured ? "border-bg/15" : "border-border",
    chipBorder: featured ? "border-bg/30" : "border-border",
    chipText: featured ? "text-bg/85" : "text-muted",
    quote: featured ? "text-bg" : "text-ink",
    italicAccent: "text-accent",
  };

  return (
    <article
      className={
        "group relative overflow-hidden border transition-colors duration-300 rounded-md " +
        t.cardBg +
        " " +
        t.cardBorder +
        " " +
        t.hover +
        " " +
        (className || "")
      }
    >
      {/* Match-score chip top-right */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
        <span
          className={
            "font-mono text-[11px] uppercase tracking-[0.18em] tabular-nums " +
            t.sub
          }
        >
          match {match.matchScore}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* === LEFT: Identity panel === */}
        <div
          className={
            "p-6 sm:p-8 lg:col-span-5 lg:border-r " +
            (featured ? "lg:border-bg/15" : "lg:border-border")
          }
        >
          {/* Avatar + name */}
          <div className="flex items-start gap-4">
            <Avatar name={match.name} size={56} />
            <div className="flex-1 min-w-0">
              <h3
                className={
                  "font-display text-2xl leading-tight " + t.name
                }
              >
                {match.name}
              </h3>
              <p
                className={
                  "font-mono text-[11px] uppercase tracking-[0.18em] mt-1.5 " +
                  t.sub
                }
              >
                {match.city} · {match.tz} · stage {match.stage}
              </p>
            </div>
          </div>

          {/* Stack tags */}
          <div className="mt-6 flex flex-wrap gap-1.5">
            {match.tags.map((tag) => (
              <span
                key={tag}
                className={
                  "font-mono text-[11px] uppercase tracking-[0.14em] px-2 py-1 rounded-sm border " +
                  t.chipBorder +
                  " " +
                  t.chipText
                }
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Working style */}
          <Section
            label="working style"
            tone={featured ? "dark" : "light"}
            className="mt-7"
          >
            <p className={"text-sm leading-relaxed " + t.body}>
              {match.workingStyle}
            </p>
          </Section>

          {/* Weird interest */}
          <Section
            label="off the clock"
            tone={featured ? "dark" : "light"}
            className="mt-5"
          >
            <p className={"text-sm leading-relaxed " + t.body}>
              {match.weirdInterest}
            </p>
          </Section>

          {/* Reads */}
          <Section
            label="reads · listens"
            tone={featured ? "dark" : "light"}
            className="mt-5"
          >
            <p className={"text-sm leading-relaxed " + t.body}>
              {match.reads}
            </p>
          </Section>
        </div>

        {/* === RIGHT: Build / ask / matchmaker note === */}
        <div className="p-6 sm:p-8 lg:col-span-7">
          {/* Building */}
          <Section label="building" tone={featured ? "dark" : "light"}>
            <p className={"text-base leading-snug " + t.body}>
              {match.building}
            </p>
          </Section>

          {/* Shipping next */}
          <Section
            label="shipping next"
            tone={featured ? "dark" : "light"}
            className="mt-5"
          >
            <p className={"text-sm leading-relaxed " + t.body}>
              {match.shippingNext}
            </p>
          </Section>

          {/* Needs (italic accent — the headline ask) */}
          <Section
            label="needs"
            tone={featured ? "dark" : "light"}
            className="mt-6"
          >
            <p
              className={
                "font-display italic text-xl sm:text-2xl leading-snug " +
                t.italicAccent
              }
            >
              {match.needs}
            </p>
          </Section>

          {/* Offers back */}
          <Section
            label="offers back"
            tone={featured ? "dark" : "light"}
            className="mt-5"
          >
            <p className={"text-sm leading-relaxed " + t.body}>
              {match.offersBack}
            </p>
          </Section>

          {/* Matchmaker reason — italic mono editorial note */}
          <div
            className={
              "mt-7 pt-5 border-t " +
              (featured ? "border-bg/15" : "border-border")
            }
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent shrink-0 pt-0.5"
              >
                why this match
              </span>
            </div>
            <p
              className={
                "mt-2 font-display italic text-base sm:text-lg leading-snug " +
                t.quote
              }
            >
              &ldquo;{match.matchReason}&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Hover spotlight: subtle accent glow on hover */}
      <div
        aria-hidden
        className={
          "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 " +
          (featured
            ? "bg-gradient-to-tr from-accent/10 via-transparent to-transparent"
            : "bg-gradient-to-tr from-accent/[0.04] via-transparent to-transparent")
        }
      />
    </article>
  );
}

// Small section wrapper: editorial label + content. Reused inside the
// card so each section has the same mono-cap label + 4-6px gap.
function Section({
  label,
  children,
  tone,
  className,
}: {
  label: string;
  children: React.ReactNode;
  tone: "dark" | "light";
  className?: string;
}): React.JSX.Element {
  const labelTone =
    tone === "dark" ? "text-accent" : "text-accent-text";
  return (
    <div className={className}>
      <p
        className={
          "font-mono text-[11px] uppercase tracking-[0.2em] mb-1.5 " +
          labelTone
        }
      >
        {label}
      </p>
      {children}
    </div>
  );
}
