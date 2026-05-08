"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
  // The big word or short phrase to use as image. Will render in display
  // serif italic at scale.
  text: string;
  className?: string;
  // Visual treatment.
  // "outline" renders only the SVG stroke (huashu-design type-as-image
  // pattern: a hollowed-out display word used as decoration). "filled" is
  // the standard solid italic.
  variant?: "outline" | "filled";
  // Vertical position of the kicker text. Mono caps either above or below
  // the word.
  kicker?: string;
  kickerPosition?: "top" | "bottom";
  // Color tone. "ink" for cream surfaces, "cream" for espresso surfaces.
  tone?: "ink" | "cream";
};

// Decorative type-as-image break. Pattern from huashu-design (Chinese
// editorial vertical rhythm using a single oversized word as visual punctuation
// between sections). Used sparingly: one or two per page max, between major
// thematic sections, never inside content blocks. Reveals on scroll with the
// same Reveal cubic-out so it lands as a moment.
//
// "Outline" variant produces a hollow display-serif word with just stroke,
// giving it the carved-into-stone editorial feel that huashu-design uses for
// big chapter words.
export function TypeAsImage({
  text,
  className,
  variant = "outline",
  kicker,
  kickerPosition = "top",
  tone = "ink",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });

  const strokeColor = tone === "cream" ? "#F4F1DB" : "#16140F";
  const fillColor = tone === "cream" ? "#F4F1DB" : "#E85A1B";
  const kickerColor = tone === "cream" ? "text-bg/70" : "text-muted";

  return (
    <div
      ref={ref}
      className={cn(
        "relative w-full select-none flex flex-col items-center gap-3",
        className
      )}
    >
      {kicker && kickerPosition === "top" ? (
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "font-mono text-[11px] uppercase tracking-[0.24em]",
            kickerColor
          )}
        >
          {kicker}
        </motion.span>
      ) : null}

      <motion.div
        initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
        animate={
          inView
            ? { opacity: 1, y: 0, filter: "blur(0px)" }
            : { opacity: 0, y: 16, filter: "blur(8px)" }
        }
        transition={{
          duration: 1.1,
          ease: [0.22, 1, 0.36, 1],
          delay: kicker && kickerPosition === "top" ? 0.15 : 0,
        }}
        className="w-full flex justify-center"
      >
        {variant === "outline" ? (
          <span
            className="font-display italic text-[clamp(80px,18vw,260px)] leading-[0.9] tracking-[-0.02em]"
            style={{
              WebkitTextStroke: `1px ${strokeColor}`,
              color: "transparent",
            }}
          >
            {text}.
          </span>
        ) : (
          <span
            className="font-display italic text-[clamp(80px,18vw,260px)] leading-[0.9] tracking-[-0.02em]"
            style={{ color: fillColor }}
          >
            {text}.
          </span>
        )}
      </motion.div>

      {kicker && kickerPosition === "bottom" ? (
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
          className={cn(
            "font-mono text-[11px] uppercase tracking-[0.24em]",
            kickerColor
          )}
        >
          {kicker}
        </motion.span>
      ) : null}
    </div>
  );
}
