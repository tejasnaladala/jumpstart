import type { FounderCard } from "@/lib/types";

export const MOCK_COHORT: FounderCard[] = [
  {
    id: "fc_maya",
    user_id: "u_maya",
    name: "Maya Chen",
    location: "Toronto",
    going_to_sf: false,
    attended_india: false,
    remote_global: true,
    open_to_async: true,
    open_to_in_person: false,
    building_summary:
      "Eval infrastructure for AI agents. Tests for trust, drift, and goal preservation in long-running autonomous systems.",
    looking_for:
      "Other infra builders, autonomous systems researchers, anyone running agents in production who hates how unreliable they feel.",
    can_help_with:
      "Eval design, golden set construction, agent observability, prompt regression testing.",
    talk_to_me_if:
      "You ship agents and quietly worry they will hallucinate something expensive.",
    tags: ["ai-agents", "infra", "evals", "research", "remote"],
    intents: ["collaborator", "peer"],
    trust_tier: "verified",
    technical_intensity: 5,
    weird_thing: "Formal verification of neural networks",
    updated_at: "2026-04-30T18:11:00Z",
  },
  {
    id: "fc_devansh",
    user_id: "u_devansh",
    name: "Devansh Rao",
    location: "Bangalore",
    going_to_sf: true,
    attended_india: true,
    remote_global: false,
    open_to_async: true,
    open_to_in_person: true,
    building_summary:
      "Manufacturing automation for India SME factories. AI-driven QA on shop floors, cheap hardware, integrates with WhatsApp.",
    looking_for:
      "Hardware founders, US distributors, other India founders going to SF, anyone solving offline-first software in low-bandwidth regions.",
    can_help_with:
      "India supply chain, hardware sourcing in Shenzhen, SME founder intros across Bangalore and Pune.",
    talk_to_me_if:
      "You want a reality check on building hardware out of India, or you sell software that needs an India ops layer.",
    tags: ["hardtech", "india", "manufacturing", "sme", "sf"],
    intents: ["collaborator", "cofounder"],
    trust_tier: "verified",
    updated_at: "2026-04-29T12:24:00Z",
  },
  {
    id: "fc_jordan",
    user_id: "u_jordan",
    name: "Jordan Park",
    location: "San Francisco",
    going_to_sf: true,
    attended_india: false,
    remote_global: false,
    open_to_async: false,
    open_to_in_person: true,
    building_summary:
      "Autonomous lab assistant for biotech wet labs. Vision plus arms plus protocol parsing. Solo founder, looking for technical cofounder.",
    looking_for:
      "Robotics or ML cofounder. Hardtech founders. Anyone shipping production robotics.",
    can_help_with:
      "Lab ops, biotech intros, fundraising story for hardtech.",
    talk_to_me_if:
      "You ship physical things fast and you do not need to be sold on hardware being a real venture.",
    tags: ["hardtech", "robotics", "biotech", "cofounder", "sf"],
    intents: ["cofounder"],
    trust_tier: "verified",
    technical_intensity: 5,
    weird_thing: "Building DIY bioreactors in his kitchen",
    updated_at: "2026-04-28T22:00:00Z",
  },
  {
    id: "fc_priya",
    user_id: "u_priya",
    name: "Priya Shah",
    location: "San Francisco",
    going_to_sf: true,
    attended_india: false,
    remote_global: false,
    open_to_async: true,
    open_to_in_person: true,
    building_summary:
      "Voice agents for healthcare front desks. Replaces the 'press 1 for' tree with a conversation that books appointments and verifies insurance.",
    looking_for:
      "Healthtech operators, voice infra people, designers who actually like working on accessibility.",
    can_help_with:
      "Voice agent stack, telephony providers, HIPAA setup.",
    talk_to_me_if:
      "You hate phone trees and want to talk about why Twilio plus an LLM is finally a real answer.",
    tags: ["ai-agents", "voice", "healthtech", "sf"],
    intents: ["collaborator", "peer"],
    trust_tier: "verified",
    updated_at: "2026-04-27T15:42:00Z",
  },
  {
    id: "fc_ahmed",
    user_id: "u_ahmed",
    name: "Ahmed Khan",
    location: "New York",
    going_to_sf: true,
    attended_india: false,
    remote_global: false,
    open_to_async: true,
    open_to_in_person: true,
    building_summary:
      "Agent ops platform. The deployment, observability, and rollback layer for production agent systems. Solo, hiring.",
    looking_for:
      "Customers running agents in production. Cofounder optional. Distribution help.",
    can_help_with:
      "Production agent infra, k8s for AI workloads, evals to deploy gates.",
    talk_to_me_if:
      "Your agents work in dev, break in prod, and you do not know why.",
    tags: ["ai-agents", "infra", "devops", "solo", "hiring"],
    intents: ["collaborator", "cofounder"],
    trust_tier: "verified",
    updated_at: "2026-04-26T09:18:00Z",
  },
  {
    id: "fc_ren",
    user_id: "u_ren",
    name: "Ren Yamada",
    location: "Tokyo",
    going_to_sf: false,
    attended_india: false,
    remote_global: true,
    open_to_async: true,
    open_to_in_person: false,
    building_summary:
      "Robotics plus LLMs for warehouse automation. Robot arms that learn picking from a single demonstration.",
    looking_for:
      "Robotics researchers, ML-for-control people, manufacturing partners, anyone with a real warehouse problem.",
    can_help_with:
      "Robotics SDK selection, sim-to-real, manipulation policy training.",
    talk_to_me_if:
      "You think the gap between LLM-as-planner and a robot that actually picks a thing is a fun problem.",
    tags: ["robotics", "ai-agents", "manufacturing", "remote", "japan"],
    intents: ["collaborator", "peer"],
    trust_tier: "verified",
    updated_at: "2026-04-25T11:00:00Z",
  },
  {
    id: "fc_sara",
    user_id: "u_sara",
    name: "Sara Lin",
    location: "London",
    going_to_sf: true,
    attended_india: false,
    remote_global: false,
    open_to_async: true,
    open_to_in_person: true,
    building_summary:
      "Climate financing API. Helps SMEs in emerging markets get financing for solar and storage in days, not months.",
    looking_for:
      "Climate operators, fintech infra people, anyone building into emerging markets.",
    can_help_with:
      "Cross-border payments, climate data, EU regulatory pathways.",
    talk_to_me_if:
      "You build into Africa, India, or LatAm and you have hit the financing wall.",
    tags: ["climate", "fintech", "emerging-markets", "sf"],
    intents: ["collaborator", "peer"],
    trust_tier: "verified",
    updated_at: "2026-04-24T08:55:00Z",
  },
  {
    id: "fc_ana",
    user_id: "u_ana",
    name: "Ana Costa",
    location: "São Paulo",
    going_to_sf: false,
    attended_india: false,
    remote_global: true,
    open_to_async: true,
    open_to_in_person: false,
    building_summary:
      "Spanish and Portuguese voice agents for LatAm SMB customer service. Outbound and inbound, multi-tenant.",
    looking_for:
      "Voice infra, LatAm distribution, anyone selling SMB software in Spanish.",
    can_help_with:
      "LatAm GTM, Portuguese language model fine-tuning, telecoms in Brazil.",
    talk_to_me_if:
      "You build voice agents and you have not thought about LatAm yet.",
    tags: ["ai-agents", "voice", "latam", "smb", "remote"],
    intents: ["collaborator"],
    trust_tier: "verified",
    updated_at: "2026-04-22T14:00:00Z",
  },
  {
    id: "fc_kai",
    user_id: "u_kai",
    name: "Kai Mueller",
    location: "Berlin",
    going_to_sf: true,
    attended_india: false,
    remote_global: false,
    open_to_async: true,
    open_to_in_person: true,
    building_summary:
      "Open-source agent observability. OTel-style traces for LLM workflows. Bootstrapped, profitable.",
    looking_for:
      "Customers, contributors, design partners running agents at scale.",
    can_help_with:
      "Open-source distribution, OTel ecosystem, AI infra patterns.",
    talk_to_me_if:
      "You run agents and you cannot answer 'why did the agent do that' in under five minutes.",
    tags: ["ai-agents", "infra", "open-source", "observability", "sf"],
    intents: ["collaborator", "peer"],
    trust_tier: "verified",
    updated_at: "2026-04-20T17:11:00Z",
  },
  {
    id: "fc_eli",
    user_id: "u_eli",
    name: "Eli Roth",
    location: "Tel Aviv",
    going_to_sf: true,
    attended_india: false,
    remote_global: false,
    open_to_async: true,
    open_to_in_person: true,
    building_summary:
      "Cyber agents. Autonomous red team that finds prompt injection in production LLM apps and reports it like a bug.",
    looking_for:
      "Security buyers, AI infra teams, anyone with an LLM app in production.",
    can_help_with:
      "Prompt injection threat models, OWASP for LLMs, security GTM.",
    talk_to_me_if:
      "Your CISO has been asking 'is the AI safe' and you have nothing to point at.",
    tags: ["ai-agents", "security", "infra", "sf"],
    intents: ["collaborator"],
    trust_tier: "verified",
    updated_at: "2026-04-19T10:30:00Z",
  },
  {
    id: "fc_ananya",
    user_id: "u_ananya",
    name: "Ananya V",
    location: "Bangalore",
    going_to_sf: false,
    attended_india: true,
    remote_global: true,
    open_to_async: true,
    open_to_in_person: true,
    building_summary:
      "Undergrad solo founder. Educational platform for Indian high schoolers, AI tutor that adapts to local board syllabi.",
    looking_for:
      "Other young founders, edtech operators, India distribution help, accountability partners.",
    can_help_with:
      "Indian school system context, undergrad founder mistakes (I have made many), young community building.",
    talk_to_me_if:
      "You are 19 to 22, building seriously, and you want a peer who will actually tell you when your idea is mid.",
    tags: ["edtech", "india", "undergrad", "solo", "ai-tutor"],
    intents: ["peer", "friend"],
    trust_tier: "verified",
    updated_at: "2026-04-18T13:45:00Z",
  },
  {
    id: "fc_lior",
    user_id: "u_lior",
    name: "Lior Cohen",
    location: "San Francisco",
    going_to_sf: true,
    attended_india: false,
    remote_global: false,
    open_to_async: false,
    open_to_in_person: true,
    building_summary:
      "Plasma reactor design tooling for fusion startups. Makes simulation and iteration 100x faster.",
    looking_for:
      "Plasma physicists, fusion company hardware leads, simulation engineers.",
    can_help_with:
      "MHD simulation, plasma engineering, fusion startup landscape.",
    talk_to_me_if:
      "You are building anything with plasma, fusion, or weird physics, and you wish the simulation tooling was less terrible.",
    tags: ["hardtech", "fusion", "plasma", "physics", "sf"],
    intents: ["collaborator", "peer"],
    trust_tier: "verified",
    updated_at: "2026-04-17T22:00:00Z",
  },
];

