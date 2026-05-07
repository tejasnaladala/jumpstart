"use client";
import { Button } from "@/components/primitive/Button";
import { Input } from "@/components/primitive/Input";
import { StepDots } from "@/components/ProgressBar";
import { Sheet } from "@/components/primitive/Sheet";
import { DraftIndicator } from "@/components/primitive/DraftIndicator";
import { useDraftState } from "@/lib/hooks/useDraftState";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { enqueue } from "@/lib/moderation/queue";

type VerificationDraft = {
  emailSubject: string;
  referral: string;
  // Fortified verification (May 7 2026): per founder direction, add
  // phone number, email re-confirm (display-only, OTP deferred to
  // PocketBase backend), and a ticket photo upload. Each of these
  // pieces is bundled into a single moderation queue item the founder
  // approves manually for the first ~50 users.
  phone: string;
  email: string;
  ticketDataUrl: string; // data: URL of the uploaded ticket image
  ticketName: string;    // original filename for admin display
  opts: {
    sf: boolean;
    india: boolean;
    remote: boolean;
    notSure: boolean;
    asyncOk: boolean;
    inPerson: boolean;
  };
};

const EMPTY: VerificationDraft = {
  emailSubject: "",
  referral: "",
  phone: "",
  email: "",
  ticketDataUrl: "",
  ticketName: "",
  opts: {
    sf: false,
    india: false,
    remote: false,
    notSure: false,
    asyncOk: true,
    inPerson: true,
  },
};

