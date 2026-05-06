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
  intensity?: number;
  variant?: Variant;
  // Color treatment. Default `ink` is for cream backgrounds; `cream` is the
  // inverted treatment for dark espresso surfaces (CTA block, footer-strip).
  tone?: Tone;
};

// Subtle magnetic CTA. The button translates a few px toward the cursor when
// the cursor enters its bounding box, eases back when it leaves. Honors
// prefers-reduced-motion (becomes a flat button with no translation).
export function MagneticButton({
  children,
  href,
  onClick,
  className,
  intensity = 0.18,
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
    setTransform(`translate3d(${x * intensity}px, ${y * intensity}px, 0)`);
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
      style={{ transform, transition: "transform 280ms cubic-bezier(0.16,1,0.3,1)" }}
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
