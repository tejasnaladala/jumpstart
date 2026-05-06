"use client";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Props = {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  back?: { href: string; label?: string };
  className?: string;
};

export function TopBar({ title, subtitle, right, back, className }: Props) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 border-b border-border bg-bg/85 backdrop-blur-md",
        className
      )}
    >
      <div className="container-app flex items-center justify-between gap-3 py-3">
        <div className="flex items-center gap-3 min-w-0">
          {back ? (
            <Link
              href={back.href}
              className="-ml-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-border/50"
              aria-label={back.label || "Back"}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 13L5 8l5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ) : null}
          <div className="min-w-0">
            {title ? (
              <h1 className="text-lg font-semibold text-ink truncate">{title}</h1>
            ) : null}
            {subtitle ? <p className="text-xs text-muted truncate">{subtitle}</p> : null}
          </div>
        </div>
        {right ? <div className="flex items-center gap-2">{right}</div> : null}
      </div>
    </header>
  );
}
