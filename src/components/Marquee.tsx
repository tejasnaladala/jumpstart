"use client";
import { cn } from "@/lib/utils";

type Props = {
  items: string[];
  speedSec?: number;
  className?: string;
  variant?: "espresso" | "cream" | "accent";
};

// Continuous horizontal scroll, like the YC Startup School 2026 footer band.
// Triple-renders the items so the scroll loops seamlessly. CSS-only, GPU
// accelerated via transform: translateX. Honors prefers-reduced-motion via
// the global guard in globals.css.
export function Marquee({ items, speedSec = 32, className, variant = "espresso" }: Props) {
  const trio = [...items, ...items, ...items];

  const palette =
    variant === "espresso"
      ? "bg-espresso text-bg border-y border-espresso-warm"
      : variant === "accent"
      ? "bg-accent text-bg border-y border-accent-edge"
      : "bg-bg text-ink border-y border-border";

  return (
    <div
      className={cn(
        "relative overflow-hidden select-none",
        palette,
        className
      )}
      aria-hidden
    >
      <div
        className="flex whitespace-nowrap will-change-transform animate-[marquee_var(--marquee-speed)_linear_infinite]"
        style={{ ["--marquee-speed" as string]: `${speedSec}s` }}
      >
        {trio.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-6 px-6 py-3 font-mono text-xs uppercase tracking-[0.18em]"
          >
            <span>{item}</span>
            <span aria-hidden className="text-current/60">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
