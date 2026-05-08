import { BlurFade } from "@/components/BlurFade";
import { GlassNav } from "@/components/GlassNav";
import { ScrollProgress } from "@/components/ScrollProgress";
import { InlineWaitlist } from "@/components/InlineWaitlist";
import { NextDropCountdown } from "@/components/NextDropCountdown";
import { Marquee } from "@/components/Marquee";
import { CursorGlow } from "@/components/landing/CursorGlow";
import { FounderGraph } from "@/components/landing/FounderGraph";
import { TerminalLine } from "@/components/landing/TerminalLine";
import { MockMatchCard } from "@/components/landing/MockMatchCard";
import { MOCK_MATCHES } from "@/components/landing/mockMatches";
import Link from "next/link";

// Landing page rebuild (May 7 2026, second pass).
//
// The first ditto.ai-influenced redo (commit 0e4d625) read as too safe
// to the founder, who pushed back: "feels too safe, too generic, too
// AI generated." This rewrite goes the other direction. Founder-coded.
// Technical density. SVG graph hero. Mock match cards with the language
// builders actually use ("needs frontend killer", not "thoughtful
// engineer"). Terminal microinteractions in the how-it-works.
//
// Audience anchor: young technical YC founders. Hackers who read Demo
// Day blurbs every week, ship before they announce, and bounce off
// "find your people" copy in 4 seconds.
//
// Compositional choices kept:
//   - Editorial brand (cream / orange / espresso, Instrument Serif italic)
//   - GlassNav fixed top, ScrollProgress thread
//   - InlineWaitlist as the only CTA primitive (no duplicate forms)
//   - BlurFade for section reveals (one shared primitive)
//   - Marquee espresso strip
//
// New surfaces:
//   - CursorGlow (desktop-only accent radial under the cursor)
//   - FounderGraph (SVG node graph as the hero right column)
//   - MockMatchCard bento (6 illustrative matches, language is the point)
//   - TerminalLine (mono command-line for HowItWorks steps)
//
// Voice rules from CLAUDE.md still load-bearing: no em-dashes, no AI
// slop adjectives, no "find your people". Every line is something a
// technical founder would say to another technical founder over coffee.

