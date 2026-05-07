"use client";
import { Button } from "@/components/primitive/Button";
import { Input } from "@/components/primitive/Input";
import { StepDots } from "@/components/ProgressBar";
import { DraftIndicator } from "@/components/primitive/DraftIndicator";
import { useDraftState } from "@/lib/hooks/useDraftState";
import { useRouter } from "next/navigation";

type IdentityDraft = {
  name: string;
  location: string;
  oneLine: string;
  publicLink?: string;
};

const EMPTY: IdentityDraft = { name: "", location: "", oneLine: "", publicLink: "" };

export default function IdentityStep() {
  // Auto-save every keystroke so a refresh on step 1 does not lose the
  // three lines the user just typed. Closes DX audit top finding (early
  // onboarding steps had plain useState while only intent had save state).
  const [draft, setDraft, status] = useDraftState<IdentityDraft>(
    "jumpstart.onboarding.identity",
    EMPTY,
    { debounceMs: 300 }
  );
  const router = useRouter();

  function onNext() {
    // Draft is already in localStorage via useDraftState; the next step
    // (verification) reads its own draft. card synthesis reads identity.
    router.push("/onboarding/verification");
  }

  function set<K extends keyof IdentityDraft>(k: K, v: IdentityDraft[K]) {
    setDraft((s) => ({ ...s, [k]: v }));
  }

  // Trim before checking so whitespace-only input doesn't pass the gate.
  // Closes speed-runner + stress-tester findings: blank-string Pass hero,
  // silent corruption of saved card. Min 3 chars on oneLine to block "asdf"
  // -shape garbage that produces zero auto-tags.
  const canContinue = Boolean(
    draft.name.trim().length >= 2 &&
      draft.location.trim().length >= 2 &&
      draft.oneLine.trim().length >= 10
  );

  const blockedReason =
    draft.name.trim().length < 2
      ? "Add your name."
      : draft.location.trim().length < 2
      ? "Add your city."
      : draft.oneLine.trim().length < 10
      ? "One line on what you're building (10+ characters)."
      : "";

  return (
    <div className="flex-1 flex flex-col">
      <div className="container-app pt-6 pb-3">
        <StepDots current={1} total={4} />
      </div>
      <div className="container-app flex-1 pb-32">
        <p className="text-xxs uppercase tracking-wider text-accent font-semibold mt-3">
          Step 1 of 4
        </p>
        <h1 className="font-display text-3xl text-ink leading-tight mt-1">Who are you?</h1>
        <p className="text-sm text-muted mt-2">
          Three lines. Free text. We will use these to build your Founder Card on the next screen.
        </p>
        <div className="flex flex-col gap-4 mt-7">
          <Input
            label="Your name"
            placeholder="First and last"
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
            autoFocus
            maxLength={60}
            showCounter
          />
          <Input
            label="Where you are"
            placeholder="City, optionally where you are heading"
            value={draft.location}
            onChange={(e) => set("location", e.target.value)}
            hint="Example: Seattle, going to SF"
            maxLength={80}
            showCounter
          />
          <Input
            label="One line on what you are building"
            placeholder="Plasmax. Autonomous R and D systems for hardtech."
            value={draft.oneLine}
            onChange={(e) => set("oneLine", e.target.value)}
            maxLength={140}
            showCounter
          />
          <Input
            label="Public link (optional)"
            placeholder="linkedin.com/in/you, or your portfolio"
            value={draft.publicLink || ""}
            onChange={(e) => set("publicLink", e.target.value)}
            hint="Shows on your Founder Pass so people you send manual invites can verify you on a third surface."
            maxLength={120}
            showCounter
          />
        </div>
      </div>
      <div className="border-t border-border bg-surface sticky bottom-0">
        <div className="container-app py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs text-muted whitespace-nowrap">Identity</span>
            <DraftIndicator status={status} className="hidden sm:inline-flex" />
          </div>
          <div className="flex items-center gap-3">
            {/* Surface why Continue is disabled. Without this, users
                hit the button, nothing happens, and they bounce. The
                identity step has the strictest validation (oneLine
                requires 10+ chars) — the inline hint names the
                missing field directly. */}
            {blockedReason ? (
              <span className="text-xs text-muted hidden sm:inline">
                {blockedReason}
              </span>
            ) : null}
            <Button onClick={onNext} disabled={!canContinue}>
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
