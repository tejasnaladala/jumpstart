"use client";
import { SmokeBackground } from "@/components/ui/SmokeBackground";
import { DottedSurface } from "@/components/ui/DottedSurface";
import { CodeShimmer } from "@/components/landing/CodeShimmer";
import { useEffect, useState } from "react";

// PreLandingHero — full-viewport "front door" before the editorial
// landing body. Layers, top of stack down:
//
//   L4 (z-10)   Foreground content: serial chip + JUMPSTART wordmark +
//               italic tagline + descriptor + scroll prompt
//   L3 (z-1)    CodeShimmer cursor trail
//   L2 (z-0)    Bottom orange wash (linear gradient)
//   L1          SmokeBackground (WebGL2 fbm noise, orange-tinted)
//   L0          DottedSurface (Three.js particle wave, ambient texture)
//
// Spacing rules (after founder feedback):
//   - Top serial sits 24px BELOW the GlassNav so they don't visually
//     touch. Doesn't anchor to the navbar; floats independently.
//   - JUMPSTART wordmark gets the entire middle third of the viewport.
//   - Scroll prompt has a real 32px gap between the "Press" label and
//     the chevron arrow (was 8px — felt cramped).

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
          Adds atmospheric depth on cream. opacity-50 so it sits behind
          the smoke without overpowering it. */}
      <div
        aria-hidden
        className={
          "absolute inset-0 transition-opacity duration-1000 " +
          (mounted ? "opacity-50" : "opacity-0")
        }
      >
        <DottedSurface dotColor={[70, 51, 37]} />
      </div>

      {/* L1: SmokeBackground — orange flames rising. multiply blend so
          the orange tint reads on top of the cream + dotted backdrop. */}
      <div
        aria-hidden
        className={
          "absolute inset-0 mix-blend-multiply transition-opacity duration-700 " +
          (mounted ? "opacity-85" : "opacity-0")
        }
      >
        <SmokeBackground smokeColor="#FF6600" bgColor="#F4F1DB" />
      </div>

      {/* L2: Bottom orange wash — emphasises rising-flame feel. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(255,102,0,0.16), transparent 58%)",
        }}
      />

      {/* L3: Code shimmer cursor trail — gentler now (longer fade,
          softer easing — see CodeShimmer.tsx). */}
      <CodeShimmer radius={260} rate={14} tone="warm" peakOpacity={0.24} />

      {/* L4: Foreground content. Three rows, equal-distributed by
          flex with explicit gaps so the JUMPSTART wordmark isn't
          crammed against the chrome above and below it. */}
      <div className="relative z-10 flex min-h-svh flex-col items-stretch px-5 sm:px-8 text-ink">
        {/* TOP — Serial chip, sits 24px below the 72px GlassNav. */}
        <div className="pt-[96px] sm:pt-[112px]">
          <div className="w-full max-w-[1280px] mx-auto flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse"
              />
              <span className="ed-serial">No. 001 / YC SS 2026</span>
            </div>
            <span className="ed-serial hidden sm:inline">
              Chase Center · Jul 25–26
            </span>
          </div>
        </div>

        {/* MIDDLE — Headline cluster (JUMPSTART + tagline + descriptor). */}
        <div className="flex-1 w-full max-w-[1280px] mx-auto flex flex-col justify-center py-10 sm:py-12">
          <h1
            className="font-mono uppercase text-ink leading-[0.86] tracking-[-0.02em] font-bold"
            style={{ fontSize: "clamp(72px, 14vw, 220px)" }}
          >
            JUMPSTART
          </h1>
          <p
            className="mt-7 sm:mt-9 max-w-2xl font-display italic text-ink/85 leading-tight"
            style={{ fontSize: "clamp(22px, 3.2vw, 44px)" }}
          >
            Knowing people through people, and people&apos;s people.
          </p>
          <p className="mt-5 sm:mt-6 max-w-xl text-sm sm:text-base text-muted leading-relaxed">
            A founder graph for YC Startup School 2026. 6,000 builders,
            woven into one cohort.
          </p>
        </div>

        {/* BOTTOM — Scroll prompt. 64px above the viewport edge so it
            breathes. Gap between label and arrow bumped 8px -> 24px. */}
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
