# Jumpstart

The unofficial global attendee graph for YC Startup School 2026. One curated founder match three times a week, Monday, Wednesday, and Friday at 09:00 PT.

## What is in this repo

### Product

- `src/app/` Next.js 15 app router. Landing, signup, 4-step onboarding, Drop, Match detail, Browse, You, /admin/health.
- `src/components/` UI primitives (Button, Pill, Avatar, Sheet, Toast) plus product components (FounderCard, MatchCard, FilterPanel, BottomNav, TopBar, FounderPass).
- `src/lib/agents/` Eight agent definitions (Onboarding Interviewer, Profile Synthesizer, Matchmaker, Match Explainer, Opener Drafter, Feedback Learner, Safety Classifier, Cohort Analyst). Pure prompt definitions plus a runner that calls Claude or falls back to local heuristic stubs.
- `src/lib/mock/` Local cohort fixture with 12 founders and tag taxonomy.
- `src/lib/match/local-drop.ts` Deterministic local drop generator. Produces 3 matches with diversity rule, explanation, suggested opener.
- `src/app/api/` Route handlers for onboarding interview, drops, intros (with safety classifier), browse search.
- `supabase/migrations/0001_init.sql` Full Postgres schema with pgvector, RLS policies, all tables from spec section 18.

### Autonomous testing + ops surface

- `harness/` Persona harness. Twelve YC-archetype personas drive the live app via Playwright. See `harness/README.md`.
- `harness/scripts/coordinator.ts` Autonomous coordinator. Reads harness logs, builds proposals, runs codex+fool review, applies safe fixes inside `harness/`, `scripts/`, `evals/`, `docs/`, `src/lib/`. Frontend changes always escalate.
- `harness/scripts/autoresearch.ts` Continuous eval cycle, drift detection.
- `harness/scripts/assertion-loop.ts` Continuous invariant suite.
- `scripts/launch-autonomous.sh` Bring up the full 8-process stack (idempotent).
- `scripts/stop-autonomous.sh` Take it down cleanly.
- `scripts/verify-stack.sh` One-shot health check, exit 0/2/1 = green/degraded/critical.
- `scripts/monitor.sh` Live terminal dashboard refreshing every 3s.
- `scripts/watchdog.ps1` 30s liveness probes, restarts dead processes.
- `scripts/checkpointer.ps1` 5min auto-commit of safe-zone changes.
- `scripts/caffeinate.ps1` Holds the system awake; lid-close-safe.
- `evals/` Eval cases and runner. Outputs `METRIC` lines so autoresearch can ingest results.
- `.github/workflows/` CI on every PR (typecheck, build, evals, e2e).

### Docs

- `docs/autonomous-stack.md` The operating manual for the 8-process autonomous stack.
- `docs/monitoring-quickstart.md` The single page to keep open while running.
- `docs/launch-playbook.md` Pre-launch checklist + distribution sequence + tunnel handling.
- `docs/prelaunch-review-synthesis.md` Output of the 12-agent prelaunch review.
- `docs/imessage-ditto-debate.md` Decision doc on iMessage / ditto.ai integration.
- `docs/superpowers/specs/2026-05-05-jumpstart-design.md` The locked design spec.

## Quickstart (5 minutes)

The fastest path from `git clone` to seeing the product:

```bash
bun install
bun run dev
```

The app boots on `http://localhost:3030` in dev mode. Sign up with any email, fill out the 4-step onboarding, see your first Drop. Stub mode is on by default - agents fall back to local heuristics, no API key needed.

To switch agents from local stub to real Claude calls, drop `ANTHROPIC_API_KEY` into `.env.local`.

## Production / closed-beta posture

```bash
bun run build
JUMPSTART_PRIVATE_BETA=1 JUMPSTART_ALLOW_STUB=1 JUMPSTART_DEV_ADMIN=1 JUMPSTART_FORCE_STUBS=1 bun run start
```

The triple-flag opt-in authorizes in-memory rate-limit fallback, stub-mode auth, and dev-admin bypass. Only valid for the closed-beta tunnel; never for a real public launch.

## Operating the autonomous stack

The product runs continuously while 12 synthetic founders pressure-test it, an autonomous coordinator triages findings, and a watchdog supervises everything.

```bash
# Bring up everything (idempotent)
bash scripts/launch-autonomous.sh

# Watch live
bash scripts/monitor.sh

# One-shot health check
bash scripts/verify-stack.sh

# Take it down cleanly
bash scripts/stop-autonomous.sh
```

Detailed operating manual: [`docs/autonomous-stack.md`](docs/autonomous-stack.md). The single page to keep open while running: [`docs/monitoring-quickstart.md`](docs/monitoring-quickstart.md).

## Run agent evals

```bash
bun run eval                 # all suites, prints pass-rate, exits 0 unless STRICT=1
STRICT=1 bun run eval        # exit non-zero on any fail
```

## Run a single persona end-to-end

```bash
HARNESS_HEADLESS=0 bun run harness:persona p_priya_fintech
```

Watch a synthetic founder sign up, onboard, see her drop, and (decision-style permitting) request an intro. Useful for debugging selector drift after a UI change.

## Deploy

Vercel project pre-configured via `vercel.json`. Run `vercel deploy --prod` once the project is linked. Required env vars listed in `.env.example`.

Supabase migrations live in `supabase/migrations/`. Run with the Supabase CLI: `supabase db push`.

## Voice rules

Every user-facing string and every doc in this repo follows the rules in `CLAUDE.md`. No em dashes, no AI-vocabulary, sentence case headings, vary rhythm, have opinions.

## Branches

- `master` Spec, planning, and tooling.
- `implementation/v1` This branch. Working app + autonomous stack.
