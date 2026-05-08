"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

// GooeyText — morphs between a list of words via SVG threshold filter
// (the "metaball" / lava-lamp effect). Adapted from the 21st.dev
// gooey-text-morphing component for INLINE use (the original was a
// centered display block; we need it to sit inside a sentence
// inheriting font-size + italic + color from the parent <p>).
//
// Adaptation:
//   - Wrapped in an inline-block container with explicit width set
//     by an invisible "sizer" span containing the longest text.
//     This prevents the surrounding sentence from reflowing as the
//     word changes (different word lengths would jump the layout
//     otherwise).
//   - Both animated spans inherit font-size, font-family, font-style,
//     color from the parent. No hardcoded text-6xl etc.
//   - SVG filter id is randomized so multiple instances on the same
//     page don't collide.

type Props = {
  texts: string[];
  // Time (sec) for the morph between two consecutive words.
  morphTime?: number;
  // Time (sec) the current word stays fully visible before next morph.
  cooldownTime?: number;
  className?: string;
};

export function GooeyText({
  texts,
  morphTime = 1,
  cooldownTime = 1.6,
  className,
}: Props): React.JSX.Element {
  const text1Ref = React.useRef<HTMLSpanElement>(null);
  const text2Ref = React.useRef<HTMLSpanElement>(null);
  // Stable per-instance filter id so multiple <GooeyText> on the same
  // page don't reuse the same SVG filter (which would cause one to
  // override the other's threshold matrix).
  const filterId = React.useId().replace(/[:]/g, "");
  const filterRef = `gooey-${filterId}`;

  React.useEffect(() => {
    let textIndex = texts.length - 1;
    let time = new Date();
    let morph = 0;
    let cooldown = cooldownTime;
    let raf = 0;
    let cancelled = false;

    const setMorph = (fraction: number): void => {
      const t1 = text1Ref.current;
      const t2 = text2Ref.current;
      if (!t1 || !t2) return;
      // Incoming text fades in, blur shrinks
      t2.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
      t2.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;
      // Outgoing text fades out, blur grows
      const inv = 1 - fraction;
      t1.style.filter = `blur(${Math.min(8 / inv - 8, 100)}px)`;
      t1.style.opacity = `${Math.pow(inv, 0.4) * 100}%`;
    };

    const doCooldown = (): void => {
      morph = 0;
      const t1 = text1Ref.current;
      const t2 = text2Ref.current;
      if (!t1 || !t2) return;
      t2.style.filter = "";
      t2.style.opacity = "100%";
      t1.style.filter = "";
      t1.style.opacity = "0%";
    };

    const doMorph = (): void => {
      morph -= cooldown;
      cooldown = 0;
      let fraction = morph / morphTime;
      if (fraction > 1) {
        cooldown = cooldownTime;
        fraction = 1;
      }
      setMorph(fraction);
    };

    const animate = (): void => {
      if (cancelled) return;
      raf = requestAnimationFrame(animate);
      const newTime = new Date();
      const shouldIncrementIndex = cooldown > 0;
      const dt = (newTime.getTime() - time.getTime()) / 1000;
      time = newTime;
      cooldown -= dt;

      if (cooldown <= 0) {
        if (shouldIncrementIndex) {
          textIndex = (textIndex + 1) % texts.length;
          if (text1Ref.current && text2Ref.current) {
            text1Ref.current.textContent =
              texts[textIndex % texts.length] ?? "";
            text2Ref.current.textContent =
              texts[(textIndex + 1) % texts.length] ?? "";
          }
        }
        doMorph();
      } else {
        doCooldown();
      }
    };
    animate();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [texts, morphTime, cooldownTime]);

  // Width-sizer: invisible span containing the longest text. Sets the
  // inline width of the wrapper so the surrounding sentence doesn't
  // reflow when the word changes.
  const longestText = texts.reduce(
    (a, b) => (b.length > a.length ? b : a),
    texts[0] ?? ""
  );

  return (
    <span
      className={cn(
        "relative inline-block align-baseline whitespace-nowrap",
        className
      )}
    >
      {/* SVG filter — threshold matrix produces the metaball merge */}
      <svg className="absolute h-0 w-0" aria-hidden="true" focusable="false">
        <defs>
          <filter id={filterRef}>
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 255 -140"
            />
          </filter>
        </defs>
      </svg>

      {/* Sizer — invisible, sets the inline width to the longest word.
          Inherits all font properties from the parent so the width
          calculation matches the rendered text. */}
      <span aria-hidden className="invisible">
        {longestText}
      </span>

      {/* Animated layer — absolutely positioned over the sizer. Both
          spans are absolute and overlap; the threshold filter merges
          them as they fade between blur states. */}
      <span
        aria-live="polite"
        className="absolute inset-0 inline-flex items-baseline justify-start"
        style={{ filter: `url(#${filterRef})` }}
      >
        <span
          ref={text1Ref}
          className="absolute inset-0 inline-block whitespace-nowrap"
        >
          {texts[texts.length - 1] ?? ""}
        </span>
        <span
          ref={text2Ref}
          className="absolute inset-0 inline-block whitespace-nowrap"
        >
          {texts[0] ?? ""}
        </span>
      </span>
    </span>
  );
}
