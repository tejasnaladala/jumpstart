import { NextResponse } from "next/server";
import { runAgent } from "@/lib/agents/runner";
import { onboardingInterviewer } from "@/lib/agents/onboarding-interviewer";

const FALLBACK_QUESTIONS = [
  "What are you building, in your own words?",
  "Who would make Startup School worth it for you?",
  "What can you uniquely help others with?",
  "What kind of meeting would feel like a waste of your time?",
];

export async function POST(req: Request) {
  const body = await req.json();
  const { identity, history, questionsAsked } = body as {
    identity: { name: string; location: string; oneLine: string };
    history: Array<{ role: "interviewer" | "user"; content: string }>;
    questionsAsked: number;
  };

  const result = await runAgent(onboardingInterviewer, { identity, history, questionsAsked });

  if (result.via === "stub") {
    const q = FALLBACK_QUESTIONS[questionsAsked] ?? FALLBACK_QUESTIONS[0]!;
    return NextResponse.json({
      next_question: q,
      is_final: questionsAsked >= FALLBACK_QUESTIONS.length - 1,
      reasoning: "local fallback",
      via: "stub",
    });
  }

  if (!result.ok || !result.output) {
    return NextResponse.json({ error: result.error || "agent error" }, { status: 500 });
  }

  return NextResponse.json({ ...result.output, via: result.via });
}
