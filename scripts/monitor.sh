#!/usr/bin/env bash
# Live monitor for the persona harness. Run this in a side terminal
# while the harness loop runs. Refreshes every 3 seconds, shows the
# 4 things that matter:
#   - server up/down
#   - last 5 persona events
#   - last 3 meetings scheduled
#   - rolling totals (signups, intros, accepts, errors)
#
# Bun + jq required. Uses tput cup to redraw in place so the screen
# stays clean.

set -uo pipefail
cd "$(dirname "$0")/.."

ACTIVITY="experiments/harness-activity.jsonl"
MEETINGS="experiments/harness-meetings.jsonl"
LOOP="experiments/harness-loop.jsonl"
ASSERTIONS="experiments/harness-assertions.jsonl"

mkdir -p experiments

while true; do
  clear
  echo "Jumpstart harness monitor"
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "─────────────────────────────────────────────────────────────"

  # Server health
  HEALTH=$(curl -s -m 2 -o /dev/null -w "%{http_code}" http://localhost:3030/api/health 2>/dev/null || echo "down")
  case "$HEALTH" in
    200) echo "  server:        UP  /api/health 200" ;;
    *)   echo "  server:        DOWN  /api/health $HEALTH" ;;
  esac

  # Latest assertion result
  if [ -f "$ASSERTIONS" ]; then
    LAST_ASSERT=$(tail -50 "$ASSERTIONS" 2>/dev/null | tail -1)
    if [ -n "$LAST_ASSERT" ]; then
      ASSERT_PASSED=$(echo "$LAST_ASSERT" | grep -oE '"passed":[a-z]+' | sed 's/"passed"://')
      ASSERT_NAME=$(echo "$LAST_ASSERT" | grep -oE '"name":"[^"]+"' | sed 's/"name":"//; s/"//')
      echo "  last invariant: $ASSERT_PASSED  $ASSERT_NAME"
    fi
  fi

  # Counters from activity log
  if [ -f "$ACTIVITY" ]; then
    SIGNUPS=$(grep -c '"event":"signed_up"' "$ACTIVITY" 2>/dev/null || echo 0)
    DROPS=$(grep -c '"event":"viewed_drop"' "$ACTIVITY" 2>/dev/null || echo 0)
    REQS=$(grep -c '"event":"requested_intro"' "$ACTIVITY" 2>/dev/null || echo 0)
    ACCS=$(grep -c '"event":"accepted_intro"' "$ACTIVITY" 2>/dev/null || echo 0)
    DECS=$(grep -c '"event":"declined_intro"' "$ACTIVITY" 2>/dev/null || echo 0)
    MEETS=$(grep -c '"event":"scheduled_meeting"' "$ACTIVITY" 2>/dev/null || echo 0)
    ERRS=$(grep -c '"event":"error"' "$ACTIVITY" 2>/dev/null || echo 0)
    echo "  signups: $SIGNUPS  drops: $DROPS  intros: $REQS  accepts: $ACCS  declines: $DECS  meetings: $MEETS  errors: $ERRS"
  else
    echo "  (no activity yet)"
  fi

  # Last 5 events
  echo ""
  echo "Recent persona events:"
  if [ -f "$ACTIVITY" ]; then
    tail -5 "$ACTIVITY" 2>/dev/null | while read line; do
      ts=$(echo "$line" | grep -oE '"ts":"[^"]+"' | sed 's/"ts":"//; s/"//' | cut -dT -f2 | cut -d. -f1)
      pid=$(echo "$line" | grep -oE '"persona_id":"[^"]+"' | sed 's/"persona_id":"//; s/"//')
      ev=$(echo "$line" | grep -oE '"event":"[^"]+"' | head -1 | sed 's/"event":"//; s/"//')
      printf "  %s  %-20s  %s\n" "$ts" "$pid" "$ev"
    done
  fi

  # Last 3 meetings
  echo ""
  echo "Recent meetings scheduled:"
  if [ -f "$MEETINGS" ]; then
    tail -3 "$MEETINGS" 2>/dev/null | while read line; do
      meet_at=$(echo "$line" | grep -oE '"meeting_at":"[^"]+"' | sed 's/"meeting_at":"//; s/"//')
      req=$(echo "$line" | grep -oE '"requester_id":"[^"]+"' | sed 's/"requester_id":"//; s/"//')
      rec=$(echo "$line" | grep -oE '"recipient_id":"[^"]+"' | sed 's/"recipient_id":"//; s/"//')
      mod=$(echo "$line" | grep -oE '"modality":"[^"]+"' | sed 's/"modality":"//; s/"//')
      printf "  %s  %s  ↔  %s  (%s)\n" "$meet_at" "$req" "$rec" "$mod"
    done
  else
    echo "  (none yet)"
  fi

  # Last loop pass
  echo ""
  echo "Last maintenance pass:"
  if [ -f "$LOOP" ]; then
    tail -1 "$LOOP" 2>/dev/null | grep -oE '"[^"]+":[^,}]+' | head -10 | while read field; do
      echo "  $field"
    done
  else
    echo "  (no loop pass yet — run scripts/harness-loop.sh)"
  fi

  echo ""
  echo "Press Ctrl-C to stop."
  sleep 3
done
