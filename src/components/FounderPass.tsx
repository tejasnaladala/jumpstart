"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { FounderCard } from "@/lib/types";
import { StampSeal } from "@/components/primitive/StampSeal";

type Props = {
  card: FounderCard;
  cohort?: string;
  venue?: string;
  className?: string;
  tilt?: boolean;
};

// Ticket shape path (matches the YC SS 2026 admit-one geometry):
// rounded rect (rx=20) with two real circular cutouts (r=14) at x=86%
// of width, top and bottom edges. fill-rule="evenodd" makes the circles
// punch out of the outer shape so the cream page color shows through
// the notches, exactly like the reference admit ticket.
//
// The shape stays. What changes per the user's direction:
//   - Toned-down orange (accent-soft cream-tinted bg, not full accent)
//   - Single accent edge stripe on the left as identity, not full flood
//   - "Y Combinator presents" line removed
//   - "Admit One" rotated stub removed; the right ~14% past the
//     perforation now carries a small "Verified" stamp seal instead
//   - Content highlight is name + the four founder card lines
const VIEW_W = 720;
const VIEW_H = 480;
const CUTOUT_X_PCT = 86;
const CUTOUT_R = 14;
const CUTOUT_X = (VIEW_W * CUTOUT_X_PCT) / 100;
// SVG path is built via array.join(" ") rather than `+`-concatenated
// template literals. The previous `+` form triggered an SWC build-time
// constant-folding bug that dropped the trailing static segment of any
// template literal whose final static ended in whitespace, producing
// a 175-char path on the wire vs the 201-char source intent. Browser
// then fired `<path> attribute d: Expected number, "...a14,14 0 1,1
// -28M605.2,480..."` on every Pass render. Repro at
// harness/scripts/repro-swc-bug.ts. The .join() call is opaque to the
// constant evaluator, so the path round-trips intact through the build.
const TICKET_PATH = [
  `M20,0 H${VIEW_W - 20} A20,20 0 0 1 ${VIEW_W},20 V${VIEW_H - 20} A20,20 0 0 1 ${VIEW_W - 20},${VIEW_H}`,
  `H20 A20,20 0 0 1 0,${VIEW_H - 20} V20 A20,20 0 0 1 20,0 Z`,
  `M${CUTOUT_X - CUTOUT_R},0 a${CUTOUT_R},${CUTOUT_R} 0 1,1 ${CUTOUT_R * 2},0 a${CUTOUT_R},${CUTOUT_R} 0 1,1 -${CUTOUT_R * 2},0 Z`,
  `M${CUTOUT_X - CUTOUT_R},${VIEW_H} a${CUTOUT_R},${CUTOUT_R} 0 1,1 ${CUTOUT_R * 2},0 a${CUTOUT_R},${CUTOUT_R} 0 1,1 -${CUTOUT_R * 2},0 Z`,
].join(" ");

