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

const SNIPPETS: string[] = [
  "while drop_queue:",
  "for card in cohort:",
  "score = embed(card.profile)",
  "if match.score > 0.78:",
  "await self.queue.get()",
  "node.next = head",
  "graph.add_edge(you, them)",
  "match = topk(scores, k=1)",
  "if both_yes: open_calendar()",
  "self.batch.append(card)",
  "asyncio.create_task(score)",
  "tags = card.tags & yours",
  "return matches[0]",
  "embedding[:768]",
  "drop = next_drop_after(now)",
  "if accepted: graph.commit()",
  "rank = bm25 + embed_sim",
  "card.fingerprint()",
  "for peer in cohort.iter():",
  "intro.send(reason=why)",
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
      // Drop sparks older than 1.6s.
      setSparks((prev) => prev.filter((s) => now - s.born < 1600));
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
              animation: `codeShimmerFade 1.6s ease-out forwards`,
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
            filter: blur(2px);
          }
          15% {
            opacity: var(--peak-opacity);
            filter: blur(0);
          }
          75% {
            opacity: var(--peak-opacity);
          }
          100% {
            opacity: 0;
            filter: blur(2px);
          }
        }
      `}</style>
    </div>
  );
}
