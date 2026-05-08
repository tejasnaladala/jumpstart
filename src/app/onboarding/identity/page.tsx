"use client";
import { Button } from "@/components/primitive/Button";
import { Input } from "@/components/primitive/Input";
import { StepDots } from "@/components/ProgressBar";
import { DraftIndicator } from "@/components/primitive/DraftIndicator";
import { useDraftState } from "@/lib/hooks/useDraftState";
import { useRouter } from "next/navigation";

// Professional onboarding step. Per founder direction (May 7 2026):
// "lets make onboarding slightly more professional: full name, age,
//  location (city, state), and other factors you can brainstorm upon"
//
// Fields included (chosen for cohort fit, kept tight to respect 90-sec
// onboarding budget):
//   - Full name (required)         identity, displayed on Pass
//   - Age (optional)               useful signal, not gate-able by law
//   - City (required)              matchmaker uses this for city_match
//   - State / Country (required)   disambiguates "Cambridge" / "Springfield"
//   - Pronouns (optional)          inclusive cohort surface
//   - One line you're building     core matchmaker signal
//   - Public link (optional)       third-surface verification
//
// Deferred to Verification step: phone number, ticket photo upload,
// email re-confirmation. Those are trust signals, not identity.

type IdentityDraft = {
  name: string;
  age: string;
  city: string;
  region: string;
  pronouns: string;
  oneLine: string;
  publicLink: string;
};

const EMPTY: IdentityDraft = {
  name: "",
  age: "",
  city: "",
  region: "",
  pronouns: "",
  oneLine: "",
  publicLink: "",
};

export default function IdentityStep() {
  const [draft, setDraft, status] = useDraftState<IdentityDraft>(
    "jumpstart.onboarding.identity",
    EMPTY,
    { debounceMs: 300 }
  );
  const router = useRouter();

  function onNext() {
    // Verification step removed (waitlist-only pre-product). Users now
    // skip straight from identity to intent.
    router.push("/onboarding/intent");
  }

  function set<K extends keyof IdentityDraft>(k: K, v: IdentityDraft[K]) {
    setDraft((s) => ({ ...s, [k]: v }));
  }

  // Validation. Required: full name (2+ chars), city (2+), region (2+),
  // one line (10+ chars). Age and pronouns are optional. Age, if filled,
  // must parse as 18-99.
  const ageNum = draft.age.trim() ? Number.parseInt(draft.age.trim(), 10) : null;
  const ageValid = ageNum === null || (Number.isFinite(ageNum) && ageNum >= 16 && ageNum <= 99);

  const canContinue = Boolean(
    draft.name.trim().length >= 2 &&
      draft.city.trim().length >= 2 &&
      draft.region.trim().length >= 2 &&
      draft.oneLine.trim().length >= 10 &&
      ageValid
  );

  const blockedReason =
    draft.name.trim().length < 2
      ? "Add your full name."
      : draft.city.trim().length < 2
      ? "Add your city."
      : draft.region.trim().length < 2
      ? "Add your state or country."
      : draft.oneLine.trim().length < 10
      ? "One line on what you're building (10+ characters)."
      : !ageValid
      ? "Age should be 16 to 99 (or leave blank)."
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
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-ink leading-[1.05] mt-2">Who are you?</h1>
        <p className="text-sm text-muted mt-2">
          Quick identity pass. Real name, real location. We use these to build your Founder
          Pass and to score who&apos;s worth meeting.
        </p>
        <div className="flex flex-col gap-4 mt-7">
          <Input
            label="Full name"
            placeholder="First and last"
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
            autoFocus
            maxLength={80}
            showCounter
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              placeholder="San Francisco"
              value={draft.city}
              onChange={(e) => set("city", e.target.value)}
              maxLength={60}
            />
            <Input
              label="State / Country"
              placeholder="CA, USA"
              value={draft.region}
              onChange={(e) => set("region", e.target.value)}
              maxLength={60}
              hint="Disambiguates your city; used in matchmaking."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Age (optional)"
              placeholder="22"
              value={draft.age}
              onChange={(e) => set("age", e.target.value.replace(/[^0-9]/g, ""))}
              maxLength={3}
              type="text"
              inputMode="numeric"
            />
            <Input
              label="Pronouns (optional)"
              placeholder="she / her"
              value={draft.pronouns}
              onChange={(e) => set("pronouns", e.target.value)}
              maxLength={20}
            />
          </div>
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
            placeholder="linkedin.com/in/you, github.com/you, or your portfolio"
            value={draft.publicLink || ""}
            onChange={(e) => set("publicLink", e.target.value)}
            hint="Shows on your Founder Pass so people you send manual invites can verify you on a third surface."
            maxLength={140}
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
