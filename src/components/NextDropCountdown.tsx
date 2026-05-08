"use client";
import { useEffect, useState } from "react";
import {
  countdownTo,
  formatDropLabel,
  nextDropAfter,
} from "@/lib/drop/schedule";

// Live countdown to the next Mon/Wed/Fri 9pm PT drop, rendered as a
// quiet editorial band. Inspired by ditto.ai's countdown-next-to-CTA
// pairing: gives every visitor a real time-bound reason to act now.
//
// Renders SSR-safe: the initial value is computed against `now=new Date()`
// at server-render so cold readers see a real countdown, not "0 / 0 / 0".
// Client effect ticks at 1Hz to keep it live. Hidden when target has
// passed (rare, will refresh on next render).

type Props = {
  // "tone" controls cream vs espresso. "light" = on cream surface, dark
  // text + accent. "dark" = on espresso surface, light text + accent.
  tone?: "light" | "dark";
  className?: string;
};

export function NextDropCountdown({
  tone = "light",
  className,
}: Props): React.JSX.Element {
  const target = nextDropAfter(new Date());
  const [c, setC] = useState(() => countdownTo(target));

  useEffect(() => {
    const t = setInterval(() => {
      setC(countdownTo(target));
    }, 1000);
    return () => clearInterval(t);
  }, [target]);

  const label = formatDropLabel(target);
  const isDark = tone === "dark";
  const eyebrowTone = isDark ? "text-bg/70" : "text-muted";
  const numTone = isDark ? "text-bg" : "text-ink";
  const labelTone = isDark ? "text-bg/85" : "text-ink/80";
  const accentLine = isDark ? "bg-bg/40" : "bg-accent";

  if (c.done) return <div className={className} aria-hidden />;

  return (
    <div
      className={"flex flex-col gap-3 " + (className || "")}
      aria-live="off"
    >
      <div aria-hidden className={"h-px w-12 " + accentLine} />
      <p
        className={
          "ed-serial " + (isDark ? "text-accent" : "text-accent")
        }
      >
        Next drop
      </p>
      <p
        className={
          "font-display italic text-2xl sm:text-3xl leading-tight " +
          labelTone
        }
      >
        {label}
      </p>
      <div
        className="flex items-end gap-3 sm:gap-5 tabular-nums"
        aria-label={`Next drop in ${c.days} days ${c.hours} hours ${c.minutes} minutes ${c.seconds} seconds`}
      >
        <Cell n={c.days} label="d" tone={tone} />
        <Sep tone={tone} />
        <Cell n={c.hours} label="h" tone={tone} />
        <Sep tone={tone} />
        <Cell n={c.minutes} label="m" tone={tone} />
        <Sep tone={tone} />
        <Cell n={c.seconds} label="s" tone={tone} />
      </div>
      <p className={"text-xs " + eyebrowTone + " mt-1"}>
        Mon, Wed, Fri at 9 PM PT. One curated founder per drop.
      </p>
    </div>
  );
}

function Cell({
  n,
  label,
  tone,
}: {
  n: number;
  label: string;
  tone: "light" | "dark";
}): React.JSX.Element {
  const isDark = tone === "dark";
  return (
    <div className="flex flex-col items-start min-w-0">
      <span
        className={
          "font-display tabular-nums leading-[0.9] text-3xl sm:text-4xl " +
          (isDark ? "text-bg" : "text-ink")
        }
      >
        {String(n).padStart(2, "0")}
      </span>
      <span
        className={
          "font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.2em] mt-1 " +
          (isDark ? "text-bg/60" : "text-muted")
        }
      >
        {label}
      </span>
    </div>
  );
}

function Sep({ tone }: { tone: "light" | "dark" }): React.JSX.Element {
  return (
    <span
      aria-hidden
      className={
        "font-display text-2xl sm:text-3xl leading-[0.9] self-center " +
        (tone === "dark" ? "text-bg/30" : "text-muted/30")
      }
    >
      ·
    </span>
  );
}
