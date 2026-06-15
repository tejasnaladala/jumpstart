# Jumpstart

An unofficial attendee graph and matchmaker for YC Startup School 2026. It gives each founder one curated match three times a week, Monday, Wednesday, and Friday at 9pm PT, in the run-up to the event.

The interesting part is the matching layer. Nine agents (onboarding interviewer, profile synthesizer, matchmaker, match explainer, opener drafter, feedback learner, safety classifier, cohort analyst, re-engagement drafter) turn a free-text onboarding into a structured founder card, score the cohort, and write the explanation and opener for each match. Every agent has a deterministic local fallback, so the whole product runs end to end with no API key. Drop an `ANTHROPIC_API_KEY` in and the same call sites route to Claude instead of the stub, no other code change.

## Quickstart

```bash
bun install
bun run dev
```

The app boots at `http://localhost:3030`. Sign up with any email, run the 4-step onboarding, see your first drop. Stub mode is on by default: agents fall back to local heuristics, no key needed.

To switch agents from stub to real Claude calls, add `ANTHROPIC_API_KEY` to `.env.local`. See `.env.example` for the full flag matrix.

## How it works

- **Onboarding to founder card.** The onboarding interviewer collects a few free-text answers; the profile synthesizer turns them into a tagged `FounderCard`. Tags are the universal vocabulary: the same tags drive matching, Browse filters, and card display.
- **Matching.** `src/lib/match/local-drop.ts` is the deterministic stub. Score is `sharedTags*3 + intentOverlap*2 + sameCity*1`, then it picks the top three with a diversity rule that prefers distinct match types. The real matchmaker agent returns the same `Match` shape, so swapping it in is a one-line change at the call site.
- **Agent runner.** All nine agents go through `src/lib/agents/runner.ts`. It does jittered exponential backoff (3 retries), per-model timeouts (30s Sonnet, 15s Haiku), prompt caching on system blocks, JSON-mode via assistant prefill, and per-call cost tracking. There is a hard kill switch (`JUMPSTART_DISABLE_ANTHROPIC=1`) independent of the stub flag, so spend can be cut without touching anything else. In production the runner refuses to start in stub mode unless an explicit override flag is set.
- **Data.** Postgres schema with pgvector and row-level security lives in `supabase/migrations/` (3 migrations: init, complete RLS, retention audit). In closed beta the app runs on `localStorage` with PocketBase scaffolding as a fallback; neither backend is wired into the default dev path yet.
- **Safety.** Intro requests pass through the safety classifier before they post. Flagged content lands in a moderation queue.

## Project layout

- `src/app/` Next.js 16 app router: landing, signup, 4-step onboarding, drop, match detail, browse, you, and `/admin/*` dashboards.
- `src/components/` UI primitives plus product components (founder card, match card, founder pass, bottom nav).
- `src/lib/agents/` Nine agent definitions, the runner, and the cost/log layer.
- `src/lib/mock/` Local cohort fixture and tag taxonomy used in stub mode.
- `evals/` Eight eval suites, one per agent, with a runner that emits `METRIC` lines.
- `harness/` Persona harness: 13 YC-archetype personas drive the live app through Playwright. A coordinator reads the logs, proposes fixes, runs a two-reviewer approval gate, and applies safe changes inside `harness/`, `scripts/`, `evals/`, `docs/`, and `src/lib/`. Frontend changes always escalate to a human.

## Autonomous test stack

The product can run continuously while the synthetic founders pressure-test it, a coordinator triages findings, and a watchdog supervises everything.

```bash
bash scripts/launch-autonomous.sh   # bring up the stack (idempotent)
bash scripts/monitor.sh             # live dashboard, 3s refresh
bash scripts/verify-stack.sh        # one-shot health check (0/2/1 = green/degraded/critical)
bash scripts/stop-autonomous.sh     # clean shutdown
```

Operating manual: [`docs/autonomous-stack.md`](docs/autonomous-stack.md).

## Evals

```bash
bun run eval            # all suites, prints pass rate, exits 0 unless STRICT=1
STRICT=1 bun run eval   # non-zero exit on any regression
```

## Run one persona end to end

```bash
HARNESS_HEADLESS=0 bun run harness:persona p_priya_fintech
```

Watch a synthetic founder sign up, onboard, see her drop, and request an intro. Useful for catching selector drift after a UI change.

## Build and check

```bash
bun run typecheck   # tsc --noEmit
bun run lint        # next lint + voice-rule checks
bun run build       # next build
bun run test:e2e    # Playwright
```

## Deploy

Vercel project configured via `vercel.json` (includes cron). Run `vercel deploy --prod` once linked. Required env vars are listed in `.env.example`. Supabase migrations apply with `supabase db push`.

The closed-beta posture runs behind three opt-in flags:

```bash
JUMPSTART_PRIVATE_BETA=1 JUMPSTART_ALLOW_STUB=1 JUMPSTART_DEV_ADMIN=1 bun run start
```

These authorize in-memory rate-limit fallback, stub-mode auth, and the dev-admin bypass. They are valid for the closed-beta tunnel only, never for a public launch.

## Stack

TypeScript, Next.js 16 (app router), React 19, Tailwind with Radix/shadcn, framer-motion and three.js for the landing. `@anthropic-ai/sdk` for agents. Supabase (pgvector + RLS) and PocketBase as data options, Upstash for rate limiting, Resend and Twilio for OTP, Zod for validation, Playwright for e2e. Package manager is Bun.

## Status

This is a private, two-person project (see [CONTRIBUTING.md](CONTRIBUTING.md)). The frontend works end to end in stub mode. The matchmaker agent is built but not yet wired into the production drop API, real magic-link auth is not wired, and the live deployment runs on the closed-beta flags above. The eight eval suites pass in stub mode.
