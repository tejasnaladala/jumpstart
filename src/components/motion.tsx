"use client";
// Framer Motion primitives for the project. Keeps the motion grammar
// consistent across pages and respects prefers-reduced-motion via the
// MotionConfig wrapper (and our globals.css fallback for the few cases
// where framer's reducer does not reach).

import { motion, AnimatePresence, MotionConfig, useReducedMotion } from "framer-motion";
import type { Variants, Transition } from "framer-motion";
import { cn } from "@/lib/utils";

// Spring constants. Direct, with a touch of weight. Avoids bouncy/cartoony.
export const SPRING_SOFT: Transition = { type: "spring", stiffness: 320, damping: 32, mass: 0.8 };
export const SPRING_TIGHT: Transition = { type: "spring", stiffness: 480, damping: 38, mass: 0.6 };
export const EASE: Transition = { type: "tween", ease: [0.16, 1, 0.3, 1], duration: 0.32 };

// Variants for staggered list reveal (used by the Drop home).
export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.985 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

export const staggerList: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

export const overlayFade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: EASE },
  exit: { opacity: 0, transition: { duration: 0.18 } },
};

export const sheetRise: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.985 },
  visible: { opacity: 1, y: 0, scale: 1, transition: SPRING_SOFT },
  exit: { opacity: 0, y: 24, scale: 0.985, transition: { duration: 0.18 } },
};

// Re-export the bits the rest of the app uses, so import paths stay short.
export { motion, AnimatePresence, MotionConfig, useReducedMotion };

// Convenience: a div with the standard fade-up entrance, for one-off uses.
export function FadeUp({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...EASE, delay }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
