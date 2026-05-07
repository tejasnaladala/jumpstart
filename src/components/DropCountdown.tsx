"use client";
import { useEffect, useState } from "react";
import { countdownTo, formatDropLabel } from "@/lib/drop/schedule";

type Props = {
  // ISO string for the next drop the user is waiting on.
  targetIso: string;
  // Fired the moment the countdown crosses zero. Parent uses this to
  // flip /drop from countdown view to match view without a refresh.
  onArrived?: () => void;
};

// Themed countdown for the /drop page. Cream background, accent-orange
// numerals, espresso labels, mono spacing for tabular nums so digits
// don't dance as they tick. Editorial flourish: a 1px accent rule above
// and below, an "ENVELOPE LANDS" eyebrow, the drop label (e.g.
// "Friday, May 8 at 9:00 PM PT") in display serif italic.
export function DropCountdown({ targetIso, onArrived }: Props) {
  const target = new Date(targetIso);
  const [c, setC] = useState(() => countdownTo(target));
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    if (arrived) return;
    let raf = 0;
    let alive = true;
    const tick = () => {
      if (!alive) return;
      const next = countdownTo(target);
      setC(next);
      if (next.done) {
        setArrived(true);
        onArrived?.();
        return;
      }
      // 1Hz tick is plenty; setInterval would drift slightly during long
      // tab inactivity but stays cheap.
      raf = window.setTimeout(tick, 1000) as unknown as number;
    };
    tick();
    return () => {
      alive = false;
      clearTimeout(raf as unknown as number);
    };
  }, [targetIso, arrived, onArrived, target]);

  if (arrived || c.done) return null;

  const label = formatDropLabel(target);
  const isFinalMinute = c.days === 0 && c.hours === 0 && c.minutes === 0;

  return (
    <div className="surface p-6 sm:p-8 text-center bg-bg/60">
      <div aria-hidden className="h-px bg-accent mx-auto mb-5 w-12" />
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-semibold">
        Envelope lands
      </p>
      <p className="font-display italic text-2xl sm:text-3xl text-ink leading-tight mt-3">
        {label}
      </p>
      <p className="text-xs text-muted mt-2 leading-relaxed max-w-md mx-auto">
        One curated founder match. Read the four lines, decide in 30
        seconds. Mon, Wed, Fri at 9pm PT, sharp.
      </p>

      <div
        className={`mt-7 grid grid-cols-4 gap-3 sm:gap-5 max-w-lg mx-auto ${
          isFinalMinute ? "animate-pulse" : ""
        }`}
        aria-live="polite"
        aria-atomic="true"
      >
        <Cell value={c.days} label="days" />
        <Cell value={c.hours} label="hours" />
        <Cell value={c.minutes} label="min" />
        <Cell value={c.seconds} label="sec" highlight={isFinalMinute} />
      </div>

      <div aria-hidden className="h-px bg-accent mx-auto mt-7 w-12" />
    </div>
  );
}

function Cell({
  value,
  label,
  highlight = false,
}: {
  value: number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <span
        className={`font-display text-4xl sm:text-5xl tabular-nums leading-none ${
          highlight ? "text-accent" : "text-ink"
        } transition-colors`}
      >
        {String(value).padStart(2, "0")}
      </span>
      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mt-2">
        {label}
      </span>
    </div>
  );
}
