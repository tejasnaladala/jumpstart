"use client";
import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

type Variant = "md" | "lg";
type Tone = "ink" | "cream";

type Props = {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  // 0..1, how strongly the cursor pulls the button toward itself.
  // Default 0.06: barely-perceptible nudge, no wobble. Past ~0.12 it starts
  // to feel rubbery and disorienting on small buttons.
  intensity?: number;
  variant?: Variant;
  // Color treatment. Default `ink` is for cream backgrounds; `cream` is the
  // inverted treatment for dark espresso surfaces (CTA block, footer-strip).
  tone?: Tone;
};

// Subtle magnetic CTA. The button translates a few px toward the cursor only
// when the cursor is within a tightened proximity radius (so the button does
// not begin tracking from across the page). Eases back when the cursor leaves.
// Honors prefers-reduced-motion (becomes a flat button with no translation).
//
// Tuning notes (post-feedback): intensity halved from 0.18 → 0.06, transition
// duration extended 280ms → 420ms, easing softened to a slower glide. The
// magnetic field clamps at 8px max travel so the button cannot drift far enough
// to feel like it is "wobbling."
export function MagneticButton({
  children,
  href,
  onClick,
  className,
  intensity = 0.06,
  variant = "lg",
  tone = "ink",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("translate3d(0,0,0)");
  const reducedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
  }, []);

  function onMove(e: React.MouseEvent) {
    if (reducedRef.current) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    // Clamp travel so the button glides, never drifts. 8px is the max
    // perceptible nudge before it starts to feel rubbery.
    const tx = Math.max(-8, Math.min(8, x * intensity));
    const ty = Math.max(-8, Math.min(8, y * intensity));
    setTransform(`translate3d(${tx}px, ${ty}px, 0)`);
  }
  function onLeave() {
    setTransform("translate3d(0, 0, 0)");
  }

  const sizeClass = variant === "lg" ? "h-12 px-6 text-base" : "h-10 px-5 text-sm";
  const toneClass =
    tone === "cream"
      ? "bg-bg text-ink hover:bg-surface"
      : "bg-ink text-bg hover:bg-espresso";

  const inner = (
    <span
      style={{
        transform,
        transition: "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
        willChange: "transform",
      }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium",
        "shadow-card hover:shadow-hover transition-colors",
        sizeClass,
        toneClass,
        className
      )}
    >
      {children}
    </span>
  );

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className="inline-block">
      {href ? (
        <a href={href}>{inner}</a>
      ) : (
        <button onClick={onClick} type="button" className="bg-transparent border-0 p-0">
          {inner}
        </button>
      )}
    </div>
  );
}
