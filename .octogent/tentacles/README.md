# Octogent tentacles

Empty by default. When you run `/octo-plan` against this repo, the
tentacle planner will scan the codebase and seed tentacles for the
durable agent personas. Each tentacle becomes a folder here:

```
.octogent/tentacles/<persona_id>/
  CONTEXT.md      - persona identity, mission, success criteria
  todo.md         - the persona's action queue (signup → drop → intro → meet)
  messages.md     - inbox for cross-persona messages (append-only)
```

Persona definitions live in `harness/personas/seed.ts` and are the
source of truth. Tentacles wrap them with octogent's swarm primitives:

- `/octo-swarm` runs all tentacle workers in parallel (cap 4 concurrent).
- Each worker invokes the persona's `tickPersona()` from
  `harness/lib/coordinator.ts`.
- DONE / BLOCKED returns get appended to the persona's todo.md.
- Worktree isolation can be enabled if a persona's run shouldn't pollute
  the main checkout.

Until you're ready to scale beyond what the in-process coordinator
handles, you don't need to populate this directory. The harness
runs standalone via `bun run harness:loop`.

To wire up:
1. Run `/octo-plan` in this repo (read-only — generates a proposal).
2. Confirm the tentacle list (one per persona in `harness/personas/seed.ts`).
3. Tentacle planner writes the CONTEXT.md + todo.md per tentacle here.
4. Run `/octo-swarm` to fan out the tick across personas in parallel.
