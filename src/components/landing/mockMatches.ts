// Mock match dataset for the landing-page social-proof bento. Lifted out
// of MockMatchCard.tsx so the data can be imported by Server Components.
//
// In Next.js 16 + Turbopack, a `"use client"` module's named exports get
// wrapped as client references during SSR. That meant `MOCK_MATCHES.slice
// is not a function` at prerender time — the array was a proxy, not an
// array. Splitting the data into a pure ES module restores the static
// shape so React Server can read .slice() on it.
//
// Voice: founder-coded, technical. "AI infra founder needs frontend
// killer" beats "Sara is a thoughtful engineer interested in AI." This
// is the register a YC SS attendee reads in Demo Day blurbs every week.

export type MockMatch = {
  name: string;
  city: string;
  tz: string;
  building: string;
  needs: string;
  stage: "0→1" | "PMF" | "scaling";
  tags: string[];
  matchScore: number;
  featured?: boolean;
};

export const MOCK_MATCHES: MockMatch[] = [
  {
    name: "Maya Chen",
    city: "SF",
    tz: "PT",
    building:
      "Inference scheduler for voice agents. Cuts p99 by 4x on shared GPU pools.",
    needs: "frontend killer for the live demo console",
    stage: "0→1",
    tags: ["ai-infra", "go", "react", "cuda"],
    matchScore: 94,
    featured: true,
  },
  {
    name: "Devansh Rao",
    city: "Bangalore",
    tz: "IST",
    building:
      "OS for biotech wet labs. Ingests instrument data, schedules experiments.",
    needs: "wet-lab automation cofounder, ideally ex-Genentech",
    stage: "0→1",
    tags: ["biotech", "robotics", "python"],
    matchScore: 91,
  },
  {
    name: "Lena Voss",
    city: "Berlin",
    tz: "CET",
    building:
      "Battery analytics for fleets. CAN bus + ISO 26262 firmware on hardware we ship.",
    needs: "growth partner who has shipped to OEMs",
    stage: "PMF",
    tags: ["climate", "hardtech", "embedded"],
    matchScore: 88,
  },
  {
    name: "Marcus Lin",
    city: "NYC",
    tz: "ET",
    building:
      "Devtools for agent runtimes. Trace every LLM call, replay any state.",
    needs:
      "second technical cofounder. Bias for systems people, ex-Stripe a plus",
    stage: "0→1",
    tags: ["devtools", "rust", "otel"],
    matchScore: 89,
  },
  {
    name: "Priya Reddy",
    city: "SF",
    tz: "PT",
    building:
      "Cross-border B2B payments. INR↔USD with sub-4-hour settlement.",
    needs: "compliance lead who's done MAS or RBI licensing",
    stage: "PMF",
    tags: ["fintech", "go", "policy"],
    matchScore: 86,
  },
  {
    name: "Aiko Tanaka",
    city: "Tokyo",
    tz: "JST",
    building:
      "Procurement copilot for SMB B2B. Lives inside Slack + email threads.",
    needs: "AI eval engineer to build the labelled-feedback loop",
    stage: "0→1",
    tags: ["ai-agents", "ts", "evals"],
    matchScore: 84,
  },
];
