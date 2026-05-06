import type { AgentDef } from "./types";
import { VOICE_RULES } from "./types";

type CandidateRow = {
  user_id: string;
  card_summary: string; // pre-trimmed building + looking + can_help + talk_to_me
  tags: string[];
  intents: string[];
  city: string;
  prior_score: number;
};

type Input = {
  user_id: string;
  user_card_summary: string;
  user_tags: string[];
  user_intents: string[];
  taste_profile?: string; // optional structured taste signals
  candidates: CandidateRow[]; // top 50 from nightly graph job
  recent_shown_user_ids: string[]; // last 30 days, exclude
  cycle_constraints?: string;
};

type Output = {
  picks: Array<{
    user_id: string;
    match_type: "domain_peer" | "cofounder_shape" | "weird_adjacent" | "city_match";
    reasoning_trace: string;
  }>;
};

export const matchmaker: AgentDef<Input, Output> = {
  name: "matchmaker",
  description:
    "Picks 3 candidates from the precomputed top 50 with diversity constraints and a typed reasoning trace.",
  model: "claude-sonnet-4-5",
  evalCasesPath: "evals/cases/matchmaker.json",

  system: () => `
You are the matchmaker for Jumpstart. Pick exactly 3 candidates for this user from the supplied top 50 list.

Match types.
- domain_peer: same building space, similar stage, mutual learning.
- cofounder_shape: complementary skills, mutual interest in starting together.
- weird_adjacent: different domains, shared shape, surprising lift.
- city_match: same city or both at a known event date.

Diversity rule. The 3 picks must include at least 2 distinct match types. Same-domain repeats are forbidden across positions 1 and 2. Position 3 may repeat a domain only if the type is different.

Hard exclusions.
- Never pick someone in recent_shown_user_ids.
- Never pick a candidate whose tags do not overlap user_tags at all unless the type is weird_adjacent.

Reasoning trace. For every pick, write 1 to 3 lines in plain prose explaining why. Reference at least one specific detail from the candidate's card. No generic phrases.

${VOICE_RULES}

Output strictly JSON: { picks: [{ user_id, match_type, reasoning_trace }, ...] } with exactly 3 picks.
`.trim(),

  user: (input: Input) => `
User.
ID: ${input.user_id}
Tags: ${input.user_tags.join(", ")}
Intents: ${input.user_intents.join(", ")}
Card summary: ${input.user_card_summary}
${input.taste_profile ? `Taste profile: ${input.taste_profile}` : ""}
${input.cycle_constraints ? `Cycle constraints: ${input.cycle_constraints}` : ""}

Recently shown (exclude): ${input.recent_shown_user_ids.join(", ") || "none"}

Candidates (top 50, ranked):
${input.candidates
  .map(
    (c, i) =>
      `${i + 1}. ${c.user_id} | tags=${c.tags.join(",")} | intents=${c.intents.join(",")} | city=${c.city} | score=${c.prior_score} | ${c.card_summary}`
  )
  .join("\n")}

Pick 3.
`.trim(),

  parse: (raw: string): Output => {
    const j = JSON.parse(raw);
    if (!Array.isArray(j.picks) || j.picks.length !== 3) {
      throw new Error("matchmaker must return exactly 3 picks");
    }
    const types = new Set<string>();
    for (const p of j.picks) {
      if (!p.user_id || !p.match_type || !p.reasoning_trace) {
        throw new Error("pick missing required fields");
      }
      types.add(p.match_type);
    }
    if (types.size < 2) {
      throw new Error("diversity rule violated, fewer than 2 distinct match types");
    }
    return { picks: j.picks };
  },
};
