import type { AgentDef } from "./types";
import { VOICE_RULES } from "./types";

type Input = {
  date: string;
  cohort_metrics: {
    verified_total: number;
    drops_sent_yesterday: number;
    intros_requested_yesterday: number;
    intros_accepted_yesterday: number;
    meetings_useful_pct_7d: number | null;
    moderation_queue: number;
  };
  weekly_top_tags: Array<{ tag: string; count: number }>;
  flagged_anomalies: string[];
  prior_summary: string;
};

type Output = {
  digest: string; // 200 word morning digest emailed to founder
  callouts: string[]; // 1-3 things that warrant action today
};

export const cohortAnalyst: AgentDef<Input, Output> = {
  name: "cohort_analyst",
  description:
    "Produces the founder's daily 6am digest. 200 words on what changed yesterday, what to do today.",
  model: "claude-sonnet-4-5",
  evalCasesPath: "evals/cases/cohort-analyst.json",

  system: () => `
You write the daily founder digest for Jumpstart. The reader is the founder running the product. They have 90 seconds to read and act.

Structure of the digest.
1. One sentence headline. What is the most important thing about yesterday.
2. The numbers worth knowing, in plain prose.
3. Anomalies worth eyes on, if any.
4. A specific suggested action for today, if useful.

Constraints.
- Hard cap 200 words.
- No marketing voice. The reader knows the product.
- No filler ("hope you had a great weekend"). Get to it.
- If nothing important happened, say so explicitly. "Slow yesterday. Verifications cleared. Nothing to act on."

Callouts.
- 1 to 3 short imperative items the founder should act on. Each under 12 words.
- If no callouts, return an empty array.

${VOICE_RULES}

Output strict JSON: { digest, callouts }.
`.trim(),

  user: (input: Input) => `
Date: ${input.date}
Prior digest (for continuity): ${input.prior_summary}

Yesterday's numbers.
Verified total: ${input.cohort_metrics.verified_total}
Drops sent: ${input.cohort_metrics.drops_sent_yesterday}
Intros requested: ${input.cohort_metrics.intros_requested_yesterday}
Intros accepted: ${input.cohort_metrics.intros_accepted_yesterday}
7-day useful meeting %: ${input.cohort_metrics.meetings_useful_pct_7d ?? "n/a"}
Moderation queue: ${input.cohort_metrics.moderation_queue}

Top tags this week:
${input.weekly_top_tags.map((t) => `- ${t.tag}: ${t.count}`).join("\n")}

Anomalies:
${input.flagged_anomalies.length ? input.flagged_anomalies.join("\n") : "(none)"}

Write the digest.
`.trim(),

  parse: (raw: string): Output => {
    const j = JSON.parse(raw);
    if (typeof j.digest !== "string" || j.digest.length < 80) {
      throw new Error("digest too short");
    }
    if (j.digest.length > 1400) {
      throw new Error("digest exceeds 200 word target");
    }
    if (!Array.isArray(j.callouts)) {
      throw new Error("callouts must be array");
    }
    return j as Output;
  },
};
