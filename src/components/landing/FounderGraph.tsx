"use client";
import { useEffect, useRef, useState } from "react";

// Founder-graph visualization for the hero. SVG with:
//  - 7-9 avatar nodes positioned in a deliberate composition
//  - Animated connection lines that draw on mount + pulse on a slow loop
//  - One "you" node center (accent ring), 6 candidate nodes around
//  - Hover on any node fades the others, shows a small bio chip
//
// Why SVG and not framer-motion canvas: SVG is text-selectable, screen-
// readable, and ~2KB instead of 40KB. The connection lines use stroke-
// dasharray/dashoffset CSS animation, no JS-driven physics.
//
// Composition (1000 x 720 viewBox):
//   center: 500, 380 (you)
//   nodes orbit at radii 220-300 with deliberate angular spread
// Mobile: scaled via viewBox; layout is the same.

type Node = {
  id: string;
  x: number;
  y: number;
  initials: string;
  // What the matchmaker sees this node "as" — short tag for bio chip
  tag: string;
  bio: string;
};

const NODES: Node[] = [
  { id: "you", x: 500, y: 380, initials: "YOU", tag: "you", bio: "Building something serious." },
  { id: "n1", x: 220, y: 240, initials: "MC", tag: "ai-infra", bio: "Inference scheduler for voice agents." },
  { id: "n2", x: 780, y: 200, initials: "DR", tag: "biotech", bio: "OS for wet labs." },
  { id: "n3", x: 220, y: 540, initials: "LV", tag: "climate", bio: "Battery analytics for fleets." },
  { id: "n4", x: 780, y: 540, initials: "ML", tag: "devtools", bio: "Trace + replay agent runtimes." },
  { id: "n5", x: 380, y: 130, initials: "PR", tag: "fintech", bio: "Cross-border B2B settlement." },
  { id: "n6", x: 620, y: 130, initials: "AT", tag: "ai-agents", bio: "Procurement copilot for SMB." },
  { id: "n7", x: 380, y: 620, initials: "JK", tag: "hardtech", bio: "Robotics for warehouse picking." },
  { id: "n8", x: 620, y: 620, initials: "SK", tag: "policy", bio: "AI safety eval suites." },
];

type Edge = { from: string; to: string; weight: number };
const EDGES: Edge[] = [
  { from: "you", to: "n1", weight: 94 },
  { from: "you", to: "n2", weight: 91 },
  { from: "you", to: "n3", weight: 88 },
  { from: "you", to: "n4", weight: 89 },
  { from: "you", to: "n5", weight: 86 },
  { from: "you", to: "n6", weight: 84 },
  { from: "n1", to: "n4", weight: 72 }, // peer cross-link
  { from: "n2", to: "n7", weight: 68 },
  { from: "n5", to: "n6", weight: 66 },
];

