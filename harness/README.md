# Persona harness

Twelve YC SS 2026 founder personas that drive the live app via Playwright,
talk to each other through the actual intro API, and pretend-schedule
meetings on accept. Production-quality testing surface for the closed-beta
launch and beyond.

## Why this exists

A static set of E2E tests catches regressions on the happy path. It does
not catch:

- the founder running the app under realistic load while debugging
- the matchmaker producing the same boring matches when N personas all
  signed up the same day
- per-API rate limit drift under concurrent traffic
- the recipient surface not actually being built (which only shows up
  when you try to be the recipient)

The harness fills that gap. Twelve personas with distinct identities,
intent, and decision styles act like real users continuously, the
maintenance loop runs invariant assertions every round, and the founder
gets a single dashboard with `/admin/health` + `experiments/harness-loop.jsonl`.

## Architecture

```
harness/
  types.ts                 - Persona, PersonaState, ActivityEntry shapes
  personas/
    seed.ts                - 12 seeded personas (extend here)
  lib/
    session.ts             - per-persona Playwright session + actions
    coordinator.ts         - onboard, tick, route intro, schedule meet
    state.ts               - JSON file persistence per persona
    activity.ts            - append-only activity log (jsonl)
    observability.ts       - per-session telemetry + screenshots
    assertions.ts          - invariant checks per round
    metrics.ts             - aggregator + METRIC line emitter
    realism.ts             - typos, abandonment, refresh noise
  runner.ts                - CLI entry point (once | loop | persona <id>)
  scripts/
    run-assertions.ts      - standalone assertion runner
  state/                   - per-persona JSON state (gitignored)
```

## Commands

```bash
# One full round: onboard every persona then run a single tick each.
bun run harness:once

# Continuous loop. Onboard once, then tick every persona every 60s.
HARNESS_LOOP_PAUSE_MS=60000 bun run harness:loop

# Single-persona dry run (debugging).
bun run harness:persona p_priya_fintech

# Invariant assertion suite (independent of personas).
bun run harness:assert

# Compute metrics over the most recent run.
bun run harness:metrics

# Full maintenance cycle: hardening + harness round + assertions + metrics.
bash scripts/harness-loop.sh
```

## Environment knobs

| Var | Default | Effect |
|---|---|---|
| `HARNESS_BASE_URL` | `http://localhost:3030` | Where personas sign up. Set to the cloudflared tunnel URL to drive the public surface. |
| `HARNESS_HEADLESS` | `1` | `0` to watch personas drive the app live in a real browser window. |
| `HARNESS_CONCURRENCY` | `4` | How many personas to run in parallel. Drop to 1 to debug. |
| `HARNESS_REALISM` | `0.3` (`0.4` in the loop script) | Probability multiplier for realism noise (typos, abandonment, refresh). 0 disables, 1 maxes. |
| `HARNESS_LOOP_PAUSE_MS` | `60000` | Loop mode: ms between rounds. 0 means run one round and exit. |
| `HARNESS_RUN_ID` | timestamp | Subdirectory under `experiments/harness-runs/` for screenshots and traces. |

## Where output goes

| Path | What's there |
|---|---|
| `harness/state/<persona_id>.json` | Per-persona durable state (signups, intros, meetings). |
| `experiments/harness-activity.jsonl` | Every event from every persona, append-only. |
| `experiments/harness-meetings.jsonl` | Every pretend meeting that got scheduled. |
| `experiments/harness-assertions.jsonl` | Invariant assertion results, append-only. |
| `experiments/harness-runs/<run_id>/<persona_id>/` | Per-persona screenshots + telemetry per run. |
| `experiments/harness-loop.jsonl` | One row per maintenance loop pass - the dashboard feed. |

## What the personas actually do

Per tick, each persona:

1. Maybe browses `/browse` (30% chance, exercises filter sheet).
2. Maybe visits `/you` and clicks Share (15% chance, exercises Web Share path).
3. Visits `/drop` and reads three matches.
4. Decides whether to act - driven by `cadence.actionRate`.
5. If acting, picks one match (eager picks first, picky filters,
   ghoster ignores, chatty randomizes).
6. Submits `POST /api/intros` through the per-context Playwright
   `request` (real auth state, real headers).
7. Coordinator routes the intro to the recipient persona's state, runs
   the recipient's decision rule, and on accept writes a
   `harness-meetings.jsonl` row with a pretend meeting time before
   the SS event date (2026-07-25).

Mobile vs desktop: 30% of personas (deterministic by id hash) run
under Pixel 7 / iPhone profiles. The rest run desktop 1280x800.

## Adding a persona

Append a new entry to `harness/personas/seed.ts`. Stable id is the
contract - once a persona's id is in production state files, do not
rename it. Bump the id (e.g. `p_priya_fintech_v2`) for material identity
changes that should reset state.

## Octogent integration (later)

The directory layout was chosen to map cleanly to octogent tentacles.
When you're ready to swarm-orchestrate, run `/octo-plan` and the
tentacle planner will read each persona's intent + behavior and
scaffold `.octogent/tentacles/<persona_id>/` with CONTEXT.md +
todo.md per persona. The tentacle worker invokes the persona's tick
through the same `harness/lib/coordinator.ts` primitives.

## What this harness deliberately does NOT do

- It does not simulate the recipient surface in the app - that surface
  isn't built yet. The coordinator is the substitute for now: it routes
  intros to recipient personas via state writes. When the in-app
  incoming-intros tray ships, swap that path to drive the real UI.
- It does not run with real Anthropic / Supabase keys. Stub mode is
  the contract - the personas' job is to pressure-test stub-mode flows.
  Wire real services after the closed-beta-of-10 phase.
- It does not authenticate per persona via magic link. Stub mode treats
  every browser context as a fresh session; the harness exploits that
  by giving each persona its own context.
