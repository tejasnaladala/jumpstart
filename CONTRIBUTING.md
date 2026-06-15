# Contributing

Jumpstart is built by two people: Tejas (backend, autonomous stack, data) and Mukund (design, editorial UX). GitHub issues and PRs are the coordination channel. This file is the shared contract for who owns what and how work lands.

## Areas of ownership

- **Backend (Tejas)** owns the autonomous stack (harness, coordinator, autoresearch), auth and OTP wire-up, PocketBase and Supabase migrations, API endpoints, rate limiting, the moderation queue, and anything that runs server-side.
- **Design (Mukund)** owns the editorial UX system: typography hierarchy, visual polish, OG image, Founder Pass treatment, onboarding progress, empty states, animation timings, mobile responsiveness, color usage.

The split is by area, not by skill. Mukund still ships code (TSX components, Tailwind classes, framer-motion timings); Tejas still touches UI when the change is backend-driven, e.g. wiring a real form to a real API. The owner label on each issue resolves any ambiguity.

## Branching

- `main` is the default branch. Feature work lands as PRs against it.
- Branch `feature/<short-slug>` for non-trivial work, e.g. `feature/pocketbase-otp` or `feature/feed-detail-polish`.
- The autonomous stack commits checkpoints to safe zones (`harness/`, `scripts/`, `experiments/`) directly to `main`. Pull with `--rebase` frequently.

## Labels

Apply at issue creation; update as work moves.

| Label | Meaning |
|---|---|
| `area:backend` | Backend / autonomous stack. |
| `area:design` | Design / UX. |
| `status:ready` | Unclaimed, fully briefed, can be picked up. |
| `status:in-progress` | Owner has started. Watch for PR. |
| `status:blocked` | Owner waiting on something. Read the latest comment. |
| `status:review` | PR open, needs review. |
| `area:auth` `area:onboarding` `area:drop` `area:feed` `area:inbox` `area:admin` `area:harness` | Surface area. Used for filtering. |

## Issue format

Every issue should be self-contained. Use this template:

```markdown
## Brief
What you're trying to accomplish, in 2-3 sentences.

## Context (file paths, line numbers)
- `src/path/to/file.ts:NN` - why it matters
- Prior commit `abc1234` - the change that introduced the relevant pattern

## Acceptance
- [ ] User can do X without seeing Y
- [ ] Build passes (`bun run build`)
- [ ] Type-check passes (`bun run typecheck`)
- [ ] (if backend) Health probe at `/api/health` returns 200 in stub mode

## Out of scope
- Stuff the issue does NOT cover, so the change doesn't expand its blast radius.
```

## PR checklist

Open a PR against `main` with:

1. Title in conventional-commit form (`feat(area): ...`, `fix(area): ...`, `chore(area): ...`).
2. Body that links the issue (`Closes #N`).
3. Screenshot for any user-facing change. Drop them in the PR body, not the repo.
4. A review from the other owner before merge.

## Voice rules

User-facing copy and PR descriptions follow these rules:

- No em-dashes. Commas, parens, periods, semicolons.
- No "not X, not Y, but Z" parallel constructions.
- No inflated significance language ("crucial", "robust", "comprehensive", "delve", "tapestry", "underscore", "stands as", "represents a").
- No promotional adjectives ("vibrant", "groundbreaking", "nestled").
- Sentence-case headings, vary sentence length, have opinions.
- Cohort size is **6,000**; event is **2 days at Chase Center, July 25-26, 2026**.

## Stub mode (default for local dev)

- Set `JUMPSTART_ALLOW_STUB=1` and `JUMPSTART_DEV_ADMIN=1` in `.env.local`.
- Without Supabase / Twilio / Resend keys, the app uses mocks at `src/lib/mock/*` and stub OTP delivery.
- OTP codes in stub mode are hidden from the visible UI. They log to the browser console as `[stub] email otp -> NNNNNN` and live in `localStorage` under `jumpstart.otp.email` / `jumpstart.otp.phone`.

## Real keys path (out of stub)

- Twilio and Resend keys live in Vercel project env, never in the repo. The OTP stub branch dies the moment `.env` has both keys filled.
- PocketBase admin lives at `pocketbase/bin/` (gitignored). Schema is at `pocketbase/schema.json` (tracked). Run `scripts/start-pocketbase.sh` locally.
- The Supabase migration is the v1.5 path. For now state lives in `localStorage` so both contributors have full feature parity.