export function FounderGraph(): React.JSX.Element {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const nodeMap = new Map(NODES.map((n) => [n.id, n]));

  // Pulse the edges on a loop using CSS keyframes via a class toggle —
  // simpler than maintaining a framer animation per edge.
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    el.classList.add("graph-pulse");
  }, []);

  return (
    <div className="relative w-full">
      <svg
        ref={svgRef}
        viewBox="0 0 1000 720"
        className="w-full h-auto"
        role="img"
        aria-label="Founder graph: 8 builder nodes with animated connection lines to the center YOU node, weighted by match score."
      >
        <defs>
          {/* dotted-line pattern for the cohort orbit ring */}
          <radialGradient id="youGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.18" />
            <stop offset="60%" stopColor="var(--color-accent)" stopOpacity="0.04" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* faint dotted orbit rings — adds depth without weight */}
        <circle
          cx="500"
          cy="380"
          r="240"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.08"
          strokeDasharray="1 6"
          strokeWidth="1"
          className="text-ink"
        />
        <circle
          cx="500"
          cy="380"
          r="320"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.06"
          strokeDasharray="1 8"
          strokeWidth="1"
          className="text-ink"
        />

        {/* glow under YOU node */}
        <circle cx="500" cy="380" r="160" fill="url(#youGlow)" />

        {/* edges */}
        <g className="graph-edges">
          {EDGES.map((e, i) => {
            const a = nodeMap.get(e.from);
            const b = nodeMap.get(e.to);
            if (!a || !b) return null;
            const isYouEdge = e.from === "you" || e.to === "you";
            const fade =
              hoverId &&
              hoverId !== e.from &&
              hoverId !== e.to;
            return (
              <line
                key={`${e.from}-${e.to}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={isYouEdge ? "var(--color-accent)" : "currentColor"}
                strokeWidth={isYouEdge ? 1.4 : 0.9}
                strokeOpacity={fade ? 0.06 : isYouEdge ? 0.55 : 0.18}
                strokeLinecap="round"
                strokeDasharray="4 6"
                className={"text-ink graph-edge graph-edge-" + i}
                style={{
                  animationDelay: `${i * 0.18}s`,
                }}
              />
            );
          })}
        </g>

        {/* nodes */}
        <g className="graph-nodes">
          {NODES.map((n) => {
            const isYou = n.id === "you";
            const isHover = hoverId === n.id;
            const isFaded = hoverId && hoverId !== n.id && !isYou;
            return (
              <g
                key={n.id}
                transform={`translate(${n.x} ${n.y})`}
                onMouseEnter={() => setHoverId(n.id)}
                onMouseLeave={() => setHoverId(null)}
                onFocus={() => setHoverId(n.id)}
                onBlur={() => setHoverId(null)}
                tabIndex={isYou ? -1 : 0}
                style={{
                  cursor: isYou ? "default" : "pointer",
                  opacity: isFaded ? 0.4 : 1,
                  transition: "opacity 200ms ease-out",
                  outline: "none",
                }}
              >
                {isYou ? (
                  <>
                    <circle
                      r="44"
                      fill="var(--color-bg)"
                      stroke="var(--color-accent)"
                      strokeWidth="1.5"
                    />
                    <circle
                      r="36"
                      fill="var(--color-accent)"
                      fillOpacity="0.92"
                    />
                    <text
                      textAnchor="middle"
                      dy="0.32em"
                      className="font-mono uppercase"
                      fontSize="13"
                      fontWeight="600"
                      fill="var(--color-bg)"
                      style={{ letterSpacing: "0.18em" }}
                    >
                      YOU
                    </text>
                  </>
                ) : (
                  <>
                    <circle
                      r={isHover ? 30 : 28}
                      fill="var(--color-bg)"
                      stroke="var(--color-ink)"
                      strokeOpacity={isHover ? 0.9 : 0.45}
                      strokeWidth={isHover ? 1.5 : 1}
                      style={{ transition: "all 200ms ease-out" }}
                    />
                    <text
                      textAnchor="middle"
                      dy="0.32em"
                      fontSize="13"
                      fontWeight="600"
                      fill="var(--color-ink)"
                      className="font-mono"
                    >
                      {n.initials}
                    </text>
                    <text
                      textAnchor="middle"
                      y="48"
                      fontSize="10"
                      className="font-mono uppercase"
                      fill="var(--color-muted)"
                      style={{ letterSpacing: "0.18em" }}
                    >
                      {n.tag}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Bio chip: positioned absolutely below the SVG, swaps content
          on node hover. Keeps the SVG itself simple. */}
      <div
        className="mt-4 min-h-[44px] text-center"
        aria-live="polite"
        aria-atomic="true"
      >
        {hoverId && hoverId !== "you" ? (
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
            <span className="text-ink font-semibold">
              {nodeMap.get(hoverId)?.initials}
            </span>{" "}
            ·{" "}
            <span className="text-accent">
              {nodeMap.get(hoverId)?.tag}
            </span>{" "}
            ·{" "}
            <span className="text-muted normal-case tracking-normal">
              {nodeMap.get(hoverId)?.bio}
            </span>
          </p>
        ) : (
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted/70">
            hover a node · 9 of 2,000 in the YC SS 2026 graph
          </p>
        )}
      </div>
    </div>
  );
}
