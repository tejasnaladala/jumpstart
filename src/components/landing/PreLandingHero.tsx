"use client";
import { SmokeBackground } from "@/components/ui/SmokeBackground";
import { CodeShimmer } from "@/components/landing/CodeShimmer";
import { useEffect, useState } from "react";

// PreLandingHero: full-viewport "front door" before the editorial body
// of the landing. Inspired by the YC Startup School 2026 hero — big
// heavy display type, an orange smoke/flame shader rising from below,
// random ambient code drifting around the cursor at low opacity.
//
// Composition:
//   - SmokeBackground (WebGL2 fbm noise, tinted YC orange)
//   - CodeShimmer (cursor-trail snippets, builder-coded, ~22% opacity)
//   - Big "JUMPSTART" mono-display wordmark, tagline below
//   - Faint chevron + "scroll" hint at bottom that scrolls the viewer
//     into the existing landing content
//
// Why mono-display over Instrument Serif here: the YC SS reference uses
// a heavy mono geometric face (Berkeley Mono / Söhne Mono Buch), and the
// scale is enormous (~clamp(72px, 14vw, 220px)). Geist Mono in our stack
// is the closest match, used at uppercase 800 weight equivalent via CSS
// font-stretch. The body of the page goes back to Instrument Serif for
// the editorial register.

export function PreLandingHero(): React.JSX.Element {
  // We use mounted state to delay the smoke shader render briefly so the
  // first paint is the cream background, then the orange ribbons fade
  // up. Without this, the canvas can flash a dark frame on slow GPUs.
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
      {/* Smoke shader backdrop. Sits absolute under everything. The
          shader fades in from the cream bg so there's no dark flash. */}
      <div
        aria-hidden
        className={
          "absolute inset-0 transition-opacity duration-700 " +
          (mounted ? "opacity-100" : "opacity-0")
        }
      >
        <SmokeBackground smokeColor="#FF6600" bgColor="#F4F1DB" />
      </div>

      {/* Vertical streak overlay: emphasises the "rising flame" feel
          on top of the smoke shader. Fixed absolute, low opacity. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(255,102,0,0.08), transparent 55%)",
        }}
      />

      {/* Code shimmer: cursor-trail random code snippets at ~22% opacity */}
      <CodeShimmer radius={220} rate={16} tone="warm" peakOpacity={0.22} />

      {/* Foreground content. Full-viewport with hero centered. */}
      <div className="relative z-10 flex min-h-svh flex-col items-center justify-between py-[88px] sm:py-[112px] lg:py-[128px] px-5 sm:px-8 text-ink">
        {/* Top serial: cohort marker, mirrors the editorial body below */}
        <div className="w-full max-w-[1200px] mx-auto flex items-center justify-between gap-4 text-xs">
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

        {/* Center: huge wordmark + tagline */}
        <div className="flex-1 w-full max-w-[1200px] mx-auto flex flex-col items-start justify-center">
          <h1
            className="font-mono uppercase text-ink leading-[0.86] tracking-[-0.02em] font-bold"
            style={{
              fontSize: "clamp(72px, 14vw, 220px)",
            }}
          >
            JUMPSTART
          </h1>
          <p
            className="mt-6 sm:mt-8 max-w-2xl font-display italic text-ink/85 leading-tight"
            style={{
              fontSize: "clamp(22px, 3.2vw, 44px)",
            }}
          >
            Knowing people through people, and people&apos;s people.
          </p>
          <p
            className="mt-4 sm:mt-5 max-w-xl text-sm sm:text-base text-muted leading-relaxed"
          >
            A founder graph for YC Startup School 2026.
            6,000 builders, woven into one cohort.
          </p>
        </div>

        {/* Bottom: scroll prompt */}
        <button
          type="button"
          onClick={scrollToBody}
          className="group flex flex-col items-center gap-2 text-muted hover:text-ink transition-colors focus-visible:outline-none focus-visible:text-ink"
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
          animation: bounceSlow 1.8s ease-in-out infinite;
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
