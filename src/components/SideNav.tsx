"use client";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Desktop-only side nav. Replaces the floating BottomNav on lg+
// breakpoints. Vertical stack on the left, fixed position, narrow
// rail with icon + label per route. Logo at top. Sign-out link
// lives in /you so we don't duplicate it here.

const NAV_ITEMS = [
  { href: "/drop", label: "Drop", icon: DropIcon },
  { href: "/browse", label: "Feed", icon: FeedIcon },
  { href: "/inbox", label: "Inbox", icon: InboxIcon },
  { href: "/you", label: "You", icon: YouIcon },
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="hidden lg:flex fixed top-0 left-0 bottom-0 z-30 w-[200px] flex-col border-r border-border bg-bg/95 backdrop-blur-md"
    >
      <div className="px-5 pt-6 pb-4 border-b border-border/60">
        <Logo />
      </div>
      <ul className="flex flex-col gap-1 px-3 py-5">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                prefetch={false}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors",
                  active
                    ? "bg-accent-soft/60 text-accent"
                    : "text-muted hover:text-ink hover:bg-bg/60"
                )}
              >
                <item.icon active={!!active} />
                <span className={cn("text-sm", active && "font-semibold")}>
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto px-5 py-5 border-t border-border/60">
        <p className="text-xxs uppercase tracking-wider text-muted font-mono">
          Cohort SS 2026
        </p>
        <p className="text-xxs text-muted/70 mt-1 leading-relaxed">
          Mon, Wed, Fri at 9pm PT. One curated match per drop.
        </p>
      </div>
    </nav>
  );
}

function DropIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
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
function FeedIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <circle
        cx="9"
        cy="9"
        r="5.5"
        stroke="currentColor"
        strokeWidth="1.6"
        fill={active ? "currentColor" : "none"}
        opacity={active ? 0.18 : 1}
      />
      <path d="M13 13l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function InboxIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
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
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <circle
        cx="10"
        cy="7"
        r="3"
        stroke="currentColor"
        strokeWidth="1.6"
        fill={active ? "currentColor" : "none"}
        opacity={active ? 0.18 : 1}
      />
      <path
        d="M3.5 17c1.2-3.4 4-5 6.5-5s5.3 1.6 6.5 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
