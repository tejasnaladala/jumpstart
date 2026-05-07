"use client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/drop", label: "Drop", icon: DropIcon },
  { href: "/browse", label: "Feed", icon: BrowseIcon },
  { href: "/inbox", label: "Inbox", icon: InboxIcon },
  { href: "/you", label: "You", icon: YouIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      // Floating pill at every breakpoint per founder direction: bottom
      // tabs on phone, tablet, and laptop. On phone (<sm) the pill is
      // edge-to-edge and flush with the bottom; sm+ gets the centered
      // pill. lg widens to 480 so the four tabs breathe on a laptop.
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-surface/95 backdrop-blur-md sm:rounded-2xl sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-[400px] sm:border sm:shadow-card lg:w-[480px]"
    >
      <ul className="flex items-stretch justify-around safe-area-padding-bottom px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                // Disable Next.js auto-prefetch on the bottom nav. Auto-
                // prefetch fires RSC payload requests on hover/visibility
                // for every nav target, and during server restarts (or
                // any tunnel hiccup) those requests fail with a "Failed
                // to fetch RSC payload" console error. The routes are
                // tiny and load instantly without prefetch; the noise
                // is not worth it.
                prefetch={false}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-md transition-colors",
                  active ? "text-accent" : "text-muted hover:text-ink"
                )}
              >
                <item.icon active={!!active} />
                <span className={cn("text-xxs", active && "font-semibold")}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function DropIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle
        cx="10"
        cy="10"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.6"
        fill={active ? "currentColor" : "none"}
        opacity={active ? 0.18 : 1}
      />
      <circle cx="10" cy="10" r="2" fill="currentColor" />
    </svg>
  );
}
function BrowseIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.6" fill={active ? "currentColor" : "none"} opacity={active ? 0.18 : 1} />
      <path d="M13 13l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function InboxIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M3 10l1.6-4.6A1.5 1.5 0 016 4.5h8a1.5 1.5 0 011.4 0.9L17 10v4.5A1.5 1.5 0 0115.5 16h-11A1.5 1.5 0 013 14.5V10z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill={active ? "currentColor" : "none"}
        opacity={active ? 0.18 : 1}
      />
      <path
        d="M3 10h4l1 1.5h4l1-1.5h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
function YouIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.6" fill={active ? "currentColor" : "none"} opacity={active ? 0.18 : 1} />
      <path d="M3.5 17c1.2-3.4 4-5 6.5-5s5.3 1.6 6.5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}
