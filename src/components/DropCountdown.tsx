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
    // Editorial countdown sized for the canonical container-app column
    // (440 phone, 640 tablet, 720 laptop). Numerals are bold and serif
    // but proportional to the column. The page TopBar already carries
    // the page h1 (Your Drop), so this block is the body hero.
    <div className="surface bg-bg/60 px-5 py-10 sm:px-8 sm:py-14 lg:px-10 lg:py-16 text-center">
      <div aria-hidden className="h-px bg-accent mx-auto mb-5 sm:mb-7 w-12 sm:w-16" />
      <p className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.22em] sm:tracking-[0.28em] text-accent font-semibold">
        Envelope lands
      </p>
      <p className="font-display italic text-3xl sm:text-4xl lg:text-5xl text-ink leading-[1.05] mt-3 sm:mt-5 px-2">
        {label}
      </p>

      <div
        className={`mt-10 sm:mt-12 lg:mt-14 flex items-end justify-center gap-4 sm:gap-8 lg:gap-10 ${
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

      <p className="text-xs sm:text-sm text-muted mt-10 sm:mt-12 leading-relaxed max-w-md mx-auto px-2">
        One curated founder match. Read the four lines, decide in 30 seconds. Mon, Wed, Fri at 9pm PT.
      </p>

      <div aria-hidden className="h-px bg-accent mx-auto mt-8 sm:mt-10 w-12 sm:w-16" />
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
        className={`font-display tabular-nums leading-[0.9] text-5xl sm:text-6xl lg:text-7xl xl:text-8xl ${
          highlight ? "text-accent" : "text-ink"
        } transition-colors`}
      >
        {String(value).padStart(2, "0")}
      </span>
      <span className="font-mono text-[9px] sm:text-[10px] lg:text-xs uppercase tracking-[0.18em] lg:tracking-[0.22em] text-muted mt-3 sm:mt-4">
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
      className="font-display text-3xl sm:text-4xl lg:text-5xl text-muted/30 leading-[0.9] self-center"
    >
      ·
    </span>
  );
}
