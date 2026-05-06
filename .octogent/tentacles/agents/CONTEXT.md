# Tentacle: agents

## Scope
The eight-agent system. Prompt definitions, runner, eval suites, golden cases, prompt versioning, taste profile maintenance.

## Files owned
- src/lib/agents/** (all 8 agents + types + runner + synthesize-local stub)
- src/lib/match/local-drop.ts
- evals/**

## What good looks like
- Every agent has 50+ golden cases in evals/cases/.
- The runner has retry, timeout, fallback to local stub, and a structured cost log.
- Prompts are versioned (v1, v2) and switchable via env or feature flag.
- Daily eval pass rate over 95% on the gold set.
- A new agent can be added in under 30 minutes.

## Boundaries
- This tentacle does not own UI. UI calls the API which routes to agents.
- This tentacle does not own DB schema. Agent log table changes go through the data tentacle.
- This tentacle does not own intro send/email. Intro is owned by trust-safety once the agent has scored it.

## Done state for v1
- 8 agent definitions exist with parse contracts.
- Runner switches between Claude API and local stub.
- 2 of 8 agents have eval cases (Match Explainer, Safety Classifier).
- Local match-drop generator works deterministically.

## Open todos
See todo.md.
