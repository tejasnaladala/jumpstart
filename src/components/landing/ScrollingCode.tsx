"use client";
import { useMemo } from "react";

// ScrollingCode — continuous vertical streams of mono code text in the
// background. Replaces the cursor-trail CodeShimmer per founder ask
// ("make this scrolling code, not just appearing").
//
// Design:
//   - 5 columns spread evenly across the viewport
//   - Each column is a flex column of code lines that translates -50%
//     vertically over a long duration (60-120s per loop), then resets
//     instantly via the dual-content trick (the column has the lines
//     duplicated, so when the first half scrolls past, the second
//     half is already in frame and the wrap is invisible)
//   - Each column scrolls at a slightly different speed so they
//     don't lock-step
//   - Pure CSS animation. No rAF. No React state changes after mount.
//   - Opacity ~0.10-0.16 so it sits as ambient texture, not foreground
//   - prefers-reduced-motion: animation paused (lines stay frozen)
//   - Snippet pool: graph/network themed (no AI scoring)

const SNIPPETS: string[] = [
  "graph.add_edge(you, them)",
  "for friend in your_circle:",
  "intro.send(via=mutual)",
  "node.next = head",
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

// Generate a column of N lines, drawing from the snippet pool with
// some random ordering. Pure function, runs once per mount.
function makeColumn(seed: number, n: number): string[] {
  const out: string[] = [];
  let s = seed;
  for (let i = 0; i < n; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    out.push(SNIPPETS[s % SNIPPETS.length]!);
  }
  return out;
}

type Column = {
  // Horizontal % position (0-100)
  leftPct: number;
  // Animation duration in seconds (per scroll loop)
  durationSec: number;
  // Delay so columns don't all start in lock-step
  delaySec: number;
  // Opacity for this column (subtle variation across columns reads
  // as parallax depth)
  opacity: number;
  lines: string[];
};

const COLUMNS: Column[] = [
  { leftPct: 7, durationSec: 95, delaySec: 0, opacity: 0.13, lines: makeColumn(13, 28) },
  { leftPct: 26, durationSec: 78, delaySec: -22, opacity: 0.11, lines: makeColumn(57, 28) },
  { leftPct: 45, durationSec: 110, delaySec: -45, opacity: 0.16, lines: makeColumn(91, 28) },
  { leftPct: 65, durationSec: 84, delaySec: -12, opacity: 0.12, lines: makeColumn(131, 28) },
  { leftPct: 84, durationSec: 102, delaySec: -65, opacity: 0.14, lines: makeColumn(173, 28) },
];

export function ScrollingCode({
  // Direction of scroll. "up" = lines move from bottom to top
  // (terminal-output feel). "down" = lines move top to bottom (rare,
  // less natural).
  direction = "up",
  // Tone: "warm" = muted brown text, "ink" = nearly-black
  tone = "warm",
  className,
}: {
  direction?: "up" | "down";
  tone?: "warm" | "ink";
  className?: string;
} = {}): React.JSX.Element {
  const colorClass = tone === "ink" ? "text-ink" : "text-muted";
  // Doubled lines so the loop is seamless (when the first half scrolls
  // past, the second copy is already in view).
  const columns = useMemo(
    () =>
      COLUMNS.map((c) => ({
        ...c,
        doubled: [...c.lines, ...c.lines],
      })),
    []
  );

  return (
    <div
      aria-hidden
      className={
        "absolute inset-0 overflow-hidden pointer-events-none select-none " +
        (className || "")
      }
    >
      {columns.map((col, i) => (
        <div
          key={i}
          className="absolute top-0 h-[200%] flex flex-col items-start"
          style={{
            left: `${col.leftPct}%`,
            opacity: col.opacity,
            animation: `scrollingCode${direction === "up" ? "Up" : "Down"} ${col.durationSec}s linear ${col.delaySec}s infinite`,
            willChange: "transform",
          }}
        >
          {col.doubled.map((line, j) => (
            <span
              key={`${i}-${j}`}
              className={
                "block font-mono text-[12px] leading-[2.4] whitespace-nowrap " +
                colorClass
              }
            >
              {line}
            </span>
          ))}
        </div>
      ))}
      <style jsx>{`
        @keyframes scrollingCodeUp {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-50%);
          }
        }
        @keyframes scrollingCodeDown {
          0% {
            transform: translateY(-50%);
          }
          100% {
            transform: translateY(0);
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
