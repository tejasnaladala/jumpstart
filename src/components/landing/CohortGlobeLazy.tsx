"use client";
import dynamic from "next/dynamic";

// Client-side wrapper around CohortGlobe so we can dynamic-import it
// with ssr:false. The page is a Server Component and Next 16 forbids
// ssr:false in server contexts. The globe is heavy (d3-geo + 60KB
// topojson fetch + 2D canvas rotation), so deferring it past the
// hero's initial paint keeps the LCP fast.

const CohortGlobeInner = dynamic(
  () => import("@/components/CohortGlobe").then((m) => ({ default: m.CohortGlobe })),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden
        className="w-full aspect-square max-w-[560px] mx-auto"
        style={{ minHeight: 300 }}
      />
    ),
  }
);

export function CohortGlobeLazy({ size = 560 }: { size?: number }): React.JSX.Element {
  return <CohortGlobeInner size={size} />;
}
