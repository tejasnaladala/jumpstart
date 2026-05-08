"use client";
import { useState } from "react";
import { useToast } from "@/components/primitive/Toast";

// Compact inline waitlist: single email field + one button on a single
// row, optional handle expander. Used in the hero and the closing CTA
// where the full WaitlistForm card would feel heavy. Same /api/waitlist
// POST contract; same 8s timeout + AbortError UX as the full form.
//
// Editorial restraint per CLAUDE.md voice rules: no exclamation marks,
// no "X people in line" theater, no progress bar. Just a row that
// looks like newspaper letters-to-the-editor: hairline border, mono
// label, serif success line.

type Status = "idle" | "submitting" | "success" | "error";

type Props = {
  source?: string;
  // tone "light" = cream surface (hero); "dark" = espresso surface (closing CTA)
  tone?: "light" | "dark";
  // Handle field disabled by default (waitlist-only pre-product;
  // founder asked to drop the 'helps the founder verify' framing).
  // Kept as an opt-in flag in case we want it back later.
  allowHandle?: boolean;
  className?: string;
  placeholder?: string;
  buttonLabel?: string;
};

export function InlineWaitlist({
  source = "hero",
  tone = "light",
  allowHandle = false,
  className,
  placeholder = "you@email.com",
  buttonLabel = "Get on the list",
}: Props): React.JSX.Element {
  const [email, setEmail] = useState("");
  const [handle, setHandle] = useState("");
  const [showHandle, setShowHandle] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (status === "submitting") return;
    const trimmed = email.trim();
    if (!trimmed) return;
    setStatus("submitting");
    setError(null);
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 8_000);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          handle: handle.trim() || undefined,
          source,
        }),
        signal: ac.signal,
      });
      if (res.ok) {
        setStatus("success");
        return;
      }
      if (res.status === 429) setError("Slow down. Try again in a minute.");
      else if (res.status === 400) setError("That email looks off.");
      else setError("Could not save. Try again in a minute.");
      setStatus("error");
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        setError("Slow connection. Try again.");
      } else {
        setError("Network hiccup. Try again.");
      }
      setStatus("error");
    } finally {
      clearTimeout(t);
    }
  }

  function shareX(): void {
    const url = encodeURIComponent(
      typeof window !== "undefined" ? window.location.origin : ""
    );
    const text = encodeURIComponent(
      "On the Jumpstart list. Curated founder matches at YC SS 2026. Mon/Wed/Fri at 9pm PT."
    );
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function copyLink(): void {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard
      .writeText(window.location.origin)
      .then(() => toast.push("Link copied. Paste anywhere.", "success"))
      .catch(() => toast.push("Could not copy.", "error"));
  }

  const isDark = tone === "dark";
  const ringTone = isDark ? "focus:border-bg" : "focus:border-ink";
  const inputTone = isDark
    ? "bg-bg/10 text-bg placeholder:text-bg/60 border-bg/30"
    : "bg-bg text-ink placeholder:text-muted/70 border-border";
  // Buttons are YC orange (filled accent) on both light and dark
  // tones. Founder asked to drop the black/cream button look — orange
  // is the through-line. Cream surface (light) gets the standard
  // accent + white; espresso surface (dark) gets the same orange but
  // with a slightly hotter edge variant for pop against the dark bg.
  const buttonTone = isDark
    ? "bg-accent text-white hover:bg-accent-edge shadow-sm shadow-accent/30"
    : "bg-accent text-white hover:bg-accent-edge shadow-sm shadow-accent/20";
  const helperTone = isDark ? "text-bg/70" : "text-muted";
  const labelTone = isDark ? "text-bg/80" : "text-muted";

  if (status === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className={"flex flex-col gap-3 " + (className || "")}
      >
        <div
          aria-hidden
          className={"h-px w-12 " + (isDark ? "bg-bg" : "bg-accent")}
        />
        <p className={"ed-serial " + (isDark ? "text-bg/80" : "text-accent-text")}>
          On the list
        </p>
        <p
          className={
            "font-display italic " +
            (isDark ? "text-bg" : "text-ink") +
            " text-2xl sm:text-3xl leading-tight max-w-prose"
          }
        >
          You&apos;re in. The founder reads every entry by hand.
        </p>
        <p className={"text-sm " + helperTone + " max-w-prose leading-relaxed"}>
          Verified SS 2026 attendees go to the front. The first 50 are reviewed personally;
          expect a reply within 24 to 48 hours.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={shareX}
            className={
              "inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors " +
              (isDark
                ? "bg-bg text-ink hover:bg-bg/90"
                : "bg-ink text-bg hover:bg-ink/90")
            }
          >
            Share on X
          </button>
          <button
            type="button"
            onClick={copyLink}
            className={
              "inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors " +
              (isDark
                ? "border-bg/30 text-bg hover:bg-bg/10"
                : "border-border text-muted hover:text-ink hover:border-ink/40")
            }
          >
            Copy link
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className={"flex flex-col gap-2 " + (className || "")}
      aria-label="Join the Jumpstart waitlist"
    >
      <div className="flex flex-col sm:flex-row gap-2">
        <label htmlFor={`waitlist-email-${source}`} className="sr-only">
          Email address
        </label>
        <input
          id={`waitlist-email-${source}`}
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={() => allowHandle && setShowHandle(true)}
          placeholder={placeholder}
          maxLength={120}
          className={
            "h-12 flex-1 min-w-0 rounded-md border px-4 text-base outline-none transition-colors " +
            inputTone +
            " " +
            ringTone
          }
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className={
            "inline-flex h-12 shrink-0 items-center justify-center rounded-md px-6 text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed " +
            buttonTone
          }
        >
          {status === "submitting" ? "Saving..." : buttonLabel}
        </button>
      </div>

      {allowHandle && showHandle ? (
        <div className="flex flex-col gap-1">
          <label
            htmlFor={`waitlist-handle-${source}`}
            className={"text-[10px] uppercase tracking-[0.18em] " + labelTone}
          >
            X handle or LinkedIn (optional, helps the founder verify)
          </label>
          <input
            id={`waitlist-handle-${source}`}
            name="handle"
            type="text"
            autoComplete="url"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="@yourhandle or linkedin.com/in/you"
            maxLength={160}
            className={
              "h-10 rounded-md border px-3 text-sm outline-none transition-colors " +
              inputTone +
              " " +
              ringTone
            }
          />
        </div>
      ) : null}

      {error ? (
        <p
          role="alert"
          className={
            "text-xs " + (isDark ? "text-bg/80" : "text-error")
          }
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}
