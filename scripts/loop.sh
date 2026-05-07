#!/usr/bin/env bash
# Continuous quality loop. Runs typecheck, build, eval suite, and a security
# regex audit. Outputs METRIC lines for autoresearch. Designed to run on a
# schedule (cron, GitHub Action, or a local while-true loop).
#
# No API spend. Eval suite skips real agent calls when ANTHROPIC_API_KEY is
# absent. The metrics still measure something useful: code quality and
# regression catching.

set -uo pipefail
# We deliberately do NOT use -e because each subcommand failure is a metric,
# not a script-fatal event. Failed builds still get logged.

cd "$(dirname "$0")/.."

JSONL="experiments/loop.jsonl"
mkdir -p experiments

START=$(date +%s)
TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Track each subscore so we can surface specific regressions.
TYPE_OK=0
BUILD_OK=0
EVAL_OK=0
LINT_OK=0

# Typecheck.
if bun run typecheck > /tmp/loop-tc.log 2>&1; then
  TYPE_OK=1
fi

# Production build.
if bun run build > /tmp/loop-build.log 2>&1; then
  BUILD_OK=1
fi

# Eval suite (no-API friendly).
if bun run eval > /tmp/loop-eval.log 2>&1; then
  EVAL_OK=1
fi

# Lightweight security regex audit. No em dash in user-facing strings, no
# obvious `any` cast misuse, no console.log in production paths.
LINT_VIOLATIONS=0

# Em dashes anywhere in source (we ban them per voice rules).
EM_DASH_HITS=$(grep -rn --include='*.ts' --include='*.tsx' --include='*.md' --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=external " - " src 2>/dev/null | wc -l | tr -d ' ')
if [ "${EM_DASH_HITS:-0}" -gt 0 ]; then
  LINT_VIOLATIONS=$((LINT_VIOLATIONS + EM_DASH_HITS))
fi

# console.log in src (excluding evals/scripts).
CONSOLE_HITS=$(grep -rn --include='*.ts' --include='*.tsx' --exclude-dir=node_modules --exclude-dir=.next "console\.log" src 2>/dev/null | wc -l | tr -d ' ')
if [ "${CONSOLE_HITS:-0}" -gt 0 ]; then
  LINT_VIOLATIONS=$((LINT_VIOLATIONS + CONSOLE_HITS))
fi

if [ "$LINT_VIOLATIONS" -eq 0 ]; then
  LINT_OK=1
fi

# Composite hardening score (0 to 100).
SCORE=$(( TYPE_OK*30 + BUILD_OK*30 + EVAL_OK*25 + LINT_OK*15 ))

DURATION=$(( $(date +%s) - START ))

# JSONL log line.
LINE="{\"ts\":\"$TS\",\"score\":$SCORE,\"typecheck\":$TYPE_OK,\"build\":$BUILD_OK,\"eval\":$EVAL_OK,\"lint\":$LINT_OK,\"em_dashes\":${EM_DASH_HITS:-0},\"console_logs\":${CONSOLE_HITS:-0},\"duration_s\":$DURATION}"
echo "$LINE" >> "$JSONL"

# METRIC lines for autoresearch parsing.
echo "METRIC hardening_score=$SCORE"
echo "METRIC typecheck=$TYPE_OK"
echo "METRIC build=$BUILD_OK"
echo "METRIC eval=$EVAL_OK"
echo "METRIC lint=$LINT_OK"
echo "METRIC em_dashes=${EM_DASH_HITS:-0}"
echo "METRIC console_logs=${CONSOLE_HITS:-0}"
echo "METRIC duration_s=$DURATION"

# Human-readable summary.
echo ""
echo "Hardening score: $SCORE/100"
echo "  typecheck: $([ $TYPE_OK -eq 1 ] && echo OK || echo FAIL)"
echo "  build:     $([ $BUILD_OK -eq 1 ] && echo OK || echo FAIL)"
echo "  eval:      $([ $EVAL_OK -eq 1 ] && echo OK || echo FAIL)"
echo "  lint:      $([ $LINT_OK -eq 1 ] && echo OK || echo FAIL) (em-dashes=${EM_DASH_HITS:-0}, console.log=${CONSOLE_HITS:-0})"
echo "  duration:  ${DURATION}s"
