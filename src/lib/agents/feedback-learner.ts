import type { AgentDef } from "./types";
import { VOICE_RULES } from "./types";

type Input = {
  user_id: string;
  prior_taste_profile: string;
  drop_history: Array<{
    week: string;
    matches: Array<{
      candidate_user_id: string;
      tags: string[];
      match_type: string;
      action: "skip" | "save" | "request" | "not_relevant" | null;
      meeting_outcome?: "worth" | "neutral" | "waste";
    }>;
  }>;
};

type Output = {
  taste_profile: string;
  preferred_match_types: Array<{ type: string; weight: number }>;
  diversity_inject: string[]; // tags to deliberately surface to avoid taste lock-in
};

export const feedbackLearner: AgentDef<Input, Output> = {
  name: "feedback_learner",
  description:
    "Rolls user behavior into a taste profile that improves next cycle's matches without overfitting.",
  model: "claude-sonnet-4-5",
  evalCasesPath: "evals/cases/feedback-learner.json",

  system: () => `
You read a user's drop history and write an updated taste profile. The profile is fed back to the matchmaker on the next cycle.

Method.
- Look at request rates by tag, by match type, by location.
- Look at meeting outcomes (worth, neutral, waste). Worth is the strongest positive signal. Waste is the strongest negative.
- Look at fast-skips (skip within seconds) as a soft negative.
- Note patterns ("user requests cofounder-shape weekly", "user marks anything voice-related as not relevant").

Diversity guardrail.
- Never let preferred_match_types collapse to a single type. Even if all 4 weeks of history was domain_peer, force at least one weird_adjacent in the diversity_inject.
- diversity_inject contains 1 to 3 tags outside the user's current taste cluster, surfaced deliberately to keep matching from echo-chambering.

Output JSON: { taste_profile, preferred_match_types, diversity_inject }.

${VOICE_RULES}
`.trim(),

  user: (input: Input) => `
User: ${input.user_id}
Prior taste profile: ${input.prior_taste_profile || "(none, this is the first run)"}

History:
${input.drop_history
  .map(
    (d) =>
      `Week ${d.week}: ${d.matches
        .map(
          (m) =>
            `${m.candidate_user_id} [${m.match_type}, tags=${m.tags.join("/")}] action=${m.action ?? "none"} outcome=${m.meeting_outcome ?? "n/a"}`
        )
        .join(" | ")}`
  )
  .join("\n")}

Write the updated taste profile.
`.trim(),

  parse: (raw: string): Output => {
    const j = JSON.parse(raw);
    if (typeof j.taste_profile !== "string" || j.taste_profile.length < 30) {
      throw new Error("taste_profile too short");
    }
    if (!Array.isArray(j.preferred_match_types) || j.preferred_match_types.length === 0) {
      throw new Error("missing preferred_match_types");
    }
    if (!Array.isArray(j.diversity_inject) || j.diversity_inject.length === 0) {
      throw new Error("diversity_inject must contain at least 1 tag");
    }
    return j as Output;
  },
};
