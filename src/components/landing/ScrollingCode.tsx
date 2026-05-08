"use client";
import { useEffect, useMemo, useRef, useState } from "react";

// ScrollingCode — grid of code mini-cells, INVISIBLE by default, fade
// in when the cursor moves near.
//
// Founder ask v2: lines should NOT all be left-aligned. They should
// look like flowing Python source with proper indentation depth — a
// `for` block nested inside a `while` block nested inside a `def`,
// etc. Reads as real code, not a column of equal-width tokens.
//
// Implementation: each cell renders one CODE_BLOCK (a multi-line
// Python snippet with leading whitespace preserved via white-space:
// pre). Each block is a coherent function or class so the indentation
// reads as legitimate hierarchy.

// Multi-line Python snippets, graph/network/scheduler themed. Each
// block reads as coherent source code (proper indentation, syntactic
// shape) so when a visitor's cursor passes over it they see what
// looks like the actual matchmaker source streaming by.
const CODE_BLOCKS: string[] = [
  `async def _worker(self):
    while True:
        batch = []
        for _ in range(self.batch_size):
            item = await self.queue.get()
            batch.append(item)
        await self._flush(batch)
        for _ in batch:
            self.queue.task_done()`,

  `def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)`,

  `class Graph:
    def __init__(self):
        self.edges = {}
        self.nodes = set()

    def add_edge(self, a, b):
        self.edges.setdefault(a, [])
        self.edges[a].append(b)
        self.nodes.add(a)
        self.nodes.add(b)`,

  `def bfs(graph, start, target):
    queue = [(start, [start])]
    seen = {start}
    while queue:
        node, path = queue.pop(0)
        if node == target:
            return path
        for nb in graph.edges.get(node, []):
            if nb not in seen:
                seen.add(nb)
                queue.append((nb, path + [nb]))`,

  `async def make_drop(user):
    cards = await load_cohort()
    pool = score(user, cards)
    for c in pool[:50]:
        if has_bridge(user, c):
            return await persist(user, c)
    return None`,

  `def score(user, cards):
    out = []
    for c in cards:
        s = embed_sim(user, c)
        s += tag_overlap(user, c)
        s += stage_match(user, c)
        out.append((s, c))
    return sorted(out, reverse=True)`,

  `class Drop:
    def __init__(self, user, match):
        self.user = user
        self.match = match
        self.created_at = now()
        self.both_yes = False

    def accept(self, side):
        self.responses[side] = "yes"
        if all(self.responses.values()):
            self.both_yes = True
            calendar.open(self)`,

  `def find_path(you, target, max_hops=4):
    paths = [[you]]
    while paths:
        path = paths.pop(0)
        if path[-1] == target:
            return path
        if len(path) >= max_hops:
            continue
        for nb in friends_of(path[-1]):
            paths.append(path + [nb])
    return None`,

  `async def commit_intro(intro):
    async with db.tx() as t:
        await t.execute(
            "insert into intros values (?, ?, ?)",
            intro.from_user,
            intro.to_user,
            intro.reason,
        )
        graph.add_edge(intro.from_user, intro.to_user)
        await t.commit()`,

  `def next_drop_after(now):
    for i in range(14):
        d = now + timedelta(days=i)
        wd = d.strftime("%a")
        if wd in ("Mon", "Wed", "Fri"):
            drop = d.replace(hour=21, minute=0)
            if drop > now:
                return drop`,

  `class Cohort:
    def __init__(self, members):
        self.members = members
        self.tags = collect_tags(members)
        self.cities = collect_cities(members)

    def filter_by(self, tag):
        return [m for m in self.members
                if tag in m.tags]`,

  `def explain(match, user):
    reasons = []
    if shared_stage(user, match):
        reasons.append("same stage")
    if mutual_friend(user, match):
        reasons.append("you both know X")
    if tags_overlap(user, match):
        reasons.append("stack overlap")
    return ". ".join(reasons)`,

  `async def deliver(drop):
    email = render_email(drop)
    sms = render_sms(drop)
    await asyncio.gather(
        send_email(drop.user.email, email),
        send_sms(drop.user.phone, sms),
    )
    drop.delivered_at = now()`,

  `def rank(candidates, user):
    sims = [embed_sim(user, c) for c in candidates]
    bm25 = [text_score(user, c) for c in candidates]
    blended = [
        0.6 * sims[i] + 0.4 * bm25[i]
        for i in range(len(candidates))
    ]
    return sorted(zip(candidates, blended),
                  key=lambda x: -x[1])`,

  `def has_bridge(a, b):
    a_friends = set(friends_of(a))
    b_friends = set(friends_of(b))
    common = a_friends & b_friends
    return len(common) > 0`,

  `class Scheduler:
    def __init__(self):
        self.queue = asyncio.Queue()
        self.workers = []

    async def start(self, n=4):
        for _ in range(n):
            t = asyncio.create_task(self._worker())
            self.workers.append(t)
        await asyncio.gather(*self.workers)`,
];

// Grid layout: 5 cols x 4 rows = 20 cells.
const COLS = 5;
const ROWS = 4;
const CELL_COUNT = COLS * ROWS;

// Reveal radius (px) — cursor must be within this distance of a
// cell center for it to fade in.
const RADIUS_PX = 280;
// Falloff zone — cells in this distance band fade smoothly to 0.
const FALLOFF_PX = 140;

// Deterministic PRNG so each cell picks a stable code block per mount
// (not flickering between blocks on every render).
function seededIndex(seed: number, modulo: number): number {
  const s = (seed * 1103515245 + 12345) & 0x7fffffff;
  return s % modulo;
}

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

  // Each cell gets a stable code block + animation params.
  const cells = useMemo(() => {
    const arr: {
      block: string;
      durationSec: number;
      delaySec: number;
    }[] = [];
    for (let i = 0; i < CELL_COUNT; i++) {
      const blockIdx = seededIndex(i * 73 + 17, CODE_BLOCKS.length);
      const block = CODE_BLOCKS[blockIdx] ?? CODE_BLOCKS[0]!;
      // Vary scroll speed per cell so they don't lock-step.
      const durationSec = 36 + seededIndex(i * 41 + 7, 24); // 36-60s
      const delaySec = -seededIndex(i * 19 + 3, 30); // -0..-30s offset
      arr.push({ block, durationSec, delaySec });
    }
    return arr;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
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
            opacity = 0.22;
          } else if (dist < RADIUS_PX + FALLOFF_PX) {
            const t = (dist - RADIUS_PX) / FALLOFF_PX;
            opacity = 0.22 * (1 - t);
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
                {/* Each cell renders its code block TWICE for seamless
                    wrap. white-space: pre preserves the leading
                    indentation so each line sits at its real column
                    (4-space-per-level Python convention). */}
                {[0, 1].map((copy) => (
                  <pre
                    key={copy}
                    className={
                      "block font-mono text-[11px] leading-[1.5] m-0 mb-4 " +
                      colorClass
                    }
                    style={{
                      whiteSpace: "pre",
                      fontVariantLigatures: "none",
                    }}
                  >
                    {cell.block}
                  </pre>
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
