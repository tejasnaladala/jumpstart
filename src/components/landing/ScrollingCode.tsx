"use client";
import { useEffect, useMemo, useRef, useState } from "react";

// ScrollingCode — grid of code mini-cells that are INVISIBLE by default
// and only fade in when the cursor moves near them. Each cell streams
// vertical code lines via CSS keyframe transform.
//
// Founder ask: "by default invisible. when cursor goes near, code
// scrolls in a radius. messy lengths. 16-20 squares not 4-5 columns."
//
// Layout: 5 cols x 4 rows = 20 cells. Cells are positioned via CSS
// grid spanning the whole container. Each cell has a tiny scrolling
// column inside (10-14 lines) with seamless wrap (doubled content).
//
// Reveal:
//   - Pointer position tracked via window pointermove + container
//     bounding rect.
//   - Each cell computes its center and the distance to the cursor.
//   - Cells inside RADIUS_PX get full opacity (0.18); cells just
//     outside get a falloff to 0; cells far away are fully invisible.
//   - 220ms opacity transition so the reveal/fade is smooth as you
//     drag the cursor.
//
// Performance:
//   - The scroll animation is pure CSS keyframe transform — no JS
//     per frame.
//   - Pointer tracking is throttled to one rAF tick so the cell
//     opacity update fires at most 60/sec.
//   - prefers-reduced-motion: scroll animation paused; reveal still
//     fires (user can hover to read code).

const SNIPPETS_LONG: string[] = [
  "graph.add_edge(you, them)",
  "for friend in your_circle:",
  "intro.send(via=mutual)",
  "if both_yes: open_calendar()",
  "graph.path(you, target)",
  "tags = you.tags & them.tags",
  "for peer in cohort.iter():",
  "drop = next_drop_after(now)",
  "if accepted: graph.commit()",
  "card.fingerprint()",
  "intro.note(why=mutual_friend)",
  "graph.bfs(start=you, depth=3)",
  "queue.push(curated_intro)",
  "calendar.open(both_sides=true)",
  "for ring in graph.rings:",
  "edge.weight += accepted",
  "graph.compounds()",
  "you.knows(them) ? bridge() : null",
  "match = next_drop.pick()",
  "circle.add(new_intro)",
  "for hop in path.steps():",
  "node.degree += 1",
  "graph.persist(state)",
];

// Variable-length set so cells don't all read the same width.
const SNIPPETS_SHORT: string[] = [
  "node.next",
  "you.tags",
  "graph.commit()",
  "intro.send()",
  "++degree",
  "circle.add(x)",
  "if mutual:",
  "for x in cohort:",
  "match()",
  "you → them",
  "drop[0]",
  "graph.bfs",
  "edge.weight",
  "tags & yours",
  "intro = ok",
  "// noted",
  "open_cal()",
  "depth=3",
  "ring[i]",
  "find(x)",
];

const SNIPPETS_MEDIUM: string[] = [
  "intro.send(via=mutual)",
  "graph.path(you, x)",
  "for n in cohort:",
  "tags = a & b",
  "drop = next_drop()",
  "graph.compounds()",
  "if both_yes:",
  "edge.weight++",
  "node.degree++",
  "queue.push(it)",
];

// PRNG helpers so the same column doesn't get the same lines on
// every render but is deterministic per-mount.
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [a[i]!, a[j]!] = [a[j]!, a[i]!];
  }
  return a;
}

function makeCellLines(seed: number, lineCount: number): string[] {
  // Mix of short, medium, long lines so cell widths vary naturally.
  const pool = [...SNIPPETS_SHORT, ...SNIPPETS_MEDIUM, ...SNIPPETS_LONG];
  return seededShuffle(pool, seed).slice(0, lineCount);
}

// Grid layout: 5 cols x 4 rows = 20 cells.
const COLS = 5;
const ROWS = 4;
const CELL_COUNT = COLS * ROWS;

// Reveal radius (px) — cursor must be within this distance of a
// cell center for it to fade in.
const RADIUS_PX = 280;
// Falloff zone — cells in this distance band fade smoothly to 0.
const FALLOFF_PX = 140;

