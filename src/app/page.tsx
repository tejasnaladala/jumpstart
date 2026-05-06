import { Logo } from "@/components/Logo";
import { FounderCardView } from "@/components/FounderCard";
import { Pill } from "@/components/primitive/Pill";
import { Avatar } from "@/components/primitive/Avatar";
import { MOCK_COHORT } from "@/lib/mock/cohort";
import { CohortGlobe } from "@/components/CohortGlobe";
import { Marquee } from "@/components/Marquee";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import Link from "next/link";

export default function LandingPage() {
  const sample = MOCK_COHORT.slice(0, 3);

  return (
    <main className="min-h-svh bg-bg text-ink">
      {/* Top bar */}
      <header className="border-b border-border bg-bg/85 backdrop-blur-md sticky top-0 z-20">
        <div className="container-wide flex items-center justify-between py-4">
          <Logo />
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/signup"
              className="hidden sm:inline-flex items-center text-muted hover:text-ink"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-ink text-white text-sm font-medium hover:bg-black transition-colors"
            >
              Get my drop
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container-wide pt-14 pb-16 sm:pt-24 sm:pb-24">
        <div className="ed-rule mb-12 flex items-center justify-between gap-4 pt-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            <span className="ed-serial">No. 001 / Cohort SS 2026</span>
          </div>
          <span className="ed-serial hidden sm:inline">Filed Wednesdays at 09:00 PT</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7">
            <h1 className="font-display text-5xl sm:text-7xl text-ink leading-[1.02]">
              YC Startup School brings the world&apos;s best young builders into one cohort.{" "}
              <span className="italic text-accent">Jumpstart helps them find each other.</span>
            </h1>
            <p className="mt-7 text-lg text-muted max-w-2xl leading-relaxed">
              The unofficial global attendee graph for SS 2026. Three curated founder matches
              every Wednesday, with a one-line on why you should meet and an opener already
              half-written.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center h-12 px-6 rounded-md bg-ink text-white font-medium hover:bg-black transition-all shadow-card hover:shadow-hover"
              >
                Get my Founder Drop
                <svg className="ml-1.5" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8m0 0L7 3m4 4L7 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <a
                href="#how"
                className="inline-flex items-center justify-center h-12 px-6 rounded-md border border-border bg-surface text-ink font-medium hover:border-ink/40 transition-colors"
              >
                How it works
              </a>
            </div>
            <div className="flex items-center gap-2 mt-6 text-xs text-muted">
              <Verified />
              <span>Verified attendees only.</span>
              <span className="opacity-50">·</span>
              <span>Not affiliated with Y Combinator.</span>
            </div>
          </div>

          {/* Globe + drop preview */}
          <div className="lg:col-span-5">
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
          </div>
        </div>
      </section>

      {/* Espresso marquee band: like the YC SS 2026 footer strip */}
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

      {/* Animated counters */}
      <section className="container-wide py-16 border-b border-border">
        <p className="text-xxs uppercase tracking-wider text-accent font-semibold ed-serial">
          By the numbers
        </p>
        <h2 className="font-display text-4xl sm:text-5xl mt-3 max-w-3xl">
          A bounded cohort. A weekly ritual. <span className="italic text-accent">Eight thousand</span> of the world&apos;s best young builders.
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10">
          <Stat label="Verified attendees" value={8000} suffix="" />
          <Stat label="Anchor cities" value={60} suffix="+" />
          <Stat label="Drops per week" value={3} />
          <Stat label="Days the cohort exists" value={90} />
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="container-wide py-16 border-t border-border">
        <div className="max-w-2xl mb-10">
          <p className="text-xxs uppercase tracking-wider text-accent font-semibold">
            How it works
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-2">
            Tell Jumpstart who would make Startup School worth it.
            <span className="text-muted">
              {" "}We do the matching.
            </span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Step
            n={1}
            title="A short conversation"
            body="Five to eight questions. Free text. We build your Founder Card from your answers and you can edit any line."
          />
          <Step
            n={2}
            title="Three matches a week"
            body="Wednesday morning. Three founders worth meeting, with a one-line on why and an opener you can copy."
          />
          <Step
            n={3}
            title="Request, accept, talk"
            body="They accept, both of you get an email with each other's contact and a calendar link. No DMs to hunt down."
          />
        </div>
      </section>

      {/* Sample card */}
      <section className="container-wide py-16 border-t border-border">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div>
            <p className="text-xxs uppercase tracking-wider text-accent font-semibold">
              Founder Card, not LinkedIn
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-2">
              You write it once. The matchmaker reads it forever.
            </h2>
            <p className="text-muted mt-4 text-lg leading-relaxed">
              No follower count. No vanity metrics. No public profile. Just the four lines that
              tell the AI who you are and who is worth your time. Other verified attendees see it.
              That is the entire audience.
            </p>
            <ul className="mt-6 space-y-2.5">
              {[
                "What you are building, in your own words",
                "Who you are looking to meet",
                "What you can uniquely help others with",
                "Who should not bother",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2 text-sm text-ink">
                  <Check />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <FounderCardView card={sample[2]!} />
        </div>
      </section>

      {/* Who it is for */}
      <section className="container-wide py-16 border-t border-border">
        <p className="text-xxs uppercase tracking-wider text-accent font-semibold">
          Who it is for
        </p>
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-2 max-w-2xl">
          Verified attendees of YC Startup School 2026. Anywhere on Earth.
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
          {[
            "SF-bound",
            "India cohort",
            "Remote / global",
            "Cofounder seekers",
            "Technical founders",
            "GTM founders",
            "Undergrads",
            "Solo founders",
          ].map((tag) => (
            <div
              key={tag}
              className="surface px-4 py-5 text-center text-sm font-medium text-ink hover:border-ink/40 hover:shadow-card transition-all"
            >
              {tag}
            </div>
          ))}
        </div>
      </section>

      {/* What it isn't */}
      <section className="container-wide py-16 border-t border-border">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div>
            <p className="text-xxs uppercase tracking-wider text-accent font-semibold">
              What it isn&apos;t
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-2">
              Nothing about this is a networking app.
            </h2>
            <p className="text-muted mt-4 text-lg leading-relaxed">
              The home is a curated drop, not a directory. There is no swipe pile or social feed.
              The intro flow is structured. The AI is the matchmaker, not a chatbot. The cohort
              is bounded to verified SS 2026 attendees, and the smallness is the value.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { not: "Directory you scroll", instead: "Curated weekly drop" },
              { not: "Swipe pile", instead: "Three picks, with reasons" },
              { not: "Follower counts", instead: "No public profile, ever" },
              { not: "Open DMs", instead: "Structured intro request" },
              { not: "Chatbot you talk to", instead: "Matchmaker that learns" },
              { not: "Lifelong network", instead: "Bounded 90-day cohort" },
            ].map((row) => (
              <div key={row.not} className="surface p-4">
                <p className="text-xxs text-muted line-through">{row.not}</p>
                <p className="text-sm font-semibold text-ink mt-1">{row.instead}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-wide pb-20">
        <div className="surface p-10 sm:p-14 rounded-2xl text-center bg-gradient-to-br from-surface to-accent-soft border-accent-edge">
          <p className="text-xxs uppercase tracking-wider text-accent font-semibold">
            Wednesday at 9
          </p>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight mt-2 max-w-3xl mx-auto">
            The cohort gets denser every day. Get on the list.
          </h2>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center h-12 px-7 mt-8 rounded-md bg-ink text-white font-medium hover:bg-black transition-all shadow-card hover:shadow-hover"
          >
            Get my Founder Drop
            <svg className="ml-1.5" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8m0 0L7 3m4 4L7 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
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

function Stat({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="ed-rule pt-4">
      <p className="font-display text-5xl sm:text-6xl text-ink leading-none">
        <AnimatedCounter value={value} suffix={suffix} />
      </p>
      <p className="text-xs uppercase tracking-wider text-muted font-semibold mt-3">{label}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="surface p-5 hover:shadow-hover transition-shadow">
      <span className="text-xs font-mono text-accent">0{n}</span>
      <h3 className="text-lg font-semibold mt-1">{title}</h3>
      <p className="text-sm text-muted mt-1.5 leading-relaxed">{body}</p>
    </div>
  );
}

function Verified() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 1.5l1.5 1.7 2.2-.4.4 2.2 1.7 1.5-1.7 1.5-.4 2.2-2.2-.4L8 11.5 6.5 9.8l-2.2.4-.4-2.2L2.2 6.5l1.7-1.5.4-2.2 2.2.4L8 1.5z"
        fill="#2E7D32"
      />
      <path d="M5.5 6.5l1.8 1.8 3.2-3.2" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function Check() {
  return (
    <svg className="mt-1 flex-none" width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" fill="#1A1A1A" />
      <path d="M5 8.5l2 2 4-4.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
