"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Heavy client component (d3-geo + topojson + canvas). Defer to client-side
// fetch + hydration so the landing page first paint isn't held by the globe's
// 200KB+ of geo libraries. The placeholder reserves the layout slot to
// prevent any CLS while the chunk loads.

const CohortGlobe = dynamic(
  () => import("./CohortGlobe").then((m) => ({ default: m.CohortGlobe })),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden
        className="rounded-full border border-accent-edge/30 bg-accent-soft/40"
        style={{ width: "min(420px, calc(100vw - 64px))", aspectRatio: "1 / 1" }}
      />
    ),
  }
);

type Props = { size?: number };

// Responsive wrapper. Picks the smaller of the requested size or the
// viewport-minus-gutter so the globe never overflows on mobile. Closes the
// audit finding "globe canvas at 420px square overflows 375 viewport".
export function GlobeLazy({ size = 420 }: Props) {
  const [actual, setActual] = useState(size);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const compute = () => {
      const max = Math.max(240, Math.min(size, window.innerWidth - 64));
      setActual(max);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [size]);
  return <CohortGlobe size={actual} />;
}
