"use client";
import { useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  // Optional folio numeral shown to the left of the label. Pattern lifted
  // from huashu-design vertical rhythm + the cohort composition list.
  folio?: string;
  // Optional editorial note rendered to the right of the label, aligned
  // with the +/- toggle. Mono caps.
  note?: string;
};

// Editorial accordion entry with a +/- toggle on the right and a slow
// reveal of the body. Pattern lifted from taste-skill: the explicit + and -
// glyphs (no chevrons), the hairline rule above the row, and the slow
// trail-out on close. Use for collapsible founder-card lines and FAQ-style
// blocks.
export function AccordionLine({
  label,
  children,
  defaultOpen = false,
  className,
  folio,
  note,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className={cn("border-t border-border", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={id}
        className={cn(
          "w-full flex items-center gap-4 py-4",
          "text-left group rounded-md",
          // Visible focus ring for keyboard users. The global focus-visible
          // shadow at globals.css:71 doesn't fully wrap a row-button, so we
          // override outline:none with a ring that reads on cream. Closes
          // Codex M2.
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        )}
      >
        {folio ? (
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent w-8 shrink-0">
            {folio}
          </span>
        ) : null}
        <span className="font-display text-xl text-ink leading-none">{label}</span>
        {note ? (
          <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.16em] text-muted hidden sm:inline">
            {note}
          </span>
        ) : null}
        <span
          aria-hidden
          className={cn(
            "flex-none w-7 h-7 inline-flex items-center justify-center",
            "font-mono text-base text-muted",
            "border border-border-strong rounded-md transition-all",
            "group-hover:border-ink/40 group-hover:text-ink",
            !note && "ml-auto"
          )}
        >
          {open ? "–" : "+"}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={id}
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
            }}
            className="overflow-hidden"
          >
            <div className="pb-5 pl-12 pr-2 text-sm text-muted leading-relaxed">
              {children}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
