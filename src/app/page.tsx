import { BlurFade } from "@/components/BlurFade";
import { GlassNav } from "@/components/GlassNav";
import { ScrollProgress } from "@/components/ScrollProgress";
import { InlineWaitlist } from "@/components/InlineWaitlist";
import { NextDropCountdown } from "@/components/NextDropCountdown";
import { CursorGlow } from "@/components/landing/CursorGlow";
import { FounderGraphHero } from "@/components/landing/FounderGraphHero";
import { PreLandingHero } from "@/components/landing/PreLandingHero";
import { DitherWarp } from "@/components/ui/DitherWarp";

// Landing page rebuild (May 7 2026, fourth pass — "make it crazy").
//
// Audit findings acted on (this commit):
//  - Visual flatness: every section used the same H2 size + same grid
//    gap + same py — sections looked cloned. Now: standardized
//    .section-pad + .grid-gap-std + .ed-masthead-accent for the heavy
//    sections (Why, People, Final CTA) so visual rhythm tiers cleanly.
//  - Tightened hero rule mb (was 7/lg:9, now 4/lg:5) so the No.001
//    label kisses the H1 instead of floating below it.
//  - Typographic hierarchy: Why H2 boosted one tier (text-5xl ->
//    text-7xl on lg) so the thesis line dominates.
//  - 21st.dev shader components wired in:
//    * RippleShader (three.js concentric pulses, orange-on-cream)
//      sits behind the FounderGraph as ambient pulse texture.
//    * DitherWarp (Paper Design dithering, lazy-loaded) sits behind
//      the featured Maya card AND the final CTA espresso block,
//      adding subtle "computed" warm noise instead of flat surfaces.
//  - Match-reason quote in cards bumped one tier: text-base -> text-lg.
//  - Mobile collage: 3-col -> 2-col on small screens for breathable cells.

