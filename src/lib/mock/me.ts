import type { FounderCard } from "@/lib/types";

// Default "you" card used during local dev. The onboarding flow overwrites
// this in localStorage when the user completes the intent interview.

export const DEFAULT_ME: FounderCard = {
  id: "fc_me",
  user_id: "u_me",
  name: "Tejas N.",
  location: "Seattle, going to SF",
  going_to_sf: true,
  attended_india: false,
  remote_global: false,
  open_to_async: true,
  open_to_in_person: true,
  building_summary:
    "Plasmax. Autonomous R and D systems and agentic engineering tools for hardtech.",
  looking_for:
    "Hardtech founders, AI infra builders, India manufacturing people, cracked undergrad founders.",
  can_help_with:
    "Hardware prototyping, plasma reactors, agent systems, YC application review, research automation.",
  talk_to_me_if:
    "You build weird things fast and hate generic startup advice.",
  tags: ["hardtech", "ai-agents", "research", "fusion", "cofounder", "sf"],
  intents: ["cofounder", "collaborator"],
  trust_tier: "verified",
  updated_at: "2026-05-05T22:00:00Z",
};

const ME_KEY = "jumpstart.me";

export function loadMe(): FounderCard {
  if (typeof window === "undefined") return DEFAULT_ME;
  try {
    const raw = window.localStorage.getItem(ME_KEY);
    if (!raw) return DEFAULT_ME;
    return JSON.parse(raw) as FounderCard;
  } catch {
    return DEFAULT_ME;
  }
}

export function saveMe(card: FounderCard) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ME_KEY, JSON.stringify(card));
}

// Clear all Jumpstart-namespaced localStorage on sign-out so a shared
// laptop does not leave the previous user's identity, onboarding drafts,
// or per-match intro notes behind. Closes DX audit privacy finding.
const JUMPSTART_PREFIX = "jumpstart.";

export function resetMe() {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(JUMPSTART_PREFIX)) keysToRemove.push(k);
    }
    for (const k of keysToRemove) {
      window.localStorage.removeItem(k);
    }
  } catch {
    // Privacy mode or quota error; fall back to clearing the canonical
    // me key so at least the visible identity is gone.
    try {
      window.localStorage.removeItem(ME_KEY);
    } catch {
      // truly nothing more we can do
    }
  }
}
