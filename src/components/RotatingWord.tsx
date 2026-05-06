"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  words: string[];
  // ms between rotations. Default 2400.
  intervalMs?: number;
  className?: string;
  // The font + style classes for the rotating word. Pass the same italic
  // accent treatment as a static word (e.g. "italic text-accent font-display").
  wordClassName?: string;
};

// Rotating word accent. Pattern adapted from the 21st.dev animated-hero
// (rotating headline word) but tailored to our editorial voice:
//   - Uses our cubic-bezier(0.22, 1, 0.36, 1) easing
//   - Slow trail-out (0.5s exit) so the swap reads deliberate not gimmicky
//   - Honors prefers-reduced-motion (locks to first word)
//   - Container sized to the longest word so layout stays stable
//
// Use as the kicker inside a hero h1: wraps a single word that cycles
// through founder archetypes (AI infra builders, hardtech founders, etc.).
export function RotatingWord({
  words,
  intervalMs = 2400,
  className,
  wordClassName,
}: Props) {
  const [index, setIndex] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (reduced || words.length <= 1) return;
    const id = setTimeout(() => {
      setIndex((i) => (i + 1) % words.length);
    }, intervalMs);
    return () => clearTimeout(id);
  }, [index, intervalMs, words.length, reduced]);

  // Compute longest word for stable container width. Approximates 0.55em
  // per char in display italic. Falls back to natural width on mobile.
  const longest = words.reduce((a, b) => (a.length >= b.length ? a : b), "");

  return (
    <span
      className={cn("relative inline-block align-baseline", className)}
      // Layout-stable container so swaps don't jiggle the line.
      style={{ minWidth: `${longest.length * 0.5}em` }}
    >
      {/* Invisible spacer holds the row height + width */}
      <span className={cn("invisible whitespace-nowrap", wordClassName)} aria-hidden>
        {longest}
      </span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={words[index]}
          initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: "0.4em", filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={reduced ? { opacity: 1 } : { opacity: 0, y: "-0.4em", filter: "blur(6px)" }}
          transition={{
            duration: 0.55,
            ease: [0.22, 1, 0.36, 1],
            opacity: { duration: 0.45 },
          }}
          className={cn(
            "absolute left-0 top-0 whitespace-nowrap",
            wordClassName
          )}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
