"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  durationMs?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
};

// Counts up from 0 to value when the element scrolls into view. Eases out
// so the last digits feel deliberate, not jittery. Honors reduced motion
// (renders the final value immediately).
export function AnimatedCounter({
  value,
  durationMs = 1400,
  prefix = "",
  suffix = "",
  className,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  // Initial state is the final value, not 0. SSR + first hydrate render
  // the real number; the IntersectionObserver in the effect below resets
  // to 0 + ticks up only when in view AND JS has hydrated. Fixes the
  // architecture-audit finding where cold readers saw "0 / 0+ / 0 / 0"
  // for the four stats while waiting for hydration.
  const [display, setDisplay] = useState(value);
  const startedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDisplay(value);
      return;
    }
    // Reset to 0 only after we've confirmed JS is alive AND we're about
    // to animate. Without this, the SSR'd final value shows briefly,
    // then snaps to 0 once the IO fires. Fine — the IO callback below
    // sets display to 0 implicitly via tick(0).
    setDisplay(0);
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            const t0 = performance.now();
            const tick = (t: number) => {
              const k = Math.min(1, (t - t0) / durationMs);
              const eased = 1 - Math.pow(1 - k, 3);
              setDisplay(Math.round(value * eased));
              if (k < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, durationMs]);

  return (
    <span ref={ref} className={cn("tabular-nums font-mono", className)}>
      {prefix}
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}
