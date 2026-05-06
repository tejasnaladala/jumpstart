# Jumpstart

The unofficial global attendee graph for YC Startup School 2026. Curated founder matches, every Wednesday.

## What is in this repo

- `src/app/` Next.js 15 app router. Landing, signup, 4-step onboarding, Drop, Match detail, Browse, You.
- `src/components/` UI primitives (Button, Pill, Avatar, Sheet, Toast) plus product components (FounderCard, MatchCard, FilterPanel, BottomNav, TopBar).
- `src/lib/agents/` Eight agent definitions (Onboarding Interviewer, Profile Synthesizer, Matchmaker, Match Explainer, Opener Drafter, Feedback Learner, Safety Classifier, Cohort Analyst). Pure prompt definitions plus a runner that calls Claude or falls back to local heuristic stubs.
- `src/lib/mock/` Local cohort fixture with 12 founders and tag taxonomy. Used in dev so the app is fully functional without a Supabase connection.
- `src/lib/match/local-drop.ts` Deterministic local drop generator. Produces 3 matches with diversity rule, explanation, suggested opener.
- `src/app/api/` Route handlers for onboarding interview, drops, intros (with safety classifier), browse search.
- `supabase/migrations/0001_init.sql` Full Postgres schema with pgvector, RLS policies, all tables from spec section 18.
- `evals/` Eval cases and runner. Outputs `METRIC` lines so autoresearch can ingest results.
- `.github/workflows/` CI on every PR (typecheck, build, evals, e2e). Weekly autoresearch eval cron.
- `docs/superpowers/specs/2026-05-05-jumpstart-design.md` The locked design spec.
- `.vision-kb/` Vision consolidation knowledge base (decisions, parking-lot, critiques, ideas).
- `autoresearch.md`, `autoresearch.jsonl`, `experiments/worklog.md`, `autoresearch-dashboard.md` Autoresearch session state.
- `external/inspection/` Read-only clones of upstream tools (gstack, autoresearch, openmythos). Gitignored.

## Run it

```bash
bun install
bun run dev
```

The app boots on `http://localhost:3030`.

Add `ANTHROPIC_API_KEY` to `.env.local` to switch agents from local stub to real Claude calls. Without the key the app still works end to end, just with deterministic responses.

## Build for production

```bash
bun run build
bun run start
```

## Run agent evals

```bash
bun run eval                 # all suites, prints pass-rate, exits 0 unless STRICT=1
STRICT=1 bun run eval        # exit non-zero on any fail
```

## Deploy

Vercel project pre-configured via `vercel.json`. Run `vercel deploy --prod` once the project is linked. Required env vars listed in `.env.example`.

Supabase migrations live in `supabase/migrations/`. Run with the Supabase CLI: `supabase db push`.

## Voice rules

Every user-facing string and every doc in this repo follows the rules in `CLAUDE.md`. No em dashes, no AI-vocabulary, sentence case headings, vary rhythm, have opinions.

## Branches

- `master` Spec, planning, and tooling.
- `implementation/v1` This branch. Working app.
- `autoresearch/vision-consolidation-2026-05-05` Vision iteration loop, merged into master.
