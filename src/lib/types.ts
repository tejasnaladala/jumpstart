export type TrustTier = "provisional" | "verified" | "peer_vouched";

export type MatchType =
  | "domain_peer"
  | "cofounder_shape"
  | "weird_adjacent"
  | "city_match";

export const MATCH_TYPE_LABEL: Record<MatchType, string> = {
  domain_peer: "Domain peer",
  cofounder_shape: "Cofounder shape",
  weird_adjacent: "Weird adjacent",
  city_match: "City match",
};

export type Intent = "cofounder" | "collaborator" | "peer" | "friend";

export type FounderCard = {
  id: string;
  user_id: string;
  name: string;
  location: string;
  going_to_sf: boolean;
  attended_india: boolean;
  remote_global: boolean;
  open_to_async: boolean;
  open_to_in_person: boolean;
  building_summary: string;
  looking_for: string;
  can_help_with: string;
  talk_to_me_if: string;
  technical_intensity?: number; // 1-5
  weird_thing?: string;
  tags: string[];
  intents: Intent[];
  trust_tier: TrustTier;
  // Optional public link (LinkedIn URL, personal site, or portfolio).
  // Renders on the Founder Pass as a discrete mono-caps line. Useful for
  // manual invites where a recipient lands on /pass/<user_id> and wants
  // to verify the sender on a third surface.
  public_link?: string;
  updated_at: string;
};

export type Match = {
  id: string;
  drop_id: string;
  user_id: string;
  candidate: FounderCard;
  match_type: MatchType;
  score: number;
  reasoning_trace: string;
  explanation: string;
  suggested_opener: string;
  position: 1 | 2 | 3;
  shown_at: string;
  action: "pending" | "skip" | "save" | "request" | "not_relevant" | null;
};

export type Drop = {
  id: string;
  user_id: string;
  cycle_week: string;
  matches: Match[];
  generated_at: string;
  sent_at: string | null;
  opened_at: string | null;
};

export type IntroRequest = {
  id: string;
  match_id: string;
  requester_id: string;
  recipient_id: string;
  note: string | null;
  sent_at: string;
  response: "pending" | "accept" | "decline" | "save" | "expired";
  response_at: string | null;
};

export type AgentInvocation = {
  id: string;
  agent_name: string;
  user_id: string | null;
  prompt: string;
  response: string;
  model: string;
  tokens_in: number;
  tokens_out: number;
  latency_ms: number;
  cost_usd: number;
  invoked_at: string;
};

export type IntentInterviewTurn = {
  role: "interviewer" | "user";
  content: string;
};
