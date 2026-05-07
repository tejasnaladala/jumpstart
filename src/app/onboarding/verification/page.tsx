"use client";
import { Button } from "@/components/primitive/Button";
import { Input } from "@/components/primitive/Input";
import { StepDots } from "@/components/ProgressBar";
import { Sheet } from "@/components/primitive/Sheet";
import { DraftIndicator } from "@/components/primitive/DraftIndicator";
import { useToast } from "@/components/primitive/Toast";
import { useDraftState } from "@/lib/hooks/useDraftState";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { enqueue } from "@/lib/moderation/queue";
import {
  isVerified,
  load as loadOtp,
  send as sendOtp,
  verify as verifyOtp,
  verifiedTarget,
} from "@/lib/verification/otp";

type VerificationDraft = {
  email: string;
  phone: string;
  ticketDataUrl: string;
  ticketName: string;
  emailScreenDataUrl: string;
  emailScreenName: string;
  emailOtpInput: string;
  phoneOtpInput: string;
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
  email: "",
  phone: "",
  ticketDataUrl: "",
  ticketName: "",
  emailScreenDataUrl: "",
  emailScreenName: "",
  emailOtpInput: "",
  phoneOtpInput: "",
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
  const [emailVerified, setEmailVerified] = useState<boolean>(() => isVerified("email"));
  const [phoneVerified, setPhoneVerified] = useState<boolean>(() => isVerified("phone"));
  const [emailOtpSent, setEmailOtpSent] = useState<boolean>(() => Boolean(loadOtp("email")));
  const [phoneOtpSent, setPhoneOtpSent] = useState<boolean>(() => Boolean(loadOtp("phone")));
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingPhone, setSendingPhone] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const {
    email,
    phone,
    ticketDataUrl,
    ticketName,
    emailScreenDataUrl,
    emailScreenName,
    emailOtpInput,
    phoneOtpInput,
    opts,
  } = draft;

  const phoneClean = phone.replace(/[^\d+]/g, "");
  const phoneValid = phoneClean.length >= 7 && phoneClean.length <= 15;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const photosUploaded = Boolean(ticketDataUrl) && Boolean(emailScreenDataUrl);
  const locationPicked = opts.sf || opts.india || opts.remote || opts.notSure;
  const ready =
    phoneValid &&
    emailValid &&
    emailVerified &&
    phoneVerified &&
    photosUploaded &&
    locationPicked;

  const blockedReason = !emailValid
    ? "Add a valid email."
    : !phoneValid
    ? "Add a valid phone number (7-15 digits, country code OK)."
    : !emailVerified
    ? "Verify your email with the code we sent."
    : !phoneVerified
    ? "Verify your phone with the code we sent."
    : !ticketDataUrl
    ? "Upload a screenshot of your YC acceptance ticket."
    : !emailScreenDataUrl
    ? "Upload a screenshot of the YC acceptance email."
    : !locationPicked
    ? "Tell us where you'll be during SS."
    : "";

  function set<K extends keyof VerificationDraft>(k: K, v: VerificationDraft[K]) {
    setDraft((s) => ({ ...s, [k]: v }));
  }
  function setOpt<K extends keyof VerificationDraft["opts"]>(
    k: K,
    v: VerificationDraft["opts"][K]
  ) {
    setDraft((s) => ({ ...s, opts: { ...s.opts, [k]: v } }));
  }

  function handlePhotoUpload(
    file: File | null | undefined,
    field: "ticket" | "emailScreen"
  ) {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.push("Image too large. Keep it under 4MB.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || "");
      if (field === "ticket") {
        setDraft((s) => ({ ...s, ticketDataUrl: url, ticketName: file.name }));
      } else {
        setDraft((s) => ({ ...s, emailScreenDataUrl: url, emailScreenName: file.name }));
      }
    };
    reader.readAsDataURL(file);
  }

  async function onSendEmailCode() {
    if (!emailValid) {
      toast.push("Enter a valid email first.", "error");
      return;
    }
    setSendingEmail(true);
    try {
      const result = await sendOtp("email", email.trim());
      if (!result.ok) {
        if (result.reason === "rate_limit") {
          toast.push("Wait a minute before requesting another code.", "error");
        } else {
          toast.push("Could not send code. Check the email format.", "error");
        }
        return;
      }
      setEmailOtpSent(true);
      // Stub-mode hides the demo_code from the visible UI per founder
      // direction (May 7): "hide codes for now". The code is logged to
      // the dev console for closed-beta debugging only; non-dev testers
      // see the same "code sent" toast a real run would produce. Real
      // beta wired to Resend will not return a demo_code at all.
      if (result.demo_code && typeof window !== "undefined") {
        console.info(`[stub] email otp -> ${result.demo_code}`);
      }
      toast.push("Code sent. Check your email.", "info");
    } finally {
      setSendingEmail(false);
    }
  }

  async function onSendPhoneCode() {
    if (!phoneValid) {
      toast.push("Enter a valid phone number first.", "error");
      return;
    }
    setSendingPhone(true);
    try {
      const result = await sendOtp("phone", phoneClean);
      if (!result.ok) {
        if (result.reason === "rate_limit") {
          toast.push("Wait a minute before requesting another code.", "error");
        } else {
          toast.push("Could not send code. Check the phone format.", "error");
        }
        return;
      }
      setPhoneOtpSent(true);
      if (result.demo_code && typeof window !== "undefined") {
        console.info(`[stub] phone otp -> ${result.demo_code}`);
      }
      toast.push("Code sent. Check your messages.", "info");
    } finally {
      setSendingPhone(false);
    }
  }

  async function onVerifyEmailCode() {
    const result = await verifyOtp("email", emailOtpInput);
    if (!result.ok) {
      const msg =
        result.reason === "expired"
          ? "Code expired. Send a new one."
          : result.reason === "mismatch"
          ? "Code did not match."
          : "No code pending. Send one first.";
      toast.push(msg, "error");
      return;
    }
    setEmailVerified(true);
    set("emailOtpInput", "");
    toast.push("Email verified.", "success");
  }

  async function onVerifyPhoneCode() {
    const result = await verifyOtp("phone", phoneOtpInput);
    if (!result.ok) {
      const msg =
        result.reason === "expired"
          ? "Code expired. Send a new one."
          : result.reason === "mismatch"
          ? "Code did not match."
          : "No code pending. Send one first.";
      toast.push(msg, "error");
      return;
    }
    setPhoneVerified(true);
    set("phoneOtpInput", "");
    toast.push("Phone verified.", "success");
  }

  function onNext() {
    // Submit a verification request to the moderation queue. Founder
    // reviews at /admin/moderation and flips trust_tier manually for
    // each in the first ~50 users.
    try {
      const idRaw =
        typeof window !== "undefined"
          ? window.localStorage.getItem("jumpstart.onboarding.identity")
          : null;
      let identityName = "Pending user";
      if (idRaw) {
        const parsed = JSON.parse(idRaw) as { data?: { name?: string } };
        if (parsed?.data?.name) identityName = parsed.data.name;
      }
      const verifiedEmail = verifiedTarget("email") || email.trim();
      const verifiedPhone = verifiedTarget("phone") || phoneClean;
      enqueue({
        kind: "verification",
        triggered_by: "self",
        target_id: "self",
        target_kind: "user",
        target_label: identityName,
        target_snippet:
          `email=${verifiedEmail} (otp_verified) ` +
          `phone=${verifiedPhone.slice(0, 4)}*** (otp_verified) ` +
          `ticket=uploaded email_screenshot=uploaded`,
        reasons: [
          "email_otp_verified",
          "phone_otp_verified",
          "ticket_uploaded",
          "email_screenshot_uploaded",
        ],
        severity: "low",
      });
    } catch {
      // queue write is non-fatal
    }
    router.push("/onboarding/intent");
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
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-ink leading-[1.05] mt-2">
          Verify you are in the cohort
        </h1>
        <p className="text-sm text-muted mt-2">
          Soft verification gets you in within seconds. A founder flips you to
          full visibility within 24 hours after a manual review.
        </p>

        {/* Audit disclaimer. Up top so it's the first thing the user
            sees - sets the trust contract before they upload anything. */}
        <div className="mt-5 surface p-4 border-accent-edge/40 bg-accent-soft/40">
          <p className="text-xxs uppercase tracking-wider text-accent font-semibold mb-1.5">
            Read before you upload
          </p>
          <p className="text-xs text-ink leading-relaxed">
            Every upload is reviewed by hand. The email shown in your acceptance
            email screenshot must match the email you enter below. The name on
            your ticket must match the name on your Founder Pass. Mismatches
            found during audit will reverse your verification, remove your card
            from the cohort, and may result in a permanent ban. This is a trust
            contract; please don&apos;t break it.
          </p>
        </div>

        <p className="text-xxs uppercase tracking-wider text-muted font-semibold mt-7 mb-3">
          Email
        </p>
        <div className="flex flex-col gap-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                label="Email address"
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => set("email", e.target.value)}
                hint="Used for drop notifications. Must match the email shown in your acceptance email screenshot below."
                maxLength={120}
                disabled={emailVerified}
              />
            </div>
            <Button
              size="sm"
              variant={emailVerified ? "ghost" : "primary"}
              onClick={onSendEmailCode}
              loading={sendingEmail}
              disabled={!emailValid || emailVerified}
            >
              {emailVerified ? "Verified" : emailOtpSent ? "Resend code" : "Send code"}
            </Button>
          </div>
          {emailOtpSent && !emailVerified ? (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label="Email code"
                  placeholder="6-digit code"
                  value={emailOtpInput}
                  onChange={(e) =>
                    set("emailOtpInput", e.target.value.replace(/[^\d]/g, "").slice(0, 6))
                  }
                  maxLength={6}
                  inputMode="numeric"
                />
              </div>
              <Button
                size="sm"
                onClick={onVerifyEmailCode}
                disabled={emailOtpInput.length !== 6}
              >
                Verify
              </Button>
            </div>
          ) : null}
        </div>

        <p className="text-xxs uppercase tracking-wider text-muted font-semibold mt-7 mb-3">
          Phone
        </p>
        <div className="flex flex-col gap-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                label="Phone number"
                type="tel"
                placeholder="+1 415 555 0123"
                value={phone}
                onChange={(e) => set("phone", e.target.value)}
                hint="Founder-only. For trust verification. Never displayed to other attendees."
                maxLength={20}
                disabled={phoneVerified}
              />
            </div>
            <Button
              size="sm"
              variant={phoneVerified ? "ghost" : "primary"}
              onClick={onSendPhoneCode}
              loading={sendingPhone}
              disabled={!phoneValid || phoneVerified}
            >
              {phoneVerified ? "Verified" : phoneOtpSent ? "Resend code" : "Send code"}
            </Button>
          </div>
          {phoneOtpSent && !phoneVerified ? (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label="Phone code"
                  placeholder="6-digit code"
                  value={phoneOtpInput}
                  onChange={(e) =>
                    set("phoneOtpInput", e.target.value.replace(/[^\d]/g, "").slice(0, 6))
                  }
                  maxLength={6}
                  inputMode="numeric"
                />
              </div>
              <Button
                size="sm"
                onClick={onVerifyPhoneCode}
                disabled={phoneOtpInput.length !== 6}
              >
                Verify
              </Button>
            </div>
          ) : null}
        </div>

        <p className="text-xxs uppercase tracking-wider text-muted font-semibold mt-7 mb-3">
          Acceptance proof
        </p>
        <div className="flex flex-col gap-3">
          <div className="surface p-4">
            <p className="text-xs font-semibold text-ink mb-1">
              YC Startup School ticket photo
            </p>
            <p className="text-xs text-muted mb-3 leading-relaxed">
              Screenshot or photo of your accepted ticket. Reviewed by the
              founder, deleted within 24h of verification.
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handlePhotoUpload(e.target.files?.[0], "ticket")}
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

          <div className="surface p-4">
            <p className="text-xs font-semibold text-ink mb-1">
              YC acceptance email screenshot
            </p>
            <p className="text-xs text-muted mb-3 leading-relaxed">
              Screenshot of the acceptance email itself, with the recipient
              address visible. The email shown must match the email you entered
              above. We audit this manually.
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handlePhotoUpload(e.target.files?.[0], "emailScreen")}
              className="block w-full text-xs file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border file:border-border file:bg-bg file:text-ink file:font-medium file:cursor-pointer hover:file:border-ink/40"
            />
            {emailScreenDataUrl ? (
              <div className="mt-3 flex items-center gap-3">
                <img
                  src={emailScreenDataUrl}
                  alt={`Uploaded email ${emailScreenName}`}
                  className="w-20 h-20 object-cover rounded-md border border-border"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-ink truncate">{emailScreenName}</p>
                  <button
                    type="button"
                    onClick={() => setDraft((s) => ({
                      ...s,
                      emailScreenDataUrl: "",
                      emailScreenName: "",
                    }))}
                    className="text-xxs text-error hover:underline mt-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : null}
          </div>
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
              onClick={() =>
                setOpt(
                  o.key as keyof VerificationDraft["opts"],
                  !opts[o.key as keyof VerificationDraft["opts"]]
                )
              }
              className={`surface px-4 py-3 text-left text-sm transition-all ${
                opts[o.key as keyof VerificationDraft["opts"]]
                  ? "border-ink shadow-card"
                  : "hover:border-ink/40"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <p className="text-xxs uppercase tracking-wider text-muted font-semibold mt-7 mb-3">
          How you want to meet
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Toggle on={opts.asyncOk} label="Open to async" onChange={() => setOpt("asyncOk", !opts.asyncOk)} />
          <Toggle on={opts.inPerson} label="Open to in-person" onChange={() => setOpt("inPerson", !opts.inPerson)} />
        </div>

        <p className="text-xs text-muted mt-7 leading-relaxed">
          We delete acceptance proof within 24 hours of review and never display
          your phone number or exact location.{" "}
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
            <Button onClick={onNext} disabled={!ready}>
              Continue
            </Button>
          </div>
        </div>
      </div>

      <Sheet open={privacyOpen} onClose={() => setPrivacyOpen(false)} title="Privacy summary">
        <p className="text-sm text-muted leading-relaxed mb-4">
          We collect only what we need to verify you are an SS attendee and to
          deliver matches. Phone numbers are never displayed. Your exact city
          is shown; precise location is not. Acceptance proof is deleted 24
          hours after review. Drop notifications are opt-in.
        </p>
      </Sheet>
    </div>
  );
}

function Toggle({ on, label, onChange }: { on: boolean; label: string; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`surface px-4 py-3 text-left text-sm transition-all ${
        on ? "border-ink shadow-card" : "hover:border-ink/40"
      }`}
    >
      {label}
    </button>
  );
}
