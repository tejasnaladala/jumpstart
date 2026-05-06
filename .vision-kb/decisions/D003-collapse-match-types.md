# Decision D003: Collapse match types from 8 to 4

Run 6, commit 3e10467, score 89 → 91. Drift warnings 2 → 1.

## What changed

Section 17 from 8 types to 4.

Kept: Domain peer, Cofounder shape, Weird adjacent collision, City match.
Cut as separate types: Technical collaborator, GTM collaborator, India to global bridge, Accountability partner. These now express as tag-level signals that feed the score, not categorical match types.

## Why it improves the rubric

Simplicity (cleaner Matchmaker prompt, smaller golden eval set, smaller diversity constraint surface) and AI-OS coherence (fewer agent decisions to make, fewer evals to maintain). Drift warning specifically about overengineered taxonomy resolved.

## What this doesn't decide

The scoring weights. Those still get tuned via a separate autoresearch session against real drop data once collected.

## Reopens if

After 8 weeks of real drops, data shows the 4 types are too coarse (e.g., users complain that domain peers and cofounder shapes feel mixed up). Then add granularity back, but only the types that data supports.
