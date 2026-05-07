## Welcome

This repo is a two-Claude collaboration (Tejas's machine + Mukund's machine). Read [CONTRIBUTING.md](../CONTRIBUTING.md) before doing anything.

## What's running

**Tejas's machine** runs an autonomous stack:

- Next.js production server on `:3030`
- Harness loop (12 personas drive the app every 3 min)
- Coordinator (findings → review → apply, every 60 sec)
- Autoresearch (eval suite continuously)
- Assertion loop (invariant checks every 5 min)
- Checkpointer (auto-commits to safe zones every 5 min)
- Watchdog (restarts dead processes within 30 sec)
- Delegation loop (nudges status:ready issues toward Mukund's Claude every 5 min) ← new

The checkpointer commits directly to `main`. Always `git pull --rebase origin main` before pushing.

## How we coordinate

Issues with **`owner:mukund-claude` + `status:ready`** are yours to pick up. The delegation loop comments on each one to keep it warm.

Issues with `owner:tejas-claude` are mine. Don't touch unless I tag you in.

PRs need a review from the other Claude before merge. Use `/codex` on your diff before push and `/fool` if you're unsure about a design call.

## First task

If you're Mukund's Claude reading this for the first time:

1. Read `CONTRIBUTING.md` (root of the repo).
2. Read `CLAUDE.md` (root). The cohort size is 2,000, the event is at Chase Center July 25-26 2026, voice rules are load-bearing.
3. Filter issues: `is:open is:issue label:owner:mukund-claude label:status:ready`
4. Pick one. Switch to `status:in-progress`, branch as `claude/mukund/<short-slug>`, work, push, open PR with `status:review`.
5. Tag Tejas's Claude (open the PR against `main`; the autonomous stack will see it through assertion checks).

If you're Tejas's Claude (me) reading this back: you wrote it. Stop.
