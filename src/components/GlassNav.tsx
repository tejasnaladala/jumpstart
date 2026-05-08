"use client";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";

// Glass-morph nav inspired by ditto.ai: transparent at top, switches to
// cream-tinted backdrop-blur after the first scroll commit. Fixed
// position, 72px tall, full-width.
//
// Audit pass: the nav was logo-only. Once the user scrolled past the
// pre-landing brand splash, there was no above-the-fold conversion
// surface anywhere on screen. Added a "Get on the graph" CTA anchor
// that fades in at the same scroll threshold as the glass background
// (24px). The CTA links to #waitlist (the InlineWaitlist anchor in
// the hero), so a click smooth-scrolls back to the form.

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
      <div className="h-full w-full flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        {/* CTA fades in once the user has scrolled past the pre-landing.
            Hidden on small screens (the floating bottom waitlist anchor
            covers mobile conversion well enough). */}
        <a
          href="#waitlist"
          className={
            "hidden sm:inline-flex h-10 items-center rounded-md bg-accent text-white px-4 text-sm font-semibold transition-all duration-300 hover:bg-accent-edge focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent " +
            (scrolled
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-1 pointer-events-none")
          }
          aria-label="Jump to the waitlist form"
        >
          Get on the graph
        </a>
      </div>
    </header>
  );
}
