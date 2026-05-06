"use client";
import { useEffect, useRef, useState } from "react";

type Props = {
  text: string;
  speedMs?: number; // ms per character
  delayMs?: number; // delay before typing begins
  className?: string;
  cursor?: boolean;
};

// Char-by-char reveal. Triggers when the element scrolls into view, with a
// gentle ease-out on character spacing so the start is brisk and the trail
// settles into final state. Honors prefers-reduced-motion (renders the full
// string immediately).
//
// Tuning notes (post-feedback): default speedMs trimmed 18 -> 22ms so the
// pacing breathes; the easing curve clusters chars at the front of the
// reveal and stretches the last ones so it lands like a typed sentence,
// not a uniform stream.
export function TypewriterText({
  text,
  speedMs = 22,
  delayMs = 220,
  className,
  cursor = true,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setN(text.length);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const totalDuration = text.length * speedMs;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            const start = performance.now();
            const tick = (t: number) => {
              const elapsed = t - start - delayMs;
              if (elapsed < 0) {
                requestAnimationFrame(tick);
                return;
              }
              // Ease-out on character index: brisk at the start, slows as
              // it reaches the end. Feels like deliberate typing.
              const k = Math.min(1, elapsed / totalDuration);
              const eased = 1 - Math.pow(1 - k, 1.6);
              const target = Math.min(text.length, Math.floor(eased * text.length));
              setN(target);
              if (target < text.length) requestAnimationFrame(tick);
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
  }, [text, speedMs, delayMs]);

  return (
    <span ref={ref} className={className}>
      {text.slice(0, n)}
      {cursor && n < text.length ? (
        <span className="inline-block w-[2px] h-[0.95em] bg-accent align-middle ml-0.5 animate-[blink_1.1s_steps(2)_infinite]" />
      ) : null}
    </span>
  );
}