export default function LandingPage(): React.JSX.Element {
  return (
    <main id="main" className="min-h-svh bg-bg text-ink overflow-hidden">
      <ScrollProgress />
      <GlassNav />
      <CursorGlow />

      {/* HERO. Two-column on lg+: left = headline + sub + CTA + trust,
          right = FounderGraph SVG. Mobile: stacked, graph below the
          waitlist (smaller viewport scaled via SVG viewBox). */}
      <section className="relative pt-[120px] pb-16 sm:pt-[140px] sm:pb-20 lg:pt-[180px] lg:pb-24">
        {/* Ambient orange-glow pad behind the graph. Decorative only. */}
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-200px] top-[100px] hidden lg:block w-[700px] h-[700px] rounded-full"
          style={{
            background:
              "radial-gradient(circle at center, rgba(255,102,0,0.08), transparent 65%)",
          }}
        />
        <div className="container-wide relative">
          <BlurFade>
            <div className="ed-rule mb-10 lg:mb-14 flex items-center justify-between gap-4 pt-3 text-xs">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse"
                />
                <span className="ed-serial">
                  No. 001 / Cohort YC SS 2026 · 2,000 builders
                </span>
              </div>
              <span className="ed-serial hidden sm:inline whitespace-nowrap">
                Drops Mon · Wed · Fri at 9 PM PT
              </span>
            </div>
          </BlurFade>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-start">
            <div className="lg:col-span-7">
              <BlurFade>
                <h1 className="font-display text-[44px] leading-[0.96] tracking-[-0.015em] text-ink sm:text-6xl lg:text-7xl xl:text-[80px]">
                  A founder graph for{" "}
                  <span className="italic text-accent">
                    YC Startup School.
                  </span>
                </h1>
              </BlurFade>
              <BlurFade delay={0.06}>
                <p className="mt-6 max-w-xl text-lg lg:text-xl text-muted leading-relaxed">
                  Meet the builders moving at your speed. One match per
                  drop, scored by an AI that reads what you&apos;re shipping.
                  Find the person who makes your next 3 months faster.
                </p>
              </BlurFade>

              <BlurFade delay={0.12}>
                <div id="waitlist" className="mt-9 max-w-xl scroll-mt-24">
                  <InlineWaitlist
                    source="hero"
                    buttonLabel="Get on the graph"
                  />
                </div>
              </BlurFade>

              <BlurFade delay={0.18}>
                <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <Verified />
                  <span>Verified SS 2026 attendees first.</span>
                  <span aria-hidden className="opacity-50">
                    ·
                  </span>
                  <span>Founder reads every entry.</span>
                  <span aria-hidden className="opacity-50">
                    ·
                  </span>
                  <span>Not affiliated with Y Combinator.</span>
                </div>
              </BlurFade>

              <BlurFade delay={0.24}>
                <div className="mt-10 grid grid-cols-3 gap-px bg-border max-w-md">
                  <Stat n="2,000" label="Cohort attendees" />
                  <Stat n="48 hrs" label="At Chase Center" />
                  <Stat n="3×/wk" label="Drop cadence" />
                </div>
              </BlurFade>
            </div>

            {/* Right column: FounderGraph SVG. On mobile it falls below
                with a top divider; on lg+ it sits parallel to the copy.
                Wrapped in a pad so the SVG breathes. */}
            <div className="lg:col-span-5 relative mt-4 lg:mt-0">
              <BlurFade delay={0.18}>
                <div className="relative">
                  <FounderGraph />
                </div>
              </BlurFade>
              <BlurFade delay={0.34}>
                <div className="mt-6 surface bg-bg/60 p-5 sm:p-6">
                  <NextDropCountdown />
                </div>
              </BlurFade>
            </div>
          </div>
        </div>
      </section>

      {/* Espresso marquee strip. Carries the cadence into the page break. */}
      <Marquee
        items={[
          "Cohort YC SS 2026",
          "One match per drop",
          "Built by an attendee",
          "Verified founders only",
          "Mon · Wed · Fri · 9 PM PT",
          "Chase Center · July 25–26",
          "Not affiliated with Y Combinator",
        ]}
        variant="espresso"
      />

      {/* WHY THIS EXISTS. The thesis line, then a short stanza. The point
          isn't to monologue, it's to land the math: 2000 people, 2 days,
          O(n²) collisions = you'll meet 30 by accident. */}
      <section className="container-wide py-20 lg:py-28">
        <BlurFade>
          <div className="ed-masthead mb-10 lg:mb-14">
            <span className="ed-serial">§ 01 / Why this exists</span>
            <span className="ed-serial hidden sm:inline">
              Discovery is O(n²) at 2,000 attendees
            </span>
          </div>
        </BlurFade>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          <div className="lg:col-span-7">
            <BlurFade>
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-ink leading-[1.04]">
                YC Startup School puts 2,000 builders in one room for 48
                hours.{" "}
                <span className="italic text-accent">
                  Discovery is still O(n²).
                </span>
              </h2>
            </BlurFade>
            <BlurFade delay={0.1}>
              <p className="mt-7 text-lg text-muted leading-relaxed max-w-prose">
                You&apos;ll meet 30 founders by accident. Maybe one of them
                changes your trajectory. The rest is luck of the seating
                chart. We index the cohort, score against your build, and
                drop one match into your inbox three times a week.
              </p>
            </BlurFade>
            <BlurFade delay={0.18}>
              <p className="mt-5 text-lg text-ink leading-relaxed max-w-prose font-display italic">
                Not another networking app. A matching layer for serious
                builders.
              </p>
            </BlurFade>
          </div>

          <BlurFade delay={0.16} className="lg:col-span-5">
            <div className="surface bg-surface p-6 lg:p-8 space-y-5">
              <p className="ed-serial text-accent-text">By the numbers</p>
              <ul className="space-y-4">
                <NumRow lhs="2,000" rhs="hand-picked attendees" />
                <NumRow lhs="≈ 1,999,000" rhs="possible 1:1 pairs" />
                <NumRow lhs="≈ 30" rhs="you’ll actually meet" />
                <NumRow
                  lhs="1"
                  rhs="match per drop, scored against your card"
                  accent
                />
              </ul>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* HOW IT WORKS. Mono terminal lines, 5 steps, staged delays so the
          eye reads them in sequence. Founder-coded. The animation is
          honest: it is the matchmaker speaking back to you. */}
      <section
        id="how"
        className="bg-espresso text-bg py-20 lg:py-28 relative overflow-hidden"
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.06] grain"
          style={{ mixBlendMode: "screen" }}
        />
        <div className="container-wide relative">
          <BlurFade>
            <div className="ed-rule mb-10 lg:mb-14 flex items-baseline justify-between gap-4 pt-3 border-bg/20 before:!bg-accent">
              <span className="ed-serial text-bg/70">§ 02 / How it works</span>
              <span className="ed-serial hidden sm:inline text-bg/70">
                Onboarding to first match in under three minutes
              </span>
            </div>
          </BlurFade>
          <BlurFade>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-bg leading-[1.04] max-w-4xl">
              Tell the matchmaker what you&apos;re building.{" "}
              <span className="italic text-accent">It does the rest.</span>
            </h2>
          </BlurFade>

          <div className="mt-14 lg:mt-20 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-7">
              <div className="rounded-lg border border-bg/15 bg-espresso-deep/50 p-5 sm:p-7 font-mono text-sm">
                <div className="flex items-center gap-2 mb-5 text-bg/40 text-[10px] uppercase tracking-[0.2em]">
                  <span className="h-2 w-2 rounded-full bg-bg/30" />
                  <span className="h-2 w-2 rounded-full bg-bg/30" />
                  <span className="h-2 w-2 rounded-full bg-bg/30" />
                  <span className="ml-2">jumpstart · matchmaker</span>
                </div>
                <div className="space-y-3 text-bg">
                  <TerminalLine
                    text="five short questions. free text. two minutes."
                    delaySec={0}
                  />
                  <TerminalLine
                    text="indexing your build against 2,000 founder cards"
                    delaySec={2.4}
                  />
                  <TerminalLine
                    text="scoring on stack, stage, ask, and what you offer back"
                    delaySec={4.5}
                  />
                  <TerminalLine
                    text="one match arrives mon · wed · fri at 9 pm pt"
                    delaySec={6.8}
                  />
                  <TerminalLine
                    text="both yes? calendar opens. both no? next drop, fresh pick."
                    delaySec={9.2}
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-7">
              {STEPS.map((s, i) => (
                <BlurFade key={s.title} delay={0.06 * i}>
                  <DarkStep n={i + 1} title={s.title} body={s.body} />
                </BlurFade>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF BENTO. Mock match cards arranged in a 3-up bento.
          The featured card is the AI infra founder (high match score,
          accent treatment). The cards exist to teach the visitor what
          a match looks like, in the language they use. */}
      <section className="container-wide py-20 lg:py-28">
        <BlurFade>
          <div className="ed-masthead mb-10 lg:mb-14">
            <span className="ed-serial">§ 03 / What a match looks like</span>
            <span className="ed-serial hidden sm:inline">
              Six illustrative cards from the cohort
            </span>
          </div>
        </BlurFade>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-12">
          <div className="lg:col-span-5">
            <BlurFade>
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.04]">
                Real builders.{" "}
                <span className="italic text-accent">Specific asks.</span>
              </h2>
            </BlurFade>
            <BlurFade delay={0.08}>
              <p className="mt-6 text-lg text-muted leading-relaxed max-w-prose">
                The matchmaker reads what you&apos;re building, who you need,
                and what you can offer back. No bios. No buzzwords. Just
                the four lines that decide whether the next 30 minutes are
                worth a calendar slot.
              </p>
            </BlurFade>
          </div>
        </div>

        {/* Bento grid: featured (Maya/AI infra) gets 3 cols x 2 rows on
            lg, the four others spread across half-rows. Hover spotlight
            on each. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5 lg:gap-6">
          {/* Featured card spans 3 cols x 2 rows on lg */}
          <BlurFade
            delay={0.06}
            className="sm:col-span-2 lg:col-span-3 lg:row-span-2"
          >
            <MockMatchCard match={MOCK_MATCHES[0]!} className="h-full" />
          </BlurFade>
          {MOCK_MATCHES.slice(1, 5).map((m, i) => (
            <BlurFade
              key={m.name}
              delay={0.1 + i * 0.05}
              className="lg:col-span-3"
            >
              <MockMatchCard match={m} className="h-full" />
            </BlurFade>
          ))}
        </div>

        <BlurFade delay={0.4}>
          <p className="mt-10 ed-serial text-muted text-center sm:text-left">
            Illustrative · the actual cohort sheet is private to verified
            attendees.
          </p>
        </BlurFade>
      </section>

      {/* FINAL CTA. Espresso block. Time-bound deadline + dark-tone
          waitlist row + a sharp last line. */}
      <section className="container-wide py-16 sm:py-24">
        <BlurFade>
          <div className="bg-espresso text-bg rounded-2xl px-6 py-12 sm:px-12 sm:py-16 lg:px-16 lg:py-20 relative overflow-hidden">
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.06] grain"
              style={{ mixBlendMode: "screen" }}
            />
            {/* Decorative graph echo: faint nodes in the corner */}
            <div
              aria-hidden
              className="absolute -top-12 -right-12 w-72 h-72 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(255,102,0,0.18), transparent 60%)",
              }}
            />
            <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
              <div className="lg:col-span-7">
                <div className="ed-rule pt-3 mb-8 flex items-center justify-between text-bg/70 before:!bg-accent border-bg/20">
                  <span className="ed-serial text-bg/70 whitespace-nowrap">
                    No. 001 / First cohort
                  </span>
                  <span className="ed-serial hidden sm:inline text-bg/70">
                    Reviewed by hand · 50 spots
                  </span>
                </div>
                <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.04] text-bg max-w-2xl">
                  For founders who ship before they{" "}
                  <span className="italic text-accent">announce.</span>
                </h2>
                <p className="mt-6 text-bg/80 leading-relaxed max-w-prose">
                  Verified SS 2026 attendees go to the front. The first 50
                  invites are personal: the founder reads every entry and
                  replies within 24 to 48 hours. After 50, drops continue
                  but the queue grows.
                </p>
              </div>
              <div className="lg:col-span-5">
                <InlineWaitlist
                  source="closing-cta"
                  tone="dark"
                  buttonLabel="Apply to the first cohort"
                />
              </div>
            </div>
          </div>
        </BlurFade>
      </section>

      <footer className="container-wide pb-10 border-t border-border pt-8 text-xs text-muted">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span className="ed-serial">Jumpstart / Cohort YC SS 2026</span>
          <p>
            Built by an attendee for the SS 2026 cohort. Not affiliated with Y
            Combinator.
          </p>
          <Link
            href="/signup"
            className="text-muted hover:text-ink transition-colors"
          >
            Sign in →
          </Link>
        </div>
      </footer>
    </main>
  );
}

