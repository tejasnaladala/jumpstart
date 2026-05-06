#!/usr/bin/env bash
# Harness maintenance loop. One full pass = run typecheck/build/eval
# (the existing loop.sh) + run one harness round + run assertion suite
# + emit consolidated METRIC lines.
#
# Designed to run in a `while true` outer loop or via cron. Each pass
# is bounded and self-contained — if the dev server is down we still
# log METRIC lines (with zeros) so we can see the gap on the dashboard.
#
# Output: experiments/harness-loop.jsonl gets one summary row per pass.
# experiments/harness-runs/<run_id>/ gets per-persona traces.

set -uo pipefail
cd "$(dirname "$0")/.."

JSONL="experiments/harness-loop.jsonl"
mkdir -p experiments

START=$(date +%s)
TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)"
export HARNESS_RUN_ID="$RUN_ID"

# Defaults that respect the closed-beta posture.
export HARNESS_BASE_URL="${HARNESS_BASE_URL:-http://localhost:3030}"
export HARNESS_CONCURRENCY="${HARNESS_CONCURRENCY:-3}"
export HARNESS_HEADLESS="${HARNESS_HEADLESS:-1}"
export HARNESS_REALISM="${HARNESS_REALISM:-0.4}"

# 1. Hardening loop (typecheck, build, eval, lint).
HARDENING_OK=0
if bash scripts/loop.sh > /tmp/harness-loop-hardening.log 2>&1; then
  HARDENING_OK=1
fi
HARDENING_SCORE=$(grep -E "^METRIC hardening_score=" /tmp/harness-loop-hardening.log | tail -1 | sed 's/.*=//')
HARDENING_SCORE=${HARDENING_SCORE:-0}

# 2. Reachability check before paying for a full harness round.
SERVER_UP=0
if curl -fsS --max-time 5 "$HARNESS_BASE_URL/api/health" > /dev/null 2>&1; then
  SERVER_UP=1
fi

# 3. Harness round (only if the server is up).
HARNESS_OK=0
HARNESS_DURATION=0
if [ "$SERVER_UP" = "1" ]; then
  HSTART=$(date +%s)
  if bun run harness:once > /tmp/harness-loop-round.log 2>&1; then
    HARNESS_OK=1
  fi
  HARNESS_DURATION=$(( $(date +%s) - HSTART ))
fi

# 4. Invariant assertions.
ASSERTION_OK=0
ASSERTION_RATE=0
if [ "$SERVER_UP" = "1" ]; then
  if bun run harness:assert > /tmp/harness-loop-assert.log 2>&1; then
    ASSERTION_OK=1
  fi
  ASSERTION_RATE=$(grep -E "^METRIC harness_assertion_pass_rate=" /tmp/harness-loop-assert.log | tail -1 | sed 's/.*=//')
  ASSERTION_RATE=${ASSERTION_RATE:-0}
fi

# 5. Harness metrics over the most recent run.
if [ "$SERVER_UP" = "1" ]; then
  bun run harness:metrics --since-iso="$TS" > /tmp/harness-loop-metrics.log 2>&1 || true
fi

# Aggregate metrics.
SIGNUPS=$(grep -E "^METRIC harness_signups_total=" /tmp/harness-loop-metrics.log 2>/dev/null | tail -1 | sed 's/.*=//')
INTROS_REQ=$(grep -E "^METRIC harness_intros_requested_total=" /tmp/harness-loop-metrics.log 2>/dev/null | tail -1 | sed 's/.*=//')
INTROS_ACC=$(grep -E "^METRIC harness_intros_accepted_total=" /tmp/harness-loop-metrics.log 2>/dev/null | tail -1 | sed 's/.*=//')
INTROS_DEC=$(grep -E "^METRIC harness_intros_declined_total=" /tmp/harness-loop-metrics.log 2>/dev/null | tail -1 | sed 's/.*=//')
MEETINGS=$(grep -E "^METRIC harness_meetings_scheduled_total=" /tmp/harness-loop-metrics.log 2>/dev/null | tail -1 | sed 's/.*=//')
ERRORS=$(grep -E "^METRIC harness_errors_total=" /tmp/harness-loop-metrics.log 2>/dev/null | tail -1 | sed 's/.*=//')
ACCEPT_RATE=$(grep -E "^METRIC harness_acceptance_rate=" /tmp/harness-loop-metrics.log 2>/dev/null | tail -1 | sed 's/.*=//')

DURATION=$(( $(date +%s) - START ))

# JSONL log line for the dashboard / autoresearch parser.
LINE=$(cat <<EOF
{"ts":"$TS","run_id":"$RUN_ID","hardening_ok":$HARDENING_OK,"hardening_score":${HARDENING_SCORE:-0},"server_up":$SERVER_UP,"harness_ok":$HARNESS_OK,"harness_duration_s":$HARNESS_DURATION,"assertion_ok":$ASSERTION_OK,"assertion_rate":${ASSERTION_RATE:-0},"signups":${SIGNUPS:-0},"intros_requested":${INTROS_REQ:-0},"intros_accepted":${INTROS_ACC:-0},"intros_declined":${INTROS_DEC:-0},"meetings_scheduled":${MEETINGS:-0},"errors":${ERRORS:-0},"acceptance_rate":${ACCEPT_RATE:-0},"duration_s":$DURATION}
EOF
)
echo "$LINE" >> "$JSONL"

# METRIC lines for autoresearch.
echo "METRIC harness_loop_hardening_score=${HARDENING_SCORE:-0}"
echo "METRIC harness_loop_server_up=$SERVER_UP"
echo "METRIC harness_loop_harness_ok=$HARNESS_OK"
echo "METRIC harness_loop_assertion_rate=${ASSERTION_RATE:-0}"
echo "METRIC harness_loop_signups=${SIGNUPS:-0}"
echo "METRIC harness_loop_intros_requested=${INTROS_REQ:-0}"
echo "METRIC harness_loop_intros_accepted=${INTROS_ACC:-0}"
echo "METRIC harness_loop_meetings_scheduled=${MEETINGS:-0}"
echo "METRIC harness_loop_errors=${ERRORS:-0}"
echo "METRIC harness_loop_acceptance_rate=${ACCEPT_RATE:-0}"
echo "METRIC harness_loop_duration_s=$DURATION"

# Human summary.
echo ""
echo "Harness loop $RUN_ID:"
echo "  hardening: $([ "$HARDENING_OK" = "1" ] && echo OK || echo FAIL) (score=${HARDENING_SCORE:-0}/100)"
echo "  server:    $([ "$SERVER_UP" = "1" ] && echo UP || echo DOWN)"
echo "  harness:   $([ "$HARNESS_OK" = "1" ] && echo OK || echo SKIPPED)"
echo "  assertions: $([ "$ASSERTION_OK" = "1" ] && echo OK || echo FAIL) (rate=${ASSERTION_RATE:-0}%)"
echo "  signups:    ${SIGNUPS:-0}"
echo "  intros:     ${INTROS_REQ:-0} requested, ${INTROS_ACC:-0} accepted, ${INTROS_DEC:-0} declined"
echo "  meetings:   ${MEETINGS:-0} scheduled (acceptance ${ACCEPT_RATE:-0}%)"
echo "  errors:     ${ERRORS:-0}"
echo "  duration:   ${DURATION}s"
