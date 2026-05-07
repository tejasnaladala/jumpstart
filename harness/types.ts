// Persona harness types. Lives outside src/ so it never ships in the
// production bundle. The harness drives the live app via Playwright,
// not by importing internals - that keeps the synthetic load realistic.

export type DecisionStyle =
  | "eager"        // requests intros aggressively, low picky-ness
  | "picky"        // only asks for ones with high tag overlap
  | "chatty"       // writes long openers, edits the suggested copy
  | "minimal"      // accepts suggested opener as-is, sends 1-line note
  | "ghoster"      // reads but rarely responds (simulate ignored intros)
  | "responsive"   // accepts most intros within minutes
  | "scheduler";   // tries to push toward a calendared meet on every call

export type PersonaCadence = {
  // How often this persona checks the app, in seconds. Real founders
  // check at irregular cadences; we sample uniformly between min/max.
  pollMinSec: number;
  pollMaxSec: number;
  // Probability per visit that they actually take an action vs lurk.
  actionRate: number;
};

export type PersonaIdentity = {
  name: string;
  email: string; // synthetic, e.g. "u_priya@harness.local"
  location: string;
  oneLine: string;
  publicLink?: string;
};

export type PersonaIntent = {
  // Maps to /onboarding/intent step answers.
  building: string;
  looking_for: string;
  can_help_with: string;
  talk_to_me_if: string;
  tags: string[];
  // /onboarding/verification toggle states
  going_to_sf: boolean;
  attended_india: boolean;
  remote_global: boolean;
  open_to_async: boolean;
  open_to_in_person: boolean;
};

export type Persona = {
  id: string;             // stable id, e.g. "p_priya_fintech"
  identity: PersonaIdentity;
  intent: PersonaIntent;
  decisionStyle: DecisionStyle;
  cadence: PersonaCadence;
  // Optional explicit hint - when "p_priya_fintech" runs, would they
  // be more likely to request "p_marcus_devops" or "p_aiko_design"?
  // The runtime reads this when scoring incoming drops.
  affinityHints?: Record<string, number>;
};

// Mutable per-persona state, persisted between runs.
export type PersonaState = {
  persona_id: string;
  // Lifecycle
  signed_up: boolean;
  onboarded: boolean;
  // Drop history
  drops_seen: number;
  matches_requested: string[];   // match_ids the persona requested
  intros_received: string[];     // intro_ids inbound (from coordinator)
  intros_accepted: string[];     // accepted ids (own response)
  intros_declined: string[];
  // Pretend meetings - coordinator records these in meetings.jsonl
  meetings_scheduled: string[];
  // Last activity for cadence sampling
  last_visit: string | null;     // ISO
  last_action: string | null;    // ISO
  // Free-form scratchpad for LLM-driven personas to track context
  notes: string[];
};

// Activity log entry written to harness/activity.jsonl
export type ActivityEntry = {
  ts: string;
  persona_id: string;
  event:
    | "signed_up"
    | "onboarded"
    | "viewed_drop"
    | "requested_intro"
    | "received_intro"
    | "accepted_intro"
    | "declined_intro"
    | "scheduled_meeting"
    | "error";
  detail?: Record<string, unknown>;
};
