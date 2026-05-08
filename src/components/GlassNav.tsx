"use client";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import Link from "next/link";

// Glass-morph nav inspired by ditto.ai: transparent at top, switches to
// cream-tinted backdrop-blur after the first scroll commit. Fixed position,
// 72px tall, full-width. Uses an IntersectionObserver-style scroll listener
// (not framer-motion useScroll, to keep the nav out of the framer-motion
// boundary and lower the bundle on the public landing).

export function GlassNav(): React.JSX.Element {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = (): void => {
      setScrolled(window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={
        "fixed top-0 left-0 right-0 z-30 h-[72px] transition-colors duration-300 " +
        (scrolled
          ? "bg-bg/85 backdrop-blur-md border-b border-border"
          : "bg-transparent border-b border-transparent")
      }
    >
      <div className="container-wide h-full flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/signup"
            className="hidden sm:inline-flex items-center px-3 py-2 text-muted hover:text-ink transition-colors"
          >
            Sign in
          </Link>
          <a
            href="#waitlist"
            className="inline-flex h-10 items-center rounded-full bg-ink px-4 text-sm font-semibold text-bg transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Get on the list
          </a>
        </nav>
      </div>
    </header>
  );
}
