#!/usr/bin/env bash
# launch-autonomous.sh - start the full autonomous Jumpstart stack:
#   1. caffeinate (PowerShell, prevents sleep)
#   2. Next.js production server (stub mode)
#   3. harness loop (12 personas, 3-min cycles)
#   4. autonomous coordinator (60-sec cycles)
#   5. autoresearch (5-min cycles)
#   6. checkpointer (5-min auto-commits to safe zones)
#   7. watchdog (30-sec liveness checks, restarts dead processes)
#
# Each process logs to experiments/<name>.log. The watchdog reads
# liveness from log mtime + TCP probes. Kill ANY process and the
# watchdog restarts it inside 30 seconds.
#
# Idempotent: if a process is already running, this script skips
# starting another instance.

set -uo pipefail
cd "$(dirname "$0")/.."

# --help / -h flag for discoverability. The full stack is documented in
# docs/autonomous-stack.md; the live monitor in docs/monitoring-quickstart.md.
if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  cat <<'HELP'
launch-autonomous.sh - start the full Jumpstart autonomous stack

Brings up these processes (idempotent: skips any already alive):

  1. caffeinate     scripts/caffeinate.ps1   prevent sleep
  2. server         next start (stub mode)   product on :3030
  3. harness_loop   bun run harness:loop     12 personas drive the app
  4. coordinator    bun run coord:loop       findings -> review -> apply
  5. autoresearch   bun run research:loop    eval suite continuously
  6. assertion_loop bun run assert:loop      invariant checks every 5min
  7. checkpointer   scripts/checkpointer.ps1 auto-commit safe zones
  8. watchdog       scripts/watchdog.ps1     restart anything dead

Usage:
  bash scripts/launch-autonomous.sh         # bring up the stack
  bash scripts/launch-autonomous.sh --help  # this message

Watch:
  bash scripts/monitor.sh                   # live dashboard
  tail -f experiments/coordinator.jsonl     # decision audit
  http://localhost:3030/admin/health        # browser monitor

Stop:
  bash scripts/stop-autonomous.sh

Verify:
  bash scripts/verify-stack.sh              # one-shot health check

Docs:
  docs/autonomous-stack.md                  # operating manual
  docs/monitoring-quickstart.md             # the page to keep open
HELP
  exit 0
fi

mkdir -p experiments

is_listening() {
  local port="$1"
  netstat -ano 2>/dev/null | grep -q ":${port}.*LISTENING"
}

log_age_seconds() {
  local fp="$1"
  if [ ! -f "$fp" ]; then echo 99999; return; fi
  local now=$(date +%s)
  local mtime=$(stat -c %Y "$fp" 2>/dev/null || stat -f %m "$fp" 2>/dev/null || echo 0)
  echo $(( now - mtime ))
}

start_if_missing() {
  local name="$1"
  local check_cmd="$2"
  local start_cmd="$3"
  if eval "$check_cmd"; then
    echo "[launch] $name already alive"
  else
    echo "[launch] starting $name"
    eval "$start_cmd"
  fi
}

echo "[launch] $(date -u +%Y-%m-%dT%H:%M:%SZ) starting autonomous stack"

# 1. caffeinate
start_if_missing "caffeinate" \
  '[ "$(log_age_seconds experiments/caffeinate.log)" -lt 90 ]' \
  'powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File scripts/caffeinate.ps1 > experiments/caffeinate.stdout.log 2>&1 &'

# 2. server
start_if_missing "server" \
  'is_listening 3030' \
  'JUMPSTART_PRIVATE_BETA=1 JUMPSTART_ALLOW_STUB=1 JUMPSTART_DEV_ADMIN=1 JUMPSTART_FORCE_STUBS=1 nohup bun run start > experiments/server.log 2>&1 &'

# Give the server up to 30s to start before kicking off the harness.
for i in $(seq 1 30); do
  if is_listening 3030; then break; fi
  sleep 1
done

# 3. harness loop
start_if_missing "harness_loop" \
  '[ "$(log_age_seconds experiments/harness-loop.log)" -lt 240 ]' \
  'HARNESS_CONCURRENCY=3 HARNESS_REALISM=0.4 HARNESS_LOOP_PAUSE_MS=180000 nohup bun run harness:loop > experiments/harness-loop.log 2>&1 &'

# 4. coordinator
start_if_missing "coordinator" \
  '[ "$(log_age_seconds experiments/coordinator.jsonl)" -lt 300 ]' \
  'HARNESS_COORD_PAUSE_MS=60000 nohup bun run coord:loop > experiments/coordinator.log 2>&1 &'

# 5. autoresearch
start_if_missing "autoresearch" \
  '[ "$(log_age_seconds experiments/autoresearch.jsonl)" -lt 600 ]' \
  'HARNESS_RESEARCH_PAUSE_MS=300000 nohup bun run research:loop > experiments/autoresearch.log 2>&1 &'

# 5b. assertion-loop (keeps invariant log fresh)
start_if_missing "assertion_loop" \
  '[ "$(log_age_seconds experiments/assertion-loop.jsonl)" -lt 600 ]' \
  'HARNESS_ASSERT_PAUSE_MS=300000 nohup bun run assert:loop > experiments/assertion-loop.log 2>&1 &'

# 6. checkpointer
start_if_missing "checkpointer" \
  '[ "$(log_age_seconds experiments/checkpoint.jsonl)" -lt 600 ]' \
  'powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File scripts/checkpointer.ps1 > experiments/checkpointer.stdout.log 2>&1 &'

# 7. watchdog
start_if_missing "watchdog" \
  '[ "$(log_age_seconds experiments/watchdog.jsonl)" -lt 60 ]' \
  'powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File scripts/watchdog.ps1 > experiments/watchdog.stdout.log 2>&1 &'

echo "[launch] all processes scheduled. Run scripts/monitor.sh in another terminal to watch live."
echo "[launch] kill all: bash scripts/stop-autonomous.sh"
