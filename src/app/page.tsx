import { BlurFade } from "@/components/BlurFade";
import { GlassNav } from "@/components/GlassNav";
import { ScrollProgress } from "@/components/ScrollProgress";
import { InlineWaitlist } from "@/components/InlineWaitlist";
import { NextDropCountdown } from "@/components/NextDropCountdown";
import { Marquee } from "@/components/Marquee";
import { CohortGlobe } from "@/components/CohortGlobe";
import { CursorGlow } from "@/components/landing/CursorGlow";
import { FounderGraph } from "@/components/landing/FounderGraph";
import { TerminalLine } from "@/components/landing/TerminalLine";
import { MockMatchCard } from "@/components/landing/MockMatchCard";
import { MOCK_MATCHES } from "@/components/landing/mockMatches";
import { PreLandingHero } from "@/components/landing/PreLandingHero";

// Landing page rebuild (May 7 2026, third pass).
//
// Founder asked for several specific edits after the second pass:
//  - Cohort is 6,000 attendees (not 2,000). Update everywhere.
//  - Concept lift: "knowing people through people and people's people."
//    Make this the strongest interconnected cohort. Founder graph stays
//    the hero, globe gets a mid-page slot.
//  - Tighten hero spacing (No.001 row sits too far below the navbar).
//  - GlassNav: remove Sign in. Waitlist is the only CTA pre-product.
//  - Logo: integrate the J mark with the wordmark (was awkwardly spaced).
//  - Terminal text in HowItWorks renders black-on-brown (invisible). Fix.
//  - Drop "founder reads every entry / first 50 manual" copy. Sounds
//    artisanal-app, not founder-network. Remove from trust strip and CTA.
//  - Tighten the dead space below the typing terminal.
//  - Add ditto.ai-style collage placeholders for "People's people". The
//    site reads non-personal; these placeholders hold space until real
//    photos land (collages of meetings, founders, on-site moments).
//
// DateDrop onboarding study (via playwright MCP) confirmed the question
// taxonomy worth borrowing for the longer Jumpstart onboarding (referenced
// in the terminal copy): preference Likert scales, multi-select with
// search, free-text personality questions with helpful placeholders.
//
// Voice rules from CLAUDE.md still load-bearing.

