"use client";
import { Button } from "@/components/primitive/Button";
import { Input } from "@/components/primitive/Input";
import { StepDots } from "@/components/ProgressBar";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VerificationStep() {
  const [emailSubject, setEmailSubject] = useState("");
  const [referral, setReferral] = useState("");
  const [opts, setOpts] = useState({
    sf: false,
    india: false,
    remote: false,
    notSure: false,
    asyncOk: true,
    inPerson: true,
  });
  const router = useRouter();

  function onNext() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "jumpstart.onboarding.verification",
        JSON.stringify({ emailSubject, referral, opts })
      );
    }
    router.push("/onboarding/intent");
  }

  const ready = (emailSubject.trim().length > 5 || referral.trim().length > 2) && (opts.sf || opts.india || opts.remote || opts.notSure);

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
            onChange={(e) => setEmailSubject(e.target.value)}
            hint="The subject line of the YC email confirming your acceptance."
          />
          <Input
            label="Referral code (optional)"
            placeholder="From a verified attendee"
            value={referral}
            onChange={(e) => setReferral(e.target.value)}
          />
        </div>

        <p className="text-xxs uppercase tracking-wider text-muted font-semibold mt-8 mb-3">
          Where will you be during SS?
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
              onClick={() => setOpts((s) => ({ ...s, [o.key]: !s[o.key as keyof typeof s] }))}
              className={`surface px-4 py-3 text-left text-sm transition-all ${opts[o.key as keyof typeof opts] ? "border-ink shadow-card" : "hover:border-ink/40"}`}
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
            onChange={() => setOpts((s) => ({ ...s, asyncOk: !s.asyncOk }))}
          />
          <Toggle
            on={opts.inPerson}
            label="Open to in-person"
            onChange={() => setOpts((s) => ({ ...s, inPerson: !s.inPerson }))}
          />
        </div>

        <p className="text-xs text-muted mt-7 leading-relaxed">
          We delete acceptance proof within 24 hours of review and never display your phone number or
          exact location. Read the
          <a href="#" className="text-ink underline ml-1">privacy summary</a>.
        </p>
      </div>

      <div className="border-t border-border bg-surface sticky bottom-0">
        <div className="container-app py-3 flex items-center justify-between">
          <span className="text-xs text-muted">Verification</span>
          <Button onClick={onNext} disabled={!ready}>Continue</Button>
        </div>
      </div>
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
