import { cn } from "@/lib/utils";
import Link from "next/link";

export function Logo({
  size = 28,
  href = "/",
  withWord = true,
  className,
}: {
  size?: number;
  href?: string;
  withWord?: boolean;
  className?: string;
}) {
  // Refined for the YC SS 2026 cream palette: orange J on transparent
  // background, no black square. The mark is the orange hook plus a single
  // dot. Stroke weight scales with size so it stays crisp at any scale.
  const stroke = Math.max(2.4, size * 0.085);
  const dotR = Math.max(1.5, size * 0.055);

  const inner = (
    // Icon + wordmark sit on a single horizontal line, vertically
    // centered together. items-center (not items-baseline) so the
    // wordmark doesn't float above the icon — founder flagged the
    // baseline-alignment as misaligned.
    <span
      className={cn(
        "inline-flex items-center gap-1.5 select-none",
        className
      )}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        aria-label="Jumpstart logo"
      >
        <path
          d="M9 12c0-1.5 1-2.5 2.5-2.5h6c2 0 3.5 1.5 3.5 3.5v6c0 3-2 4.5-4.5 4.5-2 0-3.5-1-3.5-3"
          stroke="#FF6600"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="22" cy="11" r={dotR} fill="#FF6600" />
      </svg>
      {withWord ? (
        <span className="text-[17px] font-semibold tracking-[-0.015em] text-ink leading-none">
          Jumpstart
        </span>
      ) : null}
    </span>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
