import type { AgentDef } from "./types";
import { VOICE_RULES } from "./types";

export type MatchExplainerInput = {
  user_card: {
    name: string;
    building: string;
    looking_for: string;
    tags: string[];
  };
  candidate_card: {
    name: string;
    building: string;
    looking_for: string;
    can_help_with: string;
    talk_to_me_if: string;
    tags: string[];
  };
  match_type: "domain_peer" | "cofounder_shape" | "weird_adjacent" | "city_match";
  reasoning_trace: string;
};

type Output = {
  explanation: string;
  specificity_anchor: string;
};

export const matchExplainer: AgentDef<MatchExplainerInput, Output> = {
  name: "match_explainer",
  description:
    "Writes the why-you-should-meet for a single match, 2 to 3 sentences, must cite at least one detail from the other card.",
  model: "claude-sonnet-4-5",
  evalCasesPath: "evals/cases/match-explainer.json",

  system: () => `
You write the "why you should meet" line for a Jumpstart match. The user reads this on their match detail page and decides in 5 seconds whether to request an intro.

Hard rules.
- 2 to 3 sentences. No more.
- Must contain at least one detail copied or paraphrased from the candidate's card. We call this the specificity anchor.
- Must explain the angle that makes this pair worth a 30-minute conversation, framed around the match_type.
- No generic phrases like "you both work in AI" or "you might find this interesting".
- No "you should connect because". Skip the framing, just write the angle.
- No exclamation points.

Match type framing.
- domain_peer: lean into shared shape, then point at the angle that differs.
- cofounder_shape: name complementarity in a specific dimension (skill, market, motion).
- weird_adjacent: explain why the unobvious overlap is useful.
- city_match: emphasize the ease of an in-person coffee plus one shared interest.

Output JSON: { explanation, specificity_anchor }.
specificity_anchor is the exact phrase you took from the candidate's card. Used by the eval suite.

${VOICE_RULES}
`.trim(),

  user: (input: MatchExplainerInput) => `
You are explaining the match.

User you are writing for.
Name: ${input.user_card.name}
Building: ${input.user_card.building}
Looking for: ${input.user_card.looking_for}
Tags: ${input.user_card.tags.join(", ")}

Candidate.
Name: ${input.candidate_card.name}
Building: ${input.candidate_card.building}
Looking for: ${input.candidate_card.looking_for}
Can help with: ${input.candidate_card.can_help_with}
Talk to them if: ${input.candidate_card.talk_to_me_if}
Tags: ${input.candidate_card.tags.join(", ")}

Match type: ${input.match_type}
Matchmaker trace: ${input.reasoning_trace}

Write the explanation now.
`.trim(),

  parse: (raw: string): Output => {
    const j = JSON.parse(raw);
    if (typeof j.explanation !== "string" || j.explanation.length < 30) {
      throw new Error("explanation too short");
    }
    if (typeof j.specificity_anchor !== "string" || !j.specificity_anchor.trim()) {
      throw new Error("missing specificity_anchor");
    }
    if (j.explanation.includes("\u2014")) {
      throw new Error("em dash detected, voice rule violation");
    }
    return { explanation: j.explanation, specificity_anchor: j.specificity_anchor };
  },
};
