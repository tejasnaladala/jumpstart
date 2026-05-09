"use client";
import { Button } from "@/components/primitive/Button";
import { StepDots } from "@/components/ProgressBar";
import { useDraftState } from "@/lib/hooks/useDraftState";
import { useRouter } from "next/navigation";

// Missing verification step — users need to self-report their SS 2026
// attendance status and meeting preferences (SF / India / Remote).
// This step sits between Identity (Step 1) and Intent (Step 3).

type VerifData = {
  opts: {
    sf: boolean;
    india: boolean;
    remote: boolean;
    asyncOk: boolean;
    inPerson: boolean;
  };
};

export default function VerificationStep() {
  const [data, setData] = useDraftState<VerifData>("jumpstart.onboarding.verification", {
    opts: {
      sf: false,
      india: false,
      remote: false,
      asyncOk: true,
      inPerson: false,
    },
  });
  const router = useRouter();

  const toggle = (key: keyof VerifData["opts"]) => {
    setData((s) => ({
      ...s,
      opts: { ...s.opts, [key]: !s.opts[key] },
    }));
  };

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
          Verify attendance
        </h1>
        <p className="text-sm text-muted mt-2 max-w-md">
          We use these to surface you to people in the same cohort or city.
        </p>

        <div className="mt-8 space-y-6">
          <div>
            <p className="ed-serial mb-3">Which cohorts are you attending?</p>
            <div className="flex flex-col gap-2">
              <CheckRow
                label="SF (In-person, July 25-26)"
                active={data.opts.sf}
                onClick={() => toggle("sf")}
              />
              <CheckRow
                label="India (In-person, May 10)"
                active={data.opts.india}
                onClick={() => toggle("india")}
              />
              <CheckRow
                label="Remote (Global cohort)"
                active={data.opts.remote}
                onClick={() => toggle("remote")}
              />
            </div>
          </div>

          <div>
            <p className="ed-serial mb-3">Meeting preferences</p>
            <div className="flex flex-col gap-2">
              <CheckRow
                label="Open to in-person coffee"
                active={data.opts.inPerson}
                onClick={() => toggle("inPerson")}
              />
              <CheckRow
                label="Open to 15-min async calls"
                active={data.opts.asyncOk}
                onClick={() => toggle("asyncOk")}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-border bg-surface sticky bottom-0">
        <div className="container-app py-3 flex items-center justify-between gap-2">
          <span className="text-xs text-muted">Attendance</span>
          <Button onClick={() => router.push("/onboarding/intent")}>
            Continue to interview
          </Button>
        </div>
      </div>
    </div>
  );
}

function CheckRow({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={
        "flex items-center justify-between p-4 rounded-xl border text-left transition-all " +
        (active
          ? "border-accent bg-accent/5 ring-1 ring-accent"
          : "border-border bg-bg hover:border-ink/20")
      }
    >
      <span className={"text-sm font-medium " + (active ? "text-ink" : "text-muted")}>
        {label}
      </span>
      <div
        className={
          "h-5 w-5 rounded-full border flex items-center justify-center transition-colors " +
          (active ? "bg-accent border-accent" : "border-border bg-bg")
        }
      >
        {active && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M2 5L4 7L8 3"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </button>
  );
}
