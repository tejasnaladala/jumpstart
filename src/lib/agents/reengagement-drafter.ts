import type { AgentDef } from "./types";
import { VOICE_RULES } from "./types";

type Input = {
  user: {
    name: string;
    intent_summary: string; // their stated reason for joining (from intent interview)
    last_active_iso: string;
    drops_unopened: number;
  };
  recent_cohort_signal: string; // 1-2 sentences on what is happening in the cohort right now
};

type Output = {
  email_subject: string;
  email_body: string;
  push_text: string; // optional 80-char push notification
};

export const reengagementDrafter: AgentDef<Input, Output> = {
  name: "reengagement_drafter",
  description:
    "Drafts a personalized re-engagement email for users who have not opened a Drop in 3+ weeks. References their original intent, names a specific recent cohort signal, gives one clear call to action.",
  model: "claude-haiku-4-5",
  evalCasesPath: "evals/cases/reengagement-drafter.json",

  system: () => `
You write a one-touch re-engagement email for a Jumpstart user who has not opened a Drop in three or more weeks. The user originally signed up wanting something specific. The cohort has changed since then. Your email reminds them why they joined and gives them one clear way back in.

Hard rules.
- Subject under 60 characters. Lower case is fine. No emoji. No clickbait.
- Body is two short paragraphs (3-5 sentences total). Reference their stated intent. Reference one specific recent cohort signal.
- One clear call to action: "Open this week's drop" or "Update your card and get a fresh drop". Pick one.
- No "great to have you back". No "we miss you". No marketing voice. Sound like a founder who built this, not a CRM.
- The push_text is optional. If included, under 80 characters. Same voice rules.

Output strict JSON: { email_subject, email_body, push_text }.

${VOICE_RULES}
`.trim(),

  user: (input: Input) => `
User.
Name: ${input.user.name}
Original intent: ${input.user.intent_summary}
Last active: ${input.user.last_active_iso}
Drops unopened: ${input.user.drops_unopened}

Recent cohort signal: ${input.recent_cohort_signal}

Draft the re-engagement email.
`.trim(),

  parse: (raw: string): Output => {
    const j = JSON.parse(raw) as Record<string, unknown>;
    if (typeof j.email_subject !== "string" || j.email_subject.length === 0) {
      throw new Error("missing email_subject");
    }
    if (j.email_subject.length > 60) {
      throw new Error("subject over 60 chars (system prompt cap)");
    }
    if (typeof j.email_body !== "string" || j.email_body.length < 60) {
      throw new Error("body too short");
    }
    if (j.email_body.includes("\u2014")) {
      throw new Error("em dash in body");
    }
    return {
      email_subject: j.email_subject,
      email_body: j.email_body,
      push_text: typeof j.push_text === "string" ? j.push_text : "",
    };
  },
};