export default function LandingPage(): React.JSX.Element {
  return (
    <main id="main" className="min-h-svh bg-bg text-ink overflow-hidden">
      <ScrollProgress />
      <GlassNav />
      <CursorGlow />

      {/* PRE-LANDING HERO. Full-viewport intro: orange smoke shader,
          cursor-trail code shimmer, giant JUMPSTART wordmark, scroll
          prompt. Once past, the editorial body begins. */}
      <PreLandingHero />

      {/* === LANDING BODY === */}
      <div id="landing-body" />

      {/* HERO — the founder graph IS the centerpiece. Headline + sub
          float above; waitlist + trust + stats + countdown sit below.
          RippleShader pulses behind the graph as ambient heartbeat. */}
      <section className="relative pt-[80px] pb-12 sm:pt-[88px] sm:pb-14 lg:pt-[96px] lg:pb-16">
        {/* Ambient orange glow behind the entire hero (subtle) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-[120px] hidden lg:block h-[800px]"
          style={{
            background:
              "radial-gradient(ellipse at 65% 40%, rgba(255,102,0,0.08), transparent 60%)",
          }}
        />
        <div className="container-wide relative">
          <BlurFade>
            <div className="ed-rule mb-5 lg:mb-6 flex items-center justify-between gap-4 pt-3 text-xs">
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

          {/* Headline above the graph */}
          <BlurFade>
            <h1 className="font-display text-[44px] leading-[0.94] tracking-[-0.018em] text-ink sm:text-6xl lg:text-7xl xl:text-[88px] max-w-5xl">
              A founder graph for{" "}
              <span className="italic text-accent">YC Startup School.</span>
            </h1>
          </BlurFade>
          <BlurFade delay={0.06}>
            <p className="mt-5 max-w-2xl text-lg lg:text-xl text-muted leading-relaxed">
              Knowing people through people, and people&apos;s people.
              6,000 builders, woven into one cohort. Hand-curated
              introductions, three times a week.
            </p>
          </BlurFade>

          {/* THE GRAPH — full width centerpiece, stands on its own. */}
          <BlurFade delay={0.14}>
            <div className="relative mt-10 lg:mt-14">
              <FounderGraphHero />
            </div>
          </BlurFade>

          {/* Waitlist row + countdown below the graph */}
          <BlurFade delay={0.22}>
            <div className="mt-12 lg:mt-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              <div className="lg:col-span-7">
                <div id="waitlist" className="max-w-xl scroll-mt-24">
                  <InlineWaitlist
                    source="hero"
                    buttonLabel="Get on the graph"
                  />
                </div>
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
                <div className="mt-8 grid grid-cols-3 gap-px bg-border max-w-md">
                  <Stat n="6,000" label="Cohort attendees" />
                  <Stat n="48 hrs" label="At Chase Center" />
                  <Stat n="3×/wk" label="Drop cadence" />
                </div>
              </div>
              <div className="lg:col-span-5">
                <div className="surface bg-bg/60 p-5 sm:p-6">
                  <NextDropCountdown />
                </div>
              </div>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* Marquee strip removed (founder asked to drop). The graph
          and the headline already carry the cohort tagline. */}

      {/* WHY THIS EXISTS — heavy section with accent masthead and
          boosted H2 (one tier bigger than the other H2s for thesis
          weight). */}
      <section className="container-wide section-pad">
        <BlurFade>
          <div className="ed-masthead-accent">
            <span className="ed-serial">§ 01 / Why this exists</span>
            <span className="ed-serial hidden sm:inline">
              Discovery is O(n²) at 6,000 attendees
            </span>
          </div>
        </BlurFade>
        <div className="grid grid-cols-1 lg:grid-cols-12 grid-gap-std items-start">
          <div className="lg:col-span-7">
            <BlurFade>
              <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl text-ink leading-[1.02] tracking-[-0.012em]">
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
                chart. Three times a week, you get one curated introduction
                to a builder a friend of a friend already vouches for.
              </p>
            </BlurFade>
            <BlurFade delay={0.18}>
              <p className="mt-5 text-lg text-ink leading-relaxed max-w-prose font-display italic">
                Not another networking app. A matching layer for serious
                YC builders.
              </p>
            </BlurFade>
          </div>

          {/* By the numbers — woven inline (no white card). Anchored
              to a left accent thread so it reads as part of the same
              editorial rhythm as the section masthead, not a card on
              top of the cream surface. */}
          <BlurFade delay={0.16} className="lg:col-span-5">
            <div className="border-l-2 border-accent/40 pl-6 lg:pl-8 space-y-5">
              <p className="ed-serial text-accent-text">By the numbers</p>
              <ul className="space-y-4">
                <NumRow lhs="6,000" rhs="hand-picked attendees" />
                <NumRow lhs="≈ 18M" rhs="possible 1:1 pairs" />
                <NumRow lhs="≈ 30" rhs="you’ll actually meet" />
                <NumRow
                  lhs="1"
                  rhs="curated introduction per drop"
                  accent
                />
              </ul>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* §02 People's people removed entirely (founder asked to strip).
          The headline + globe section was meaningless given the graph
          itself already shows the same thesis. The graph IS the demo. */}

      {/* FINAL CTA — espresso block. Top padding tightened (was
          section-pad-tight = py-12/14/16 stacking with Why's py-28
          bottom = ~176px gap). Now pt-2/pt-4/pt-6 + same py-bottom
          for breathing only beneath the block. */}
      <section className="container-wide pt-2 sm:pt-4 lg:pt-6 pb-12 sm:pb-14 lg:pb-16">
        <BlurFade>
          <div className="bg-espresso text-bg rounded-2xl px-6 py-12 sm:px-12 sm:py-14 lg:px-16 lg:py-20 relative overflow-hidden">
            {/* Dithering shader as the ambient backdrop, blended subtly
                so the espresso reads as "computed warmth" not flat. */}
            <div className="absolute inset-0 opacity-[0.16] mix-blend-screen pointer-events-none">
              <DitherWarp
                colorFront="#FF8533"
                colorBack="#00000000"
                speed={0.18}
                type="4x4"
                shape="warp"
              />
            </div>
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.06] grain"
              style={{ mixBlendMode: "screen" }}
            />
            <div
              aria-hidden
              className="absolute -top-16 -right-16 w-80 h-80 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(255,102,0,0.22), transparent 60%)",
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
                <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.02] tracking-[-0.012em] text-bg max-w-2xl">
                  Skip the{" "}
                  <span className="italic text-accent">seating chart.</span>
                </h2>
                <p className="mt-5 text-bg/75 leading-relaxed max-w-prose">
                  Six thousand builders. One graph. One match per drop, three
                  times a week.
                </p>
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
