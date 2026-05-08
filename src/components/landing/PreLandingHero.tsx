"use client";
import { SmokeBackground } from "@/components/ui/SmokeBackground";
import { DottedSurface } from "@/components/ui/DottedSurface";
import { GooeyText } from "@/components/ui/GooeyText";
import { ScrollingCode } from "@/components/landing/ScrollingCode";
import { useEffect, useState } from "react";

// Rotating adjectives for the tagline. Lengths intentionally varied
// (7-10 chars) — the GooeyText sizer reserves the longest width and
// the rest of the sentence wraps to a new line via a hard <br />,
// so when the morph cycles to 'earnest' (7) the gap doesn't push
// 'builders' awkwardly far right.
const TAGLINE_WORDS = [
  "formidable",
  "earnest",
  "relentless",
  "contrarian",
  "audacious",
];

// PreLandingHero — full-viewport "front door" before the editorial
// landing body.
//
// Founder feedback this pass:
//   - Background was too dark. Smoke shader opacities dropped
//     (100% -> 55%, focal layer 90% -> 35%). Bottom wash dropped
//     (0.18 -> 0.08). Cream comes through more.
//   - Tagline morph word "contrarian" reserved more inline width
//     than "earnest" — pushed "builders" too far right when the
//     short word was visible. Fix: hard line break before
//     "builders" so the morph word lives on its own line.
//   - Add a sub line: "Jumpstart helps them find each other."
//   - ScrollingCode now grid-of-cells with cursor-radius reveal
//     (default invisible).

