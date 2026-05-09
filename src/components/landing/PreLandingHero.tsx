"use client";
import { SmokeBackground } from "@/components/ui/SmokeBackground";
import { DottedSurface } from "@/components/ui/DottedSurface";
import { useEffect, useState } from "react";

// PreLandingHero — clean editorial brand splash.
//
// Founder ask (May 8 2026): revert to a state before the orange dome
// and the vertical streaks ("red streaks or semi circle"). Stripped:
//   - L3 bottom orange wash (linear-gradient warming the bottom edge)
//   - L3.5 orange dome (halo + solid radial-gradient + vertical
//     repeating-linear-gradient streaks)
//
// What remains: DottedSurface particles (low opacity), a faint
// SmokeBackground for ambient warmth, the SF.CA event mark in the
// corner, JUMPSTART wordmark, one-line tagline, sub. The orange now
// only appears as the accent color on the tagline highlight, not as
// a page-spanning dome.

export function PreLandingHero(): React.JSX.Element {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      id="prelanding"
      className="relative min-h-[60svh] w-full overflow-hidden bg-bg"
      aria-label="Jumpstart intro"
    >
      {/* L0: DottedSurface — Three.js particle wave, deepest layer. */}
      <div
        aria-hidden
        className={
          "absolute inset-0 transition-opacity duration-1000 " +
          (mounted ? "opacity-25" : "opacity-0")
        }
      >
        <DottedSurface dotColor={[70, 51, 37]} />
      </div>

      {/* L1: SmokeBackground — barely-there ambient texture. Was 10%,
          dropped further to 6% so there is no perceptible orange tint
          on the cream bg. Pure motion as background atmosphere. */}
      <div
        aria-hidden
        className={
          "absolute inset-0 mix-blend-multiply transition-opacity duration-700 " +
          (mounted ? "opacity-[0.06]" : "opacity-0")
        }
      >
        <SmokeBackground smokeColor="#E85A1B" bgColor="#F2E5C2" />
      </div>

      {/* SF.CA event mark, top-right. Mocha tone matches JUMPSTART. */}
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

      {/* Foreground content — JUMPSTART wordmark + one-line tagline + sub. */}
      <div className="relative z-10 flex min-h-[60svh] flex-col items-stretch px-5 sm:px-8 text-ink">
        {/* TOP — spacer to clear the 72px GlassNav. */}
        <div className="h-[72px] sm:h-[80px]" aria-hidden />

        {/* MIDDLE — wordmark + tagline + sub. */}
        <div className="flex-1 w-full max-w-[1280px] mx-auto flex flex-col justify-start py-2 sm:py-4">
          <h1
            className="font-mono uppercase text-mocha leading-[0.86] tracking-[-0.02em] font-bold"
            style={{ fontSize: "clamp(56px, 10vw, 160px)" }}
          >
            JUMPSTART
          </h1>

          {/* Tagline — direct, single line. */}
          <p
            className="mt-5 sm:mt-7 max-w-3xl font-display italic text-ink/85 leading-tight"
            style={{ fontSize: "clamp(20px, 2.6vw, 36px)" }}
          >
            Find the people you were{" "}
            <span className="text-accent">supposed to meet.</span>
          </p>

          {/* Sub — concrete cadence + venue cue. */}
          <p
            className="mt-3 sm:mt-4 max-w-2xl font-display italic text-muted leading-snug"
            style={{ fontSize: "clamp(16px, 1.8vw, 22px)" }}
          >
            YC brings the cohort. Jumpstart routes the room.
          </p>
        </div>

        {/* BOTTOM — small bottom padding only. The hero waitlist is
            visible below the 60vh fold so no scroll hint is needed. */}
        <div className="pb-6 sm:pb-8" aria-hidden />
      </div>
    </section>
  );
}
