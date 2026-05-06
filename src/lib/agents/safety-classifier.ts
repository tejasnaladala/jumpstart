import type { AgentDef } from "./types";
import { VOICE_RULES } from "./types";

type Input = {
  artifact_type: "intro_note" | "card_field" | "report" | "verification";
  artifact_text: string;
  context: {
    sender_id?: string;
    sender_history_summary?: string;
    recipient_id?: string;
    recent_artifacts?: number;
  };
};

type Output = {
  risk_score: number; // 0 to 100
  recommendation: "allow" | "flag" | "block" | "escalate";
  reasons: string[];
  redactions?: string[]; // optional list of substrings to redact
};

export const safetyClassifier: AgentDef<Input, Output> = {
  name: "safety_classifier",
  description:
    "Reads every intro note, report, card field, and verification submission. Scores risk, returns a recommendation.",
  model: "claude-haiku-4-5",
  evalCasesPath: "evals/cases/safety-classifier.json",

  system: () => `
You are the safety classifier for Jumpstart. Read the artifact and the context, score risk 0 to 100, and recommend an action.

Risk dimensions to consider.
- Spam patterns (mass-message phrasing, copy-pasted templates, link spam).
- Harassment, threats, slurs, doxxing.
- Catfish or impersonation (claiming to be someone they are not).
- Verification fraud (faked acceptance email, suspicious referrals).
- Off-platform recruitment to competing services.
- Personal data leakage in card fields (phone numbers, home addresses).

Recommendations.
- allow: risk under 25, no concerns.
- flag: 25 to 60, queue for human review but do not block in real time.
- block: 60 to 85, do not send, notify the user with a generic reason.
- escalate: 85+, urgent founder review, log to attempts.jsonl.

Output strict JSON: { risk_score, recommendation, reasons, redactions }.
reasons is a list of 1 to 4 short strings.
redactions only appears if you recommend allow with edits.

False positive bar. Do not flag normal founder cold messages. "Coffee in SF this week?" is allow. "Click this link to make $5000/day from home" is block. Use judgment.

${VOICE_RULES}
`.trim(),

  user: (input: Input) => `
Artifact type: ${input.artifact_type}
${input.context.sender_id ? `Sender: ${input.context.sender_id}` : ""}
${input.context.sender_history_summary ? `Sender history: ${input.context.sender_history_summary}` : ""}
${input.context.recipient_id ? `Recipient: ${input.context.recipient_id}` : ""}
${input.context.recent_artifacts !== undefined ? `Recent artifacts from this user: ${input.context.recent_artifacts}` : ""}

Artifact:
"""
${input.artifact_text}
"""

Score and recommend.
`.trim(),

  parse: (raw: string): Output => {
    const j = JSON.parse(raw);
    if (typeof j.risk_score !== "number" || j.risk_score < 0 || j.risk_score > 100) {
      throw new Error("invalid risk_score");
    }
    if (!["allow", "flag", "block", "escalate"].includes(j.recommendation)) {
      throw new Error("invalid recommendation");
    }
    if (!Array.isArray(j.reasons)) {
      throw new Error("reasons must be array");
    }
    return j as Output;
  },
};
