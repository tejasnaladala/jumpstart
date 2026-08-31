"use client";

import { Marquee } from "@/components/Marquee";
import { BlurFade } from "@/components/BlurFade";
import { GlassNav } from "@/components/GlassNav";
import { ScrollProgress } from "@/components/ScrollProgress";
import { InlineWaitlist } from "@/components/InlineWaitlist";
import { NextDropCountdown } from "@/components/NextDropCountdown";
import { SignalField } from "@/components/SignalField";
import { CpuArchitecture } from "@/components/ui/cpu-architecture";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { FallingPattern } from "@/components/ui/falling-pattern";
import Link from "next/link";
import React from "react";

const HERO_FACTS = [
  { label: "COHORT SIZE", value: "2,000+ Founders" },
  { label: "SIGNAL TYPE", value: "Proof of Work" },
  { label: "ROUTING", value: "Hand-curated Drops" },
];

const HERO_TELEMETRY = [
  { label: "NODES", value: "1,240" },
  { label: "MATCHES", value: "842" },
  { label: "UPTIME", value: "99.9%" },
  { label: "LATENCY", value: "14ms" },
];

const ROUTE_TRACE = [
  "Inbound request from Chase Center",
  "Identity verification: PASSED",
  "Technical intensity overlap: 94%",
  "Routing drop #004 to local map",
];

const PROBLEM_POINTS = [
  { title: "Noise", body: "Group chats move too fast to find real signal." },
  { title: "Bias", body: "The loudest person in the room isn't always the best match." },
  { title: "Randomness", body: "Hope is not a routing strategy for your next cofounder." },
];

const STEPS = [
  { title: "Identity", body: "Verify your Startup School attendance." },
  { title: "Signal", body: "Submit your technical intensity and weird interests." },
  { title: "Graph", body: "We map your profile against the active cohort." },
  { title: "Drop", body: "Get one high-signal founder routed to you daily." },
];

function Verified() {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success border border-success/20">
      <span className="h-1 w-1 rounded-full bg-success" />
      Verified
    </div>
  );
}

function ProblemCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <h3 className="font-display text-xl text-ink">{title}</h3>
      <p className="mt-2 text-sm text-muted leading-relaxed">{body}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="relative">
      <div className="ed-folio mb-4">{n.toString().padStart(2, '0')}</div>
      <h3 className="font-display text-2xl text-ink">{title}</h3>
      <p className="mt-3 text-sm text-muted leading-relaxed">{body}</p>
    </div>
  );
}

function RoutingBand() {
  return (
    <div className="bg-carbon py-4 border-y border-white/5">
      <div className="container-wide flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <span className="ed-serial text-white/40">Status</span>
            <span className="text-xs text-signal">LIVE ROUTING</span>
          </div>
          <div className="flex flex-col">
            <span className="ed-serial text-white/40">Load</span>
            <span className="text-xs text-bg">NOMINAL</span>
          </div>
        </div>
        <div className="hidden md:block">
          <CpuArchitecture width="200" height="40" animateLines={true} />
        </div>
      </div>
    </div>
  );
}

