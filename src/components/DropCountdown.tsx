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
    // Hero countdown. Founder direction (May 7): "Make the envelope
    // lands thing big to take up most space on the screen, make it
    // look good." On lg+ this fills the container-wide canvas
    // (1080px) with display-serif numerals and generous whitespace.
    <div className="surface bg-bg/60 px-4 py-10 sm:px-10 sm:py-16 lg:px-16 lg:py-24 text-center">
      <div aria-hidden className="h-px bg-accent mx-auto mb-6 lg:mb-12 w-12 lg:w-24" />
      <p className="font-mono text-[10px] sm:text-xs lg:text-sm uppercase tracking-[0.22em] lg:tracking-[0.36em] text-accent font-semibold">
        Envelope lands
      </p>
      <p className="font-display italic text-3xl sm:text-4xl lg:text-6xl xl:text-7xl text-ink leading-[1.05] mt-4 lg:mt-8 px-2">
        {label}
      </p>

      <div
        className={`mt-12 lg:mt-20 flex items-end justify-center gap-6 sm:gap-12 lg:gap-20 ${
          isFinalMinute ? "animate-pulse" : ""
        }`}
        aria-live="polite"
        aria-atomic="true"
      >
        <Cell value={c.days} label="days" />
        <Separator />
        <Cell value={c.hours} label="hours" />
        <Separator />
        <Cell value={c.minutes} label="min" />
        <Separator />
        <Cell value={c.seconds} label="sec" highlight={isFinalMinute} />
      </div>

      <p className="text-xs sm:text-sm lg:text-base text-muted mt-12 lg:mt-20 leading-relaxed max-w-md lg:max-w-2xl mx-auto px-4">
        One curated founder match. Read the four lines, decide in 30
        seconds. Mon, Wed, Fri at 9pm PT, sharp.
      </p>

      <div aria-hidden className="h-px bg-accent mx-auto mt-10 lg:mt-16 w-12 lg:w-24" />
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
    <div className="flex flex-col items-center min-w-0">
      <span
        className={`font-display tabular-nums leading-[0.9] text-5xl sm:text-7xl lg:text-[10rem] xl:text-[12rem] ${
          highlight ? "text-accent" : "text-ink"
        } transition-colors`}
      >
        {String(value).padStart(2, "0")}
      </span>
      <span className="font-mono text-[9px] sm:text-[10px] lg:text-sm uppercase tracking-[0.18em] lg:tracking-[0.28em] text-muted mt-3 lg:mt-6">
        {label}
      </span>
    </div>
  );
}

function Separator() {
  // Decorative · between countdown cells. Lighter weight than the
  // numerals so the rhythm reads "02 · 00 · 25 · 01" rather than a
  // single mashed-together number.
  return (
    <span
      aria-hidden
      className="font-display text-3xl sm:text-5xl lg:text-7xl text-muted/30 leading-[0.9] self-center"
    >
      ·
    </span>
  );
}
