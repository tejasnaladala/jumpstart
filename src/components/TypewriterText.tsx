"use client";
import { useEffect, useRef, useState } from "react";

type Props = {
  text: string;
  speedMs?: number; // ms per character
  delayMs?: number; // delay before typing begins
  className?: string;
  cursor?: boolean;
};

// Char-by-char reveal. Triggers when the element scrolls into view.
// Honors prefers-reduced-motion (renders the full string immediately).
export function TypewriterText({
  text,
  speedMs = 18,
  delayMs = 200,
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
              const target = Math.min(text.length, Math.floor(elapsed / speedMs));
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
        <span className="inline-block w-[1px] h-[1em] bg-accent align-middle ml-0.5 animate-[blink_0.9s_steps(2)_infinite]" />
      ) : null}
    </span>
  );
}
