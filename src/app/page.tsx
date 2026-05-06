import { Logo } from "@/components/Logo";
import { FounderCardView } from "@/components/FounderCard";
import { MOCK_COHORT } from "@/lib/mock/cohort";
import { CohortGlobe } from "@/components/CohortGlobe";
import { Marquee } from "@/components/Marquee";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { MagneticButton } from "@/components/MagneticButton";
import { Reveal } from "@/components/Reveal";
import { TypewriterText } from "@/components/TypewriterText";
import Link from "next/link";

export default function LandingPage() {
  const sample = MOCK_COHORT.slice(0, 3);

  return (
    <main className="min-h-svh bg-bg text-ink">
      {/* Top bar */}
      <header className="border-b border-border bg-bg/85 backdrop-blur-md sticky top-0 z-20">
        <div className="container-wide flex items-center justify-between py-4">
          <Logo />
          <nav className="flex items-center gap-3 text-sm">
            <Link
              href="/signup"
              className="hidden sm:inline-flex items-center text-muted hover:text-ink transition-colors"
            >
              Sign in
            </Link>
            <MagneticButton href="/signup" variant="md">
              Get my drop
            </MagneticButton>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container-wide pt-14 pb-20 sm:pt-24 sm:pb-28">
        <Reveal>
          <div className="ed-rule mb-12 flex items-center justify-between gap-4 pt-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              <span className="ed-serial">No. 001 / Cohort SS 2026</span>
            </div>
            <span className="ed-serial hidden sm:inline">Filed Wednesdays at 09:00 PT</span>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7">
            <Reveal>
              <h1 className="font-display text-5xl sm:text-7xl text-ink leading-[1.02]">
                YC Startup School brings the world&apos;s best young builders into one cohort.{" "}
                <span className="italic text-accent">Jumpstart helps them find each other.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="mt-7 text-lg text-muted max-w-2xl leading-relaxed">
                The unofficial global attendee graph for SS 2026. Three curated founder matches
                every Wednesday, with a one-line on why you should meet and an opener already
                half-written.
              </p>
            </Reveal>
            <Reveal delay={0.16}>
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <MagneticButton href="/signup" variant="lg">
                  Get my Founder Drop
                  <svg className="ml-1.5" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M3 7h8m0 0L7 3m4 4L7 11"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </MagneticButton>
                <a
                  href="#how"
                  className="inline-flex items-center justify-center h-12 px-6 rounded-md border border-border bg-surface text-ink font-medium hover:border-ink/40 transition-colors"
                >
                  How it works
                </a>
              </div>
            </Reveal>
            <Reveal delay={0.24}>
              <div className="flex items-center gap-2 mt-6 text-xs text-muted">
                <Verified />
                <span>Verified attendees only.</span>
                <span className="opacity-50">·</span>
                <span>Not affiliated with Y Combinator.</span>
              </div>
            </Reveal>
          </div>

          {/* Globe + drop preview */}
          <div className="lg:col-span-5">
            <Reveal delay={0.12}>
              <div className="relative flex flex-col items-center gap-6">
                <div className="relative">
                  <div
                    aria-hidden
                    className="absolute -inset-4 rounded-full bg-accent-soft opacity-50 blur-xl"
                  />
                  <CohortGlobe size={420} />
                </div>
                <p className="ed-serial mt-4">12 anchor cities · 60+ countries verifying</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Espresso marquee band: footer-strip energy borrowed from YC SS 2026 */}
      <Marquee
        items={[
          "Cohort SS 2026",
          "Weekly drops",
          "Built by an attendee",
          "Verified founders only",
          "Three matches every Wednesday",
          "Not affiliated with Y Combinator",
        ]}
        variant="espresso"
      />

      {/* Section 01 - By the numbers */}
      <section className="container-wide py-20">
        <Reveal>
          <div className="ed-masthead">
            <span className="ed-serial">§ 01 / By the numbers</span>
            <span className="ed-serial hidden sm:inline">A bounded cohort</span>
          </div>
        </Reveal>
        <Reveal>
          <h2 className="font-display text-4xl sm:text-5xl max-w-3xl">
            A bounded cohort. A weekly ritual.{" "}
            <span className="italic text-accent">Eight thousand</span> of the world&apos;s best
            young builders.
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10 mt-12">
            <Stat label="Verified attendees" value={8000} suffix="" />
            <Stat label="Anchor cities" value={60} suffix="+" />
            <Stat label="Drops per week" value={3} />
            <Stat label="Days the cohort exists" value={90} />
          </div>
        </Reveal>
      </section>

      {/* Section 02 - How it works */}
      <section id="how" className="container-wide py-20">
        <Reveal>
          <div className="ed-masthead">
            <span className="ed-serial">§ 02 / How it works</span>
            <span className="ed-serial hidden sm:inline">Drop lands at 0900 PT</span>
          </div>
        </Reveal>
        <Reveal>
          <h2 className="font-display text-4xl sm:text-5xl max-w-3xl leading-[1.06]">
            Tell Jumpstart who would make Startup School worth it.
            <span className="text-muted italic"> We do the matching.</span>
          </h2>
        </Reveal>

        {/* Editorial steps: unboxed, numbered, hairline rule between each */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-10">
          <Reveal>
            <Step
              n={1}
              title="A short conversation"
              body="Five to eight questions. Free text. We build your Founder Card from your answers, and you can edit any line."
            />
          </Reveal>
          <Reveal delay={0.08}>
            <Step
              n={2}
              title="Three matches a week"
              body="Wednesday morning. Three founders worth meeting, with a one-line on why and an opener you can copy."
            />
          </Reveal>
          <Reveal delay={0.16}>
            <Step
              n={3}
              title="Request, accept, talk"
              body="They accept, both of you get an email with each other's contact and a calendar link. No DMs to hunt down."
            />
          </Reveal>
        </div>
      </section>

      {/* Section 03 - Founder Card */}
      <section className="container-wide py-20">
        <Reveal>
          <div className="ed-masthead">
            <span className="ed-serial">§ 03 / Founder Card</span>
            <span className="ed-serial hidden sm:inline">The four lines</span>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <Reveal>
              <h2 className="font-display text-4xl sm:text-5xl leading-[1.06]">
                You write it once.{" "}
                <span className="italic text-accent">
                  <TypewriterText
                    text="The matchmaker reads it forever."
                    speedMs={26}
                    delayMs={400}
                    cursor={false}
                  />
                </span>
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="text-muted mt-5 text-lg leading-relaxed">
                No follower count. No vanity metrics. No public profile. Just the four lines that
                tell the AI who you are and who is worth your time. Other verified attendees see
                it. That is the entire audience.
              </p>
            </Reveal>
            <Reveal delay={0.16}>
              <ul className="mt-7 space-y-3">
                {[
                  "What you are building, in your own words",
                  "Who you are looking to meet",
                  "What you can uniquely help others with",
                  "Who should not bother",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-3 text-sm text-ink">
                    <Check />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
          <Reveal delay={0.12}>
            <FounderCardView card={sample[2]!} />
          </Reveal>
        </div>
      </section>

      {/* Section 04 - Cohort composition (was "Who it is for") */}
      <section className="container-wide py-20">
        <Reveal>
          <div className="ed-masthead">
            <span className="ed-serial">§ 04 / Cohort composition</span>
            <span className="ed-serial hidden sm:inline">60+ countries verifying</span>
          </div>
        </Reveal>
        <Reveal>
          <h2 className="font-display text-4xl sm:text-5xl max-w-3xl leading-[1.06]">
            Verified attendees of YC Startup School 2026.{" "}
            <span className="italic text-muted">Anywhere on Earth.</span>
          </h2>
        </Reveal>

        {/* Editorial typeset list. Two columns on md, hairlines between rows. */}
        <Reveal delay={0.08}>
          <ul className="mt-12 grid grid-cols-1 md:grid-cols-2 md:gap-x-12">
            {COHORT_SEGMENTS.map((seg, i) => (
              <li
                key={seg.label}
                className="flex items-baseline gap-5 border-t border-border py-5 group"
              >
                <span className="ed-serial w-7 shrink-0 text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-display text-2xl text-ink leading-none">{seg.label}</span>
                <span className="ml-auto ed-serial text-right hidden sm:inline">{seg.note}</span>
              </li>
            ))}
            <li className="md:col-span-2 border-t border-border" />
          </ul>
        </Reveal>
      </section>

      {/* Section 05 - Counter-positioning */}
      <section className="container-wide py-20">
        <Reveal>
          <div className="ed-masthead">
            <span className="ed-serial">§ 05 / Counter-positioning</span>
            <span className="ed-serial hidden sm:inline">What this is and isn&apos;t</span>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <Reveal>
              <h2 className="font-display text-4xl sm:text-5xl leading-[1.06]">
                Nothing about this is a{" "}
                <span className="italic text-accent">networking app.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="text-muted mt-5 text-lg leading-relaxed">
                The home is a curated drop, not a directory. There is no swipe pile or social
                feed. The intro flow is structured. The AI is the matchmaker. The cohort is
                bounded to verified SS 2026 attendees, and the smallness is the value.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.12}>
            {/* Double-Bezel container: outer cream tile + inner ink panel */}
            <div className="double-bezel-outer bg-bg border border-border">
              <div className="double-bezel-inner bg-surface">
                <ul className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                  {COUNTER_PAIRS.map((row) => (
                    <li
                      key={row.not}
                      className="p-5 sm:p-6 flex flex-col justify-between min-h-[112px]"
                    >
                      <p className="ed-serial line-through text-muted/70">{row.not}</p>
                      <p className="font-display text-xl text-ink mt-3 leading-tight">
                        {row.instead}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA - solid espresso, no gradient */}
      <section className="container-wide py-16 sm:py-24">
        <Reveal>
          <div className="bg-espresso text-bg rounded-2xl px-8 py-14 sm:px-14 sm:py-20 relative overflow-hidden">
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.06] grain"
              style={{ mixBlendMode: "screen" }}
            />
            <div className="relative">
              <div className="ed-rule pt-3 mb-10 flex items-center justify-between text-bg/70">
                <span className="ed-serial text-bg/70">Wednesday at 09:00 PT</span>
                <span className="ed-serial hidden sm:inline text-bg/70">No. 001 / Drop pending</span>
              </div>
              <h2 className="font-display text-4xl sm:text-6xl max-w-3xl leading-[1.04] text-bg">
                The cohort gets denser every day.{" "}
                <span className="italic text-accent">Get on the list.</span>
              </h2>
              <div className="mt-10 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <MagneticButton href="/signup" variant="lg" tone="cream">
                  Get my Founder Drop
                  <svg
                    className="ml-1.5"
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                  >
                    <path
                      d="M3 7h8m0 0L7 3m4 4L7 11"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </MagneticButton>
                <span className="ed-serial text-bg/60">Verified SS 2026 attendees only</span>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="container-wide pb-10 border-t border-border pt-8 text-xs text-muted">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Logo size={20} withWord />
          <p>
            Unofficial attendee-built tool for Startup School participants. Not affiliated with Y
            Combinator.
          </p>
        </div>
      </footer>
    </main>
  );
}

const COHORT_SEGMENTS: { label: string; note: string }[] = [
  { label: "SF-bound", note: "Demo Day, summer programming, in-person" },
  { label: "India cohort", note: "Bangalore, Bombay, Delhi, Hyderabad" },
  { label: "Remote / global", note: "Verified across 60+ countries" },
  { label: "Cofounder seekers", note: "Looking for a long-term partner" },
  { label: "Technical founders", note: "Building, shipping, debugging" },
  { label: "GTM founders", note: "Distribution, sales, partnerships" },
  { label: "Undergrads", note: "In school, already shipping" },
  { label: "Solo founders", note: "Until they decide otherwise" },
];

const COUNTER_PAIRS: { not: string; instead: string }[] = [
  { not: "Directory you scroll", instead: "Curated weekly drop" },
  { not: "Swipe pile", instead: "Three picks, with reasons" },
  { not: "Follower counts", instead: "No public profile, ever" },
  { not: "Open DMs", instead: "Structured intro request" },
  { not: "Chatbot you talk to", instead: "Matchmaker that learns" },
  { not: "Lifelong network", instead: "Bounded 90-day cohort" },
];

function Stat({
  label,
  value,
  suffix = "",
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="ed-rule pt-4">
      <p className="font-display text-5xl sm:text-6xl text-ink leading-none">
        <AnimatedCounter value={value} suffix={suffix} />
      </p>
      <p className="ed-serial mt-3">{label}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="border-t border-border pt-5">
      <span className="ed-folio block">{String(n).padStart(2, "0")}</span>
      <div className="mt-4 h-px w-10 bg-accent" />
      <h3 className="font-display text-2xl text-ink mt-5 leading-tight">{title}</h3>
      <p className="text-sm text-muted mt-3 leading-relaxed">{body}</p>
    </div>
  );
}

function Verified() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
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

function Check() {
  return (
    <svg className="mt-1 flex-none" width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" fill="#16140F" />
      <path
        d="M5 8.5l2 2 4-4.5"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
