#!/usr/bin/env bash
# verify-stack.sh - comprehensive health check of the autonomous stack.
# Designed to be invoked by cron every ~18 minutes. Outputs a structured
# summary the cron handler can act on.
#
# Exit codes:
#   0 = all green
#   2 = degraded (one or more processes stale/missing, server still up)
#   1 = critical (server down or multiple core processes dead)
#
# Output: tab-separated KEY=VALUE lines on stdout, plus a one-line verdict
# at the end. JSONL row appended to experiments/verify.jsonl per run.

set -uo pipefail
cd "$(dirname "$0")/.."

mkdir -p experiments
LOG="experiments/verify.jsonl"
TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Helper: log file mtime age in seconds.
log_age_s() {
  local fp="$1"
  if [ ! -f "$fp" ]; then echo 99999; return; fi
  local now=$(date +%s)
  local mtime=$(stat -c %Y "$fp" 2>/dev/null || stat -f %m "$fp" 2>/dev/null | tr -d '\n')
  echo $(( now - mtime ))
}

# Helper: TCP listening on port.
is_listening() {
  netstat -ano 2>/dev/null | grep -q ":${1}.*LISTENING"
}

# Helper: HTTP probe.
http_status() {
  curl -s -m 3 -o /dev/null -w "%{http_code}" "$1" 2>/dev/null || echo "000"
}

