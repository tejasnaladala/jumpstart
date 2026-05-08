"use client";
import { SmokeBackground } from "@/components/ui/SmokeBackground";
import { DottedSurface } from "@/components/ui/DottedSurface";
import { useEffect, useState } from "react";

// PreLandingHero — compressed brand splash above the editorial body.
//
// Audit pass (May 8 2026, "implement everything end to end"):
//   - Cut the GooeyText morphing-adjective tagline (formidable / earnest /
//     relentless / contrarian / audacious) — read as performance, not
//     positioning. Replaced with one declarative line.
//   - Cut the ScrollingCode cursor-radius reveal grid — vibe-coder
//     showcase, no product value, invisible to most users.
//   - Compressed min-h from svh → 60svh so the real hero (with the email
//     field) peeks above the fold instead of being a full screen below.
//   - Dropped smoke shader opacity hard (25 → 10) so the new warm cream
//     bg (#F2E5C2) shows through cleanly.
//   - Down arrow removed (hero is visible below now, no need to hint).
//   - Dome streak spacing widened (16/17 → 22/23) so they don't read as
//     a regular grid at the smaller dome size.
//
// What remains: JUMPSTART wordmark + one-line tagline + sub + SF.CA
// event mark + compact orange dome at bottom-center. That's it.

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
      {/* L0: DottedSurface — Three.js particle wave, deepest layer.
          Toned to opacity-25 so the cream shows through more. */}
      <div
        aria-hidden
        className={
          "absolute inset-0 transition-opacity duration-1000 " +
          (mounted ? "opacity-25" : "opacity-0")
        }
      >
        <DottedSurface dotColor={[70, 51, 37]} />
      </div>

      {/* L1: SmokeBackground — minimal warm texture. Was 25%, now 10%.
          The shader stays for ambient motion but no longer tints the
          page bg orange. */}
      <div
        aria-hidden
        className={
          "absolute inset-0 mix-blend-multiply transition-opacity duration-700 " +
          (mounted ? "opacity-10" : "opacity-0")
        }
      >
        <SmokeBackground smokeColor="#E85A1B" bgColor="#F2E5C2" />
      </div>

      {/* L3: Bottom orange wash — quiet base warmth. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(232,90,27,0.06), transparent 50%)",
        }}
      />

      {/* L3.5: Compact orange dome at bottom-center. Sized to fit the
          new 60vh hero without dominating it. True semi-ellipse via
          the slash border-radius syntax. */}
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
            width: "min(36vw, 540px)",
            height: "min(22vh, 200px)",
          }}
        >
          {/* Halo — soft glow ring around the dome. */}
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
          {/* Solid dome. */}
          <div
            className="absolute inset-0"
            style={{
              borderRadius: "50% 50% 0 0 / 100% 100% 0 0",
              background:
                "radial-gradient(ellipse at 50% 100%, rgba(232,90,27,0.98) 0%, rgba(232,90,27,0.93) 55%, rgba(232,90,27,0.80) 82%, rgba(232,90,27,0.50) 96%, rgba(232,90,27,0.18) 100%)",
            }}
          />
          {/* Vertical light rays — wider spacing (22/23 px) so they read
              as rays not a regular grid at the compact dome size. */}
          <div
            className="absolute inset-0"
            style={{
              borderRadius: "50% 50% 0 0 / 100% 100% 0 0",
              background:
                "repeating-linear-gradient(to right, transparent 0, transparent 22px, rgba(242,229,194,0.50) 22px, rgba(242,229,194,0.50) 23px)",
              maskImage:
                "radial-gradient(ellipse at 50% 100%, black 0%, black 78%, transparent 100%)",
              WebkitMaskImage:
                "radial-gradient(ellipse at 50% 100%, black 0%, black 78%, transparent 100%)",
            }}
          />
        </div>
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

      {/* Foreground content. Two rows: top spacer + JUMPSTART/tagline/sub. */}
      <div className="relative z-10 flex min-h-[60svh] flex-col items-stretch px-5 sm:px-8 text-ink">
        {/* TOP — spacer to clear the 72px GlassNav. */}
        <div className="h-[72px] sm:h-[80px]" aria-hidden />

        {/* MIDDLE — JUMPSTART wordmark + one-line tagline + sub.
            JUMPSTART size dropped (clamp 72/14vw/220 → 56/10vw/160) to
            fit the compressed 60vh hero. */}
        <div className="flex-1 w-full max-w-[1280px] mx-auto flex flex-col justify-start py-2 sm:py-4">
          <h1
            className="font-mono uppercase text-mocha leading-[0.86] tracking-[-0.02em] font-bold"
            style={{ fontSize: "clamp(56px, 10vw, 160px)" }}
          >
            JUMPSTART
          </h1>

          {/* Tagline — direct, single line. No more morphing adjective. */}
          <p
            className="mt-5 sm:mt-7 max-w-3xl font-display italic text-ink/85 leading-tight"
            style={{ fontSize: "clamp(20px, 2.6vw, 36px)" }}
          >
            Find the founders you{" "}
            <span className="text-accent">should have met already.</span>
          </p>

          {/* Sub — concrete cadence + venue cue. */}
          <p
            className="mt-3 sm:mt-4 max-w-2xl font-display italic text-muted leading-snug"
            style={{ fontSize: "clamp(16px, 1.8vw, 22px)" }}
          >
            One intro, three times a week, before Chase Center opens.
          </p>
        </div>

        {/* BOTTOM — small bottom padding only. The down arrow was
            removed because the hero waitlist is now visible below the
            fold (60vh hero), so the user doesn't need a scroll hint. */}
        <div className="pb-6 sm:pb-8" aria-hidden />
      </div>
    </section>
  );
}