export function FounderPass({
  card,
  cohort = "Startup School 2026",
  venue = "Chase Center, SF · July 25-26",
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
    setTilts({ x: -py * 2.5, y: px * 3.5, lift: 4 });
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

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn("relative w-full max-w-[720px] mx-auto", className)}
      style={{
        perspective: "1200px",
        // drop-shadow respects the SVG silhouette so the shadow follows
        // the perforated edge, not a rectangle bounding box
        filter:
          tilts.lift > 0
            ? "drop-shadow(0 14px 24px rgba(31,26,17,0.18)) drop-shadow(0 3px 6px rgba(31,26,17,0.06))"
            : "drop-shadow(0 6px 12px rgba(31,26,17,0.10)) drop-shadow(0 1px 2px rgba(31,26,17,0.04))",
        transition: "filter 360ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <div
        className="relative"
        style={{
          // No fixed aspectRatio: let the four founder lines + tags +
          // public_link + venue determine the natural height. The SVG
          // ticket shape stretches to match via preserveAspectRatio="none";
          // the cutout circles get a tiny vertical squash but at r=14
          // it's not perceptible. Closes the /you overflow issue where
          // a fixed 720/480 box clipped the content.
          minHeight: 0,
          transform: `rotateX(${tilts.x}deg) rotateY(${tilts.y}deg) translateZ(${tilts.lift}px)`,
          transition: "transform 360ms cubic-bezier(0.22, 1, 0.36, 1)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Background SVG: ticket shape with real cutouts via fill-rule
            evenodd. Layered fills (accent-soft bg + warm tint + grain)
            all clipped to the same path so the cutouts punch through
            cleanly. */}
        <svg
          aria-hidden
          className="absolute inset-0 w-full h-full"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="none"
        >
          <defs>
            {/* Soft warm wash from upper-left to lower-right so the cream
                has dimensional warmth rather than flat color. */}
            <linearGradient id="pass-warm-wash" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFF0E9" stopOpacity="0" />
              <stop offset="60%" stopColor="#FFE5D0" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#FFD5B4" stopOpacity="0.3" />
            </linearGradient>
            <clipPath id="pass-clip" clipPathUnits="userSpaceOnUse">
              <path d={TICKET_PATH} />
            </clipPath>
            <filter id="pass-grain">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch" />
              <feColorMatrix
                values="0 0 0 0 0.18  0 0 0 0 0.14  0 0 0 0 0.07  0 0 0 0.4 0"
              />
            </filter>
          </defs>

          {/* Toned-down base: accent-soft cream-with-warm-tint, NOT the
              loud orange field of the original. */}
          <path d={TICKET_PATH} fillRule="evenodd" fill="#FFF0E9" />

          <g clipPath="url(#pass-clip)">
            <rect width={VIEW_W} height={VIEW_H} fill="url(#pass-warm-wash)" />
            <rect
              width={VIEW_W}
              height={VIEW_H}
              filter="url(#pass-grain)"
              opacity="0.18"
              style={{ mixBlendMode: "multiply" }}
            />
          </g>
        </svg>

        {/* HTML content in normal flow on top of the SVG ticket. The flex
            row splits into a 86% body + 14% stub area matching the SVG
            cutout x-position so the perforation falls between them. */}
        <div className="relative flex">
          {/* Main body */}
          <div
            className="min-w-0 flex flex-col text-ink"
            style={{ width: `${CUTOUT_X_PCT}%` }}
          >
            <div className="relative pl-6 pr-5 sm:pl-9 sm:pr-7 py-6 sm:py-8">
              {/* Single accent left edge stripe - the only loud orange */}
              <div
                aria-hidden
                className="absolute left-0 top-6 bottom-6 w-[4px] rounded-full bg-accent"
              />

              {/* Top serial: cohort + No. 001. Mono caps, discrete. */}
              <div className="flex items-baseline justify-between gap-3 mb-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                  {cohort}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted opacity-70">
                  No. 001
                </span>
              </div>

              {/* HERO: name + location */}
              <div className="mb-4">
                <h2 className="font-display text-3xl sm:text-4xl text-ink leading-[0.98] tracking-[-0.01em] break-words">
                  {card.name}
                </h2>
                <p className="font-mono text-[11px] sm:text-[12px] uppercase tracking-[0.18em] mt-2 text-muted">
                  {card.location}
                </p>
              </div>

              <div aria-hidden className="h-px w-12 bg-accent mb-4" />

              {/* Four founder card lines, vertical stack. The HIGHLIGHT. */}
              <div className="flex flex-col gap-3">
                {lines.map((line, i) => (
                  <div key={line.label} className="flex gap-3 items-baseline">
                    <span className="font-mono text-[10px] font-bold text-accent w-6 shrink-0 tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.18em] font-semibold text-muted mb-0.5">
                        {line.label}
                      </p>
                      <p className="text-[12px] sm:text-[13px] leading-snug text-ink">
                        {line.body || (
                          <span className="italic text-muted/60">Not set yet.</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tags + public link + venue */}
              <div className="mt-5 pt-3 border-t border-accent-edge/25">
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  {card.tags.slice(0, 6).map((tag) => (
                    <span
                      key={tag}
                      className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 rounded-full border border-accent-edge/40 text-muted bg-bg/40"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                {card.public_link ? (
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted mb-1">
                    <span className="opacity-60">Find me /</span>{" "}
                    <a
                      href={
                        card.public_link.startsWith("http")
                          ? card.public_link
                          : `https://${card.public_link}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink hover:text-accent transition-colors"
                    >
                      {card.public_link.replace(/^https?:\/\//, "")}
                    </a>
                  </p>
                ) : null}
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                  {venue}
                </p>
              </div>
            </div>
          </div>

          {/* Right stub past the perforation. Used to be ADMIT ONE; now
              carries a small Verified stamp seal so the perforation has
              meaning beyond decoration. */}
          <div
            className="relative flex flex-col items-center justify-center gap-3 px-2 py-6 overflow-hidden min-w-0"
            style={{ width: `${100 - CUTOUT_X_PCT}%` }}
          >
            <StampSeal
              topLabel={
                card.trust_tier === "verified"
                  ? "Verified"
                  : card.trust_tier === "peer_vouched"
                  ? "Vouched"
                  : "Pending"
              }
              bottomLabel="SS 2026"
              ariaLabel={`${
                card.trust_tier === "verified"
                  ? "Verified"
                  : card.trust_tier === "peer_vouched"
                  ? "Peer vouched"
                  : "Provisional"
              } attendee, Startup School 2026`}
              size={56}
              rotate={-6}
              className={
                card.trust_tier === "provisional"
                  ? "text-muted shrink-0"
                  : "text-accent shrink-0"
              }
            />
          </div>

          {/* Perforated dotted divider at the cutout x-position */}
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              top: "22px",
              bottom: "22px",
              left: `${CUTOUT_X_PCT}%`,
              transform: "translateX(-0.5px)",
              width: "1px",
              backgroundImage:
                "repeating-linear-gradient(to bottom, rgba(31,26,17,0.32) 0 3px, transparent 3px 7px)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
