// Mock match dataset for the landing-page social-proof bento. Lifted out
// of MockMatchCard.tsx so the data can be imported by Server Components.
//
// In Next.js 16 + Turbopack, a `"use client"` module's named exports get
// wrapped as client references during SSR. That meant `MOCK_MATCHES.slice
// is not a function` at prerender time — the array was a proxy, not an
// array. Splitting the data into a pure ES module restores the static
// shape so React Server can read .slice() on it.
//
// Voice: founder-coded, technical AND personal. Founder said the previous
// 6-up bento was too transactional — just "what I'm building / what I
// need". The full set now reads like a magazine profile: building, what
// they're shipping next, what they offer back, what they read, working
// style, the weird interest most founders don't have, and the match-
// maker's reason for picking them. This is the register a YC SS attendee
// recognizes from a great Demo Day blurb plus the personality cues that
// turn an intro into a friendship.

export type MockMatch = {
  // Core identity
  name: string;
  city: string;
  tz: string;
  stage: "0→1" | "PMF" | "scaling";
  matchScore: number;
  featured?: boolean;
  // Build / ask
  building: string;
  needs: string;
  shippingNext: string;
  offersBack: string;
  // Personality
  reads: string;
  workingStyle: string;
  weirdInterest: string;
  // Matchmaker note: why we paired them with you
  matchReason: string;
  // Stack tags
  tags: string[];
};

export const MOCK_MATCHES: MockMatch[] = [
  {
    name: "Maya Chen",
    city: "SF",
    tz: "PT",
    stage: "0→1",
    matchScore: 94,
    featured: true,
    building:
      "Inference scheduler for voice agents. Cuts p99 by 4x on shared GPU pools. Currently in private beta with 7 voice-AI startups.",
    needs:
      "frontend killer for the live demo console. someone who can ship motion-rich state visualizations in a week.",
    shippingNext:
      "v0.4 of the routing layer with batch-size scaling to 32k tokens.",
    offersBack:
      "intros across the SF GPU underground. CUDA pair sessions for anyone fighting kernels.",
    reads:
      "Three-Body Problem on loop. Latent Space podcast every Friday.",
    workingStyle: "team of 3 in SoMa. lab energy, not standup energy.",
    weirdInterest: "competitive Rubik's cube speedsolves. sub-12s average.",
    matchReason:
      "you both ship before you announce. she needs your frontend; you'd ship faster with her CUDA brain on call.",
    tags: ["ai-infra", "go", "react", "cuda"],
  },
  {
    name: "Devansh Rao",
    city: "Bangalore",
    tz: "IST",
    stage: "0→1",
    matchScore: 91,
    building:
      "OS for biotech wet labs. Ingests instrument data, schedules experiments, queries protocols in plain English. Two paying labs.",
    needs:
      "wet-lab automation cofounder, ideally ex-Genentech or ex-Verge. someone who's run a thousand assays themselves.",
    shippingNext:
      "instrument adapter for Tecan + Hamilton liquid handlers.",
    offersBack:
      "wet-lab automation playbooks. warm intros to ex-Genentech ICs and seed investors who get bio.",
    reads:
      "Kary Mullis memoir. Antonio Regalado in MIT Tech Review.",
    workingStyle:
      "deep work mornings, lab afternoons. Bangalore + SF biweekly.",
    weirdInterest:
      "amateur radio operator (VU2DR). long train rides across Karnataka.",
    matchReason:
      "biotech infra + your matchmaker stack is a clean wedge. he's hiring, you're hunting.",
    tags: ["biotech", "robotics", "python"],
  },
  {
    name: "Lena Voss",
    city: "Berlin",
    tz: "CET",
    stage: "PMF",
    matchScore: 88,
    building:
      "Battery analytics for fleets. CAN bus + ISO 26262 firmware on hardware we ship to OEMs.",
    needs: "growth partner who's shipped to OEMs.",
    shippingNext: "fleet-grade dashboard for 5 European delivery operators.",
    offersBack:
      "EU compliance playbook. embedded firmware code reviews.",
    reads: "Daniel Yergin. Volts podcast. Neal Stephenson.",
    workingStyle: "small team in Kreuzberg. monthly hardware sprints.",
    weirdInterest: "rebuilding a 1976 Trabant in her garage.",
    matchReason:
      "hardtech-PMF founder, knows the OEM lobby. could open doors for you in EU.",
    tags: ["climate", "hardtech", "embedded"],
  },
  {
    name: "Marcus Lin",
    city: "NYC",
    tz: "ET",
    stage: "0→1",
    matchScore: 89,
    building:
      "Devtools for agent runtimes. Trace every LLM call, replay any state.",
    needs:
      "second technical cofounder. systems people, ex-Stripe a plus.",
    shippingNext: "trace-to-replay roundtrip in under 800ms.",
    offersBack: "OTel deep dives. NYC investor warm intros.",
    reads: "Hillel Wayne. Kleppmann's DDIA, third pass.",
    workingStyle: "morning person. solo for now, hiring soon.",
    weirdInterest: "rock climbing trad lines in the Gunks every weekend.",
    matchReason:
      "your matchmaker would benefit from his trace tooling. he needs a designer's eye on the replay UI.",
    tags: ["devtools", "rust", "otel"],
  },
  {
    name: "Priya Reddy",
    city: "SF",
    tz: "PT",
    stage: "PMF",
    matchScore: 86,
    building: "Cross-border B2B payments. INR↔USD with sub-4-hour settlement.",
    needs: "compliance lead who's done MAS or RBI licensing.",
    shippingNext: "AED + SGD corridors by end of Q3.",
    offersBack: "fintech regulatory contacts in 3 jurisdictions.",
    reads: "Matt Levine, daily. The Generalist.",
    workingStyle: "remote-first, quarterly off-sites in Singapore.",
    weirdInterest: "competitive bridge player. national tournament rated.",
    matchReason:
      "if you scale to multi-currency someday, she's your shortlist for compliance.",
    tags: ["fintech", "go", "policy"],
  },
  {
    name: "Aiko Tanaka",
    city: "Tokyo",
    tz: "JST",
    stage: "0→1",
    matchScore: 84,
    building:
      "Procurement copilot for SMB B2B. Lives inside Slack + email threads.",
    needs: "AI eval engineer to build the labelled-feedback loop.",
    shippingNext: "Japanese language eval suite + 50 paid pilots.",
    offersBack: "agent-eval methodology. Tokyo VC warm intros.",
    reads: "Murakami. Stratechery. Anything by Don Norman.",
    workingStyle: "Tokyo-Singapore biweekly. tea ceremony Sundays.",
    weirdInterest: "calligraphy. has a small studio in Kichijoji.",
    matchReason:
      "agent-eval pipeline overlaps with what your matchmaker needs at v2.",
    tags: ["ai-agents", "ts", "evals"],
  },
];
