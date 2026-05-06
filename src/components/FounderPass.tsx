"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  cohort?: string;
  venue?: string;
  // Tailwind class for the cutout circles. Must match the parent container's
  // background so the notches "punch through" cleanly. Default `bg-bg` works
  // on every cream-page surface (landing, /you, /onboarding/card success).
  cutoutColor?: string;
  className?: string;
  tilt?: boolean;
};

// Editorial founder ticket. Modeled on the YC Startup School 2026 admit ticket
// (orange field, grain, cream bloom in upper-right, perforated stub with
// rotated "Admit One"). Subtle 3D tilt on cursor hover, honors
// prefers-reduced-motion.
//
// Place on cream backgrounds (default cutout color is bg-bg). For dark
// surfaces, pass `cutoutColor="bg-espresso"` etc.
export function FounderPass({
  name,
  cohort = "Startup School 2026",
  venue = "Chase Center, SF · July 25-26",
  cutoutColor = "bg-bg",
  className,
  tilt = true,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilts, setTilts] = useState({ x: 0, y: 0, lift: 0 });
  const reducedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
  }, []);

  function onMove(e: React.MouseEvent) {
    if (!tilt || reducedRef.current) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilts({ x: -py * 4.5, y: px * 6, lift: 6 });
  }
  function onLeave() {
    setTilts({ x: 0, y: 0, lift: 0 });
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn("relative w-full max-w-[640px] mx-auto", className)}
      style={{ perspective: "1000px" }}
    >
      <div
        className="relative aspect-[2/1.18] rounded-[20px] bg-accent shadow-card overflow-hidden"
        style={{
          transform: `rotateX(${tilts.x}deg) rotateY(${tilts.y}deg) translateZ(${tilts.lift}px)`,
          transition: "transform 360ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 360ms ease",
          transformStyle: "preserve-3d",
          boxShadow:
            tilts.lift > 0
              ? "0 18px 40px -12px rgba(31,26,17,0.35), 0 4px 8px rgba(31,26,17,0.08)"
              : "0 6px 18px -4px rgba(31,26,17,0.18), 0 1px 2px rgba(31,26,17,0.05)",
        }}
      >
        {/* Soft cream bloom in upper-right. The signature highlight on the
            reference ticket. Layered radial gradient with a heavy blur. */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: "-30%",
            right: "0%",
            width: "62%",
            height: "130%",
            background:
              "radial-gradient(ellipse 55% 55% at 60% 50%, rgba(244,241,219,0.92) 0%, rgba(244,241,219,0.45) 28%, rgba(244,241,219,0.12) 55%, rgba(244,241,219,0) 75%)",
            filter: "blur(6px)",
          }}
        />

        {/* Soft secondary glow lower-right for depth. */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            bottom: "-20%",
            right: "10%",
            width: "40%",
            height: "60%",
            background:
              "radial-gradient(ellipse at center, rgba(255,213,180,0.45) 0%, rgba(255,213,180,0) 70%)",
            filter: "blur(10px)",
          }}
        />

        {/* Grain texture. SVG fractal noise, multiplied over the orange so it
            reads like printed ticket stock. */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.40] mix-blend-multiply pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 320 320' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 0.18  0 0 0 0 0.14  0 0 0 0 0.07  0 0 0 0.6 0'/></filter><rect width='320' height='320' filter='url(%23n)'/></svg>\")",
            backgroundSize: "320px 320px",
          }}
        />

        {/* Subtle warmth wash to deepen the orange in the middle */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, rgba(251,101,30,0.0) 0%, rgba(251,101,30,0.15) 60%, rgba(251,101,30,0.25) 100%)",
          }}
        />

        {/* Content row: main ticket body + stub */}
        <div className="relative h-full flex">
          {/* Left main body */}
          <div className="flex-1 p-5 sm:p-8 flex flex-col justify-between text-espresso-deep min-w-0">
            <div className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.18em] leading-[1.7] opacity-90">
              <p>Y Combinator presents</p>
              <p className="font-semibold">{cohort}</p>
            </div>
            <h2 className="font-sans font-bold text-2xl sm:text-4xl uppercase leading-[0.92] tracking-[-0.015em] break-words">
              {name}
            </h2>
            <div className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.18em] opacity-90">
              {venue}
            </div>
          </div>

          {/* Right stub: ~22% width with rotated ADMIT ONE + faded year */}
          <div className="relative w-[22%] flex items-center justify-center overflow-hidden">
            <span
              aria-hidden
              className="absolute font-sans font-bold text-espresso-deep/20 select-none leading-none"
              style={{
                fontSize: "clamp(72px, 14vw, 120px)",
                transform: "rotate(90deg)",
                letterSpacing: "-0.04em",
              }}
            >
              2026
            </span>
            <p
              className="relative z-10 font-sans font-bold text-espresso-deep text-sm sm:text-lg uppercase tracking-[0.32em] whitespace-nowrap"
              style={{ transform: "rotate(90deg)" }}
            >
              Admit One
            </p>
          </div>
        </div>

        {/* Perforated dotted divider between body and stub */}
        <div
          aria-hidden
          className="absolute top-7 bottom-7 right-[22%] -translate-x-px"
          style={{
            width: "1px",
            backgroundImage:
              "repeating-linear-gradient(to bottom, rgba(31,26,17,0.34) 0 3px, transparent 3px 7px)",
          }}
        />
      </div>

      {/* Cutout circles: positioned outside the overflow:hidden ticket so they
          punch over the rounded corners. Their bg matches the parent surface. */}
      <div
        className={cn(
          "absolute right-[22%] -top-[10px] w-5 h-5 rounded-full -translate-x-1/2 z-10",
          cutoutColor
        )}
        aria-hidden
      />
      <div
        className={cn(
          "absolute right-[22%] -bottom-[10px] w-5 h-5 rounded-full -translate-x-1/2 z-10",
          cutoutColor
        )}
        aria-hidden
      />
    </div>
  );
}
