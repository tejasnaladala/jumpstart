# Contributing

Two-Claude collaboration convention for Jumpstart. One Claude runs on Tejas's machine, one on Mukund's. GitHub Issues, PRs, and labels are the only coordination channel — neither Claude can see the other's terminal.

## Roles and the channel

- **Tejas + Codex (backend)** — own the autonomous stack (harness, coordinator, autoresearch), real auth + OTP wire-up, PocketBase + Supabase migrations, API endpoints, rate limiting, the moderation queue, and anything backed by code that runs server-side. Codex is OpenAI Codex CLI, used as an independent reviewer + audit layer on the backend diffs.
- **Mukund's Claude (design)** — owns the editorial UX system: typography hierarchy, visual polish, OG image, Founder Pass treatment, onboarding progress, empty states, animation calls, mobile responsiveness, color usage. Read each issue's "Brief" section like a self-contained agent prompt.
- **Both** — read this file, the project root [CLAUDE.md](CLAUDE.md), and the spec at `docs/superpowers/specs/2026-05-05-jumpstart-design.md` (override notes in CLAUDE.md beat the spec where they conflict).

The split is by area, not by skill. Mukund still ships code (TSX components, Tailwind classes, framer-motion timings); Tejas + Codex still touch UI when the change is backend-driven (e.g. wiring a real form to a real API). The owner labels on each issue resolve any ambiguity.

## Branching

- `implementation/v1` is the default branch. Feature work lands as PRs against it.
- Each Claude branches `claude/<owner>/<short-slug>` for non-trivial work, e.g. `claude/mukund/pocketbase-otp` or `claude/tejas/feed-detail-polish`.
- The autonomous stack on Tejas's machine commits checkpoints to safe zones (harness, scripts, experiments) directly to `implementation/v1`. Both Claudes should `git pull --rebase` frequently.

## Labels

Apply at issue creation; update as work moves.

| Label | Meaning |
|---|---|
| `owner:tejas-claude` | Backend / autonomous stack. Tejas + Codex are on it. |
| `owner:mukund-claude` | Design / UX. Mukund's Claude is on it. |
| `status:ready` | Unclaimed, fully briefed, can be picked up. |
| `status:in-progress` | Owner has started. Watch for PR. |
| `status:blocked` | Owner waiting on something. Read the latest comment. |
| `status:review` | PR open, needs review by the other Claude. |
| `area:auth` `area:onboarding` `area:drop` `area:feed` `area:inbox` `area:admin` `area:harness` `area:design` | Surface area. Used for filtering. |

## Issue format (briefing pattern)

Every issue meant for a Claude must be self-contained. The reader has zero conversation history. Use this template:

```markdown
## Brief
What you're trying to accomplish, in 2-3 sentences.

## Context (file paths, line numbers)
- `src/path/to/file.ts:NN` - why it matters
- `docs/spec.md#section` - relevant spec section
- Prior commit `abc1234` - the change that introduced the relevant pattern

## Acceptance
- [ ] User can do X without seeing Y
- [ ] Build passes (`npm run build`)
- [ ] Type-check passes (`npx tsc --noEmit`)
- [ ] Visual diff verified at 1440x900 and 414x896 (run `npx tsx harness/scripts/design-audit-shoot.ts`)
- [ ] (if backend) Health probe at `/api/health` returns 200 in stub mode

## Out of scope
- Stuff the issue does NOT cover, so the agent doesn't expand the blast radius.

## Useful skills
- `/codex` for an independent code review of the diff before push
- `/fool` to challenge any design call you make
- `/qa` to manually exercise the flow if it's user-facing
```

## PR checklist

Open a PR against `implementation/v1` with:

1. Title in conventional-commit form (`feat(area): ...`, `fix(area): ...`, `chore(area): ...`).
2. Body that links the issue (`Closes #N`).
3. Self-review by running `/codex` (gstack skill) on the diff before requesting review.
4. Screenshot for any user-facing change. Drop them in the PR body, not the repo.
5. The other Claude reviews. Apply `status:review` label, comment with findings, switch to `status:in-progress` if changes needed.

## Voice rules (load-bearing)

User-facing copy and PR descriptions both follow the rules in [CLAUDE.md](CLAUDE.md):

- No em-dashes. Commas, parens, periods, semicolons.
- No "not X, not Y, but Z" parallel constructions.
- No inflated significance language ("crucial", "robust", "comprehensive", "delve", "tapestry", "underscore", "stands as", "represents a").
- No promotional adjectives ("vibrant", "groundbreaking", "nestled").
- Sentence-case headings, vary sentence length, have opinions.
- Cohort size is **2,000** (not 8,000), event is **2 days at Chase Center July 25-26 2026**.

## Stub mode (default for both Claudes)

- `JUMPSTART_ALLOW_STUB=1` and `JUMPSTART_DEV_ADMIN=1` in `.env.local`. Both Claudes start with this.
- Without Supabase / Twilio / Resend keys, the app uses mocks at `src/lib/mock/*` and stub OTP at `src/lib/verification/otp.ts`.
- OTP codes in stub mode are intentionally hidden from the visible UI (May 7 founder direction). They log to the browser console as `[stub] email otp -> NNNNNN` and live in `localStorage` under `jumpstart.otp.email` / `jumpstart.otp.phone`.

## Checkpoints from the autonomous stack

If you see commits authored by the autonomous coordinator (`checkpoint: autonomous loop touched N file(s) in safe zones`), they only touch `harness/`, `scripts/`, `experiments/`, or `docs/superpowers/`. Don't fight them; rebase on top.

## When to hand off vs. continue

- If you finished and the next step depends on something the other Claude owns, open a follow-up issue with `status:ready` and `@`-mention them in a comment.
- If you're blocked, drop a comment on your own issue with `status:blocked`, describe what you tried, what's needed, and switch the label.
- If you're about to make a load-bearing architectural decision, open an issue with `area:design` first and let the other Claude weigh in.

## Real keys path (when we move out of stub)

- Twilio + Resend keys live in Vercel project env, never in the repo. The OTP module's stub branch dies the moment `.env` has both keys filled.
- PocketBase admin lives at `pocketbase/bin/` (gitignored). Schema is at `pocketbase/schema.json` (tracked). Either Claude can run `scripts/start-pocketbase.sh` locally.
- Supabase migration is the v1.5 path (see spec). For now everything is `localStorage` so both Claudes have full feature parity.
