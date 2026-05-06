"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
};

// Section-level scroll reveal. Cinematic: 12-16 px upward fade with a slow
// cubic-out so it reads as deliberate, not snappy. Use sparingly: the goal
// is to mark the entrance of a major section, not to animate every line.
//
// Tuning notes (post-feedback): duration extended 500ms -> 720ms, ease
// softened to expoOut for a slow trail-off. Initial offset trimmed to 12px
// so the motion is felt, not seen.
export function Reveal({
  children,
  className,
  delay = 0,
  y = 12,
  once = true,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-8% 0px -4% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y, filter: "blur(2px)" }}
      animate={
        inView
          ? { opacity: 1, y: 0, filter: "blur(0px)" }
          : { opacity: 0, y, filter: "blur(2px)" }
      }
      transition={{
        duration: 0.72,
        ease: [0.22, 1, 0.36, 1],
        delay,
        opacity: { duration: 0.6, delay },
        filter: { duration: 0.5, delay },
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