export default function LandingPage(): React.JSX.Element {
  return (
    <main id="main" className="min-h-svh bg-bg text-ink overflow-hidden">
      <ScrollProgress />
      <GlassNav />
      <CursorGlow />

      {/* PRE-LANDING HERO. Full-viewport intro: orange smoke shader
          backdrop + cursor-trail code shimmer + giant JUMPSTART
          wordmark + tagline + scroll prompt. Inspired by YC Startup
          School 2026's site. Once visitors scroll past, they land in
          the editorial body below. */}
      <PreLandingHero />

      {/* === LANDING BODY === */}
      {/* Anchor target the PreLandingHero scroll button jumps to. */}
      <div id="landing-body" />

      {/* HERO. Two-column on lg+: left = headline + sub + CTA + trust,
          right = FounderGraph SVG. Tightened top padding (was 180px,
          felt awkwardly low) and reduced rule margin. */}
      <section className="relative pt-[100px] pb-14 sm:pt-[112px] sm:pb-16 lg:pt-[128px] lg:pb-20">
        {/* Ambient orange-glow pad behind the graph. Decorative only. */}
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-200px] top-[60px] hidden lg:block w-[700px] h-[700px] rounded-full"
          style={{
            background:
              "radial-gradient(circle at center, rgba(255,102,0,0.08), transparent 65%)",
          }}
        />
        <div className="container-wide relative">
          <BlurFade>
            <div className="ed-rule mb-7 lg:mb-9 flex items-center justify-between gap-4 pt-3 text-xs">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse"
                />
                <span className="ed-serial">
                  No. 001 / YC SS 2026 · 6,000 builders
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
                  Knowing people through people, and people&apos;s people.
                  6,000 builders, woven into one cohort, scored by an AI
                  that reads what you&apos;re shipping.
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
                  <span>No public profile.</span>
                  <span aria-hidden className="opacity-50">
                    ·
                  </span>
                  <span>Not affiliated with Y Combinator.</span>
                </div>
              </BlurFade>

              <BlurFade delay={0.24}>
                <div className="mt-10 grid grid-cols-3 gap-px bg-border max-w-md">
                  <Stat n="6,000" label="Cohort attendees" />
                  <Stat n="48 hrs" label="At Chase Center" />
                  <Stat n="3×/wk" label="Drop cadence" />
                </div>
              </BlurFade>
            </div>

            {/* Right column: FounderGraph SVG + countdown card. */}
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
          "6,000 hand-picked builders",
          "One match per drop",
          "People through people · people's people",
          "Mon · Wed · Fri · 9 PM PT",
          "Chase Center · July 25–26",
          "Not affiliated with Y Combinator",
        ]}
        variant="espresso"
      />

      {/* WHY THIS EXISTS. The thesis line, then a short stanza. The point
          is the math: 6,000 people, 48 hours, O(n²) collisions = you'll
          meet 30 by accident. */}
      <section className="container-wide py-16 lg:py-24">
        <BlurFade>
          <div className="ed-masthead mb-8 lg:mb-12">
            <span className="ed-serial">§ 01 / Why this exists</span>
            <span className="ed-serial hidden sm:inline">
              Discovery is O(n²) at 6,000 attendees
            </span>
          </div>
        </BlurFade>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          <div className="lg:col-span-7">
            <BlurFade>
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-ink leading-[1.04]">
                YC Startup School puts 6,000 builders in one room for 48
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
                <NumRow lhs="6,000" rhs="hand-picked attendees" />
                <NumRow lhs="≈ 18M" rhs="possible 1:1 pairs" />
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

      {/* PEOPLE'S PEOPLE — globe + collage placeholders. The thesis: this
          isn't a feed, it's a graph. Globe shows geography of the cohort;
          collage placeholders carry the human warmth (real photos drop
          in once we have them). Ditto.ai-style: photos do the talking. */}
      <section className="container-wide py-16 lg:py-24 relative">
        <BlurFade>
          <div className="ed-masthead mb-8 lg:mb-12">
            <span className="ed-serial">§ 02 / People&apos;s people</span>
            <span className="ed-serial hidden sm:inline">
              The graph extends through everyone you meet
            </span>
          </div>
        </BlurFade>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left: headline + sub + globe */}
          <div className="lg:col-span-6">
            <BlurFade>
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-ink leading-[1.04]">
                Knowing people{" "}
                <span className="italic text-accent">through people,</span>{" "}
                and people&apos;s people.
              </h2>
            </BlurFade>
            <BlurFade delay={0.08}>
              <p className="mt-6 text-lg text-muted leading-relaxed max-w-prose">
                Every match comes with a reason. Every accepted intro adds
                an edge. The graph compounds: the people you meet bring
                people you&apos;d never find on your own.
              </p>
            </BlurFade>
            <BlurFade delay={0.14}>
              <div className="mt-10 flex items-center justify-center lg:justify-start">
                <div className="w-full max-w-[460px]">
                  <CohortGlobe size={460} />
                </div>
              </div>
            </BlurFade>
          </div>

          {/* Right: 6-up collage placeholder grid. Empty cells with
              hairline borders + mono labels — drops in real photos
              later (founder dinners, on-site meetings, demo nights). */}
          <div className="lg:col-span-6">
            <BlurFade delay={0.1}>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <CollagePlaceholder span="row-span-2" label="founder dinners" />
                <CollagePlaceholder label="demo night" />
                <CollagePlaceholder label="off-site" />
                <CollagePlaceholder span="col-span-2" label="cohort photo" />
                <CollagePlaceholder label="hack" />
                <CollagePlaceholder label="intros" />
                <CollagePlaceholder span="col-span-2" label="meetings" />
              </div>
            </BlurFade>
            <BlurFade delay={0.18}>
              <p className="mt-4 ed-serial text-muted">
                Photos drop in as the cohort builds.
              </p>
            </BlurFade>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS. Mono terminal + dark steps. Tightened section
          padding (was py-20, now py-16) to remove the dead space the
          founder flagged below the typing block. */}
      <section
        id="how"
        className="bg-espresso text-bg py-16 lg:py-20 relative overflow-hidden"
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.06] grain"
          style={{ mixBlendMode: "screen" }}
        />
        <div className="container-wide relative">
          <BlurFade>
            <div className="ed-rule mb-8 lg:mb-12 flex items-baseline justify-between gap-4 pt-3 border-bg/20 before:!bg-accent">
              <span className="ed-serial text-bg/70">§ 03 / How it works</span>
              <span className="ed-serial hidden sm:inline text-bg/70">
                Onboarding builds the card the matchmaker reads forever
              </span>
            </div>
          </BlurFade>
          <BlurFade>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-bg leading-[1.04] max-w-4xl">
              Tell the matchmaker who you are.{" "}
              <span className="italic text-accent">It does the rest.</span>
            </h2>
          </BlurFade>

          <div className="mt-10 lg:mt-14 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
            <div className="lg:col-span-7 flex">
              <div className="rounded-lg border border-bg/15 bg-espresso-deep/60 p-5 sm:p-7 font-mono text-sm w-full text-bg">
                <div className="flex items-center gap-2 mb-5 text-bg/40 text-[10px] uppercase tracking-[0.2em]">
                  <span className="h-2 w-2 rounded-full bg-bg/30" />
                  <span className="h-2 w-2 rounded-full bg-bg/30" />
                  <span className="h-2 w-2 rounded-full bg-bg/30" />
                  <span className="ml-2">jumpstart · matchmaker</span>
                </div>
                <div className="space-y-3 text-bg">
                  <TerminalLine
                    text="40 questions. preference scales, picks, free text."
                    delaySec={0}
                  />
                  <TerminalLine
                    text="what you ship. how you work. what you read."
                    delaySec={2.6}
                  />
                  <TerminalLine
                    text="the weird interest most founders don't have."
                    delaySec={4.7}
                  />
                  <TerminalLine
                    text="indexing your card against 6,000 in the cohort"
                    delaySec={6.7}
                  />
                  <TerminalLine
                    text="one match arrives mon · wed · fri at 9 pm pt"
                    delaySec={9.0}
                  />
                  <TerminalLine
                    text="both yes? calendar opens. both no? next drop, fresh pick."
                    delaySec={11.4}
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6 lg:space-y-7">
              {STEPS.map((s, i) => (
                <BlurFade key={s.title} delay={0.06 * i}>
                  <DarkStep n={i + 1} title={s.title} body={s.body} />
                </BlurFade>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF BENTO. Mock match cards arranged in a 3-up bento. */}
      <section className="container-wide py-16 lg:py-24">
        <BlurFade>
          <div className="ed-masthead mb-8 lg:mb-12">
            <span className="ed-serial">§ 04 / What a match looks like</span>
            <span className="ed-serial hidden sm:inline">
              Six illustrative cards from the cohort
            </span>
          </div>
        </BlurFade>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-10">
          <div className="lg:col-span-6">
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
                the lines that decide whether the next 30 minutes are
                worth a calendar slot.
              </p>
            </BlurFade>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5 lg:gap-6">
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

      {/* FINAL CTA. Espresso block. Stripped of the "founder reads every
          entry / first 50 personal" copy at founder's request. The pitch
          is the headline + the form. Nothing else. */}
      <section className="container-wide py-16 sm:py-20">
        <BlurFade>
          <div className="bg-espresso text-bg rounded-2xl px-6 py-12 sm:px-12 sm:py-14 lg:px-16 lg:py-16 relative overflow-hidden">
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.06] grain"
              style={{ mixBlendMode: "screen" }}
            />
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
                <div className="ed-rule pt-3 mb-6 flex items-center justify-between text-bg/70 before:!bg-accent border-bg/20">
                  <span className="ed-serial text-bg/70 whitespace-nowrap">
                    No. 001 / Cohort YC SS 2026
                  </span>
                  <span className="ed-serial hidden sm:inline text-bg/70">
                    6,000 builders · one graph
                  </span>
                </div>
                <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.04] text-bg max-w-2xl">
                  For founders who ship before they{" "}
                  <span className="italic text-accent">announce.</span>
                </h2>
              </div>
              <div className="lg:col-span-5">
                <InlineWaitlist
                  source="closing-cta"
                  tone="dark"
                  buttonLabel="Get on the graph"
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
          <span className="ed-serial">6,000 builders · one graph</span>
        </div>
      </footer>
    </main>
  );
}

