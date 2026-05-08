"use client";
import { useEffect, useState } from "react";

// Subtle cursor-follow radial gradient for the hero only. Desktop only
// (md+ breakpoint check via matchMedia). Throttled with requestAnimation-
// Frame so it costs ~zero CPU. Honors prefers-reduced-motion (no glow).
//
// The glow is positioned `fixed` and uses `pointer-events-none` so it
// never intercepts clicks. Color is the accent at low opacity, so it
// reads as warmth rather than a tracker dot.

export function CursorGlow(): React.JSX.Element | null {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mqDesktop = window.matchMedia("(min-width: 1024px)");
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!mqDesktop.matches || mqReduce.matches) return;

    setActive(true);
    let raf = 0;
    const onMove = (e: PointerEvent): void => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setPos({ x: e.clientX, y: e.clientY });
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!active || !pos) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[5] hidden lg:block"
      style={{
        background: `radial-gradient(420px circle at ${pos.x}px ${pos.y}px, rgba(255,102,0,0.07), transparent 50%)`,
      }}
    />
  );
}
