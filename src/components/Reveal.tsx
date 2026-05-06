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

// Section-level scroll reveal. Subtle: 8 to 16 px upward fade with a
// cubic ease. Use sparingly; the goal is to mark the entrance of a major
// section, not to animate every paragraph.
export function Reveal({
  children,
  className,
  delay = 0,
  y = 16,
  once = true,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-10% 0px -5% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