// HowItWorks step copy — borrows DateDrop's pattern of mixing question
// types (preference scales, picks, free text) but in a founder register.
const STEPS: { title: string; body: string }[] = [
  {
    title: "Build your card.",
    body: "Forty short prompts. Preference scales, multi-picks, a few free-text questions about what you ship and how you read.",
  },
  {
    title: "We index the cohort.",
    body: "6,000 cards, embedded against yours. Stack, stage, ask, what you offer back, and the weird interest most founders don't have.",
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
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted mt-2">
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

// CollagePlaceholder: empty bordered cell with a mono label. Holds layout
// space until real cohort photos drop in (founder dinners, demo nights,
// on-site meetings). Ditto.ai-style — photos eventually do the talking,
// but until then the editorial mono tag carries the slot. The cell uses
// a subtle accent-wash tint so the grid reads warm, not empty.
function CollagePlaceholder({
  label,
  span,
}: {
  label: string;
  span?: string;
}): React.JSX.Element {
  return (
    <div
      className={
        "relative aspect-[4/3] overflow-hidden border border-border-strong/60 bg-accent-wash/40 group transition-colors duration-300 hover:border-accent-edge/40 hover:bg-accent-wash " +
        (span || "")
      }
    >
      {/* Subtle grain so the cell doesn't read as flat */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.05] grain pointer-events-none"
      />
      {/* Editorial frame: hairline corners */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-accent-edge/40" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-accent-edge/40" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-accent-edge/40" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-accent-edge/40" />
      <div className="absolute inset-0 flex items-end p-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          {label}
        </span>
      </div>
    </div>
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
