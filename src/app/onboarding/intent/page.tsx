"use client";
import { Button } from "@/components/primitive/Button";
import { Textarea } from "@/components/primitive/Input";
import { StepDots } from "@/components/ProgressBar";
import { DraftIndicator } from "@/components/primitive/DraftIndicator";
import { Kbd } from "@/components/primitive/Kbd";
import { useDraftState } from "@/lib/hooks/useDraftState";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const QUESTIONS = [
  {
    key: "building",
    q: "What are you building, in your own words?",
    placeholder: "Skip the pitch deck phrasing. Tell me what you actually do."
  },
  {
    key: "looking_for",
    q: "Who would make Startup School worth it for you?",
    placeholder: "Be specific. Names of founder shapes are more useful than generic adjectives."
  },
  {
    key: "can_help",
    q: "What can you uniquely help others with?",
    placeholder: "What would make someone want to talk to you specifically, not just any founder?"
  },
  {
    key: "waste",
    q: "What kind of meeting would feel like a waste of your time?",
    placeholder: "We use this to filter, not to judge."
  },
];

type Answers = Record<string, string>;

export default function IntentInterviewStep() {
  const [step, setStep] = useState(0);
  // Auto-saved drafts: every keystroke debounce-saves to localStorage so a
  // mid-flow refresh or accidental nav-away doesn't lose the user's answers.
  // Hydrates on mount: if a previous session was abandoned mid-onboarding,
  // the user picks up where they left off.
  const [answers, setAnswers, draftStatus] = useDraftState<Answers>(
    "jumpstart.onboarding.intent",
    {},
    { debounceMs: 300 }
  );
  const [thinking, setThinking] = useState(false);
  const router = useRouter();
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    taRef.current?.focus();
  }, [step]);

  const current = QUESTIONS[step]!;
  const answer = answers[current.key] || "";

  async function next() {
    if (!answer.trim()) return;
    setThinking(true);
    await new Promise((r) => setTimeout(r, 700));
    setThinking(false);
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      // Final submit. The draft is already in localStorage via useDraftState;
      // we keep it through to /onboarding/card so the next step can read it
      // and pre-fill the founder card draft. /onboarding/card clears the
      // intent draft after a successful card save.
      router.push("/onboarding/card");
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="container-app pt-6 pb-3">
        <StepDots current={3} total={4} />
      </div>
      <div className="container-app flex-1 pb-32">
        <p className="text-xxs uppercase tracking-wider text-accent font-semibold mt-3">
          Step 3 of 4 · Question {step + 1} of {QUESTIONS.length}
        </p>

        {/* prior turns */}
        <div className="mt-6 flex flex-col gap-4">
          {QUESTIONS.slice(0, step).map((q) => (
            <div key={q.key} className="flex flex-col gap-2 opacity-60">
              <div className="flex gap-2">
                <Bot />
                <p className="text-sm text-muted leading-relaxed">{q.q}</p>
              </div>
              <div className="flex gap-2 ml-7">
                <p className="text-sm text-ink/80 leading-relaxed">{answers[q.key]}</p>
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <Bot />
            <p className="text-base font-medium text-ink leading-relaxed">{current.q}</p>
          </div>

          <Textarea
            ref={taRef}
            placeholder={current.placeholder}
            value={answer}
            onChange={(e) => setAnswers((s) => ({ ...s, [current.key]: e.target.value }))}
            rows={4}
            className="ml-7"
            maxLength={600}
            showCounter
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") next();
            }}
          />
          {thinking ? (
            <div className="flex gap-2 ml-7 items-center text-sm text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse delay-150" />
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse delay-300" />
              <span className="ml-2">Reading your answer...</span>
            </div>
          ) : null}
        </div>
      </div>
      <div className="border-t border-border bg-surface sticky bottom-0">
        <div className="container-app py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs text-muted whitespace-nowrap inline-flex items-center gap-1.5">
              <Kbd>⌘</Kbd>
              <span className="opacity-60">+</span>
              <Kbd>↵</Kbd>
              <span className="ml-1">to continue</span>
            </span>
            <DraftIndicator status={draftStatus} className="hidden sm:inline-flex" />
          </div>
          <Button onClick={next} disabled={!answer.trim()} loading={thinking}>
            {step < QUESTIONS.length - 1 ? "Next question" : "Build my card"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Bot() {
  return (
    <span
      aria-hidden
      className="inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-ink text-white text-xxs font-mono"
    >
      AI
    </span>
  );
}
