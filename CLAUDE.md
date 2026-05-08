# Jumpstart

AI-routed pre-event matchmaker for **YC Startup School 2026**, the AI-focused **2-day in-person event** at **Chase Center, San Francisco, July 25-26, 2026**. Curated drops of founders worth meeting at the event. Built by an attendee. Cadence is Monday, Wednesday, Friday at 9pm PT during the matchmaking lead-in (~8 weeks before the event), with denser scheduling support during the 2 days on-site, then a follow-up window post-event.

**Cohort size: ~6,000 hand-picked attendees** (corrected from earlier 6,000 estimate; the 8,000 figure is also wrong — that was the historical online Startup School program). Any user-facing copy or stat referencing 6,000 or 8,000 is stale and should read 6,000.

**Source of truth for everything is** `docs/superpowers/specs/2026-05-05-jumpstart-design.md`. Read that first if you're spinning up on this project. **NB:** that spec was written assuming an 8,000-founder, 90-day distributed cohort. Treat all references to "8000 users", "8,000 founders", "90-day cohort", and "Days the cohort runs: 90" as outdated. The corrected facts above (2 days, Chase Center, ~6,000 attendees) override the spec.

## Event facts (load-bearing, do not get wrong)

- **Name:** YC Startup School 2026 (AI-focused, the in-person AI Startup School)
- **Dates:** July 25-26, 2026 (Saturday + Sunday)
- **Venue:** Chase Center, San Francisco
- **Format:** 2-day in-person event with speakers (Jensen Huang, Sam Altman, Jeff Dean among others), founder programming, networking time
- **Attendees:** ~6,000 hand-picked accepted founders
- **Pre-event window:** ~8 weeks of pre-event matchmaking (Jumpstart's primary surface)
- **Post-event window:** ~1-2 weeks of follow-up scheduling
- **Founder positioning:** "Built by an attendee, for the cohort"

## gstack (required, global install)

Before doing any work, verify gstack is installed:

```bash
test -d ~/.claude/skills/gstack/bin && echo "GSTACK_OK" || echo "GSTACK_MISSING"
```

If GSTACK_MISSING, stop and tell the user to install it:

```bash
git clone --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
cd ~/.claude/skills/gstack && ./setup --team
```

Do not skip gstack skills, ignore gstack errors, or work around missing gstack. Use `/browse` for all web browsing, never `mcp__claude-in-chrome__*`.

## When to use which gstack skill

Match the user's intent to the skill. Invoke via the Skill tool.

| Intent | Skill |
|---|---|
| Product idea, brainstorming, "should we build X" | `/office-hours` |
| Plan a feature with strategic challenge | `/plan-ceo-review` |
| Architecture, execution plan | `/plan-eng-review` |
| Design review of a plan | `/plan-design-review` |
| Full review pipeline (CEO + design + eng + DX) | `/autoplan` |
| Design system from scratch | `/design-consultation` |
| Visual exploration of variants | `/design-shotgun` |
| Pre-landing PR review | `/review` |
| QA test a live URL with browser | `/qa` or `/qa-only` |
| Visual polish on shipped UI | `/design-review` |
| Bug, error, weird behavior | `/investigate` |
| Security audit | `/cso` |
| Ship a PR | `/ship` |
| Land + deploy + canary verify | `/land-and-deploy` |
| Save context across sessions | `/context-save` and `/context-restore` |

## Autoresearch (also installed)

`/autoresearch <goal>` runs an autonomous experiment loop on any measurable metric. Useful for tuning Match Explainer prompt quality, Matchmaker scoring weights, Onboarding Interviewer drop-off rate, and any other agent prompt tuning. The agent creates a branch, writes a benchmark, runs a baseline, and loops, keeping winners and discarding losers. Hook the autoresearch context into settings.json only when actively running an experiment.

## Reframed product shape (post-correction)

The original spec described a 90-day distributed cohort with weekly drops. The actual event is a 2-day in-person gathering. Reconcile this way:

- **The cohort exists for ~10-12 weeks** total (8 pre-event + 2 in person + 1-2 follow-up), not 90 days.
- **Weekly drops** become **3-times-a-week drops** (Mon, Wed, Fri at 9pm PT) during the pre-event window, more frequent on-site.
- **The success metric** is not "useful meetings during a 90-day program" but **"useful meetings scheduled and completed during or around the 2-day event"**.
- **The Founder Pass** (the editorial admit-one ticket) and **the Founder Card** (the four-line founder data) are the same identity object, presented as one merged surface.
- **YC outreach trigger**: not "1000 verified users in 30 days" but a richer signal like "30-50 high-signal verified attendees + 20 meetings scheduled at the event + 10 marked useful afterward + 3 testimonials".

## Tech stack (from the spec)

- Next.js 15 app router on Vercel
- Supabase Postgres with pgvector
- Magic link auth (Supabase Auth or Clerk)
- Anthropic Claude 4.6 Sonnet for agents
- Resend for email
- PostHog for analytics
- Vercel AI SDK for streaming agent UI
- Tailwind CSS plus shadcn/ui base components
- Sentry for error monitoring
- GitHub Actions for CI
- Playwright for e2e tests

## Writing voice rules

All user-facing copy and all docs in this repo follow these rules:

1. No em dashes. Use commas, parens, periods, semicolons.
2. No "not X, not Y, but Z" parallel constructions.
3. No inflated significance language (no "stands as", "serves as", "represents a", "marks a", "showcases", "highlights its importance").
4. No promotional adjectives (no "vibrant", "rich", "groundbreaking", "nestled", "in the heart of").
5. No "tapestry", "interplay", "intricate", "delve", "underscore", "landscape" used abstractly.
6. No bolded inline-header lists like `**Speed:** description`. Use real subsections or write prose.
7. No emoji decoration of headings or bullets.
8. No knowledge-cutoff hedges or "in conclusion, the future looks bright" closures.
9. Headings are sentence case, not Title Case Of Every Word.
10. Vary sentence length. Short punchy lines mixed with longer ones. Have opinions.

If a humanizer skill is available, run it before shipping any user-facing copy.

## Project conventions

- Files: many small files over few large files. 200 to 400 lines typical, 800 max.
- Immutability: prefer creating new objects over mutating existing ones.
- Tags are the universal vocabulary. Same tags drive matching, Browse filters, and Founder Card display. Examples: `ai agents`, `hardtech`, `india`, `sf`, `cofounder`, `solo`, `undergrad`.
- Three product tabs only in v1: Drop, Browse, You. No Pods, no Micro-meetups, no Relationship Map, no Follow-up tracker. They live in the parking lot in the spec until v1 traction justifies adding them back.
- No customers or investors in the intent options. Cohort is for cofounders and collaborators.

## Agents that run the product

Eight agents do the work. Each has a SKILL.md style spec in the design doc, section 10. Order of importance for v1:

1. Onboarding Interviewer
2. Profile Synthesizer
3. Matchmaker
4. Match Explainer
5. Opener Drafter
6. Feedback Learner
7. Safety Classifier
8. Cohort Analyst

## Files of record

- `docs/superpowers/specs/2026-05-05-jumpstart-design.md` - full design spec
- `docs/external-tools.md` - gstack and autoresearch setup notes
- `external/inspection/` - read-only clones of reference repos (gitignored)
- `.superpowers/` - brainstorming session artifacts (gitignored)

## Build phases (from spec section 33)

- Phase 1, week 1: prototype. Onboarding through intro accept.
- Phase 2, week 2 to 3: closed-loop. Auto drops, eval suites, agent learning.
- Phase 3, week 4 to 5: agentic workflows. Safety, analyst, re-engagement.
- Phase 4, week 6 to 8: dashboard and memory layer. CohortOS, YC handoff.
- Phase 5, post-launch: scale, token monitoring, full cohort.
