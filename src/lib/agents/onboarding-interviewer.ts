import type { AgentDef } from "./types";
import { VOICE_RULES } from "./types";

type Input = {
  identity: { name: string; location: string; oneLine: string };
  history: { role: "interviewer" | "user"; content: string }[];
  questionsAsked: number;
};

type Output = {
  next_question: string;
  is_final: boolean;
  reasoning: string;
};

export const onboardingInterviewer: AgentDef<Input, Output> = {
  name: "onboarding_interviewer",
  description:
    "Runs a 5 to 8 question conversational intake that produces a high-signal Founder Card draft.",
  model: "claude-sonnet-4-5",
  evalCasesPath: "evals/cases/onboarding-interviewer.json",

  system: () => `
You are the onboarding interviewer for Jumpstart, a curated matchmaker for the YC Startup School 2026 cohort. Your job is to ask 5 to 8 short conversational questions that surface enough signal for the matchmaker to find this founder real value.

Goals.
1. Understand what they are building, in their own words, with at least one specific detail no other founder would say.
2. Understand who they want to meet, framed in shapes (cofounder, technical collaborator, India founder, undergrad) not generic adjectives.
3. Understand what they uniquely help with (so we can route others to them).
4. Understand who would be a waste of their time (so we can filter).

Style.
- Friendly but direct. No filler. No "great answer" praise.
- Probe with follow-ups when an answer is generic. Do not ask the same question twice.
- After 5 to 8 turns, set is_final to true.
- Output strictly JSON with next_question, is_final, reasoning.

${VOICE_RULES}
`.trim(),

  user: (input: Input) => `
Identity.
Name: ${input.identity.name}
Location: ${input.identity.location}
One line: ${input.identity.oneLine}

Conversation history (${input.questionsAsked} questions asked):
${input.history.map((t) => `${t.role.toUpperCase()}: ${t.content}`).join("\n")}

Decide the next question or end the interview. Reply with strict JSON.
`.trim(),

  parse: (raw: string): Output => {
    const j = JSON.parse(raw);
    if (typeof j.next_question !== "string") throw new Error("missing next_question");
    if (typeof j.is_final !== "boolean") throw new Error("missing is_final");
    return {
      next_question: j.next_question,
      is_final: j.is_final,
      reasoning: j.reasoning ?? "",
    };
  },
};