export default function VerificationStep() {
  const [draft, setDraft, status] = useDraftState<VerificationDraft>(
    "jumpstart.onboarding.verification",
    EMPTY,
    { debounceMs: 300 }
  );
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const router = useRouter();

  const { emailSubject, referral, phone, email, ticketDataUrl, ticketName, opts } = draft;

  // Fortified gates (May 7):
  //   - phone (required, simple regex for digits + length)
  //   - email (required at this step; signup also collects, but we
  //     display + confirm here so the user is reminded what we use)
  //   - ticket photo OR (acceptance email subject OR referral code)
  //     The ticket is the strongest proof; subject/referral are softer
  //     fallbacks for users who didn't keep the email.
  //   - location (one of sf/india/remote/notSure)
  const phoneClean = phone.replace(/[^\d+]/g, "");
  const phoneValid = phoneClean.length >= 7 && phoneClean.length <= 15;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const proofProvided =
    Boolean(ticketDataUrl) ||
    emailSubject.trim().length > 5 ||
    referral.trim().length > 2;
  const locationPicked = opts.sf || opts.india || opts.remote || opts.notSure;
  const ready = phoneValid && emailValid && proofProvided && locationPicked;

  const blockedReason = !phoneValid
    ? "Add a valid phone number (7-15 digits, with country code)."
    : !emailValid
    ? "Add a valid email."
    : !proofProvided
    ? "Upload your YC ticket photo, or add the email subject / referral code."
    : !locationPicked
    ? "Tell us where you'll be during SS."
    : "";

  function onNext() {
    // Submit a verification request to the moderation queue. Founder
    // reviews at /admin/moderation Verifications tab and flips trust
    // tier manually for each one in the first ~50 users.
    try {
      const idRaw = typeof window !== "undefined"
        ? window.localStorage.getItem("jumpstart.onboarding.identity")
        : null;
      let identityName = "Pending user";
      if (idRaw) {
        const parsed = JSON.parse(idRaw) as { data?: { name?: string } };
        if (parsed?.data?.name) identityName = parsed.data.name;
      }
      enqueue({
        kind: "verification",
        triggered_by: "self",
        target_id: "self",
        target_kind: "user",
        target_label: identityName,
        target_snippet:
          `phone=${phoneClean.slice(0, 4)}*** email=${email.slice(0, 5)}*** ` +
          `ticket=${ticketDataUrl ? "uploaded" : "not_uploaded"} ` +
          `subject=${emailSubject ? "set" : "empty"} referral=${referral ? "set" : "empty"}`,
        reasons: [
          ticketDataUrl ? "ticket_uploaded" : "no_ticket",
          emailSubject ? "subject_provided" : "subject_empty",
          referral ? "referral_provided" : "referral_empty",
        ],
        severity: "low",
      });
    } catch {
      // queue write is non-fatal; the user still proceeds
    }
    router.push("/onboarding/intent");
  }

  function set<K extends keyof VerificationDraft>(k: K, v: VerificationDraft[K]) {
    setDraft((s) => ({ ...s, [k]: v }));
  }
  function setOpt<K extends keyof VerificationDraft["opts"]>(
    k: K,
    v: VerificationDraft["opts"][K]
  ) {
    setDraft((s) => ({ ...s, opts: { ...s.opts, [k]: v } }));
  }

  function onTicketChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Cap at 4MB to keep localStorage from blowing up. Real backend
    // (PocketBase or S3) handles larger files later.
    if (file.size > 4 * 1024 * 1024) {
      // eslint-disable-next-line no-alert
      alert("Image too large. Keep it under 4MB or screenshot a smaller crop.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || "");
      setDraft((s) => ({ ...s, ticketDataUrl: url, ticketName: file.name }));
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="container-app pt-6 pb-3">
        <StepDots current={2} total={4} />
      </div>
      <div className="container-app flex-1 pb-32">
        <p className="text-xxs uppercase tracking-wider text-accent font-semibold mt-3">
          Step 2 of 4
        </p>
        <h1 className="font-display text-3xl text-ink leading-tight mt-1">Verify you are in the cohort</h1>
        <p className="text-sm text-muted mt-2">
          Soft verification gets you in within seconds. A reviewer flips you to full visibility within 24 hours.
        </p>

        <p className="text-xxs uppercase tracking-wider text-muted font-semibold mt-7 mb-3">
          Contact
        </p>
        <div className="flex flex-col gap-3">
          <Input
            label="Email"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => set("email", e.target.value)}
            hint="Used for drop notifications. We never sell, share, or list this anywhere."
            maxLength={120}
          />
          <Input
            label="Phone number"
            type="tel"
            placeholder="+1 415 555 0123"
            value={phone}
            onChange={(e) => set("phone", e.target.value)}
            hint="Founder-only. For trust verification. Never displayed to other attendees."
            maxLength={20}
          />
        </div>

        <p className="text-xxs uppercase tracking-wider text-muted font-semibold mt-7 mb-3">
          Acceptance proof
        </p>
        <div className="flex flex-col gap-3">
          <div className="surface p-4">
            <p className="text-xs font-semibold text-ink mb-1">
              Upload your YC ticket photo (recommended)
            </p>
            <p className="text-xs text-muted mb-3 leading-relaxed">
              Screenshot of your YC Startup School acceptance ticket or email
              header. Reviewed by the founder, deleted within 24h of verification.
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={onTicketChange}
              className="block w-full text-xs file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border file:border-border file:bg-bg file:text-ink file:font-medium file:cursor-pointer hover:file:border-ink/40"
            />
            {ticketDataUrl ? (
              <div className="mt-3 flex items-center gap-3">
                <img
                  src={ticketDataUrl}
                  alt={`Uploaded ticket ${ticketName}`}
                  className="w-20 h-20 object-cover rounded-md border border-border"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-ink truncate">{ticketName}</p>
                  <button
                    type="button"
                    onClick={() => setDraft((s) => ({ ...s, ticketDataUrl: "", ticketName: "" }))}
                    className="text-xxs text-error hover:underline mt-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="text-xxs uppercase tracking-wider text-muted font-mono text-center my-1">
            or fall back to
          </div>

          <Input
            label="Acceptance email subject line"
            placeholder="Welcome to YC Startup School 2026"
            value={emailSubject}
            onChange={(e) => set("emailSubject", e.target.value)}
            hint="The subject line of the YC email confirming your acceptance."
            maxLength={120}
            showCounter
          />
          <Input
            label="Referral code"
            placeholder="From a verified attendee"
            value={referral}
            onChange={(e) => set("referral", e.target.value)}
            maxLength={40}
            showCounter
          />
        </div>

        <p className="text-xxs uppercase tracking-wider text-muted font-semibold mt-8 mb-3">
          Where will you be during SS? You can pick more than one.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: "sf", label: "Going to SF" },
            { key: "india", label: "Attended India" },
            { key: "remote", label: "Remote / global" },
            { key: "notSure", label: "Not sure yet" },
          ].map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => setOpt(o.key as keyof VerificationDraft["opts"], !opts[o.key as keyof VerificationDraft["opts"]])}
              className={`surface px-4 py-3 text-left text-sm transition-all ${opts[o.key as keyof VerificationDraft["opts"]] ? "border-ink shadow-card" : "hover:border-ink/40"}`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <p className="text-xxs uppercase tracking-wider text-muted font-semibold mt-7 mb-3">
          How you want to meet
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Toggle
            on={opts.asyncOk}
            label="Open to async"
            onChange={() => setOpt("asyncOk", !opts.asyncOk)}
          />
          <Toggle
            on={opts.inPerson}
            label="Open to in-person"
            onChange={() => setOpt("inPerson", !opts.inPerson)}
          />
        </div>

        <p className="text-xs text-muted mt-7 leading-relaxed">
          We delete acceptance proof within 24 hours of review and never display your phone number or
          exact location.{" "}
          <button
            type="button"
            onClick={() => setPrivacyOpen(true)}
            className="text-ink underline hover:text-accent transition-colors"
          >
            Read the privacy summary.
          </button>
        </p>
      </div>

      <div className="border-t border-border bg-surface sticky bottom-0">
        <div className="container-app py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs text-muted whitespace-nowrap">Verification</span>
            <DraftIndicator status={status} className="hidden sm:inline-flex" />
          </div>
          <div className="flex items-center gap-3">
            {blockedReason ? (
              <span className="text-xs text-muted hidden sm:inline">{blockedReason}</span>
            ) : null}
            <Button onClick={onNext} disabled={!ready}>Continue</Button>
          </div>
        </div>
      </div>

      <Sheet
        open={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
        title="Privacy summary"
      >
        <p className="text-sm text-muted leading-relaxed mb-4">
          Five things Jumpstart does not do, ever:
        </p>
        <ul className="space-y-3 text-sm text-ink">
          <li className="flex items-start gap-2">
            <span className="text-accent">·</span>
            <span>Show your phone number to anyone, ever.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent">·</span>
            <span>Display your exact location, only city.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent">·</span>
            <span>Rank attendees publicly. No leaderboard.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent">·</span>
            <span>Tell you how many people viewed your card.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent">·</span>
            <span>Keep your acceptance proof beyond 24 hours after review.</span>
          </li>
        </ul>
      </Sheet>
    </div>
  );
}

function Toggle({ on, label, onChange }: { on: boolean; label: string; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`flex items-center justify-between gap-3 surface px-4 py-3 text-sm transition-all ${on ? "border-ink shadow-card" : "hover:border-ink/40"}`}
    >
      <span>{label}</span>
      <span
        className={`w-9 h-5 rounded-full p-0.5 transition-all ${on ? "bg-ink" : "bg-border"}`}
      >
        <span
          className={`block w-4 h-4 rounded-full bg-white transition-transform ${on ? "translate-x-4" : "translate-x-0"}`}
        />
      </span>
    </button>
  );
}
