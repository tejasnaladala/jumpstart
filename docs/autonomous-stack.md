# Autonomous Jumpstart - operating manual

The closed loop, top to bottom. Six processes run continuously and the
founder steps in only for the few decisions a machine cannot judge.

## What's running

| # | Process | Cycle | Purpose |
|---|---|---|---|
| 1 | `caffeinate.ps1` | 30s tick | Holds the system awake via `SetThreadExecutionState`. Lid close does not stop the loop. |
| 2 | `next start` (port 3030) | continuous | The product itself, in stub mode. |
| 3 | `harness:loop` | 3 min/round | 12 personas drive the live app via Playwright. The pressure-test surface. |
| 4 | `coord:loop` | 60s/round | Reads harness logs, builds proposals, runs codex+fool review, applies safe fixes. |
| 5 | `research:loop` | 5 min/cycle | Runs eval suite continuously. Surfaces drift the moment it lands. |
| 6 | `checkpointer.ps1` | 5 min | Auto-commits any change in `harness/`, `scripts/`, `evals/`, `docs/`, `src/lib/` to git. Never touches frontend. |
| 7 | `watchdog.ps1` | 30s | Probes every other process for liveness. Restarts anything dead inside 30s. |

## How it follows the principles

**AI as OS, not tool.** Every observation in the system is JSONL on disk.
The coordinator reads it, the reviewers judge it, the applier acts on it.
The founder is the chief judge, not the chief router.

**Closed loops everywhere.** Harness exercises the product → activity log
→ findings → proposals → review → apply → harness exercises the patched
product. The loop is the system. There is no out-of-band path.

**Legibility.** Six append-only JSONL streams capture every event:

| Stream | What it captures |
|---|---|
| `experiments/harness-activity.jsonl` | every persona event |
| `experiments/harness-meetings.jsonl` | every pretend meeting scheduled |
| `experiments/harness-assertions.jsonl` | every invariant pass/fail |
| `experiments/harness-loop.jsonl` | maintenance pass summaries |
| `experiments/coordinator.jsonl` | every finding/proposal/review/apply decision |
| `experiments/autoresearch.jsonl` | every eval cycle result + trend |
| `experiments/checkpoint.jsonl` | every git checkpoint commit |
| `experiments/watchdog.jsonl` | every liveness probe and restart |
| `experiments/caffeinate.log` | system-awake state |

A future you, or an LLM teammate, can answer "what happened on May 7
between 0900 and 1100?" in one grep.

**Software factory.** The coordinator is a closed `find-pain → propose →
review → apply` factory for harness-observable bugs. The applier refuses
anything that touches `src/app/` or `src/components/` (frontend), exceeds
5 files, or exceeds 100 LOC delta. Anything refused goes to
`experiments/coordinator-human-queue.jsonl` for the founder to triage.

**No human middleware.** Findings → proposals → reviewers → applier.
No status meetings. No "let me check with X". The reviewers are codex
(factual) + fool (devil's advocate); both must approve. When either
rejects, the proposal goes to the human queue with the rejection reason.

**Token-max.** Reviewers default to local heuristics when
`ANTHROPIC_API_KEY` is unset, so the coordinator can run all night
without burning the budget. When the key is wired, both reviewers run
real Haiku 4.5 calls per proposal. Cheap relative to a person's time.

## The auto-apply boundary

The applier writes to:
- `harness/` (the test harness itself)
- `scripts/` (ops scripts)
- `evals/` (eval cases)
- `docs/` (documentation)
- `src/lib/` (non-UI logic)
- `.octogent/` (tentacle scaffolding)

The applier refuses to write to:
- `src/app/` (frontend pages)
- `src/components/` (frontend components)
- `public/` (assets)
- `.env*`, `secrets/` (secrets)

A change that needs to touch any refused path lands in
`experiments/coordinator-human-queue.jsonl` for the founder to read,
edit by hand, and ship.

## Operations

### Launch everything

```bash
bash scripts/launch-autonomous.sh
```

Idempotent. Re-run any time. If a process is already alive, it skips
that one. New ones get started.

### Live monitoring

```bash
# One terminal - refreshing dashboard
bash scripts/monitor.sh

# Another terminal - raw event stream
tail -f experiments/coordinator.jsonl experiments/harness-activity.jsonl experiments/autoresearch.jsonl
```

### Stop everything

```bash
bash scripts/stop-autonomous.sh
```

### Read the human queue

```bash
cat experiments/coordinator-human-queue.jsonl | tail -20 | jq -c '.'
```

Each row is one rejected or escalated proposal with the rejection
reason, the original finding, and the proposal body.

## When the founder needs to step in

The autonomous loop handles:
- Harness bugs (selector drift, persona seed issues, flaky steps)
- Eval drift (regressions caught fresh, queued)
- Stale state (checkpointer commits work, watchdog restarts dead procs)
- Operating-system noise (caffeinate keeps it awake)

The founder still owns:
- Frontend changes (refused by applier)
- Architectural pivots (no proposal can describe these well)
- Product thesis (no LLM should be tuning this)
- Anything in `coordinator-human-queue.jsonl` flagged frontend / large-scope
- Anything the watchdog can't restart on its own (e.g. server build
  fails after a code change - watchdog restarts the binary, but if the
  build is broken the binary won't come up)

## Failure modes (and the fixes already in place)

| Failure | Detection | Recovery |
|---|---|---|
| Server crashes | Watchdog probes :3030 every 30s | Restart with same env |
| Harness loop dies | Watchdog reads `harness-loop.log` mtime; >4 min stale = dead | Restart with same env |
| Coordinator dies | Watchdog reads `coordinator.jsonl` mtime; >5 min stale = dead | Restart |
| Caffeinate dies | Watchdog reads `caffeinate.log` mtime; >90s stale = dead | Restart |
| Bad fix applied | Checkpointer commits each round; revertible by `git revert <sha>` | Revert |
| LLM reviewer hallucinates approve | Heuristic safety guards run BEFORE reviewer (scope, frontend, file existence) | Refused at applier |
| Disk fills with logs | TODO: rotate JSONL by day (not yet wired) | Manual `rm experiments/*.jsonl` |

## Next-step hooks (open by design)

These are the seams where a future iteration would plug in:

- **Active autoresearch perturbation.** Today autoresearch only observes.
  A future loop would generate variants of `coordinator.decideAccept`
  thresholds, run a 1-tick harness round, keep variants that improve
  acceptance_rate, revert otherwise.
- **Real Anthropic agents.** Reviewers fall back to heuristics when no
  API key is wired. Set `ANTHROPIC_API_KEY` in the env and both reviewers
  call Haiku 4.5 per proposal. Per-call cost ~$0.001; for ~30 proposals/hr
  that's pennies a day.
- **Cross-persona memory.** Ruflo's `memory_store`/`memory_search`
  primitives could give each persona vector recall across runs. Not
  needed for closed-beta-of-10 but worth queuing.
- **Spec-first software factory.** Today the coordinator only fixes
  bugs. A spec-first factory would let the founder write a spec + tests
  for a new feature, and the coordinator would build until tests pass.
  Boundary work - needs prompt design, not code.
