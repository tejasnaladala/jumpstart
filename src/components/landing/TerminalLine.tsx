"use client";
import { useEffect, useRef, useState } from "react";

// Mono command-line aesthetic for landing-page step rows. Static SSR
// fallback shows the full text; once on screen, the typing effect
// animates char-by-char (no jitter, ~28ms per char). prefers-reduced-
// motion skips the animation entirely.
//
// Use sparingly: at most one block per scroll (the HowItWorks section
// is the right place; not every page-block needs terminal energy).

type Props = {
  prompt?: string; // "$" "›" ">" — defaults to "›"
  text: string;
  className?: string;
  // Optional delay before typing starts (allows staggering rows).
  delaySec?: number;
};

export function TerminalLine({
  prompt = "›",
  text,
  className,
  delaySec = 0,
}: Props): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState<string>(text);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduce) return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            obs.disconnect();
            setShown("");
            setAnimating(true);
            const ms = 28;
            const startMs = delaySec * 1000;
            for (let i = 1; i <= text.length; i++) {
              setTimeout(() => {
                setShown(text.slice(0, i));
                if (i === text.length) setAnimating(false);
              }, startMs + i * ms);
            }
          }
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [text, delaySec]);

  return (
    <div
      ref={ref}
      className={
        "font-mono text-sm sm:text-base text-ink/90 flex items-baseline gap-3 " +
        (className || "")
      }
    >
      <span aria-hidden className="text-accent shrink-0">
        {prompt}
      </span>
      <span className="break-words">
        {shown}
        {animating ? (
          <span
            aria-hidden
            className="inline-block w-[8px] h-[14px] sm:h-[16px] ml-0.5 bg-ink animate-pulse align-baseline"
          />
        ) : null}
      </span>
    </div>
  );
}
