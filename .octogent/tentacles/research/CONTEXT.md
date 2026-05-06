# Tentacle: research

## Scope
Continuous autoresearch loops on agent quality, matching algorithm, scoring weights, copy quality, safety thresholds. Owns the eval suite, the autoresearch sessions, and the weekly cron.

## Files owned
- evals/**
- autoresearch.md, autoresearch.jsonl, autoresearch.sh (vision-consolidation session, archived)
- experiments/** (per-session worklogs)
- .vision-kb/** (knowledge base, agent-managed)
- .github/workflows/autoresearch.yml

## What good looks like
- At any moment, at least one autoresearch session is running on a measurable agent metric.
- The eval pass rate is published to a dashboard and watched daily.
- Every prompt change gets a regression eval before deploy.
- The knowledge base documents every kept and discarded experiment with rationale.
- Weekly cron uploads eval results as artifacts. Monthly manual review.

## Boundaries
- This tentacle does not modify agent prompts directly. It proposes, tests, and recommends. Agents tentacle owns the deploys.
- This tentacle does not own safety thresholds in production. Trust-safety owns those. Research can recommend changes via experiment results.

## Done state for v1
- One autoresearch session completed (vision-consolidation, 11 runs, score 85→94).
- Knowledge base structure built (.vision-kb).
- Eval runner exists for 2 of 8 agents.
- Weekly cron workflow defined in .github/workflows/autoresearch.yml.

## Open todos
See todo.md.
