import { FounderPass } from "@/components/FounderPass";
import { MOCK_COHORT } from "@/lib/mock/cohort";
import { Marquee } from "@/components/Marquee";
import { BlurFade } from "@/components/BlurFade";
import { GlassNav } from "@/components/GlassNav";
import { ScrollProgress } from "@/components/ScrollProgress";
import { InlineWaitlist } from "@/components/InlineWaitlist";
import { NextDropCountdown } from "@/components/NextDropCountdown";
import Link from "next/link";

// Landing page redo (May 7 2026). Inspired by ditto.ai (taste anchor):
// sticky-scroll storytelling, lowercase declarative headline, live
// countdown + literal-next-action CTA, single italic accent. Editorial
// brand preserved (cream / orange / espresso, Instrument Serif italic).
//
// Deliberately killed from the previous landing:
//   - 27 ad-hoc <Reveal /> wrappers (composite-thrash on mobile, anti-
//     editorial). Replaced with a single <BlurFade /> primitive lifted
//     from magicui (~70 lines). Used only on section h2 headlines.
//   - The big globe section. (Was already deleted in a prior pass.)
//   - The "By the numbers" 4-stat row that read as marketing pap. The
//     stats live as one editorial line in the closing CTA instead.
//   - The full WaitlistForm card in the hero. Replaced with the
//     compact <InlineWaitlist /> (single email row + optional handle).
//
// Carry-overs:
//   - FounderPass component (the editorial admit-one ticket)
//   - Marquee strip (espresso band between hero and how-it-works)
//   - MOCK_COHORT for the FounderPass demo card
//   - Closing-CTA espresso panel (now tone="dark" for InlineWaitlist)
//
// Sticky scroll-pin: used ONCE on the FounderPass section (lg+ only).
// Mobile uses normal flow. Avoids ditto's 7-stage scroll-pin marathon
// while keeping the moment-of-arrival on the editorial ticket.

