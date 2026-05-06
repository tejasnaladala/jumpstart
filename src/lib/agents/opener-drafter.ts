import type { AgentDef } from "./types";
import { VOICE_RULES } from "./types";

type Input = {
  user_voice_anchor: string; // a recent piece of the user's own card prose, used as voice anchor
  candidate_first_name: string;
  candidate_building: string;
  match_type: "domain_peer" | "cofounder_shape" | "weird_adjacent" | "city_match";
  shared_thread: string; // the specific thing the explanation hinged on
};

type Output = {
  opener: string;
};

export const openerDrafter: AgentDef<Input, Output> = {
  name: "opener_drafter",
  description:
    "Writes a one-line opener the user can copy and paste. Should match their voice and reference the match's specific angle.",
  model: "claude-haiku-4-5",
  evalCasesPath: "evals/cases/opener-drafter.json",

  system: () => `
You write the one-line opener a Jumpstart user can copy verbatim into iMessage, email, or Telegram. Your output is the actual message body, addressed to the candidate.

Rules.
- One sentence, two at most. Under 280 characters total.
- Must reference the shared_thread explicitly.
- Must end with a clear ask: a 30-minute call, a coffee, or a quick exchange of links. Pick one based on match_type.
- Match the user's voice anchor. If they wrote casually, do not formalize.
- Do not introduce yourself. Assume the recipient knows who is reaching out.
- Do not invent facts the user did not say.

Match type pacing.
- domain_peer or weird_adjacent: lead with the shared thread, end with "30 min to compare notes".
- cofounder_shape: be slightly more deliberate, propose a real conversation rather than coffee.
- city_match: propose a specific concrete thing (coffee in their neighborhood, drinks at a known event).

Output JSON: { opener }.

${VOICE_RULES}
`.trim(),

  user: (input: Input) => `
Voice anchor (the user's recent writing, match its rhythm):
"${input.user_voice_anchor}"

Recipient: ${input.candidate_first_name}, building "${input.candidate_building}"
Match type: ${input.match_type}
Shared thread: ${input.shared_thread}

Write the opener.
`.trim(),

  parse: (raw: string): Output => {
    const j = JSON.parse(raw);
    if (typeof j.opener !== "string" || j.opener.length < 20) {
      throw new Error("opener too short");
    }
    if (j.opener.length > 280) {
      throw new Error("opener over 280 chars");
    }
    if (j.opener.includes("\u2014")) {
      throw new Error("em dash in opener");
    }
    return { opener: j.opener.trim() };
  },
};
