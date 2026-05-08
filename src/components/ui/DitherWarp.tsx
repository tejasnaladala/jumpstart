"use client";
import { lazy, Suspense } from "react";

// DitherWarp — orange-tinted dithered warping pattern. Wraps the Paper
// Design `Dithering` shader for the YC SS palette. Used as a subtle
// backdrop layer behind featured cards and the closing CTA so the
// surfaces read as "computed" rather than flat espresso/cream.
//
// Lazy-loaded because @paper-design/shaders-react ships a fair chunk
// of WebGL plumbing — no need to inflate the initial bundle when it's
// only used in two below-the-fold spots.

const Dithering = lazy(() =>
  import("@paper-design/shaders-react").then((mod) => ({
    default: mod.Dithering,
  }))
);

type Props = {
  // Foreground tint of the dithered pattern. Defaults to YC orange.
  colorFront?: string;
  // Background — usually transparent so the layer below shows through.
  colorBack?: string;
  // Animation speed. 0.2-0.6 reads as ambient texture; >1 is hectic.
  speed?: number;
  // Tailwind class string for the wrapper.
  className?: string;
  // Pixel size of the dither grid. 4x4 is the editorial choice; 2x2
  // looks too crisp, 8x8 reads as low-fi pixelation.
  type?: "2x2" | "4x4" | "8x8";
  // Shape preset — "warp" is the swirling pattern. Available shapes
  // come from @paper-design/shaders-react Dithering API.
  shape?: "warp" | "ripple" | "swirl" | "sphere" | "simplex" | "dots" | "wave";
};

export function DitherWarp({
  colorFront = "#E85A1B",
  colorBack = "#00000000",
  speed = 0.25,
  className,
  type = "4x4",
  shape = "warp",
}: Props): React.JSX.Element {
  return (
    <Suspense fallback={<div className="absolute inset-0" />}>
      <div className={"absolute inset-0 pointer-events-none " + (className || "")}>
        <Dithering
          colorFront={colorFront}
          colorBack={colorBack}
          shape={shape}
          type={type}
          speed={speed}
          className="size-full"
          minPixelRatio={1}
        />
      </div>
    </Suspense>
  );
}
