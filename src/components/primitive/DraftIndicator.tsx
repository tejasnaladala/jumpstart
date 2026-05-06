"use client";
import type { DraftStatus } from "@/lib/hooks/useDraftState";
import { cn } from "@/lib/utils";

type Props = {
  status: DraftStatus;
  className?: string;
  // Show the timestamp of the last save in mono caps (e.g., "Saved 19:42 PT").
  timestamp?: string;
};

// Tiny editorial save-state indicator. Renders in the corner of forms and
// editors so the user trusts the page won't lose their work on a refresh.
// Pattern lifted from taste-skill (mono caps, hairline color) + impeccable
// (the inset dot mark for state).
//
// A11y: visible chrome is decorative (aria-hidden); the screen-reader only
// hears terminal transitions ("Draft saved", "Save failed") via a separate
// polite live region. Per Fool review: aria-live + aria-atomic on the
// outer span screamed every 350ms during typing as the dirty -> saving ->
// saved cycle ran. Now silent during typing, only announces on settled
// terminal states.
export function DraftIndicator({ status, className, timestamp }: Props) {
  const label =
    status === "saving"
      ? "Saving…"
      : status === "saved"
      ? "Saved"
      : status === "dirty"
      ? "Unsaved changes"
      : status === "error"
      ? "Save failed"
      : "Auto-saving";

  const dotColor =
    status === "saving"
      ? "bg-accent"
      : status === "saved"
      ? "bg-success"
      : status === "dirty"
      ? "bg-accent-edge"
      : status === "error"
      ? "bg-error"
      : "bg-muted/40";

  // Only announce terminal states ("saved" or "error") to screen readers.
  // Skip the typing churn ("dirty" / "saving") which would interrupt every
  // few hundred ms.
  const announceMessage =
    status === "saved"
      ? `Draft saved${timestamp ? ` at ${timestamp}` : ""}`
      : status === "error"
      ? "Save failed. Check storage quota or private browsing mode."
      : "";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted",
        status === "error" && "text-error",
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "h-1.5 w-1.5 rounded-full transition-colors",
          dotColor,
          status === "saving" && "animate-pulse"
        )}
      />
      <span aria-hidden>{label}</span>
      {status === "saved" && timestamp ? (
        <span className="opacity-60" aria-hidden>
          / {timestamp}
        </span>
      ) : null}
      {/* Polite live region: only fires on terminal states */}
      <span role="status" aria-live="polite" className="sr-only">
        {announceMessage}
      </span>
    </span>
  );
}
