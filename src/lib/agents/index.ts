// Agent registry. Eight agents per the design spec section 10.
// Each agent has a name, a system prompt builder, an I/O contract, and
// declared eval suites.
//
// The agents are pure prompt definitions. They run via lib/agents/runner.ts
// against the Anthropic API in production, or against the local heuristic
// stubs (lib/agents/synthesize-local.ts, lib/match/local-drop.ts) in dev.

import { onboardingInterviewer } from "./onboarding-interviewer";
import { profileSynthesizer } from "./profile-synthesizer";
import { matchmaker } from "./matchmaker";
import { matchExplainer } from "./match-explainer";
import { openerDrafter } from "./opener-drafter";
import { feedbackLearner } from "./feedback-learner";
import { safetyClassifier } from "./safety-classifier";
import { cohortAnalyst } from "./cohort-analyst";

export const AGENTS = {
  onboardingInterviewer,
  profileSynthesizer,
  matchmaker,
  matchExplainer,
  openerDrafter,
  feedbackLearner,
  safetyClassifier,
  cohortAnalyst,
} as const;

export type AgentName = keyof typeof AGENTS;

export const AGENT_LIST = Object.values(AGENTS);