export function ScrollingCode({
  tone = "warm",
  className,
}: {
  tone?: "warm" | "ink";
  className?: string;
} = {}): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const cellsRef = useRef<(HTMLDivElement | null)[]>([]);
  const cursorRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef(0);
  const [enabled, setEnabled] = useState(false);

  // Build cell config once per mount. Each cell has slightly
  // different line counts and animation speeds so they don't
  // synchronize.
  const cells = useMemo(() => {
    const arr: {
      lines: string[];
      durationSec: number;
      delaySec: number;
    }[] = [];
    for (let i = 0; i < CELL_COUNT; i++) {
      const seed = i * 73 + 17;
      arr.push({
        lines: makeCellLines(seed, 10 + ((seed >> 3) % 5)), // 10-14 lines
        durationSec: 28 + ((seed >> 5) % 22), // 28-50s
        delaySec: -((seed >> 7) % 30), // -0 to -30s offset
      });
    }
    return arr;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Desktop only — phones don't have a hover cursor, the reveal
    // mechanic doesn't apply. We bail entirely; the section is just
    // empty space on phones.
    const mqDesktop = window.matchMedia("(min-width: 1024px)");
    if (!mqDesktop.matches) return;
    setEnabled(true);

    const onMove = (e: PointerEvent): void => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      cursorRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };
    const onLeave = (): void => {
      cursorRef.current = null;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);

    // rAF tick: read cursor position, compute opacity per cell, write
    // it to the DOM. We do this in a single rAF instead of per-cell
    // listeners so 20 cells = 20 cheap style updates per frame, not
    // 20 events.
    const tick = (): void => {
      const el = containerRef.current;
      if (el) {
        const cursor = cursorRef.current;
        const rect = el.getBoundingClientRect();
        for (let i = 0; i < cellsRef.current.length; i++) {
          const cell = cellsRef.current[i];
          if (!cell) continue;
          if (!cursor) {
            cell.style.opacity = "0";
            continue;
          }
          const cellRect = cell.getBoundingClientRect();
          const cx = cellRect.left + cellRect.width / 2 - rect.left;
          const cy = cellRect.top + cellRect.height / 2 - rect.top;
          const dx = cx - cursor.x;
          const dy = cy - cursor.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          let opacity = 0;
          if (dist < RADIUS_PX) {
            // Full visible inside core radius.
            opacity = 0.2;
          } else if (dist < RADIUS_PX + FALLOFF_PX) {
            // Linear falloff in the band.
            const t = (dist - RADIUS_PX) / FALLOFF_PX;
            opacity = 0.2 * (1 - t);
          }
          cell.style.opacity = String(opacity);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const colorClass = tone === "ink" ? "text-ink" : "text-muted";

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={
        "absolute inset-0 overflow-hidden pointer-events-none select-none " +
        (className || "")
      }
    >
      {/* CSS grid: 5x4 cells. Each cell is invisible by default and
          only revealed via per-cell opacity from the rAF tick. */}
      <div
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
        }}
      >
        {cells.map((cell, i) => (
          <div
            key={i}
            ref={(el) => {
              cellsRef.current[i] = el;
            }}
            className="relative overflow-hidden"
            style={{
              opacity: 0,
              transition: "opacity 220ms cubic-bezier(0.4, 0, 0.2, 1)",
              willChange: "opacity",
            }}
          >
            {enabled ? (
              <div
                className="absolute top-0 left-2 h-[200%] flex flex-col items-start"
                style={{
                  animation: `scrollingCodeUp ${cell.durationSec}s linear ${cell.delaySec}s infinite`,
                  willChange: "transform",
                }}
              >
                {[...cell.lines, ...cell.lines].map((line, j) => (
                  <span
                    key={j}
                    className={
                      "block font-mono text-[11px] leading-[2.2] whitespace-nowrap " +
                      colorClass
                    }
                  >
                    {line}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes scrollingCodeUp {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-50%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          div[style*="animation"] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
