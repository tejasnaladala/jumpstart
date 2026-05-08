"use client";
import React from "react";
import { BlurFade } from "@/components/BlurFade";

// HowItWorks — three editorial cards explaining the mechanic.
//
// Audit gap: the landing page jumped from positioning ("six thousand
// builders, one graph") to thesis ("discovery is O(n²)") without ever
// telling the visitor HOW the matching actually works. This section
// fills that gap with three concrete steps that cover the whole loop:
//   01 We build the graph (data collection)
//   02 You get one drop M/W/F at 9 PM PT (delivery cadence)
//   03 Both yes → calendar opens (mutual-yes mechanic, no DM tax)
//
// Visual register: same border-left + accent-serial treatment as the
// "matching layer for serious YC builders" callout in §01, so the
// section reads as continuous editorial rhythm rather than a tacked-on
// feature strip.

export function HowItWorks(): React.JSX.Element {
  return (
    <section className="container-wide section-pad-tight">
      <BlurFade>
        <div className="ed-masthead-accent">
          <span className="ed-serial">§ how it works</span>
          <span className="ed-serial hidden sm:inline">Three steps</span>
        </div>
      </BlurFade>

      <div className="grid grid-cols-1 md:grid-cols-3 grid-gap-std">
        <BlurFade delay={0.05}>
          <Card
            n="01"
            title="We build the graph"
            body="Six thousand SS 2026 attendees, filed by what they build. Tags drive matching: AI agents, hardtech, infra, voice, fintech, biotech."
          />
        </BlurFade>
        <BlurFade delay={0.12}>
          <Card
            n="02"
            title="One drop, M·W·F at 9 PM PT"
            body="Three drops a week before the event. One curated founder per drop. Friend-of-a-friend or stack overlap, never random."
          />
        </BlurFade>
        <BlurFade delay={0.18}>
          <Card
            n="03"
            title="Both yes → calendar"
            body="Mutual yes opens a 15-min calendar slot. No DMs, no LinkedIn dance, no introductions-at-the-bar tax."
          />
        </BlurFade>
      </div>
    </section>
  );
}

function Card({
  n,
  title,
  body,
}: {
  n: string;
  title: string;
  body: string;
}): React.JSX.Element {
  return (
    <div className="border-l-2 border-accent pl-5 py-1">
      <p className="ed-serial text-accent-text">No. {n}</p>
      <h3 className="mt-2 font-display text-2xl sm:text-3xl text-ink leading-tight tracking-[-0.012em]">
        {title}
      </h3>
      <p className="mt-3 text-base text-muted leading-relaxed">{body}</p>
    </div>
  );
}
