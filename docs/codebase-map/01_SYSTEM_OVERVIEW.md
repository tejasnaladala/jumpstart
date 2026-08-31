# System overview

## What the app does

Jumpstart is an AI-routed pre-event matchmaker for **YC AI Startup School 2026** (Chase Center, San Francisco, July 25-26, 2026, ~2,000 hand-picked attendees). The product surface is intentionally tiny: three tabs (Drop, Browse, You) plus an inbox. Once an attendee finishes a 4-step onboarding wizard, they get one curated drop of three founders worth meeting on Mon, Wed, Fri at 9pm PT. They request an intro with a half-written opener; the recipient accepts or declines; on accept, both sides get a single email with contact details and a calendar link.

Behind that small surface, eight agents do the work: Onboarding Interviewer, Profile Synthesizer, Matchmaker, Match Explainer, Opener Drafter, Feedback Learner, Safety Classifier, Cohort Analyst. The system reasons about the cohort as a queryable graph and improves drop quality from feedback.

The corrected event facts (overriding the original spec, which assumed an 8,000-founder 90-day cohort): 2,000 attendees, 2 days in person, ~8 weeks of pre-event matchmaking, ~1-2 weeks of post-event follow-up.

## Main architecture

```
                         ┌──────────────────────────┐
                         │  Vercel (next 15.1.5)    │
                         │  region iad1, cron 0 3 * │
                         └─────────────┬────────────┘
                                       │
              ┌────────────────────────┴───────────────────────┐
              │                                                │
        Frontend (RSC + client)                       API routes (route.ts)
        src/app/(app)/**                              src/app/api/**
        src/components/**                             ├ /api/health (public)
        Tailwind + Radix + Framer                    ├ /api/cron/retention (Bearer)
        framer-motion, d3-geo                         ├ /api/drops, /api/browse
        ELU Analytics + PostHog                       ├ /api/intros (safety-gated)
                                                      └ /api/onboarding/interview
                                       │
                          ┌────────────┼────────────┐
                          │            │            │
                  Supabase Postgres   Anthropic   Upstash Redis
                  (auth, RLS,         (Sonnet     (rate limit,
                   pgvector 1536,     4.5 +        sliding window)
                   11 tables)         Haiku 4.5)
                          │
                  Resend (TODO)
                  PostHog (frontend)
                  Sentry (planned)
```

In one sentence: every important action is an agent invocation that writes structured output back to a queryable database, and the same agents power both the user surface and the autonomous testing/ops loop.

## Core runtime

- **Web framework:** Next.js 15.1 app router (RSC by default, client components opt-in via `"use client"`). Custom port 3030 in dev/start.
- **Package manager:** Bun (lockfile present). Bun also runs eval/harness/coord scripts via `tsx`.
- **Languages:** TypeScript 5.7 throughout, strict mode (see `tsconfig.json`).
- **UI primitives:** Radix dialog, dropdown, label, progress, slot, toast. Tailwind tokens layer on top.
- **Animations:** framer-motion 11. Spring presets in `src/components/motion.tsx`.
- **Map visualization:** d3-geo + topojson-client + `public/world-110m.json` driving `CohortGlobe`.
- **Validation:** Zod 3.24, schemas centralized in `src/lib/api/schema.ts`.
- **Auth:** Supabase Auth (magic link planned, currently stub-mode by env flags). `@supabase/ssr` + `@supabase/supabase-js`.
- **Rate limiting:** Upstash Redis sliding window in prod, in-memory mutex in dev/private-beta.
- **AI:** Anthropic SDK 0.40, Sonnet 4.5 (5 agents) and Haiku 4.5 (3 agents).
- **Database:** Supabase Postgres + pgvector (1536-dim embeddings on `founder_cards.embedding`).
- **Email:** Resend (env wired, not yet called).
- **Analytics:** PostHog (frontend), ELU Analytics (frontend, identify-on-mount).
- **E2E testing:** Playwright 1.50.
- **Deploy:** Vercel (`vercel.json` defines build, cron, headers, CSP).

## Major technical decisions

1. **Tiered stub mode.** Three independent flags (`JUMPSTART_FORCE_STUBS`, `JUMPSTART_ALLOW_STUB`, `JUMPSTART_PRIVATE_BETA`) plus a kill switch (`JUMPSTART_DISABLE_ANTHROPIC`). The app degrades gracefully from real Anthropic to local heuristics; auth degrades to a deterministic dev user; rate limiting falls back to in-memory. Each flag is checked explicitly to prevent accidental bypass in Vercel preview environments where `NODE_ENV=production`.

