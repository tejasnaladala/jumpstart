"use client";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";

// Single shared primitive that replaces ad-hoc <Reveal /> wrappers across
// the landing. Lifted from magicuidesign/magicui (MIT). Respects
// prefers-reduced-motion. Fires once when 30% of the block enters the
// viewport. Tiny opacity + 12px translateY; no blur (audit flagged blur
// as composite-thrashing on mobile, plus it fights the editorial
// restraint).

type Props = {
  children: React.ReactNode;
  delay?: number; // seconds
  duration?: number; // seconds
  yOffset?: number; // pixels
  className?: string;
  // Pass `inView=false` to never trigger; default fires on intersection.
  forceInView?: boolean;
};

export function BlurFade({
  children,
  delay = 0,
  duration = 0.6,
  yOffset = 12,
  className,
  forceInView,
}: Props): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const reduced = useReducedMotion();
  const visible = forceInView ?? inView;

  const variants: Variants = {
    hidden: { opacity: 0, y: yOffset },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      ref={ref}
      initial={reduced ? "visible" : "hidden"}
      animate={visible || reduced ? "visible" : "hidden"}
      exit="hidden"
      variants={variants}
      transition={{
        delay: reduced ? 0 : delay,
        duration: reduced ? 0 : duration,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
