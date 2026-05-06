"use client";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion, sheetRise, overlayFade } from "@/components/motion";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
};

export function Sheet({ open, onClose, title, children, footer, size = "md" }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            variants={overlayFade}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            variants={sheetRise}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              "relative w-full bg-surface border-t border-border sm:border sm:rounded-2xl shadow-hover",
              "max-h-[92vh] flex flex-col",
              size === "sm" && "sm:max-w-md",
              size === "md" && "sm:max-w-lg",
              size === "lg" && "sm:max-w-2xl"
            )}
          >
            {title ? (
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h3 className="text-base font-semibold text-ink">{title}</h3>
                <button
                  onClick={onClose}
                  className="-mr-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-border/50 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : null}
            <div className="overflow-y-auto px-5 py-4 flex-1">{children}</div>
            {footer ? (
              <div className="border-t border-border px-5 py-3 flex items-center justify-end gap-2">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