2. **Proxy as performance hint, not security.** `src/proxy.ts` rejects API calls with no Supabase auth-cookie hint to save route work. The route handler is the actual security boundary via `requireSession()`.

3. **Centralized agent runner.** All eight agents go through `src/lib/agents/runner.ts:139` (`runAgent`). It does retries with jittered backoff, model-specific timeouts, prompt cache on system blocks, JSON prefill (`{ role: "assistant", content: "{" }` to force JSON output), and cost tracking with hardcoded prices ($3/$15 Sonnet, $1/$5 Haiku per MTok).

4. **Deterministic local match generator.** `src/lib/match/local-drop.ts:103` runs in the browser and on the server when stubs are on. Score = `sharedTags*3 + intentOverlap*2 + sameCity*1`, with diversity rule (≥2 distinct match types in the top-3). The real Matchmaker agent runs on the same shape so swap-in is trivial.

5. **Autonomous test stack.** `scripts/launch-autonomous.sh` brings up server + harness loop + coordinator + autoresearch + assertion loop + checkpointer + caffeinate, supervised by a watchdog. The coordinator can edit code in safe zones (`harness/`, `scripts/`, `evals/`, `docs/`, `src/lib/`) but never frontend (`src/app/`, `src/components/`).

6. **PocketBase prepared but dormant.** `src/lib/pocketbase/client.ts` and `pocketbase/` directory exist as a closed-beta fallback. Currently unused; closed beta uses `localStorage` directly. Decision pending whether to wire PocketBase or migrate straight to Supabase for the 6,000-attendee launch.

7. **Voice rules enforced at multiple layers.** No em dashes, no AI-vocabulary, sentence-case headings. CI lints for them; agents are prompted with them; a humanizer pass re-checks user-facing copy.

## Current maturity level

| Area | State | Evidence |
|---|---|---|
| Frontend | **Working** in stub mode end-to-end | `tests/e2e/happy-path.spec.ts`, harness personas |
| Onboarding flow | **Working** with stub OTP and stub agent | `src/app/onboarding/**` + interview route |
| Drop generation | **Working** in stub mode (deterministic local) | `src/lib/match/local-drop.ts` |
| Real Matchmaker agent | **Built**, not wired into prod drop API | `src/lib/agents/matchmaker.ts` |
| Database schema | **Complete** (11 tables + RLS) | `supabase/migrations/0001_init.sql`, `0002_complete_rls.sql` |
| API routes | **Stub-mode complete**, prod paths throw 503 | `src/app/api/drops/route.ts:54`, `intros/route.ts:152` |
| Auth (real magic link) | **Not wired** | `src/app/signup/page.tsx:44-50` is mock localStorage |
| Rate limiting | **Working** with hard prod gate on Upstash | `src/lib/auth/rate-limit.ts:150` |
| Cron retention | **503 stub** | `src/app/api/cron/retention/route.ts:51` |
| Agent log persistence | **Local JSONL only**, Supabase TODO | `src/lib/agents/log.ts:98` |
| Seed script | **Missing** | `package.json` references `scripts/seed-cohort.ts`, file does not exist |
| Eval suites | **8 suites passing** in stub mode | `evals/cases/*.json` + `evals/run-all.ts` |
| Harness + coordinator | **Operational**, 12 personas | `harness/personas/seed.ts` |
| CI | **Three jobs** (build, evals, e2e) | `.github/workflows/ci.yml` |
| Production deploy | **Not yet performed** | No `vercel deploy --prod` evidence |

## Active branch and working state

- Default branch: `master` (spec, tooling, planning)
- Working branch: `implementation/v1` (this is what should be reviewed)
- Recent direction (latest 5 commits, oldest first):
  - `82d2514` chore(verification): hide stub-mode OTP codes from visible UI
  - `1e62991` chore(analytics): install ELU Analytics

## Phase plan from the spec (still applicable)

- **Phase 1, week 1.** Prototype: onboarding through intro accept. ✅ in stub mode.
- **Phase 2, weeks 2-3.** Closed loop: auto drops, eval suites, agent learning. 🟡 in progress.
- **Phase 3, weeks 4-5.** Agentic workflows: safety, analyst, re-engagement. 🟡 partial.
- **Phase 4, weeks 6-8.** Dashboard and memory layer: CohortOS, YC handoff. ⬜ pending.
- **Phase 5, post-launch.** Scale, token monitoring, full cohort. ⬜ pending.

## Date

Audit performed: 2026-05-06. The clock that matters: ~11 weeks until July 25-26 in-person event.