const STEPS: { title: string; body: string }[] = [
  {
    title: "Tell the matchmaker.",
    body: "Five questions. Free text. Two minutes flat. We build your card from your answers.",
  },
  {
    title: "We index the cohort.",
    body: "Stack, stage, ask, what you offer back. Embedding-scored against the 2,000.",
  },
  {
    title: "One match per drop.",
    body: "Mon · Wed · Fri at 9 PM PT. One name. One card. The reason we picked them.",
  },
  {
    title: "Both yes opens calendar.",
    body: "Both no? Next drop, fresh pick. Nothing in between. No swipe pile.",
  },
];

function DarkStep({
  n,
  title,
  body,
}: {
  n: number;
  title: string;
  body: string;
}): React.JSX.Element {
  return (
    <div className="border-t border-bg/20 pt-5">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent-text block">
        {String(n).padStart(2, "0")}
      </span>
      <h3 className="font-display italic text-2xl text-bg mt-3 leading-tight">
        {title}
      </h3>
      <p className="text-sm text-bg/70 mt-3 leading-relaxed">{body}</p>
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }): React.JSX.Element {
  return (
    <div className="bg-bg p-4">
      <p className="font-display text-2xl sm:text-3xl text-ink leading-none tabular-nums">
        {n}
      </p>
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted mt-2">
        {label}
      </p>
    </div>
  );
}

function NumRow({
  lhs,
  rhs,
  accent,
}: {
  lhs: string;
  rhs: string;
  accent?: boolean;
}): React.JSX.Element {
  return (
    <li className="flex items-baseline gap-4 border-t border-border pt-4">
      <span
        className={
          "font-display text-3xl tabular-nums leading-none shrink-0 " +
          (accent ? "text-accent" : "text-ink")
        }
      >
        {lhs}
      </span>
      <span className="text-sm text-muted leading-snug">{rhs}</span>
    </li>
  );
}

function Verified(): React.JSX.Element {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="shrink-0 holo-stamp"
    >
      <path
        d="M8 1.5l1.5 1.7 2.2-.4.4 2.2 1.7 1.5-1.7 1.5-.4 2.2-2.2-.4L8 11.5 6.5 9.8l-2.2.4-.4-2.2L2.2 6.5l1.7-1.5.4-2.2 2.2.4L8 1.5z"
        fill="#48B584"
      />
      <path
        d="M5.5 6.5l1.8 1.8 3.2-3.2"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
