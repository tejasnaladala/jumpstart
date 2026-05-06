"use client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/drop", label: "Drop", icon: DropIcon },
  { href: "/browse", label: "Browse", icon: BrowseIcon },
  { href: "/you", label: "You", icon: YouIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-surface/95 backdrop-blur-md sm:rounded-2xl sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-[400px] sm:border sm:shadow-card"
    >
      <ul className="flex items-stretch justify-around safe-area-padding-bottom px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
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
function YouIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.6" fill={active ? "currentColor" : "none"} opacity={active ? 0.18 : 1} />
      <path d="M3.5 17c1.2-3.4 4-5 6.5-5s5.3 1.6 6.5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}
