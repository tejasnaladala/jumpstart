# Jumpstart codebase map

This folder is the navigation layer for the Jumpstart repo. If you are new to the project, read this file first, then `01_SYSTEM_OVERVIEW.md`, then jump to whichever map matches the work in front of you.

## What this is

A working set of docs that explains every layer of Jumpstart in enough detail that a new engineer can be productive in under an hour. It is built from a static audit on `implementation/v1` (commit `200255c` and prior). It is not auto-regenerated; refresh it after material changes.

The docs that ship with the repo (under `docs/`) are operating manuals (`autonomous-stack.md`, `monitoring-quickstart.md`, `launch-playbook.md`, `pocketbase-setup.md`). This folder is different: it describes what is actually in the code.

## How to navigate

| If you are | Read |
|---|---|
| New here | `00_README.md` → `01_SYSTEM_OVERVIEW.md` → `02_REPO_STRUCTURE.md` → `12_ONBOARDING.md` |
| The frontend collaborator | `03_FRONTEND_MAP.md` + `05_API_CONTRACTS.md` + `../FRONTEND_COLLABORATOR_HANDOFF.md` |
| The backend owner | `04_BACKEND_MAP.md` + `06_DATABASE_MAP.md` + `07_AUTH_AND_SECURITY.md` + `../BACKEND_OWNER_BRIEF.md` |
| Tracing a bug | `08_DATA_FLOWS.md` + the relevant per-domain map |
| Doing a security pass | `07_AUTH_AND_SECURITY.md` + `10_RISKS_AND_TECH_DEBT.md` |
| Setting up a dev box | `12_ONBOARDING.md` + `09_DEPENDENCIES_AND_CONFIG.md` |
| Coordinating with the other side | `11_COLLABORATION_GUIDE.md` |

## What is frontend-owned vs backend-owned

This is a load-bearing distinction in this repo because two people are working in it.

**Frontend-owned (touch freely, do not break the API contracts in `05_API_CONTRACTS.md`):**

- `src/app/(app)/**` — drop, browse, match, inbox, you tabs
- `src/app/onboarding/**` — 4-step onboarding wizard
- `src/app/page.tsx` — landing
- `src/app/signup/page.tsx` — signup entry point
- `src/components/**` — every UI primitive and product component
- `src/lib/hooks/**` — `useDraftState` and any future hooks
- `src/lib/match/local-drop.ts` — client-side match generator (deterministic stub)
- `src/lib/mock/**` — `MOCK_COHORT`, `DEFAULT_ME` fixtures
- `tailwind.config.ts`, `src/app/globals.css` — design tokens and base styles
- `public/**` — static assets, the topojson world map

**Backend-owned (frontend should propose changes via PR, not edit directly):**

- `src/app/api/**` — route handlers (auth, rate limit, agent calls)
- `src/lib/agents/**` — the eight Claude agents and their runner
- `src/lib/auth/**` — session, admin, rate limit
- `src/lib/api/schema.ts` — Zod schemas for request/response (the contract)
- `src/lib/safety/**`, `src/lib/moderation/**`, `src/lib/verification/**`, `src/lib/forum/**`, `src/lib/inbox/**`, `src/lib/drop/**` — server logic
- `src/lib/pocketbase/**` — currently dormant client (closed-beta fallback)
- `src/proxy.ts` — auth cookie fast-fail
- `supabase/migrations/**` — DB schema
- `evals/**`, `harness/**` — testing and autonomous ops infrastructure
- `scripts/**` — launch, watchdog, checkpointer, monitor
- `.github/workflows/**` — CI
- `vercel.json` — deploy + cron + headers

**Shared (coordinate changes):**

- `src/lib/types.ts` — `FounderCard`, `Match`, `Drop`, `IntroRequest`, etc.
- `src/lib/api/schema.ts` — request/response Zod schemas
- `.env.example` — flag matrix and required keys
- `README.md`, `CONTRIBUTING.md`

## What is fragile vs safe to modify

**Fragile (change with care, run evals):**

- `src/lib/agents/runner.ts` — the Anthropic call wrapper. Retries, timeouts, prompt cache, JSON prefill, cost tracking. Breaking this kills every agent.
- `src/lib/auth/session.ts` — stub-mode gating. Any change to the env-flag conditions can leak stub auth into prod.
- `src/lib/auth/rate-limit.ts:150` — the hard gate that blocks in-memory rate limiting in production.
- `src/proxy.ts` — auth fast-fail. Public-route bypass list is critical.
- `supabase/migrations/0002_complete_rls.sql` — RLS policies. A wrong USING clause is a data leak.
- `harness/scripts/coordinator.ts` — autonomous stack. Has write zones; do not widen them casually.

**Safe to modify:**

- Any frontend page or component (run `bun run typecheck` and `bun run lint` after).
- Eval cases in `evals/cases/*.json` — additions only need a passing run; deletions need justification.
- Tailwind tokens (semver-cosmetic; the editorial palette is a brand decision).
- `harness/personas/seed.ts` — can add or tweak personas without breaking anything.
- Docs.

## What is unknown

Marked throughout the maps as `UNKNOWN: <evidence checked>`. Top items:

- **Magic-link auth wiring.** Signup is mock localStorage today. The Supabase Auth flow is described in the spec but no code path connects the click-through email to a real session.
- **Vercel Cron retention deletion.** `src/app/api/cron/retention/route.ts` returns 503; the deletion logic is not implemented.
- **Match ownership in prod.** `assertMatchOwnership` in `src/app/api/intros/route.ts` throws when not in stub mode.
- **Agent log persistence.** `src/lib/agents/log.ts` writes to the local filesystem in dev, has a TODO for the Supabase service-role insert.
- **Seed script.** `package.json` lists `bun run db:seed` but `scripts/seed-cohort.ts` does not exist.

These are tracked in `10_RISKS_AND_TECH_DEBT.md`.

## How to refresh this map

1. Re-run the audit pass (the prompt that produced this set lives in the conversation history and can be replayed).
2. Or run `/graphify` from this repo root to regenerate the graph artifacts in `../graph/`.
3. Update the date at the bottom of `01_SYSTEM_OVERVIEW.md`.

## Files in this folder

- `00_README.md` — this file
- `01_SYSTEM_OVERVIEW.md` — what the app does, runtime, decisions
- `02_REPO_STRUCTURE.md` — folder-by-folder breakdown
- `03_FRONTEND_MAP.md` — pages, components, styling, API calls
- `04_BACKEND_MAP.md` — routes, services, middleware, jobs
- `05_API_CONTRACTS.md` — every API surface
- `06_DATABASE_MAP.md` — tables, RLS, vectors, read/write sites
- `07_AUTH_AND_SECURITY.md` — auth flow, gating, secrets, headers
- `08_DATA_FLOWS.md` — user journeys end to end
- `09_DEPENDENCIES_AND_CONFIG.md` — packages, env, scripts, deploy
- `10_RISKS_AND_TECH_DEBT.md` — ranked risks, dead code, refactors
- `11_COLLABORATION_GUIDE.md` — frontend / backend ownership rules
- `12_ONBOARDING.md` — 30-minute path to productivity