export default function LandingPage(): React.JSX.Element {
  return (
    <main id="main" className="min-h-svh bg-bg text-ink">
      <ScrollProgress />
      <GlassNav />

      {/* HERO SECTION */}
      <section className="relative min-h-[92svh] overflow-hidden bg-carbon text-bg">
        <SignalField />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,16,16,0.92)_0%,rgba(16,16,16,0.68)_46%,rgba(16,16,16,0.18)_100%)]"
        />
        <div className="container-wide relative z-10 flex min-h-[92svh] flex-col justify-center py-[104px] sm:py-[128px] lg:py-[148px]">
          <BlurFade>
            <div className="ed-rule mb-10 flex items-center justify-between gap-4 border-bg/20 pt-3 text-xs before:bg-signal lg:mb-14">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse" />
                <span className="ed-serial text-bg/70">No. 001 / YC SS 2026</span>
              </div>
              <span className="ed-serial hidden whitespace-nowrap text-bg/70 sm:inline">
                July 25-26 / Chase Center
              </span>
            </div>
          </BlurFade>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-7">
              <BlurFade>
                <h1 className="max-w-4xl font-display text-[46px] leading-[0.94] text-bg sm:text-6xl lg:text-7xl xl:text-[92px]">
                  Private founder map{" "}
                  <span className="italic text-signal">for the room.</span>
                </h1>
              </BlurFade>
              <BlurFade delay={0.08}>
                <p className="mt-7 max-w-2xl text-lg leading-relaxed text-bg/78 lg:text-xl">
                  Startup School is two days. About 2,000 founders, one loud
                  room, maybe twelve real conversations. Jumpstart gives
                  verified SS 2026 attendees a private map of the five founders
                  worth finding before Chase Center.
                </p>
              </BlurFade>

              <BlurFade delay={0.12}>
                <dl className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {HERO_FACTS.map((fact) => (
                    <div key={fact.label} className="border-t border-bg/20 pt-3">
                      <dt className="ed-serial text-signal">{fact.label}</dt>
                      <dd className="mt-2 text-sm leading-snug text-bg">
                        {fact.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </BlurFade>

              <BlurFade delay={0.16}>
                <div id="waitlist" className="mt-10 max-w-xl scroll-mt-24">
                  <InlineWaitlist
                    source="hero"
                    tone="dark"
                    placeholder="founder@email.com"
                    buttonLabel="Get my founder map"
                  />
                </div>
              </BlurFade>
              <BlurFade delay={0.24}>
                <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-bg/68">
                  <Verified />
                  <span>Verified SS 2026 attendees only.</span>
                  <span aria-hidden className="opacity-50">/</span>
                  <span>First 50 reviewed by hand.</span>
                  <span aria-hidden className="opacity-50">/</span>
                  <span>Independent project, not affiliated with YC.</span>
                </div>
              </BlurFade>
            </div>

            <BlurFade delay={0.12} className="lg:col-span-5">
              <div className="signal-panel rounded-2xl p-5 sm:p-7">
                <NextDropCountdown tone="dark" />
                <div className="mt-8 grid grid-cols-2 gap-3">
                  {HERO_TELEMETRY.map((item) => (
                    <div key={item.label} className="signal-card">
                      <p className="ed-serial text-bg/55">{item.label}</p>
                      <p className="mt-2 font-mono text-lg text-signal">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="telemetry-grid mt-5 rounded-lg border border-white/10 p-4">
                  <p className="ed-serial text-bg/60">Route trace</p>
                  <div className="mt-4 space-y-3">
                    {ROUTE_TRACE.map((item) => (
                      <div key={item} className="flex items-center gap-3 text-sm text-bg/82">
                        <span className="h-1.5 w-1.5 rounded-full bg-signal" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </BlurFade>
          </div>
        </div>
      </section>

      <Marquee
        items={[
          "Startup School is two days",
          "Private founder map",
          "One routed founder per drop",
          "Proof of work over tags",
          "Built by an attendee",
          "Not affiliated with Y Combinator",
        ]}
        variant="espresso"
      />

      <RoutingBand />

      {/* PROBLEM SECTION */}
      <section id="problem" className="container-wide py-20 lg:py-28">
        <BlurFade>
          <div className="ed-masthead mb-10 lg:mb-14">
            <span className="ed-serial">01 / The problem</span>
            <span className="ed-serial hidden sm:inline">
              Two days creates bad defaults
            </span>
          </div>
        </BlurFade>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5">
            <BlurFade>
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-ink leading-[1.04]">
                Everyone will be interesting.{" "}
                <span className="italic text-accent">That is the problem.</span>
              </h2>
            </BlurFade>
          </div>
          <div className="lg:col-span-7">
            <BlurFade delay={0.08}>
              <p className="max-w-2xl text-lg text-muted leading-relaxed">
                The room is too dense for random networking. You can spend the
                whole weekend meeting impressive founders and still miss the
                one person building next to your bottleneck. Jumpstart gives
                you a short list before the event starts.
              </p>
            </BlurFade>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {PROBLEM_POINTS.map((point, i) => (
                <BlurFade key={point.title} delay={0.08 + i * 0.04}>
                  <ProblemCard {...point} />
                </BlurFade>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how" className="container-wide py-20 lg:py-28">
        <BlurFade>
          <div className="ed-masthead mb-10 lg:mb-14">
            <span className="ed-serial">02 / How it works</span>
            <span className="ed-serial hidden sm:inline">
              Onboarding to first drop in under three minutes
            </span>
          </div>
        </BlurFade>
        <BlurFade>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-ink leading-[1.04] max-w-4xl">
            Submit real signal.{" "}
            <span className="italic text-muted">Get routed before you land.</span>
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

      {/* VISUAL BREAK / CALL TO ACTION */}
      <section className="relative h-[400px] overflow-hidden my-20">
        <FallingPattern backgroundColor="#101010" color="#FFD600" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="text-center px-4">
             <h2 className="font-display text-4xl md:text-5xl text-white mb-8">
               Stop networking. Start compounding.
             </h2>
             <Link href="#waitlist">
               <LiquidButton className="text-white border-white/20">
                 Join the Waitlist
               </LiquidButton>
             </Link>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="container-wide py-20 lg:py-32">
        <div className="rounded-3xl bg-espresso-deep p-8 md:p-16 text-center overflow-hidden relative">
           <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
              <CpuArchitecture />
           </div>
           <BlurFade>
             <h2 className="font-display text-4xl sm:text-6xl text-white mb-6">
               Ready to find your cohort?
             </h2>
             <p className="text-white/60 max-w-xl mx-auto mb-10 text-lg">
               Limited to verified YC Startup School attendees. hand-curated drops begin July 20th.
             </p>
             <div className="max-w-md mx-auto">
                <InlineWaitlist
                  tone="dark"
                  placeholder="founder@email.com"
                  buttonLabel="Secure my spot"
                />
             </div>
           </BlurFade>
        </div>
      </section>

      <footer className="container-wide py-12 border-t border-border">
         <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-4">
               <span className="font-display text-2xl">Jumpstart</span>
               <span className="ed-serial">/</span>
               <span className="ed-serial">SS 2026 EDITION</span>
            </div>
            <div className="text-xs text-muted">
              Built by an attendee. Not affiliated with Y Combinator.
            </div>
         </div>
      </footer>
    </main>
  );
}
