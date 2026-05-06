import type { AgentDef } from "./types";
import { VOICE_RULES } from "./types";

type Input = {
  intent_transcript: { role: "interviewer" | "user"; content: string }[];
  identity: { name: string; location: string; oneLine: string };
  prior_card?: {
    building_summary?: string;
    looking_for?: string;
    can_help_with?: string;
    talk_to_me_if?: string;
    tags?: string[];
  };
};

type Output = {
  building_summary: string;
  looking_for: string;
  can_help_with: string;
  talk_to_me_if: string;
  tags: string[];
};

export const profileSynthesizer: AgentDef<Input, Output> = {
  name: "profile_synthesizer",
  description:
    "Turns the intent interview into the four card lines plus a tag set the matchmaker can use.",
  model: "claude-sonnet-4-5",
  evalCasesPath: "evals/cases/profile-synthesizer.json",

  system: () => `
You produce Founder Cards for Jumpstart. Read the user's intent interview and write four lines and a tag list.

Output schema.
- building_summary: 2 to 3 sentences. Lead with what they are building. Include at least one specific detail from their own words. No generic startup phrasing.
- looking_for: 2 to 3 sentences. Describe shapes of people, not generic adjectives. If the user mentioned cities, domains, or stages, name them.
- can_help_with: 2 sentences. Concrete capabilities only. No "I am a great connector" phrasing.
- talk_to_me_if: 1 sentence in lower case prose, written as the second half of "Talk to me if [...]". Specific and a little opinionated.
- tags: 4 to 8 tags from the cohort tag taxonomy. Use kebab-case. Always include any obvious geographic and shape tags.

Constraints.
- Never invent facts the user did not say.
- Match the user's voice. If they were casual, do not formalize. If they were precise, do not soften.
- The card is read by other founders deciding whether to spend 30 minutes with this person. Make the card earn that.

${VOICE_RULES}

Output strictly JSON with building_summary, looking_for, can_help_with, talk_to_me_if, tags.
`.trim(),

  user: (input: Input) => `
Identity.
Name: ${input.identity.name}
Location: ${input.identity.location}
One line: ${input.identity.oneLine}

Interview transcript.
${input.intent_transcript.map((t) => `${t.role.toUpperCase()}: ${t.content}`).join("\n")}

${input.prior_card ? `Prior card (preserve voice if it sounded right):\n${JSON.stringify(input.prior_card, null, 2)}` : ""}

Write the card now.
`.trim(),

  parse: (raw: string): Output => {
    const j = JSON.parse(raw);
    const required = ["building_summary", "looking_for", "can_help_with", "talk_to_me_if"];
    for (const k of required) {
      if (typeof j[k] !== "string" || !j[k].trim()) throw new Error(`missing ${k}`);
    }
    if (!Array.isArray(j.tags) || j.tags.length === 0) throw new Error("missing tags");
    return {
      building_summary: j.building_summary,
      looking_for: j.looking_for,
      can_help_with: j.can_help_with,
      talk_to_me_if: j.talk_to_me_if,
      tags: j.tags.map((t: string) => t.toLowerCase()),
    };
  },
};
