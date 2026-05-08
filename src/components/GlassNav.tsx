"use client";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";

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
      {/* Full-viewport flex. Logo only — 'Get on the list' button
          removed from the navbar at founder request (the pre-landing
          itself is the funnel, no nav CTA needed). Right side stays
          intentionally empty. */}
      <div className="h-full w-full flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
      </div>
    </header>
  );
}
