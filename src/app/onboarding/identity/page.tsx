"use client";
import { Button } from "@/components/primitive/Button";
import { Input } from "@/components/primitive/Input";
import { StepDots } from "@/components/ProgressBar";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function IdentityStep() {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [oneLine, setOneLine] = useState("");
  const router = useRouter();

  function onNext() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "jumpstart.onboarding.identity",
        JSON.stringify({ name, location, oneLine })
      );
    }
    router.push("/onboarding/verification");
  }

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
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <Input
            label="Where you are"
            placeholder="City, optionally where you are heading"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            hint="Example: Seattle, going to SF"
          />
          <Input
            label="One line on what you are building"
            placeholder="Plasmax. Autonomous R and D systems for hardtech."
            value={oneLine}
            onChange={(e) => setOneLine(e.target.value)}
          />
        </div>
      </div>
      <div className="border-t border-border bg-surface sticky bottom-0">
        <div className="container-app py-3 flex items-center justify-between">
          <span className="text-xs text-muted">Identity</span>
          <Button onClick={onNext} disabled={!name || !location || !oneLine}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