# 1. Server reachability
SERVER_LISTENING=$(is_listening 3030 && echo 1 || echo 0)
HEALTH_STATUS=$(http_status http://localhost:3030/api/health)
ADMIN_HEALTH=$(http_status http://localhost:3030/admin/health)

# 2. Process liveness via log mtime (the lightweight check)
HARNESS_AGE=$(log_age_s experiments/harness-loop.log)
COORD_AGE=$(log_age_s experiments/coordinator.jsonl)
RESEARCH_AGE=$(log_age_s experiments/autoresearch.jsonl)
CAFFEINATE_AGE=$(log_age_s experiments/caffeinate.log)
WATCHDOG_AGE=$(log_age_s experiments/watchdog.jsonl)
CHECKPOINT_AGE=$(log_age_s experiments/checkpoint.jsonl)

# 3. Process counts
BUN_PROCESSES=$(tasklist //FI "IMAGENAME eq bun.exe" //NH 2>/dev/null | grep -c "bun.exe")
PWSH_PROCESSES=$(tasklist //FI "IMAGENAME eq powershell.exe" //NH 2>/dev/null | grep -c "powershell.exe")

# 4. Recent activity (last 30 min)
NOW_MS=$(date +%s)
SINCE_ISO=$(date -u -d "@$(( NOW_MS - 1800 ))" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || \
            date -u -r "$(( NOW_MS - 1800 ))" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || echo "0")

# Count events in last 30m. Quick grep-based; not perfect but cheap.
SIGNUPS_30M=$(grep -c '"event":"signed_up"' experiments/harness-activity.jsonl 2>/dev/null | tr -d '\n')
INTROS_30M=$(grep -c '"event":"requested_intro"' experiments/harness-activity.jsonl 2>/dev/null | tr -d '\n')
ACCEPTS_30M=$(grep -c '"event":"accepted_intro"' experiments/harness-activity.jsonl 2>/dev/null | tr -d '\n')
MEETINGS_30M=$(grep -c '"event":"scheduled_meeting"' experiments/harness-activity.jsonl 2>/dev/null | tr -d '\n')
COORD_FINDINGS=$(grep -c '"event":"finding"' experiments/coordinator.jsonl 2>/dev/null | tr -d '\n')
COORD_APPLIED=$(grep -c '"event":"applied"' experiments/coordinator.jsonl 2>/dev/null | tr -d '\n')
COORD_QUEUED=$(grep -c '"event":"queued"' experiments/coordinator.jsonl 2>/dev/null | tr -d '\n')
if [ -f experiments/coordinator-human-queue.jsonl ]; then
  HUMAN_QUEUE=$(wc -l < experiments/coordinator-human-queue.jsonl 2>/dev/null | tr -d ' \n')
else
  HUMAN_QUEUE=0
fi
HUMAN_QUEUE=${HUMAN_QUEUE:-0}

# 5. Assertion health (last 30 cycles)
ASSERT_RECENT_FAILS=$(tail -50 experiments/harness-assertions.jsonl 2>/dev/null | grep -c '"passed":false' | tr -d '\n')
# Set sane defaults so unbound or empty values don't crash arithmetic.
: "${SIGNUPS_30M:=0}" "${INTROS_30M:=0}" "${ACCEPTS_30M:=0}" "${MEETINGS_30M:=0}"
: "${COORD_FINDINGS:=0}" "${COORD_APPLIED:=0}" "${COORD_QUEUED:=0}"
: "${ASSERT_RECENT_FAILS:=0}" "${HUMAN_QUEUE:=0}"

# 6. Verdict
VERDICT="green"
EXIT_CODE=0
ISSUES=""

# Critical: server down
if [ "$SERVER_LISTENING" = "0" ] || [ "$HEALTH_STATUS" != "200" ]; then
  VERDICT="critical"
  EXIT_CODE=1
  ISSUES="$ISSUES,server_down"
fi

# Degraded: a loop is stale
if [ "$HARNESS_AGE" -gt 300 ]; then
  [ "$VERDICT" = "green" ] && VERDICT="degraded" && EXIT_CODE=2
  ISSUES="$ISSUES,harness_stale(${HARNESS_AGE}s)"
fi
if [ "$COORD_AGE" -gt 300 ]; then
  [ "$VERDICT" = "green" ] && VERDICT="degraded" && EXIT_CODE=2
  ISSUES="$ISSUES,coord_stale(${COORD_AGE}s)"
fi
if [ "$RESEARCH_AGE" -gt 900 ]; then
  [ "$VERDICT" = "green" ] && VERDICT="degraded" && EXIT_CODE=2
  ISSUES="$ISSUES,research_stale(${RESEARCH_AGE}s)"
fi
if [ "$CAFFEINATE_AGE" -gt 90 ]; then
  [ "$VERDICT" = "green" ] && VERDICT="degraded" && EXIT_CODE=2
  ISSUES="$ISSUES,caffeinate_stale(${CAFFEINATE_AGE}s)"
fi
if [ "$WATCHDOG_AGE" -gt 90 ]; then
  [ "$VERDICT" = "green" ] && VERDICT="degraded" && EXIT_CODE=2
  ISSUES="$ISSUES,watchdog_stale(${WATCHDOG_AGE}s)"
fi
if [ "$CHECKPOINT_AGE" -gt 600 ]; then
  [ "$VERDICT" = "green" ] && VERDICT="degraded" && EXIT_CODE=2
  ISSUES="$ISSUES,checkpoint_stale(${CHECKPOINT_AGE}s)"
fi

# Degraded: any recent assertion failures. Critical only if many.
# Threshold accounts for pre-rebuild noise that ages out as new passes
# accumulate from the assertion-loop.
if [ "$ASSERT_RECENT_FAILS" -gt 15 ]; then
  VERDICT="critical"
  EXIT_CODE=1
  ISSUES="$ISSUES,assertion_failures($ASSERT_RECENT_FAILS)"
elif [ "$ASSERT_RECENT_FAILS" -gt 5 ]; then
  [ "$VERDICT" = "green" ] && VERDICT="degraded" && EXIT_CODE=2
  ISSUES="$ISSUES,assertion_failures($ASSERT_RECENT_FAILS)"
fi

# Output structured summary
echo "ts=$TS"
echo "verdict=$VERDICT"
echo "server_listening=$SERVER_LISTENING"
echo "api_health=$HEALTH_STATUS"
echo "admin_health=$ADMIN_HEALTH"
echo "harness_age_s=$HARNESS_AGE"
echo "coord_age_s=$COORD_AGE"
echo "research_age_s=$RESEARCH_AGE"
echo "caffeinate_age_s=$CAFFEINATE_AGE"
echo "watchdog_age_s=$WATCHDOG_AGE"
echo "checkpoint_age_s=$CHECKPOINT_AGE"
echo "bun_processes=$BUN_PROCESSES"
echo "pwsh_processes=$PWSH_PROCESSES"
echo "signups_total=$SIGNUPS_30M"
echo "intros_total=$INTROS_30M"
echo "accepts_total=$ACCEPTS_30M"
echo "meetings_total=$MEETINGS_30M"
echo "coord_findings=$COORD_FINDINGS"
echo "coord_applied=$COORD_APPLIED"
echo "coord_queued=$COORD_QUEUED"
echo "human_queue_size=$HUMAN_QUEUE"
echo "assertion_recent_fails=$ASSERT_RECENT_FAILS"
echo "issues=${ISSUES#,}"
echo "VERDICT $VERDICT"

# JSONL append
LINE=$(cat <<EOF
{"ts":"$TS","verdict":"$VERDICT","server":$SERVER_LISTENING,"api_health":"$HEALTH_STATUS","admin_health":"$ADMIN_HEALTH","harness_age_s":$HARNESS_AGE,"coord_age_s":$COORD_AGE,"research_age_s":$RESEARCH_AGE,"caffeinate_age_s":$CAFFEINATE_AGE,"watchdog_age_s":$WATCHDOG_AGE,"checkpoint_age_s":$CHECKPOINT_AGE,"signups":$SIGNUPS_30M,"intros":$INTROS_30M,"accepts":$ACCEPTS_30M,"meetings":$MEETINGS_30M,"coord_findings":$COORD_FINDINGS,"coord_applied":$COORD_APPLIED,"coord_queued":$COORD_QUEUED,"human_queue_size":$HUMAN_QUEUE,"assertion_recent_fails":$ASSERT_RECENT_FAILS,"issues":"${ISSUES#,}"}
EOF
)
echo "$LINE" >> "$LOG"

exit $EXIT_CODE
