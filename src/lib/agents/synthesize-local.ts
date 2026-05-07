// Local heuristic synthesis used in dev when the Anthropic API is not wired
// up. The real Profile Synthesizer agent (lib/agents/profile-synthesizer.ts)
// uses Claude. This stub keeps the onboarding flow working without an API key.

import { COHORT_TAGS } from "@/lib/mock/cohort";
import type { Intent } from "@/lib/types";

type IntakeShape = {
  identity?: { name?: string; location?: string; oneLine?: string };
  verification?: {
    emailSubject?: string;
    referral?: string;
    opts?: {
      sf?: boolean;
      india?: boolean;
      remote?: boolean;
      asyncOk?: boolean;
      inPerson?: boolean;
    };
  };
  intent?: {
    building?: string;
    looking_for?: string;
    can_help?: string;
    waste?: string;
  };
};

export function synthesizeCardLocal(input: IntakeShape) {
  const id = input.identity ?? {};
  const intent = input.intent ?? {};
  return {
    building:
      polish(intent.building) ||
      polish(id.oneLine) ||
      "Building something. Update this line in your card.",
    looking_for:
      polish(intent.looking_for) ||
      "Founders working on adjacent problems. People you would learn from in a 30 minute call.",
    can_help_with:
      polish(intent.can_help) ||
      "Specific introductions and your real lived experience in your domain.",
    talk_to_me_if:
      polishSentence(intent.waste, "you ship things and you do not need to be sold on the work being a real venture.") ||
      "you ship things and you do not need to be sold on the work being a real venture.",
  };
}

export function extractTags(input: IntakeShape): string[] {
  const text = [
    input.identity?.oneLine,
    input.intent?.building,
    input.intent?.looking_for,
    input.intent?.can_help,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const found = new Set<string>();

  for (const tag of COHORT_TAGS) {
    const needles = [tag.value.replace(/-/g, " "), tag.label.toLowerCase()];
    if (needles.some((n) => text.includes(n))) {
      found.add(tag.value);
    }
  }

  // Heuristic mapping
  const map: Array<[RegExp, string]> = [
    [/agent|llm|gpt|claude/, "ai-agents"],
    [/eval|benchmark|test/, "evals"],
    [/voice|speech|stt|tts/, "voice"],
    [/robot|arm|warehouse|gripper/, "robotics"],
    [/hardware|hardtech|electron/, "hardtech"],
    [/fusion|plasma|reactor/, "fusion"],
    [/biotech|wet lab|protocol|cell/, "biotech"],
    [/climate|solar|grid|carbon/, "climate"],
    [/fintech|payment|bank|finance/, "fintech"],
    [/health|hipaa|patient|clinic/, "healthtech"],
    [/edtech|tutor|school/, "edtech"],
    [/manufactur|factor|supply/, "manufacturing"],
    [/security|infosec|red team|injection/, "security"],
    [/open ?source|github/, "open-source"],
    [/sf|san francisco|bay area/, "sf"],
    [/india|bangalore|pune|delhi/, "india"],
    [/remote|global|distributed/, "remote"],
    [/cofounder|co-founder/, "cofounder"],
    [/solo/, "solo"],
    [/undergrad|college|university/, "undergrad"],
    [/hiring|hire/, "hiring"],
    [/research|paper/, "research"],
  ];
  for (const [re, tag] of map) {
    if (re.test(text)) found.add(tag);
  }

  if (input.verification?.opts?.sf) found.add("sf");
  if (input.verification?.opts?.india) found.add("india");
  if (input.verification?.opts?.remote) found.add("remote");

  return Array.from(found).slice(0, 8);
}

// Derive intents from the user's actual answers. Default is empty —
// don't presume cofounder unless the user said it. Closes the
// bleed-through bug where every new user inherited DEFAULT_ME.intents
// (["cofounder","collaborator"]) and got cofounder_shape matches they
// never asked for.
export function extractIntents(input: IntakeShape): Intent[] {
  const text = [
    input.identity?.oneLine,
    input.intent?.building,
    input.intent?.looking_for,
    input.intent?.can_help,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const out = new Set<Intent>();
  if (/\bcofounder\b|\bco-?founder\b/.test(text)) out.add("cofounder");
  if (/\bcollaborator\b|\bcollab\b|\bcompare notes\b/.test(text)) out.add("collaborator");
  if (/\bpeer\b|\bsounding board\b/.test(text)) out.add("peer");
  if (/\bfriend\b|\bbeer\b|\bcoffee\b/.test(text)) out.add("friend");
  // No false-positive "everyone wants collaborators" default. Empty is empty.
  return Array.from(out);
}

function polish(s: string | undefined): string {
  if (!s) return "";
  const trimmed = s.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  // Capitalize first letter
  return trimmed[0]!.toUpperCase() + trimmed.slice(1);
}

function polishSentence(s: string | undefined, fallback: string): string {
  const p = polish(s);
  if (!p) return fallback;
  return p.toLowerCase().replace(/\s+$/, "").replace(/\.$/, "");
}
