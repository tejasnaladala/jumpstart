"use client";
import React from "react";

// DropCardMockup — static preview of what the user will receive every
// Mon/Wed/Fri at 9 PM PT. Sits in the hero right column under the
// countdown so visitors see the actual product surface before entering
// their email, not after.
//
// Audit insight: the entire landing page had no visible product
// surface. Visitors were asked to give an email to a thing they had
// never seen. This component closes that gap with a representative
// mock of one drop: founder identity, four lines of bio, a bridge
// (friend-of-a-friend), and the Yes/Skip action row.
//
// Buttons are intentionally disabled — this is a preview, not the
// real interaction. The disabled cursor + opacity-90 keep them legible
// without inviting clicks that go nowhere.

export function DropCardMockup(): React.JSX.Element {
  return (
    <div className="surface bg-bg/80 p-5 sm:p-6 relative">
      {/* Drop header: serial number + timestamp. Editorial mono.
          The "sample drop" tag is the only place we admit this is a
          preview — keeps the mock honest without being apologetic. */}
      <div className="ed-rule pt-2 mb-4 flex items-center justify-between text-xs">
        <span className="ed-serial text-accent">Sample drop</span>
        <span className="ed-serial">Mon · 9 PM PT</span>
      </div>

      {/* Founder identity row — display serif name + mono context tag.
          Real names anonymized to last initial; cohort-realistic detail. */}
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="font-display text-2xl text-ink leading-none">
          Maya C.
        </span>
        <span className="ed-serial text-muted">SF · pre-seed</span>
      </div>

      {/* Four lines — the actual founder card content. Tight, scanable.
          Last line is the bridge ("why this match exists"), muted so
          the matching mechanic reads as supporting metadata, not pitch. */}
      <ul className="mt-4 space-y-1.5 text-sm text-ink leading-snug">
        <li>ML researcher, ex-Anthropic</li>
        <li>Building voice agents for healthcare</li>
        <li>5y CUDA, looking for a CTO co-founder</li>
        <li className="text-muted">
          <span className="ed-serial text-[10px] mr-1.5 text-accent-text">
            Bridge
          </span>
          Sarah K. (Caltech ’23, 2 hops)
        </li>
      </ul>

      {/* Action row — disabled buttons that show the mutual-yes
          mechanic. The "Both yes → calendar" hint on the right makes
          the loop obvious without a footnote. */}
      <div className="mt-5 flex items-center gap-2">
        <button
          type="button"
          disabled
          aria-label="Sample drop — Yes intro action (disabled preview)"
          className="h-9 px-4 rounded-md bg-accent text-white text-sm font-semibold opacity-90 cursor-default"
        >
          Yes, intro
        </button>
        <button
          type="button"
          disabled
          aria-label="Sample drop — Skip action (disabled preview)"
          className="h-9 px-4 rounded-md border border-border text-sm text-muted cursor-default"
        >
          Skip
        </button>
        <span className="ml-auto ed-serial text-muted text-[10px] hidden sm:inline">
          Both yes → calendar
        </span>
      </div>
    </div>
  );
}
