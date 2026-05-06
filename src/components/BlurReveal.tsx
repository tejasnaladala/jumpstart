"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  className?: string;
  // Stagger between word reveals (seconds). Default 0.06.
  staggerSec?: number;
  // Per-word duration (seconds). Default 1.0. Slightly randomized per word
  // to avoid robotic uniformity.
  durationSec?: number;
  // Initial blur in px. Default 6 (down from 14 per Fool a11y review:
  // 14px renders text completely unreadable mid-reveal for low-vision
  // users not using the reduced-motion preference).
  blurPx?: number;
  // Once true, animation plays once on mount; otherwise replays on scroll.
  once?: boolean;
};

// Word-by-word cinematic reveal. Pattern adapted from 21st.dev
// blur-text-animation, tailored to our easing curve and palette:
//   - cubic-bezier(0.25, 0.46, 0.45, 0.94) for the soft ease-in-out
//   - per-word stagger of 0.06s with a small randomized micro-variation
//   - per-word duration randomized within +/- 0.2s so the trail looks
//     organic (not a uniform stream)
//   - honors prefers-reduced-motion at INITIAL render (not after first
//     paint) so reduced-motion users never see a blur flash
//   - default blur 6px (was 14px) so even non-reduced-motion users with
//     low visual acuity can read the text mid-animation
//
// Use as a one-shot reveal on key editorial lines (the "matchmaker reads
// it forever" kicker, h2 emphasis lines). Replaces the typewriter pattern
// for a more refined feel.
export function BlurReveal({
  text,
  className,
  staggerSec = 0.06,
  durationSec = 1.0,
  blurPx = 6,
  once = true,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  // Synchronous reduced-motion read on first render. Honors the OS
  // preference at the very first paint so reduced-motion users never see
  // any animation flash. Closes Codex M5.
  const [reducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return false;
    }
  });
  // active=true means "show final state" (no blur, full opacity).
  // - reduced-motion users: active=true from first render
  // - everyone else: active=false until IntersectionObserver fires
  const [active, setActive] = useState(reducedMotion);

  const words = useMemo(() => {
    return text.split(/(\s+)/).map((w, i) => ({
      text: w,
      delay: i * staggerSec + Math.sin(i * 1.7) * 0.025,
      duration: durationSec + Math.cos(i * 0.6) * 0.14,
    }));
  }, [text, staggerSec, durationSec]);

  useEffect(() => {
    if (reducedMotion) return; // already at final state
    if (typeof window === "undefined") return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setActive(false);
          }
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [once, reducedMotion]);

  return (
    <span ref={ref} className={cn("inline", className)}>
      {words.map((w, i) =>
        /^\s+$/.test(w.text) ? (
          <span key={i}>{w.text}</span>
        ) : (
          <span
            key={i}
            className="inline-block"
            style={{
              transition: reducedMotion
                ? "none"
                : `opacity ${w.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${w.delay}s, filter ${w.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${w.delay}s, transform ${w.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${w.delay}s`,
              opacity: active ? 1 : 0,
              filter: active ? "blur(0px)" : `blur(${blurPx}px)`,
              transform: active ? "translateY(0)" : "translateY(0.25em)",
              willChange: active ? "auto" : "filter, transform, opacity",
            }}
          >
            {w.text}
          </span>
        )
      )}
    </span>
  );
}
