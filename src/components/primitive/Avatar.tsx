"use client";
import { cn, initialsFrom } from "@/lib/utils";

const PALETTE = [
  "#1A1A1A",
  "#C45612",
  "#2E5A88",
  "#1E5C3A",
  "#7B2D8E",
  "#A33B3B",
];

function colorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length]!;
}

export function Avatar({ name, size = 40, className }: { name: string; size?: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full text-white font-medium",
        className
      )}
      style={{
        width: size,
        height: size,
        background: colorFor(name),
        fontSize: Math.round(size * 0.36),
      }}
      aria-label={name}
    >
      {initialsFrom(name)}
    </span>
  );
}
