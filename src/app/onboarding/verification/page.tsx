"use client";
import { Button } from "@/components/primitive/Button";
import { Input } from "@/components/primitive/Input";
import { StepDots } from "@/components/ProgressBar";
import { Sheet } from "@/components/primitive/Sheet";
import { DraftIndicator } from "@/components/primitive/DraftIndicator";
import { useDraftState } from "@/lib/hooks/useDraftState";
import { useState } from "react";
import { useRouter } from "next/navigation";

type VerificationDraft = {
  emailSubject: string;
  referral: string;
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
  // Auto-save every keystroke + toggle. Closes DX top finding (early
  // onboarding steps lacked save state).
  const [draft, setDraft, status] = useDraftState<VerificationDraft>(
    "jumpstart.onboarding.verification",
    EMPTY,
    { debounceMs: 300 }
  );
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const router = useRouter();

  const { emailSubject, referral, opts } = draft;

  const proofProvided =
    emailSubject.trim().length > 5 || referral.trim().length > 2;
  const locationPicked = opts.sf || opts.india || opts.remote || opts.notSure;
  const ready = proofProvided && locationPicked;

  // Inline hint that names the second requirement when only the first is
  // satisfied. Closes DX top finding (silent disabled-button is hostile).
  const blockedReason = !proofProvided
    ? "Add the email subject line or a referral code."
    : !locationPicked
    ? "And tell us where you'll be during SS."
    : "";

  function onNext() {
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
          Pick at least one
        </p>
        <div className="flex flex-col gap-3">
          <Input
            label="Acceptance email subject line"
            placeholder='Welcome to YC Startup School 2026'
            value={emailSubject}
            onChange={(e) => set("emailSubject", e.target.value)}
            hint="The subject line of the YC email confirming your acceptance."
            maxLength={120}
            showCounter
          />
          <Input
            label="Referral code (optional)"
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
