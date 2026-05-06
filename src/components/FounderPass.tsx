"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { FounderCard } from "@/lib/types";

type Props = {
  card: FounderCard;
  cohort?: string;
  venue?: string;
  serial?: string;
  className?: string;
  tilt?: boolean;
  // When false, render only the identity face (matches the reference YC
  // ticket exactly - cohort meta + name + location + venue, no card lines).
  showCardLines?: boolean;
};

// Ticket shape path. ViewBox 640x400. Rounded rect (rx=20) with two
// circular cutouts (r=14) at x=540 (84% of 640), positioned at top edge
// (y=0) and bottom edge (y=400). fill-rule="evenodd" makes the circles
// punch out of the outer shape since they're inside the rect's wind.
const TICKET_PATH =
  "M20,0 H620 A20,20 0 0 1 640,20 V380 A20,20 0 0 1 620,400 H20 A20,20 0 0 1 0,380 V20 A20,20 0 0 1 20,0 Z " +
  "M526,0 a14,14 0 1,1 28,0 a14,14 0 1,1 -28,0 Z " +
  "M526,400 a14,14 0 1,1 28,0 a14,14 0 1,1 -28,0 Z";

// Editorial founder ticket. Modeled on the YC Startup School 2026 admit
// ticket: solid orange field, soft cream bloom in upper-right, grain
// texture, perforated stub on the right with rotated "Admit One" and a
// faded "2026" behind it. Real shape cutouts via SVG path with
// fill-rule="evenodd" so the perforation circles are part of the ticket
// geometry, not overlaid white circles.
//
// The Pass IS the Founder Card - one merged identity object. The face
// carries cohort meta, name, location, the four founder-card lines as
// numbered editorial entries, the founder's tags, and the venue.
//
// Honors prefers-reduced-motion (no 3D tilt). Drop-shadow filter respects
// the SVG shape so the shadow follows the perforated edge.
export function FounderPass({
  card,
  cohort = "Startup School 2026",
  venue = "Chase Center, SF · July 25-26",
  serial = "No. 001",
  className,
  tilt = true,
  showCardLines = true,
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

  const lines = [
    { label: "Building", body: card.building_summary },
    { label: "Looking for", body: card.looking_for },
    { label: "Can help with", body: card.can_help_with },
    { label: "Talk to me if", body: card.talk_to_me_if },
  ];

  // Aspect: 5:3 with the four lines on the face, 640:380 (~ref) without.
  const aspect = showCardLines ? "640 / 400" : "640 / 380";

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn("relative w-full max-w-[680px] mx-auto", className)}
      style={{ perspective: "1200px" }}
    >
      <div
        className="relative"
        style={{
          aspectRatio: aspect,
          transform: `rotateX(${tilts.x}deg) rotateY(${tilts.y}deg) translateZ(${tilts.lift}px)`,
          transition: "transform 360ms cubic-bezier(0.22, 1, 0.36, 1), filter 360ms ease",
          transformStyle: "preserve-3d",
          // drop-shadow respects the SVG path silhouette so the shadow
          // follows the perforated edge and rounded corners cleanly
          filter:
            tilts.lift > 0
              ? "drop-shadow(0 18px 28px rgba(31,26,17,0.30)) drop-shadow(0 4px 6px rgba(31,26,17,0.10))"
              : "drop-shadow(0 8px 14px rgba(31,26,17,0.18)) drop-shadow(0 2px 3px rgba(31,26,17,0.06))",
        }}
      >
        {/* Background SVG: ticket shape + bloom + grain + warmth, all
            rendered as SVG so they share the path geometry. */}
        <svg
          aria-hidden
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 640 400"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Cream bloom in upper-right */}
            <radialGradient id="pass-bloom" cx="0.72" cy="0.38" r="0.42" gradientUnits="objectBoundingBox">
              <stop offset="0%" stopColor="#F4F1DB" stopOpacity="0.92" />
              <stop offset="35%" stopColor="#F4F1DB" stopOpacity="0.4" />
              <stop offset="80%" stopColor="#F4F1DB" stopOpacity="0" />
            </radialGradient>
            {/* Secondary warm glow lower-right */}
            <radialGradient id="pass-warm" cx="0.85" cy="0.85" r="0.3" gradientUnits="objectBoundingBox">
              <stop offset="0%" stopColor="#FFD5B4" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#FFD5B4" stopOpacity="0" />
            </radialGradient>
            {/* Diagonal warmth wash */}
            <linearGradient id="pass-warmth" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FB651E" stopOpacity="0" />
              <stop offset="60%" stopColor="#FB651E" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#FB651E" stopOpacity="0.22" />
            </linearGradient>
            {/* Grain via fractal noise filter */}
            <filter id="pass-grain" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch" />
              <feColorMatrix
                values="0 0 0 0 0.18  0 0 0 0 0.14  0 0 0 0 0.07  0 0 0 0.6 0"
              />
            </filter>
            {/* Clip path so the bloom/warmth/grain rects clip to ticket shape */}
            <clipPath id="pass-clip" clipPathUnits="userSpaceOnUse">
              <path d={TICKET_PATH} />
            </clipPath>
          </defs>

          {/* Solid orange ticket with real shape cutouts */}
          <path d={TICKET_PATH} fillRule="evenodd" fill="#FF6600" />

          {/* Layered fills, all clipped to ticket shape */}
          <g clipPath="url(#pass-clip)">
            <rect width="640" height="400" fill="url(#pass-warmth)" />
            <rect width="640" height="400" fill="url(#pass-warm)" />
            <rect width="640" height="400" fill="url(#pass-bloom)" />
            {/* Grain layered with multiply blend via opacity */}
            <rect
              width="640"
              height="400"
              filter="url(#pass-grain)"
              opacity="0.38"
              style={{ mixBlendMode: "multiply" }}
            />
          </g>
        </svg>

        {/* HTML content layered absolutely. The content is sized to leave
            the rightmost ~16% (stub area) for the rotated ADMIT ONE, with
            the cutouts living at 84% of width. The content stays inside
            the safe zone so it never overlaps a cutout. */}
        <div className="absolute inset-0 flex pointer-events-none">
          {/* Main body - flex 84 (matches cutout x=84%) */}
          <div
            className="min-w-0 p-5 sm:p-7 flex flex-col gap-3 sm:gap-4 text-espresso-deep"
            style={{ flex: "84 1 0%" }}
          >
            {/* Top serial bar: cohort meta + serial */}
            <div className="flex items-baseline justify-between gap-3">
              <div className="font-mono text-[9px] sm:text-[11px] uppercase tracking-[0.18em] leading-[1.7] opacity-90">
                <p>Y Combinator presents</p>
                <p className="font-semibold">{cohort}</p>
              </div>
              <span className="font-mono text-[9px] sm:text-[11px] uppercase tracking-[0.18em] opacity-70">
                {serial}
              </span>
            </div>

            {/* Hero: name + location */}
            <div>
              <h2 className="font-sans font-bold text-xl sm:text-3xl uppercase leading-[0.95] tracking-[-0.015em] break-words">
                {card.name}
              </h2>
              <p className="font-mono text-[9px] sm:text-[11px] uppercase tracking-[0.16em] mt-1.5 opacity-85">
                {card.location}
              </p>
            </div>

            {showCardLines ? (
              <>
                <div aria-hidden className="h-px w-10 bg-espresso-deep/40" />

                {/* Four-line founder card grid. Each body line-clamped to 2
                    so the grid stays compact and never crowds the venue row. */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2.5">
                  {lines.map((line, i) => (
                    <div key={line.label} className="min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-[9px] font-bold opacity-65">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.18em] font-semibold opacity-85">
                          {line.label}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11.5px] leading-snug mt-0.5 line-clamp-2 opacity-95">
                        {line.body}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Bottom: venue on its own row, tags on the row above. Spaced
                    via mt-auto + gap-1.5 so the layout breathes. */}
                <div className="mt-auto flex flex-col gap-2">
                  <div className="flex items-center gap-1 flex-wrap">
                    {card.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-full border border-espresso-deep/35 opacity-90"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="font-mono text-[9px] sm:text-[10.5px] uppercase tracking-[0.18em] opacity-90 font-semibold">
                    {venue}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex-1" />
                <div className="font-mono text-[9px] sm:text-[11px] uppercase tracking-[0.18em] opacity-90 font-semibold">
                  {venue}
                </div>
              </>
            )}
          </div>

          {/* Stub - flex 16 (the remaining ~16% past the cutouts).
              "2026" is the faded watermark behind. "Admit One" is the
              crisp bold label in front. Reference ticket has the year
              very faded (~12% opacity) so the label reads clean. */}
          <div
            className="relative flex items-center justify-center overflow-hidden min-w-0"
            style={{ flex: "16 1 0%" }}
          >
            <span
              aria-hidden
              className="absolute font-sans font-bold select-none leading-none"
              style={{
                fontSize: "clamp(70px, 13vw, 130px)",
                transform: "rotate(90deg)",
                letterSpacing: "-0.045em",
                color: "rgba(31, 26, 17, 0.13)",
              }}
            >
              2026
            </span>
            <p
              className="relative z-10 font-sans font-bold text-espresso-deep uppercase whitespace-nowrap"
              style={{
                transform: "rotate(90deg)",
                fontSize: "clamp(11px, 1.6vw, 17px)",
                letterSpacing: "0.34em",
              }}
            >
              Admit One
            </p>
          </div>
        </div>

        {/* Perforated dotted divider running between the two cutouts at 84% */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: "20px",
            bottom: "20px",
            left: "84%",
            transform: "translateX(-0.5px)",
            width: "1px",
            backgroundImage:
              "repeating-linear-gradient(to bottom, rgba(31,26,17,0.42) 0 3px, transparent 3px 7px)",
          }}
        />
      </div>
    </div>
  );
}