export default function LandingPage(): React.JSX.Element {
  const sample = MOCK_COHORT.slice(0, 3);
  const passCard = sample[2] ?? sample[0];

  return (
    <main id="main" className="min-h-svh bg-bg text-ink">
      <ScrollProgress />
      <GlassNav />

      {/* HERO. Two-column on lg+: left = headline + sub + countdown,
          right = compact InlineWaitlist + trust strip + cohort serial.
          Mobile: stacked, waitlist sits directly under the headline. */}
      <section className="relative pt-[120px] pb-16 sm:pt-[140px] sm:pb-20 lg:pt-[180px] lg:pb-28">
        <div className="container-wide">
          <BlurFade>
            <div className="ed-rule mb-10 lg:mb-14 flex items-center justify-between gap-4 pt-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                <span className="ed-serial">No. 001 / Cohort SS 2026</span>
              </div>
              <span className="ed-serial hidden sm:inline whitespace-nowrap">
                Filed Mon, Wed, Fri at 9 PM PT
              </span>
            </div>
          </BlurFade>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-7">
              <BlurFade>
                <h1 className="font-display text-[44px] leading-[0.98] tracking-[-0.015em] text-ink sm:text-6xl lg:text-7xl xl:text-[88px]">
                  one match.{" "}
                  <span className="italic text-accent">filed by hand,</span>{" "}
                  three times a week.
                </h1>
              </BlurFade>
              <BlurFade delay={0.08}>
                <p className="mt-7 max-w-xl text-lg lg:text-xl text-muted leading-relaxed">
                  A curated founder from the YC SS 2026 cohort. Read four
                  lines, decide in 30 seconds. Mon, Wed, Fri at 9 PM PT.
                </p>
              </BlurFade>
              <BlurFade delay={0.16}>
                <div id="waitlist" className="mt-10 max-w-xl scroll-mt-24">
                  <InlineWaitlist source="hero" />
                </div>
              </BlurFade>
              <BlurFade delay={0.24}>
                <div className="mt-6 flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                  <Verified />
                  <span>Verified attendees first.</span>
                  <span aria-hidden className="opacity-50">·</span>
                  <span>Founder reads every entry.</span>
                  <span aria-hidden className="opacity-50">·</span>
                  <span>Not affiliated with Y Combinator.</span>
                </div>
              </BlurFade>
            </div>

            <BlurFade delay={0.12} className="lg:col-span-5">
              <div className="surface bg-bg/60 p-6 sm:p-8">
                <NextDropCountdown />
              </div>
            </BlurFade>
          </div>
        </div>
      </section>

      {/* Espresso strip. Carries the cadence motif into the page break. */}
      <Marquee
        items={[
          "Cohort SS 2026",
          "One match per drop",
          "Built by an attendee",
          "Verified founders only",
          "Mon, Wed, Fri at 9 PM PT",
          "Not affiliated with Y Combinator",
        ]}
        variant="espresso"
      />

      {/* HOW IT WORKS. Editorial four-step sequence. ditto.ai shape:
          numbered chapters + short imperative title + one body line. */}
      <section id="how" className="container-wide py-20 lg:py-28">
        <BlurFade>
          <div className="ed-masthead mb-10 lg:mb-14">
            <span className="ed-serial">§ 01 / How it works</span>
            <span className="ed-serial hidden sm:inline">
              Onboarding to first match in under three minutes
            </span>
          </div>
        </BlurFade>
        <BlurFade>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-ink leading-[1.04] max-w-4xl">
            Tell the matchmaker who you&apos;d want to meet.{" "}
            <span className="italic text-muted">It does the rest.</span>
          </h2>
        </BlurFade>

        <div className="mt-14 lg:mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {STEPS.map((s, i) => (
            <BlurFade key={s.title} delay={0.06 * i}>
              <Step n={i + 1} title={s.title} body={s.body} />
            </BlurFade>
          ))}
        </div>
      </section>

      {/* FOUNDER PASS. The signature surface. Sticky on lg+ so it pins
          while the visitor scrolls past — the "moment" of the editorial
          ticket landing. Mobile uses normal flow. */}
      <section className="container-wide py-20 lg:py-32">
        <BlurFade>
          <div className="ed-masthead mb-10 lg:mb-14">
            <span className="ed-serial">§ 02 / Founder Pass</span>
            <span className="ed-serial hidden sm:inline">
              The four lines the matchmaker reads forever
            </span>
          </div>
        </BlurFade>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-5">
            <BlurFade>
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.04]">
                One pass.{" "}
                <span className="italic text-accent">
                  Read forever, answered four ways.
                </span>
              </h2>
            </BlurFade>
            <BlurFade delay={0.08}>
              <p className="mt-7 text-lg text-muted leading-relaxed max-w-prose">
                Your Founder Pass is the editorial identity. Four lines that
                tell the matchmaker who you are, what you&apos;re building,
                who you&apos;re looking for, and who should not bother.
                That is the entire interface to the model.
              </p>
            </BlurFade>
            <BlurFade delay={0.16}>
              <ul className="mt-8 space-y-4 max-w-md">
                {FOUR_LINES.map((line) => (
                  <li
                    key={line.label}
                    className="border-t border-border pt-4 flex items-baseline gap-4"
                  >
                    <span className="ed-serial w-7 shrink-0 text-accent">
                      {line.n}
                    </span>
                    <div>
                      <p className="font-display text-xl text-ink leading-tight">
                        {line.label}
                      </p>
                      <p className="text-sm text-muted mt-1 leading-relaxed">
                        {line.help}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </BlurFade>
          </div>

          {/* Sticky on lg+. The Pass card pins for ~1 viewport while the
              left column scrolls. */}
          <div className="lg:col-span-7">
            <div className="lg:sticky lg:top-24">
              <BlurFade delay={0.18}>
                {passCard ? <FounderPass card={passCard} /> : null}
              </BlurFade>
            </div>
          </div>
        </div>
      </section>

      {/* COUNTER-POSITIONING. What this is, and what it isn't. */}
      <section className="container-wide py-20 lg:py-28">
        <BlurFade>
          <div className="ed-masthead mb-10 lg:mb-14">
            <span className="ed-serial">§ 03 / Counter-positioning</span>
            <span className="ed-serial hidden sm:inline">
              What this is, and is not
            </span>
          </div>
        </BlurFade>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5">
            <BlurFade>
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.04]">
                Nothing about this is a{" "}
                <span className="italic text-accent">networking app.</span>
              </h2>
            </BlurFade>
            <BlurFade delay={0.08}>
              <p className="mt-7 text-lg text-muted leading-relaxed max-w-prose">
                The home is a curated drop, not a directory. There is no
                swipe pile, no follower count, no DM hunt. The matchmaker is
                the AI. The cohort is bounded to verified SS 2026 attendees.
                The smallness is the value.
              </p>
            </BlurFade>
          </div>
          <BlurFade delay={0.12} className="lg:col-span-7">
            <div className="double-bezel-outer bg-bg border border-border">
              <div className="double-bezel-inner bg-surface">
                <ul className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                  {COUNTER_PAIRS.map((row) => (
                    <li
                      key={row.not}
                      className="p-5 sm:p-6 flex flex-col justify-between min-h-[112px]"
                    >
                      <p className="ed-serial line-through text-muted/70">
                        {row.not}
                      </p>
                      <p className="font-display text-xl text-ink mt-3 leading-tight">
                        {row.instead}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* CLOSING CTA. Espresso block. Time-bound deadline + dark-tone
          InlineWaitlist (instead of a duplicate "Get my Founder Drop"
          button that points back to the same hero form). */}
      <section className="container-wide py-16 sm:py-24">
        <BlurFade>
          <div className="bg-espresso text-bg rounded-2xl px-6 py-12 sm:px-12 sm:py-16 lg:px-16 lg:py-20 relative overflow-hidden">
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.06] grain"
              style={{ mixBlendMode: "screen" }}
            />
            <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
              <div className="lg:col-span-7">
                <div className="ed-rule pt-3 mb-8 flex items-center justify-between text-bg/70">
                  <span className="ed-serial text-bg/70 whitespace-nowrap">
                    No. 001 / First cohort
                  </span>
                  <span className="ed-serial hidden sm:inline text-bg/70">
                    Closing as the matchmaker fills the first 50 spots
                  </span>
                </div>
                <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.04] text-bg max-w-2xl">
                  Cohort 1 of 50.{" "}
                  <span className="italic text-accent">
                    Reviewed by hand.
                  </span>
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
          <span className="ed-serial">Jumpstart / Cohort SS 2026</span>
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
    body: "Five short questions. Free text. Two minutes. We build your Founder Pass from your answers.",
  },
  {
    title: "The Drop arrives.",
    body: "Mon, Wed, Fri at 9 PM PT. One match, scored against your card. Email plus iMessage.",
  },
  {
    title: "Read four lines.",
    body: "Building, looking for, can help with, talk to me if. Decide in 30 seconds.",
  },
  {
    title: "Coffee. Or not.",
    body: "Both yes? Calendar opens. Both no? Next drop, fresh pick. Nothing in between.",
  },
];

