"use client";
import { useEffect, useRef, useState } from "react";

// CodeShimmer — cursor-trail code snippets that fade in/out around the
// pointer at low opacity.
//
// Smooth-pass rewrite (founder flagged the previous version as glitchy
// and artificial). Two big changes:
//
//   1. Spawn cadence is decoupled from rAF. We use setInterval at the
//      configured rate (default 100ms = 10 sparks/sec). The previous
//      version ran setSparks() inside the rAF loop on every frame —
//      that's 60 React reconciliations per second, two of them per
//      tick (add + filter). React would batch but the LCP loved it
//      anyway. New version triggers React state updates only on
//      spawn (10/sec) and on cleanup (10/sec).
//
//   2. Removal is delegated to setTimeout per spark, not a per-frame
//      Array.filter. The spark schedules its own deletion at lifetime+50ms.
//
// Visual smoothness comes from:
//   - Opacity-only keyframe (no filter/blur — those force compositor
//     re-rasterization which jitters on integrated GPUs).
//   - cubic-bezier(0.33, 1, 0.68, 1) — a long ease-out that holds
//     peak opacity for 60% of the lifetime.
//   - will-change: opacity on each spark for GPU promotion.
//
// Behavior:
//   - Desktop only (matchMedia 1024px+)
//   - prefers-reduced-motion: bail entirely
//   - Snippet pool is graph/connection-themed (no AI scoring)

type Spark = {
  id: number;
  x: number;
  y: number;
  text: string;
  dx: number;
  dy: number;
  rot: number;
};

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
];

export function CodeShimmer({
  // Spawn radius in px around the cursor.
  radius = 240,
  // Spawn interval in ms. 100ms = 10/sec. Lower = denser cloud, higher
  // = smoother / sparser. Founder flagged previous 14/sec as too dense.
  intervalMs = 110,
  // Lifetime of each spark before it fades out, in ms.
  lifetimeMs = 3200,
  // Tone determines text color. "warm" = espresso/muted on cream;
  // "ink" = nearly-black on cream. Either works on the cream bg.
  tone = "warm",
  // CSS opacity of each spark at peak.
  peakOpacity = 0.22,
}: {
  radius?: number;
  intervalMs?: number;
  lifetimeMs?: number;
  tone?: "warm" | "ink";
  peakOpacity?: number;
} = {}): React.JSX.Element | null {
  const [sparks, setSparks] = useState<Spark[]>([]);
  const idRef = useRef(0);
  const cursorRef = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mqDesktop = window.matchMedia("(min-width: 1024px)");
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!mqDesktop.matches || mqReduce.matches) return;
    activeRef.current = true;

    const onMove = (e: PointerEvent): void => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      cursorRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    // Spawn loop on a fixed interval. No per-frame state churn.
    const spawn = (): void => {
      const c = cursorRef.current;
      if (!c) return;
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;
      const text =
        SNIPPETS[Math.floor(Math.random() * SNIPPETS.length)] ?? "//";
      const id = ++idRef.current;
      const spark: Spark = {
        id,
        x: c.x + Math.cos(angle) * r,
        y: c.y + Math.sin(angle) * r,
        text,
        dx: (Math.random() - 0.5) * 14,
        dy: (Math.random() - 0.5) * 14,
        rot: (Math.random() - 0.5) * 3,
      };
      setSparks((prev) => [...prev, spark]);
      // Schedule self-removal at lifetime+grace (150ms past the
      // animation's 100% keyframe to avoid flash-cuts).
      window.setTimeout(() => {
        setSparks((prev) => prev.filter((s) => s.id !== id));
      }, lifetimeMs + 150);
    };
    const interval = window.setInterval(spawn, intervalMs);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.clearInterval(interval);
    };
  }, [radius, intervalMs, lifetimeMs]);

  const colorClass = tone === "ink" ? "text-ink" : "text-muted";

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="absolute inset-0 overflow-hidden pointer-events-none select-none"
    >
      {sparks.map((s) => (
        <span
          key={s.id}
          className={
            "absolute font-mono text-[12px] leading-none whitespace-nowrap " +
            colorClass
          }
          style={{
            left: s.x,
            top: s.y,
            transform: `translate(-50%, -50%) translate(${s.dx}px, ${s.dy}px) rotate(${s.rot}deg)`,
            opacity: 0,
            willChange: "opacity",
            animation: `codeShimmerFade ${lifetimeMs}ms cubic-bezier(0.33, 1, 0.68, 1) forwards`,
            ["--peak-opacity" as string]: String(peakOpacity),
          }}
        >
          {s.text}
        </span>
      ))}
      {/* Opacity-only keyframe — no filter/blur (those force compositor
          rasterization on every frame which jitters). Long ease-out
          holds peak for the middle ~60% of lifetime. */}
      <style jsx>{`
        @keyframes codeShimmerFade {
          0% {
            opacity: 0;
          }
          18% {
            opacity: var(--peak-opacity);
          }
          78% {
            opacity: var(--peak-opacity);
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
