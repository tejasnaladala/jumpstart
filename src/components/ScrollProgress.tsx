"use client";
import { motion, useScroll, useSpring } from "framer-motion";

// 2px reading-progress bar pinned to the very top of the viewport, accent
// color. Lifted from motion-primitives (MIT). Respects scroll-bound
// nature; no IntersectionObserver. Sits ABOVE the GlassNav so the
// progress is visible against any nav background state.

export function ScrollProgress(): React.JSX.Element {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden
      className="fixed top-0 left-0 right-0 z-40 h-[2px] origin-left bg-accent"
      style={{ scaleX }}
    />
  );
}
