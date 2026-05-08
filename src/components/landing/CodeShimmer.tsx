"use client";
import { useEffect, useRef, useState } from "react";

// CodeShimmer — cursor-trail code snippets that fade in/out around the
// pointer at low opacity. Direct lift of the YC Startup School 2026
// landing-page background trick (random source-code lines drift in at
// ~20% opacity in a radius around the cursor).
//
// Cap: 24 active snippets. Each lives ~1.6s before fading. Throttled
// via requestAnimationFrame so a fast mouse drag doesn't spawn 200/sec.
// Desktop only (matchMedia min-width 1024px) — no point doing this on
// touch where there's no cursor. prefers-reduced-motion bails entirely.
//
// Snippet pool is intentionally small + builder-coded: queue/scheduler
// patterns, async loops, embedding scoring, the kind of code that would
// be in the actual matchmaker source. Reads as the system writing
// itself, not random lorem-code.

type Spark = {
  id: number;
  x: number;
  y: number;
  text: string;
  born: number;
  // Each spark gets a tiny offset + slight rotation so a cluster doesn't
  // stack as a perfect grid.
  dx: number;
  dy: number;
  rot: number;
};

// Snippets are graph/connection-themed (not score/embed). Reads as
// "we're building the network", not "we score you with AI" — founder
// asked to drop the AI-judgment language across the site.
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
  "you.knows(them) ? bridge() : null",
  "graph.bfs(start=you, depth=3)",
  "queue.push(curated_intro)",
  "return suggestion",
  "calendar.open(both_sides=true)",
  "for ring in graph.rings:",
  "edge.weight += accepted",
  "graph.compounds()",
];

export function CodeShimmer({
  // The radius (in px) the snippets spawn within around the cursor.
  // Larger = looser cloud, smaller = tighter halo.
  radius = 180,
  // Snippets per second cap when the cursor is moving.
  rate = 14,
  // Tone determines text color. "warm" = espresso/muted on cream;
  // "ink" = nearly-black on cream. Either works on the cream bg.
  tone = "warm",
  // CSS opacity of each snippet at peak. Stays low so the effect reads
  // as ambient code rather than foreground.
  peakOpacity = 0.22,
}: {
  radius?: number;
  rate?: number;
  tone?: "warm" | "ink";
  peakOpacity?: number;
}): React.JSX.Element | null {
  const [sparks, setSparks] = useState<Spark[]>([]);
  const idRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const cursorRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Desktop only; mobile + reduced motion bail.
    const mqDesktop = window.matchMedia("(min-width: 1024px)");
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!mqDesktop.matches || mqReduce.matches) return;

    const onMove = (e: PointerEvent): void => {
      // Coordinates are relative to the parent container. The parent is
      // typically `relative` and full-section, so PointerEvent.clientY -
      // containerTop gives a local Y.
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      cursorRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const minIntervalMs = 1000 / rate;

    const tick = (now: number): void => {
      const c = cursorRef.current;
      if (c && now - lastSpawnRef.current > minIntervalMs) {
        lastSpawnRef.current = now;
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * radius;
        const text =
          SNIPPETS[Math.floor(Math.random() * SNIPPETS.length)] ?? "//";
        const spark: Spark = {
          id: ++idRef.current,
          x: c.x + Math.cos(angle) * r,
          y: c.y + Math.sin(angle) * r,
          text,
          born: now,
          dx: (Math.random() - 0.5) * 12,
          dy: (Math.random() - 0.5) * 12,
          rot: (Math.random() - 0.5) * 4,
        };
        // Cap at 24 active sparks. Drop the oldest to keep DOM count low.
        setSparks((prev) =>
          prev.length >= 24 ? [...prev.slice(1), spark] : [...prev, spark]
        );
      }
      // Drop sparks older than 2.6s (was 1.6s — longer fade reads as
      // smoother ambient text instead of jittery flashes).
      setSparks((prev) => prev.filter((s) => now - s.born < 2600));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [radius, rate]);

  // SSR-safe: render container always, sparks only on the client.
  const colorClass = tone === "ink" ? "text-ink" : "text-muted";

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="absolute inset-0 overflow-hidden pointer-events-none select-none"
    >
      {sparks.map((s) => {
        // Each spark fades in over the first 200ms, holds, then fades.
        // Compute a CSS animation via inline style.
        return (
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
              animation: `codeShimmerFade 2.6s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
              ["--peak-opacity" as string]: String(peakOpacity),
            }}
          >
            {s.text}
          </span>
        );
      })}
      {/* Inline keyframes so the component is self-contained. */}
      <style jsx>{`
        @keyframes codeShimmerFade {
          0% {
            opacity: 0;
            filter: blur(3px);
          }
          22% {
            opacity: var(--peak-opacity);
            filter: blur(0);
          }
          70% {
            opacity: var(--peak-opacity);
            filter: blur(0);
          }
          100% {
            opacity: 0;
            filter: blur(3px);
          }
        }
      `}</style>
    </div>
  );
}
