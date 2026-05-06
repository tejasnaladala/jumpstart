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
  const inner = (
    <span className={cn("inline-flex items-center gap-2 select-none", className)}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect x="2" y="2" width="28" height="28" rx="7" fill="#1A1A1A" />
        <path
          d="M9 12c0-1.5 1-2.5 2.5-2.5h6c2 0 3.5 1.5 3.5 3.5v6c0 3-2 4.5-4.5 4.5-2 0-3.5-1-3.5-3"
          stroke="#C45612"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="22" cy="11" r="1.6" fill="#C45612" />
      </svg>
      {withWord ? (
        <span className="text-base font-semibold tracking-tight text-ink">jumpstart</span>
      ) : null}
    </span>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
