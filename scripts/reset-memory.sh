#!/usr/bin/env bash
# reset-memory.sh - wipe past harness + experiment state for a clean
# friend-test demo. Does NOT touch git; commits stay. Does NOT touch
# the running server's localStorage (that's per-browser; visit /signup
# in the browser to wipe your own).
#
# What gets cleared:
#   - harness/state/*.json          per-persona durable state
#   - experiments/*.jsonl           activity, coordinator, autoresearch logs
#   - experiments/*.log             stdout streams
#   - experiments/harness-runs/     per-run screenshots and telemetry
#   - experiments/verify.jsonl      cron health-check history
#   - experiments/checkpoint.jsonl  checkpointer log (auto-commits stay)
#
# What survives:
#   - all git commits (history preserved)
#   - the autonomous coordinator config and skill files
#   - persona seed definitions
#   - per-browser localStorage (cleared by visiting /signup)

set -uo pipefail
cd "$(dirname "$0")/.."

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  cat <<'HELP'
reset-memory.sh - wipe harness state + experiment logs (no git impact)

Usage:
  bash scripts/reset-memory.sh         # wipe everything below
  bash scripts/reset-memory.sh --help  # this message

Wipes:
  harness/state/*.json
  experiments/*.jsonl
  experiments/*.log
  experiments/harness-runs/
  experiments/checkpoint.jsonl

Does NOT touch:
  git history
  the running server (it keeps serving)
  the running watchdog/harness loops (they regenerate state on next round)
  per-browser localStorage (visit /signup in the browser to wipe that)
HELP
  exit 0
fi

echo "[reset] $(date -u +%Y-%m-%dT%H:%M:%SZ) wiping harness + experiment state"

# Persona state (survived restarts; needs to die for a fresh demo).
if [ -d harness/state ]; then
  count=$(find harness/state -name '*.json' -type f | wc -l | tr -d ' ')
  rm -f harness/state/*.json
  echo "[reset] cleared $count persona state files"
fi

# Append-only logs.
for f in \
  experiments/harness-activity.jsonl \
  experiments/harness-meetings.jsonl \
  experiments/harness-assertions.jsonl \
  experiments/harness-loop.jsonl \
  experiments/coordinator.jsonl \
  experiments/coordinator-human-queue.jsonl \
  experiments/autoresearch.jsonl \
  experiments/assertion-loop.jsonl \
  experiments/checkpoint.jsonl \
  experiments/watchdog.jsonl \
  experiments/verify.jsonl
do
  if [ -f "$f" ]; then
    rm -f "$f"
    echo "[reset] removed $f"
  fi
done

# Stdout logs (less interesting, but stale).
rm -f experiments/*.log experiments/*.stdout.log 2>/dev/null
echo "[reset] cleared stdout logs"

# Per-run screenshots + telemetry.
if [ -d experiments/harness-runs ]; then
  rm -rf experiments/harness-runs
  echo "[reset] removed experiments/harness-runs/"
fi

echo "[reset] done. Visit /signup in the browser to wipe per-browser localStorage."
echo "[reset] If the autonomous loops are running, they will start producing fresh state on the next tick."
