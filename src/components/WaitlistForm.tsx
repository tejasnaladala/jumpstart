"use client";
import { useState } from "react";
import { useToast } from "@/components/primitive/Toast";

// Public waitlist form for the landing page. Single email field with
// optional handle and one-line "what are you building". Submit POSTs to
// /api/waitlist; on success the form swaps to a confirmation state with
// share-to-X / share-to-LinkedIn helpers so the founder can amplify on
// the same channels they're publishing the page to.
//
// Closed-beta posture: anyone can join the waitlist, the founder reviews
// the list manually and invites people via the existing onboarding flow.
// This avoids letting random non-attendees into the cohort feed while
// still capturing demand from organic LinkedIn / X traffic.

type Status = "idle" | "submitting" | "success" | "error";

const SHARE_TEXT_X =
  "Just got on the Jumpstart waitlist. Pre-event matchmaker for YC Startup School 2026. One curated founder match per drop, Mon Wed Fri at 9pm PT.";
const SHARE_TEXT_LINKEDIN = SHARE_TEXT_X;

export function WaitlistForm({
  source,
  className,
}: {
  // Optional: where on the page this form sits, so we can attribute
  // hero conversions vs footer conversions in the JSONL log.
  source?: string;
  className?: string;
}) {
  const [email, setEmail] = useState("");
  const [handle, setHandle] = useState("");
  const [building, setBuilding] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting") return;
    const trimmed = email.trim();
    if (!trimmed) return;
    setStatus("submitting");
    setError(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          handle: handle.trim() || undefined,
          building: building.trim() || undefined,
          source,
        }),
      });
      if (res.ok) {
        setStatus("success");
        return;
      }
      if (res.status === 429) {
        setError("Slow down. Try again in a minute.");
      } else if (res.status === 400) {
        setError("That email looks off. Double-check and try again.");
      } else {
        setError("Could not save. Try again in a minute.");
      }
      setStatus("error");
    } catch {
      setError("Network hiccup. Try again.");
      setStatus("error");
    }
  }

  function shareX() {
    const url = encodeURIComponent(typeof window !== "undefined" ? window.location.origin : "");
    const text = encodeURIComponent(SHARE_TEXT_X);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function shareLinkedIn() {
    const url = encodeURIComponent(typeof window !== "undefined" ? window.location.origin : "");
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function copyLink() {
    const url = typeof window !== "undefined" ? window.location.origin : "";
    if (!url) return;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.push("Link copied. Paste anywhere.", "success"))
      .catch(() => toast.push("Could not copy. Long-press the URL bar.", "error"));
  }

  if (status === "success") {
    return (
      <div
        className={
          "surface p-6 sm:p-8 bg-bg/60 " + (className || "")
        }
      >
        <div aria-hidden className="h-px bg-accent w-12 mb-5" />
        <p className="ed-serial text-accent">On the list</p>
        <h2 className="font-display text-2xl sm:text-3xl text-ink leading-tight mt-3">
          You&apos;re in. The founder reviews the list by hand.
        </h2>
        <p className="text-sm text-muted mt-3 leading-relaxed max-w-prose">
          The first 50 invites are manually curated. If you&apos;re a verified SS 2026 attendee
          who&apos;s built something serious, the invite lands in your inbox within a few days.
          Tell another founder who&apos;d match well with the cohort.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={shareX}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-md bg-ink text-bg text-sm font-medium hover:bg-ink/90 transition-colors"
          >
            <XLogo />
            Share on X
          </button>
          <button
            type="button"
            onClick={shareLinkedIn}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-md border border-border bg-surface text-ink text-sm font-medium hover:border-ink/40 transition-colors"
          >
            <LinkedInLogo />
            Share on LinkedIn
          </button>
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-md border border-border bg-surface text-muted text-sm font-medium hover:text-ink hover:border-ink/40 transition-colors"
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
      className={
        "surface p-6 sm:p-8 bg-bg/60 flex flex-col gap-4 " + (className || "")
      }
    >
      <div aria-hidden className="h-px bg-accent w-12" />
      <div>
        <p className="ed-serial">Join the waitlist</p>
        <h2 className="font-display text-2xl sm:text-3xl text-ink leading-tight mt-2">
          One curated founder match, three times a week.
        </h2>
        <p className="text-sm text-muted mt-2 leading-relaxed max-w-prose">
          Drop your email. The founder reads every entry and invites verified SS 2026 attendees
          first. No spam, no marketing list.
        </p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xxs uppercase tracking-wider text-muted font-semibold">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          maxLength={120}
          className="text-sm h-11 px-3 rounded-md border border-border bg-bg text-ink placeholder:text-muted/70 focus:outline-none focus:border-ink"
          autoComplete="email"
          inputMode="email"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xxs uppercase tracking-wider text-muted font-semibold">
          X handle or LinkedIn (optional)
        </span>
        <input
          type="text"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="@yourhandle or linkedin.com/in/you"
          maxLength={160}
          className="text-sm h-11 px-3 rounded-md border border-border bg-bg text-ink placeholder:text-muted/70 focus:outline-none focus:border-ink"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xxs uppercase tracking-wider text-muted font-semibold">
          What are you building (optional)
        </span>
        <input
          type="text"
          value={building}
          onChange={(e) => setBuilding(e.target.value)}
          placeholder="One line. Plain English."
          maxLength={280}
          className="text-sm h-11 px-3 rounded-md border border-border bg-bg text-ink placeholder:text-muted/70 focus:outline-none focus:border-ink"
        />
      </label>

      <div className="flex items-center justify-between gap-3 pt-1">
        <p className="text-xxs text-muted">
          Already accepted to SS 2026?{" "}
          <a href="/signup" className="underline hover:text-ink">
            Skip the line
          </a>
          .
        </p>
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex items-center justify-center h-11 px-5 rounded-md bg-ink text-bg text-sm font-semibold hover:bg-ink/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === "submitting" ? "Saving..." : "Join the waitlist"}
        </button>
      </div>

      {error ? <p className="text-xs text-error mt-1">{error}</p> : null}
    </form>
  );
}

function XLogo() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInLogo() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.27 2.38 4.27 5.47zM5.34 7.43a2.06 2.06 0 11.001-4.121 2.06 2.06 0 010 4.121zM7.12 20.45H3.56V9h3.56zM22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46C23.2 24 24 23.23 24 22.28V1.72C24 .77 23.2 0 22.23 0z" />
    </svg>
  );
}
