"use client";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Props = {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  back?: { href: string; label?: string };
  className?: string;
  // "hero" (default for primary tabs): big serif masthead with ed-rule.
  // "compact" (for sub-pages like /match/[id], /inbox/[id], /admin/*):
  // slim breadcrumb so it doesn't fight a hero further down the page.
  variant?: "hero" | "compact";
};

// Editorial masthead. The page h1 lives here, big and serif, with an
// optional ed-serial subtitle line under a hairline accent rule. This
// replaces the previous text-lg sans h1 that read like a chrome label
// (May 7 founder feedback: "title of every page is too small").
//
// Two variants:
// - hero: the four primary tabs (Drop, Feed, Inbox, You) and signup /
//   onboarding screens. Display serif at text-3xl sm:text-4xl
//   lg:text-5xl, real masthead spacing.
// - compact: detail and admin pages where a hero further down owns
//   the page weight. Slim breadcrumb at text-xl serif.
export function TopBar({
  title,
  subtitle,
  right,
  back,
  className,
  variant = "hero",
}: Props) {
  const isHero = variant === "hero";
  return (
    <header
      className={cn(
        "sticky top-0 z-20 border-b border-border bg-bg/85 backdrop-blur-md",
        className
      )}
    >
      <div
        className={cn(
          "container-app",
          isHero ? "pt-6 pb-5 sm:pt-8 sm:pb-6 lg:pt-10 lg:pb-7" : "py-3"
        )}
      >
        <div
          className={cn(
            "flex gap-3",
            isHero ? "items-end justify-between" : "items-center justify-between"
          )}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {back ? (
              <Link
                href={back.href}
                className={cn(
                  "shrink-0 inline-flex items-center justify-center rounded-md text-muted hover:bg-border/50",
                  isHero ? "h-9 w-9 -ml-1.5 self-end mb-2" : "h-8 w-8 -ml-1"
                )}
                aria-label={back.label || "Back"}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M10 13L5 8l5-5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            ) : null}
            <div className="min-w-0 flex-1">
              {isHero && subtitle ? (
                <span className="ed-serial block mb-1.5">{subtitle}</span>
              ) : null}
              {title ? (
                isHero ? (
                  <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-ink leading-[1.05]">
                    {title}
                  </h1>
                ) : (
                  <h1 className="font-display text-xl sm:text-2xl text-ink leading-tight truncate">
                    {title}
                  </h1>
                )
              ) : null}
              {!isHero && subtitle ? (
                <p className="text-xs text-muted truncate mt-0.5">{subtitle}</p>
              ) : null}
            </div>
          </div>
          {right ? (
            <div className={cn("flex items-center gap-2 shrink-0", isHero && "self-end mb-2")}>
              {right}
            </div>
          ) : null}
        </div>
        {isHero ? (
          <div aria-hidden className="h-px bg-accent w-12 mt-5 sm:mt-6 lg:mt-7" />
        ) : null}
      </div>
    </header>
  );
}
