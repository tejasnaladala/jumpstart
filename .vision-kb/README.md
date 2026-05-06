# Vision knowledge base

Internal-only. The user does not read these files. They exist so the agent (me) keeps continuity across context resets and brings the right history to future autoresearch turns.

## Structure

- `decisions/` — accepted refinements with full rationale, one file per Decision (D###)
- `parking-lot/` — rejected ideas with the reason, the score delta, and the conditions that would justify revisiting (P###)
- `critiques/` — brutal critiques and how the current spec answers them (C###)
- `ideas/` — feature ideas to evaluate later, sorted by prior

## Index

### Decisions

- D001: Sharpen positioning vs YC Cofounder Matching and Bookface
- D002: Compress JTBD from 5 to 3
- D003: Collapse match types from 8 to 4
- D004: Model the reciprocity gap as a worked-out abuse case
- D005: Cut the contact-unlock state, single email on accept

### Parking lot

- P001: Cut the Browse tab entirely
- P002: Add weekly check-in nudge
- P003: Cut the Suggested Opener
- P004: Cohort Analyst as live status page
- P005: One high-signal match per drop instead of three

### Critiques

- C001: Why is Jumpstart different from Bookface for YC alumni?
- C002: What happens after the 90-day window?

### Ideas

- next-feature-experiments.md (queue of candidates for future autoresearch sessions)

## How future agent invocations should use this

1. On context reset / new session: read this README + `experiments/worklog.md` + `autoresearch-dashboard.md` + git log to recover state.
2. Before iterating: check `parking-lot/` so we do not retest something already discarded.
3. When the user introduces a new feature idea: write it to `ideas/` first, then schedule for next iteration.
4. When a parking-lot condition for revisit triggers: move the file into `decisions/` if the new run keeps it.