export function PreLandingHero(): React.JSX.Element {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  function scrollToBody(): void {
    const next = document.getElementById("landing-body");
    if (!next) return;
    next.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section
      id="prelanding"
      className="relative min-h-svh w-full overflow-hidden bg-bg"
      aria-label="Jumpstart intro"
    >
      {/* L0: DottedSurface — Three.js particle wave, deepest layer.
          Toned to opacity-30 so the cream shows through more. */}
      <div
        aria-hidden
        className={
          "absolute inset-0 transition-opacity duration-1000 " +
          (mounted ? "opacity-30" : "opacity-0")
        }
      >
        <DottedSurface dotColor={[70, 51, 37]} />
      </div>

      {/* L1: SmokeBackground — orange flames rising. Opacity dropped
          100% -> 55% so the page is brighter. The shader still reads,
          just doesn't dominate the cream. */}
      <div
        aria-hidden
        className={
          "absolute inset-0 mix-blend-multiply transition-opacity duration-700 " +
          (mounted ? "opacity-55" : "opacity-0")
        }
      >
        <SmokeBackground smokeColor="#E85A1B" bgColor="#F8F5EA" />
      </div>

      {/* L2: Focal smoke behind JUMPSTART — opacity dropped 90% -> 35%
          so it adds atmosphere without darkening. */}
      <div
        aria-hidden
        className={
          "absolute inset-x-0 top-[18%] h-[55%] mix-blend-multiply transition-opacity duration-700 " +
          (mounted ? "opacity-35" : "opacity-0")
        }
        style={{
          maskImage:
            "radial-gradient(ellipse at center, black 0%, black 45%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 0%, black 45%, transparent 80%)",
        }}
      >
        <SmokeBackground smokeColor="#CC4E15" bgColor="#F8F5EA" />
      </div>

      {/* L3: Bottom orange wash — dropped 0.18 -> 0.08 so the bottom
          isn't dragged down into a saturated orange band. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(232,90,27,0.08), transparent 55%)",
        }}
      />

      {/* L3.5: Orange ascending sun — TRUE SEMICIRCLE DOME matching the
          YC SS 2026 reference (founder shared the screenshot). Two
          stacked layers, both clipped to a semicircle via
          border-radius 50% 50% 0 0 sitting at the bottom edge:
            1. Solid bright orange dome — radial gradient from saturated
               core out to a soft fade at the edges
            2. Vertical CREAM streaks rising through the orange — read
               as light rays cutting through the dome
          The semicircle is wider than the viewport on small screens
          (max 1400px on lg) so it always fills the bottom band. */}
      <div
        aria-hidden
        className={
          "absolute inset-x-0 bottom-0 pointer-events-none flex justify-center items-end transition-opacity duration-1000 " +
          (mounted ? "opacity-100" : "opacity-0")
        }
      >
        <div
          className="relative"
          style={{
            // Aspect ratio 2:1 so border-radius 50%/100% creates a
            // true semicircle (height = half width).
            width: "min(120vw, 1600px)",
            height: "min(60vw, 800px)",
          }}
        >
          {/* Solid orange dome — radial gradient bright at center,
              soft fade at the curved edges. */}
          <div
            className="absolute inset-0"
            style={{
              borderRadius: "50% 50% 0 0",
              background:
                "radial-gradient(circle at 50% 100%, rgba(232,90,27,0.95) 0%, rgba(232,90,27,0.85) 40%, rgba(232,90,27,0.50) 70%, rgba(232,90,27,0.10) 90%, transparent 100%)",
            }}
          />
          {/* Cream vertical streaks rising through the dome — masked
              so they only show inside the semicircle and fade at the
              edges. Reads as light rays cutting the orange. */}
          <div
            className="absolute inset-0"
            style={{
              borderRadius: "50% 50% 0 0",
              background:
                "repeating-linear-gradient(to right, transparent 0, transparent 10px, rgba(248,245,234,0.55) 10px, rgba(248,245,234,0.55) 11px)",
              maskImage:
                "radial-gradient(circle at 50% 100%, black 0%, black 75%, transparent 100%)",
              WebkitMaskImage:
                "radial-gradient(circle at 50% 100%, black 0%, black 75%, transparent 100%)",
            }}
          />
        </div>
      </div>

      {/* L4: ScrollingCode — grid of 5x4=20 cells, INVISIBLE by
          default. Cells fade in only when the cursor moves within
          280px of their center. Pure CSS keyframe scroll inside each
          cell. Mobile: skipped entirely (no hover cursor). */}
      <ScrollingCode tone="warm" />

      {/* L4.5: SF.CA mark, repositioned TOP-RIGHT corner (was bottom-
          right, founder asked for cleaner placement that doesn't
          clutter against the orange sun + scrolling code). Sits in
          the empty top-right where the navbar CTA used to be — small
          enough that it reads as a place mark, not a dominant element.
          Mocha tone matches JUMPSTART. */}
      <div
        aria-hidden
        className="absolute right-5 sm:right-8 lg:right-12 top-[28px] sm:top-[32px] z-[5] text-right pointer-events-none hidden md:block"
      >
        <div
          className="font-mono uppercase font-bold text-mocha leading-none tracking-[-0.01em]"
          style={{ fontSize: "clamp(20px, 2.2vw, 32px)" }}
        >
          SF.CA
        </div>
        <div className="mt-1.5 font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.22em] text-muted">
          Jul 25–26 · 2026
        </div>
      </div>

      {/* L5: Foreground content. Three rows: top spacer, middle
          headline cluster, bottom scroll prompt. */}
      <div className="relative z-10 flex min-h-svh flex-col items-stretch px-5 sm:px-8 text-ink">
        {/* TOP — spacer to clear the 72px GlassNav. */}
        <div className="h-[96px] sm:h-[112px]" aria-hidden />

        {/* MIDDLE — JUMPSTART wordmark + tagline + sub. All three lines
            left-align together (tagline + sub used to be ml-8/16/24
            offset right of the wordmark; founder asked to align with
            the J of Jumpstart). JUMPSTART text-ink -> text-mocha for
            the warm dark brown look. */}
        <div className="flex-1 w-full max-w-[1280px] mx-auto flex flex-col justify-center py-10 sm:py-12">
          <h1
            className="font-mono uppercase text-mocha leading-[0.86] tracking-[-0.02em] font-bold"
            style={{ fontSize: "clamp(72px, 14vw, 220px)" }}
          >
            JUMPSTART
          </h1>

          {/* Tagline — now left-aligned with the J of Jumpstart (no
              ml offset). Hard <br /> before 'builders' so the morph
              word can cycle freely without pushing 'builders' right. */}
          <p
            className="mt-8 sm:mt-10 max-w-3xl font-display italic text-ink/85 leading-tight"
            style={{ fontSize: "clamp(22px, 3.0vw, 40px)" }}
          >
            YC Startup School puts the most{" "}
            <GooeyText
              texts={TAGLINE_WORDS}
              morphTime={1}
              cooldownTime={1.6}
              className="text-accent"
            />
            <br />
            builders in one room for two days.
          </p>

          {/* Sub — also left-aligned with the wordmark now. */}
          <p
            className="mt-5 sm:mt-6 max-w-2xl font-display italic text-muted leading-snug"
            style={{ fontSize: "clamp(16px, 1.8vw, 22px)" }}
          >
            Jumpstart helps them find each other.
          </p>
        </div>

        {/* BOTTOM — Scroll prompt. 'Press ↓ or scroll to enter' text
            removed (founder ask). Just a bigger chevron arrow with a
            circle ring that animates in on hover. */}
        <div className="pb-[72px] sm:pb-[88px] w-full max-w-[1280px] mx-auto flex items-center justify-center">
          <button
            type="button"
            onClick={scrollToBody}
            className="scroll-arrow-btn group relative inline-flex items-center justify-center text-muted hover:text-mocha transition-colors focus-visible:outline-none focus-visible:text-mocha"
            aria-label="Scroll to enter the site"
            style={{ width: 64, height: 64 }}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
              className="animate-bounce-slow relative z-10"
            >
              <path
                d="M12 5v14m0 0l-6-6m6 6l6-6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounceSlow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(6px);
          }
        }
        .animate-bounce-slow {
          animation: bounceSlow 2.2s ease-in-out infinite;
        }
        /* Scroll-arrow circle reveal on hover. Pseudo-element ring that
           starts scaled down + invisible, expands to full circle on
           hover. Border-color follows currentColor so it inherits
           the muted -> mocha color shift on hover. */
        .scroll-arrow-btn::before {
          content: "";
          position: absolute;
          inset: 0;
          border: 1px solid currentColor;
          border-radius: 9999px;
          transform: scale(0.55);
          opacity: 0;
          transition: transform 280ms cubic-bezier(0.16, 1, 0.3, 1),
            opacity 220ms ease-out;
        }
        .scroll-arrow-btn:hover::before,
        .scroll-arrow-btn:focus-visible::before {
          transform: scale(1);
          opacity: 0.6;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-bounce-slow {
            animation: none;
          }
          .scroll-arrow-btn::before {
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}