const FOUR_LINES: { n: string; label: string; help: string }[] = [
  {
    n: "01",
    label: "What you are building",
    help: "One line, plain English. The matchmaker reads this every time.",
  },
  {
    n: "02",
    label: "Who you are looking to meet",
    help: "Cofounder, collaborator, second pair of eyes, hardware partner.",
  },
  {
    n: "03",
    label: "What you can uniquely help with",
    help: "Match value flows both ways. This is what you offer the cohort.",
  },
  {
    n: "04",
    label: "Who should not bother",
    help: "The most useful filter. Honest beats polite.",
  },
];

const COUNTER_PAIRS: { not: string; instead: string }[] = [
  { not: "Directory you scroll", instead: "Curated drop, three times a week" },
  { not: "Swipe pile", instead: "One pick at a time, with the reason" },
  { not: "Follower counts", instead: "No public profile, ever" },
  { not: "Open DMs", instead: "Structured intro request" },
  { not: "Chatbot you talk to", instead: "Matchmaker that learns" },
  { not: "Lifelong network", instead: "Bounded 2-day event" },
];

function Step({
  n,
  title,
  body,
}: {
  n: number;
  title: string;
  body: string;
}): React.JSX.Element {
  return (
    <div className="border-t border-border pt-5">
      <span className="ed-folio block">{String(n).padStart(2, "0")}</span>
      <div className="mt-4 h-px w-10 bg-accent" />
      <h3 className="font-display text-2xl text-ink mt-5 leading-tight">
        {title}
      </h3>
      <p className="text-sm text-muted mt-3 leading-relaxed">{body}</p>
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
      className="shrink-0"
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