export const COHORT_TAGS: { value: string; label: string; group: string }[] = [
  { value: "ai-agents", label: "AI agents", group: "Domain" },
  { value: "infra", label: "Infra", group: "Domain" },
  { value: "evals", label: "Evals", group: "Domain" },
  { value: "voice", label: "Voice", group: "Domain" },
  { value: "robotics", label: "Robotics", group: "Domain" },
  { value: "hardtech", label: "Hardtech", group: "Domain" },
  { value: "fusion", label: "Fusion", group: "Domain" },
  { value: "biotech", label: "Biotech", group: "Domain" },
  { value: "climate", label: "Climate", group: "Domain" },
  { value: "fintech", label: "Fintech", group: "Domain" },
  { value: "healthtech", label: "Healthtech", group: "Domain" },
  { value: "edtech", label: "Edtech", group: "Domain" },
  { value: "manufacturing", label: "Manufacturing", group: "Domain" },
  { value: "security", label: "Security", group: "Domain" },
  { value: "open-source", label: "Open source", group: "Domain" },

  { value: "sf", label: "SF", group: "Where" },
  { value: "india", label: "India", group: "Where" },
  { value: "remote", label: "Remote", group: "Where" },
  { value: "latam", label: "LatAm", group: "Where" },
  { value: "japan", label: "Japan", group: "Where" },
  { value: "emerging-markets", label: "Emerging markets", group: "Where" },

  { value: "cofounder", label: "Cofounder seeking", group: "Shape" },
  { value: "solo", label: "Solo", group: "Shape" },
  { value: "undergrad", label: "Undergrad", group: "Shape" },
  { value: "hiring", label: "Hiring", group: "Shape" },
  { value: "research", label: "Research", group: "Shape" },
];

export function findById(id: string): FounderCard | undefined {
  return MOCK_COHORT.find((c) => c.id === id || c.user_id === id);
}
