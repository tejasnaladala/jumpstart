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
        <SmokeBackground smokeColor="#E85A1B" bgColor="#F4F1DB" />
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
        <SmokeBackground smokeColor="#CC4E15" bgColor="#F4F1DB" />
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

      {/* L3.5: Orange ascending sun — boosted size + brighter streaks
          per founder ask ('orange lights too thin too small'). Three
          stacked layers:
            1. Wide sun core glow — large radial, bright orange center
            2. Outer ambient halo — pulls warmth out to the edges
            3. Vertical streak beams — thicker (3px every 12px gap)
               and darker so they read clearly as light shafts. */}
      <div
        aria-hidden
        className={
          "absolute inset-x-0 bottom-0 h-[70%] pointer-events-none transition-opacity duration-1000 " +
          (mounted ? "opacity-100" : "opacity-0")
        }
      >
        {/* Outer ambient halo — broadest, softest layer */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 100% at 55% 110%, rgba(232,90,27,0.30) 0%, rgba(232,90,27,0.10) 40%, transparent 75%)",
          }}
        />
        {/* Vertical streak beams — thicker (3px ever 12px), darker */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(to right, transparent 0px, transparent 12px, rgba(204,78,21,0.32) 12px, rgba(204,78,21,0.32) 14px)",
            maskImage:
              "radial-gradient(ellipse 60% 100% at 55% 100%, black 0%, black 35%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 60% 100% at 55% 100%, black 0%, black 35%, transparent 75%)",
          }}
        />
        {/* Bright sun core — concentrated bright glow at the horizon */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 50% 75% at 55% 105%, rgba(232,90,27,0.75) 0%, rgba(232,90,27,0.30) 30%, rgba(232,90,27,0.08) 55%, transparent 75%)",
          }}
        />
      </div>

      {/* L4: ScrollingCode — grid of 5x4=20 cells, INVISIBLE by
          default. Cells fade in only when the cursor moves within
          280px of their center. Pure CSS keyframe scroll inside each
          cell. Mobile: skipped entirely (no hover cursor). */}
      <ScrollingCode tone="warm" />

      {/* L4.5: SF.CA location + dates label. Positioned bottom-right
          of the viewport so it doesn't collide with the JUMPSTART
          wordmark above (the wordmark is too wide to leave horizontal
          room for a same-height SF.CA on the right, like the YC SS
          reference does — JUMPSTART is 9 chars at clamp 220 vs YC's
          two-line break). Bottom-right placement reads as a "footer
          mark" of place/time/venue, mirroring how YC SS has SF.CA
          near the bottom-right of the orange sun. */}
      <div
        aria-hidden
        className="absolute right-5 sm:right-8 lg:right-12 bottom-[140px] sm:bottom-[160px] lg:bottom-[180px] z-[5] text-right pointer-events-none hidden md:block"
      >
        <div
          className="font-mono uppercase font-bold text-ink leading-[0.86] tracking-[-0.02em]"
          style={{ fontSize: "clamp(48px, 6vw, 96px)" }}
        >
          SF.CA
        </div>
        <div className="mt-3 lg:mt-4 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-muted">
          Jul 25 — 26 · 2026
        </div>
        <div className="mt-1 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-muted">
          Chase Center
        </div>
      </div>

      {/* L5: Foreground content. Three rows: top spacer, middle
          headline cluster, bottom scroll prompt. */}
      <div className="relative z-10 flex min-h-svh flex-col items-stretch px-5 sm:px-8 text-ink">
        {/* TOP — spacer to clear the 72px GlassNav. */}
        <div className="h-[96px] sm:h-[112px]" aria-hidden />

        {/* MIDDLE — JUMPSTART wordmark + tagline + sub. */}
        <div className="flex-1 w-full max-w-[1280px] mx-auto flex flex-col justify-center py-10 sm:py-12">
          <h1
            className="font-mono uppercase text-ink leading-[0.86] tracking-[-0.02em] font-bold"
            style={{ fontSize: "clamp(72px, 14vw, 220px)" }}
          >
            JUMPSTART
          </h1>

          {/* Tagline. Hard line break BEFORE 'builders' so when the
              morph word cycles to a shorter token (e.g. 'earnest'),
              the trailing 'builders in one room for two days.' stays
              on its own line and doesn't get pushed right by the
              GooeyText width sizer. */}
          <p
            className="mt-8 sm:mt-10 max-w-3xl font-display italic text-ink/85 leading-tight ml-8 sm:ml-16 lg:ml-24"
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

          {/* New sub line — the Jumpstart promise paired against the
              YC framing above it. Smaller, italic too, but in muted
              tone so the rotating tagline keeps weight. */}
          <p
            className="mt-5 sm:mt-6 max-w-2xl font-display italic text-muted leading-snug ml-8 sm:ml-16 lg:ml-24"
            style={{ fontSize: "clamp(16px, 1.8vw, 22px)" }}
          >
            Jumpstart helps them find each other.
          </p>
        </div>

        {/* BOTTOM — Scroll prompt. */}
        <div className="pb-[72px] sm:pb-[88px] w-full max-w-[1280px] mx-auto flex items-center justify-center">
          <button
            type="button"
            onClick={scrollToBody}
            className="group flex flex-col items-center gap-6 text-muted hover:text-ink transition-colors focus-visible:outline-none focus-visible:text-ink"
            aria-label="Scroll to enter the site"
          >
            <span className="ed-serial">Press ↓ or scroll to enter</span>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
              className="animate-bounce-slow"
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
        @media (prefers-reduced-motion: reduce) {
          .animate-bounce-slow {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
