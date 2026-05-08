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
          again (55% -> 22%) since the new peach bg + small dome read
          better with less full-page orange tint. The shader is still
          there as quiet motion texture but no longer fights the dome
          for attention. */}
      <div
        aria-hidden
        className={
          "absolute inset-0 mix-blend-multiply transition-opacity duration-700 " +
          (mounted ? "opacity-25" : "opacity-0")
        }
      >
        <SmokeBackground smokeColor="#E85A1B" bgColor="#F2CFA5" />
      </div>

      {/* L2: Focal smoke behind JUMPSTART — also dialed down (35% ->
          12%) so the tagline area doesn't muddy. */}
      <div
        aria-hidden
        className={
          "absolute inset-x-0 top-[18%] h-[55%] mix-blend-multiply transition-opacity duration-700 " +
          (mounted ? "opacity-15" : "opacity-0")
        }
        style={{
          maskImage:
            "radial-gradient(ellipse at center, black 0%, black 45%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 0%, black 45%, transparent 80%)",
        }}
      >
        <SmokeBackground smokeColor="#CC4E15" bgColor="#F2CFA5" />
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

      {/* L3.5: Orange ascending sun — compact dome at bottom-center,
          matching the YC SS 2026 reference. Previous pass made the
          dome 120vw x 60vw which on a 1440 desktop = 1440 x 720, i.e.
          the entire bottom half of the viewport. Founder said it
          looked 'like an egg taking up half the screen'.
          Re-tuned to the YC ratio: ~50vw wide x ~40vh tall, capped at
          720 x 380 on lg+. Sits centered, anchored to bottom edge.
          Three layers:
            1. Soft orange halo (slightly larger than the dome) for a
               glow ring — bleeds the warmth past the hard edge
            2. Solid orange dome — semicircle of an ellipse via
               border-radius 50% 50% 0 0
            3. Vertical peach streaks rising through it — reads as
               light rays cutting the dome */}
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
            // Tightened pass: was 56vw x 42vh, founder said still too
            // big (looked like a flat-topped rectangle taking half the
            // screen). Now 36vw x 28vh — true semi-ellipse aspect
            // (~1.65:1) reads as a clean dome, sits in the bottom 30%
            // of the page rather than dominating it.
            width: "min(36vw, 540px)",
            height: "min(28vh, 280px)",
          }}
        >
          {/* Soft halo — wider/fainter orange tint behind the dome so
              the edge has a glow ring instead of a razor cut. Halo
              bleeds outside the container via negative inset. */}
          <div
            className="absolute"
            style={{
              left: "-22%",
              right: "-22%",
              top: "-18%",
              bottom: 0,
              borderRadius: "50% 50% 0 0 / 100% 100% 0 0",
              background:
                "radial-gradient(ellipse at 50% 100%, rgba(232,90,27,0.32) 0%, rgba(232,90,27,0.14) 55%, transparent 85%)",
              filter: "blur(28px)",
            }}
          />
          {/* Solid orange dome — saturated core, fade only at the very
              edge so the silhouette stays defined. */}
          <div
            className="absolute inset-0"
            style={{
              borderRadius: "50% 50% 0 0 / 100% 100% 0 0",
              background:
                "radial-gradient(ellipse at 50% 100%, rgba(232,90,27,0.98) 0%, rgba(232,90,27,0.93) 55%, rgba(232,90,27,0.80) 82%, rgba(232,90,27,0.50) 96%, rgba(232,90,27,0.18) 100%)",
            }}
          />
          {/* Vertical peach streaks — page-bg tinted lines cutting
              through the orange (read as light rays). At the smaller
              dome size, dial back density: was 12/13 px stripe period,
              now 16/17 so the rays don't read as a regular grid. */}
          <div
            className="absolute inset-0"
            style={{
              borderRadius: "50% 50% 0 0 / 100% 100% 0 0",
              background:
                "repeating-linear-gradient(to right, transparent 0, transparent 16px, rgba(242,207,165,0.45) 16px, rgba(242,207,165,0.45) 17px)",
              maskImage:
                "radial-gradient(ellipse at 50% 100%, black 0%, black 78%, transparent 100%)",
              WebkitMaskImage:
                "radial-gradient(ellipse at 50% 100%, black 0%, black 78%, transparent 100%)",
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
          headline cluster, bottom scroll prompt.
          Tightening pass — founder said the arrow was below the fold
          on standard viewports. Pulled JUMPSTART up by:
            (a) shrinking top spacer 96/112 -> 72/80 (just clears the
                72px GlassNav, no extra breathing room)
            (b) middle row justify-center -> justify-start (don't
                center vertically; sit at top)
            (c) middle py 10/12 -> 2/4
            (d) bottom pb 72/88 -> 40/56
          With min-h-svh on the section, this puts the arrow back
          inside the viewport on a typical 800-900px tall window. */}
      <div className="relative z-10 flex min-h-svh flex-col items-stretch px-5 sm:px-8 text-ink">
        {/* TOP — spacer to clear the 72px GlassNav. */}
        <div className="h-[72px] sm:h-[80px]" aria-hidden />

        {/* MIDDLE — JUMPSTART wordmark + tagline + sub. justify-start
            so content sits high in the row instead of being centered
            in the leftover flex-1 space. */}
        <div className="flex-1 w-full max-w-[1280px] mx-auto flex flex-col justify-start py-2 sm:py-4">
          <h1
            className="font-mono uppercase text-mocha leading-[0.86] tracking-[-0.02em] font-bold"
            style={{ fontSize: "clamp(72px, 14vw, 220px)" }}
          >
            JUMPSTART
          </h1>

          {/* Tagline — left-aligned with the J of Jumpstart. Hard
              <br /> before 'builders' so the morph word can cycle
              freely without pushing 'builders' right. mt-8/10 -> 5/7
              as part of the vertical compression pass. */}
          <p
            className="mt-5 sm:mt-7 max-w-3xl font-display italic text-ink/85 leading-tight"
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

          {/* Sub — left-aligned with the wordmark. mt 5/6 -> 3/4
              as part of the vertical compression. */}
          <p
            className="mt-3 sm:mt-4 max-w-2xl font-display italic text-muted leading-snug"
            style={{ fontSize: "clamp(16px, 1.8vw, 22px)" }}
          >
            Jumpstart helps them find each other.
          </p>
        </div>

        {/* BOTTOM — Scroll prompt. 'Press ↓ or scroll to enter' text
            removed (founder ask). Bigger chevron arrow with a circle
            ring that animates in on hover. pb 72/88 -> 40/56 to bring
            the arrow above the fold on standard viewports. */}
        <div className="pb-[40px] sm:pb-[56px] w-full max-w-[1280px] mx-auto flex items-center justify-center">
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
