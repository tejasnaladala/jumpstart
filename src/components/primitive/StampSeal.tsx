import { useId } from "react";
import { cn } from "@/lib/utils";

type Props = {
  // Two short lines of text shown inside the seal. Mono uppercase.
  // Defaults: VERIFIED / SS 2026.
  topLabel?: string;
  bottomLabel?: string;
  // Accessible label read by screen readers. Override when the visual
  // labels include initialisms ("SS 2026") that read as letters by
  // default. Defaults to a spoken-friendly expansion of the visual
  // labels. Closes Fool a11y finding.
  ariaLabel?: string;
  // Center glyph (default: a small star). Pass null for no glyph.
  glyph?: React.ReactNode | null;
  size?: number;
  rotate?: number;
  className?: string;
};

// Ink-stamp seal. Pattern lifted from huashu-design (Chinese editorial
// seal motif): a circular ink mark with two text rings and a center
// glyph. Used here for the Verified attendee badge and other authenticity
// marks. Renders as a single SVG so it scales cleanly and can be tinted
// via CSS color.
export function StampSeal({
  topLabel = "Verified",
  bottomLabel = "SS 2026",
  ariaLabel,
  glyph,
  size = 88,
  rotate = -8,
  className,
}: Props) {
  // textPath needs a path; we draw two arcs (top half + bottom half)
  // along which the labels are laid. IDs come from React's useId() so
  // every instance has a unique pair, even when two identical-prop seals
  // render on the same page (closes Codex M4).
  const reactId = useId();
  const topId = `seal-top-${reactId.replace(/[^a-zA-Z0-9]/g, "_")}`;
  const bottomId = `seal-bot-${reactId.replace(/[^a-zA-Z0-9]/g, "_")}`;

  // Default a11y label that expands SS to "Startup School" so screen
  // readers say "Verified attendee, Startup School 2026" instead of
  // spelling out "S S 2 0 2 6".
  const computedAriaLabel =
    ariaLabel ||
    (topLabel === "Verified" && bottomLabel === "SS 2026"
      ? "Verified attendee, Startup School 2026"
      : `${topLabel} ${bottomLabel}`);

  return (
    <span
      className={cn("inline-block text-stamp", className)}
      style={{
        width: size,
        height: size,
        transform: `rotate(${rotate}deg)`,
        transformOrigin: "center",
      }}
      aria-label={computedAriaLabel}
      role="img"
    >
      <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          {/* Top label arc: from 200,50 sweeping clockwise to 80,50 along
              a radius of 38, so the text reads left-to-right across the top */}
          <path
            id={topId}
            d="M 12,50 A 38,38 0 0 1 88,50"
            fill="none"
          />
          <path
            id={bottomId}
            d="M 88,50 A 38,38 0 0 1 12,50"
            fill="none"
          />
        </defs>

        {/* Outer ring */}
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        {/* Inner ring */}
        <circle
          cx="50"
          cy="50"
          r="38"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
        />

        {/* Top label text along the arc */}
        <text
          fontFamily="var(--font-mono), ui-monospace, monospace"
          fontSize="8"
          fontWeight="700"
          letterSpacing="2"
          fill="currentColor"
          style={{ textTransform: "uppercase" }}
        >
          <textPath href={`#${topId}`} startOffset="50%" textAnchor="middle">
            {topLabel}
          </textPath>
        </text>

        {/* Bottom label text along the arc */}
        <text
          fontFamily="var(--font-mono), ui-monospace, monospace"
          fontSize="7"
          fontWeight="700"
          letterSpacing="2"
          fill="currentColor"
          style={{ textTransform: "uppercase" }}
        >
          <textPath href={`#${bottomId}`} startOffset="50%" textAnchor="middle">
            {bottomLabel}
          </textPath>
        </text>

        {/* Center glyph (default star), can be replaced */}
        {glyph === null ? null : glyph || (
          <g>
            <path
              d="M 50,32 L 53,42 L 64,42 L 55,49 L 58,60 L 50,53 L 42,60 L 45,49 L 36,42 L 47,42 Z"
              fill="currentColor"
              opacity="0.85"
            />
          </g>
        )}
      </svg>
    </span>
  );
}
