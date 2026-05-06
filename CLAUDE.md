# Jumpstart

AI-routed relationship layer for the YC Startup School 2026 cohort. Curated weekly drops of three founders worth meeting, no swiping, no directory scrolling, all matchmaking done by agents.

**Source of truth for everything is** `docs/superpowers/specs/2026-05-05-jumpstart-design.md`. Read that first if you're spinning up on this project.

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

- `docs/superpowers/specs/2026-05-05-jumpstart-design.md` — full design spec
- `docs/external-tools.md` — gstack and autoresearch setup notes
- `external/inspection/` — read-only clones of reference repos (gitignored)
- `.superpowers/` — brainstorming session artifacts (gitignored)

## Build phases (from spec section 33)

- Phase 1, week 1: prototype. Onboarding through intro accept.
- Phase 2, week 2 to 3: closed-loop. Auto drops, eval suites, agent learning.
- Phase 3, week 4 to 5: agentic workflows. Safety, analyst, re-engagement.
- Phase 4, week 6 to 8: dashboard and memory layer. CohortOS, YC handoff.
- Phase 5, post-launch: scale, token monitoring, full cohort.
