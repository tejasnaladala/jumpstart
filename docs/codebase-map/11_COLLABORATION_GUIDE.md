# Collaboration guide

This repo has a frontend collaborator and a backend owner working in parallel, plus an AI pair (Codex 5.5) on the backend side. The rules below keep the two sides from stepping on each other.

## Ownership split

### Frontend collaborator owns

- UI, UX, interaction polish, animations, visual design, accessibility, responsive behavior.
- Pages and components under `src/app/**` and `src/components/**`, except API / admin / auth-sensitive server logic noted below.
- Local frontend-only stores while they remain localStorage.
- Copy and page-level loading/error states.

### Backend owner (humans + Codex) owns

- API contracts and route handlers.
- Auth, session, admin middleware and policies.
- Database schema, migrations, RLS, seeds.
- Agent runner, agent logging, eval infrastructure.
- Rate limiting, cron, deployment, CI, security headers.
- External service integration.

## Files frontend should touch

Usually safe:

- `src/app/page.tsx`
- `src/app/signup/page.tsx`
- `src/app/onboarding/**/page.tsx`
- `src/app/(app)/**/page.tsx`
- `src/components/**`
- `src/app/globals.css`
- `tailwind.config.ts`
- `tests/e2e/**` when updating UI tests

With awareness (frontend-owned today only because they are browser-local; persistence migration requires coordination):

- `src/lib/forum/posts.ts`
- `src/lib/inbox/threads.ts`
- `src/lib/drop/eligibility.ts`
- `src/lib/drop/delivery.ts`
- `src/lib/moderation/queue.ts`
- `src/lib/verification/otp.ts`

## Files backend should touch

- `src/app/api/**`
- `src/middleware.ts`
- `src/lib/auth/**`
- `src/lib/api/schema.ts`
- `src/lib/agents/**`
- `src/lib/pocketbase/**`
- `supabase/migrations/**`
- `pocketbase/schema.json`
- `vercel.json`
- `.github/workflows/**`
- `scripts/**`
- `harness/**`
- `evals/**`

## Files requiring coordination

| File | Why |
|---|---|
| `src/lib/types.ts` | Domain types shared across boundaries |
| `src/lib/api/schema.ts` | Request/response Zod — both sides depend |
| `src/lib/match/local-drop.ts` | Frontend renders its output; backend will replace with Matchmaker agent output of same shape |
| `src/lib/auth/session.ts` | `SessionUser` shape used by frontend pages and admin |
| `src/lib/verification/otp.ts` | Frontend renders, backend validates |
| `src/app/(app)/match/[id]/page.tsx` | Drives `/api/intros` request |
| `src/app/(app)/drop/page.tsx` | Drives match shape expectations |
| `src/app/admin/**` | Read-only dashboards; frontend can polish, backend owns data |
| `src/lib/drop/**` | Some frontend stub paths, some backend logic |
| `src/lib/forum/posts.ts`, `inbox/threads.ts`, `moderation/queue.ts`, `verification/otp.ts`, `mock/**` | Frontend-owned today, will migrate to backend |
| `.env.example` | Flag matrix changes affect both sides |

## API contract change process

1. Open an issue with the `contract:change` label. Describe motivation, before/after shape, migration plan.
2. Backend opens a draft PR that:
   - Edits `src/lib/api/schema.ts`.
   - Updates `src/lib/types.ts` if needed.
   - Updates `docs/codebase-map/05_API_CONTRACTS.md` in the same PR.
   - Marks any new fields as optional initially.
3. Frontend reviews and confirms. If not blocking, the contract lands.
4. Frontend lands the consumer change next, removes optional flags.
5. Backend tightens the schema (drops optionals, makes new fields required).
6. If the data flow changes materially, update `docs/graph/codebase_nodes.json` + `codebase_edges.json` and `docs/codebase_registry.json` in the same PR.
7. PR description includes request/response examples and migration notes.

## Branching and PR recommendations

- Trunk: `master` (spec, planning, tooling).
- Active: `implementation/v1` (everything ships here).
- Feature work: branch off `implementation/v1` named `<scope>/<short-noun>`.
- PRs target `implementation/v1`. Merge with squash to keep history readable.
- Master only receives `implementation/v1` after a release-ready candidate.

Suggested branch prefixes:

- `frontend/...`
- `backend/...`
- `docs/...`
- `infra/...`
- `shared/...`

### PR title format

`<scope>: <imperative summary>` — examples:

- `frontend(drop): tighten card hover, add skeleton`
- `backend(intros): wire match ownership query`
- `db(migrations): add 0003_agent_log_retention`
- `chore(deps): bump @anthropic-ai/sdk to 0.41`

### Required PR sections

```
## Summary
- 1–3 bullets

## Test plan
- [ ] bun run typecheck
- [ ] bun run lint
- [ ] bun run test:e2e
- [ ] bun run eval (STRICT=1 if touching agents)
- [ ] manual: <describe>

## Files of note
- src/path/to/file.ts:NN
```

## Two-Claude (Codex + this Claude) collaboration

There is an automated delegation loop in `harness/scripts/delegation-loop.ts`. It looks for issues labeled `status:ready` + `owner:mukund-claude` and posts standardized nudges.

Conventions:

- Use `status:*` labels: `status:ready`, `status:in-progress`, `status:review`, `status:done`.
- Use `owner:*` labels: `owner:tejas-claude`, `owner:mukund-claude`, `owner:codex`.
- Use `area:*` labels: `area:frontend`, `area:backend`, `area:db`, `area:agents`, `area:harness`, `area:auth`, `area:infra`.
- Use `priority:*` labels: `priority:p0` … `priority:p3`.

When you (this Claude) hand off to Codex, paste a self-contained prompt in the conversation. Codex begins from the prompt; do not assume it has read the chat. Pattern:

```
You are Codex 5.5 working on the jumpstart repo at branch implementation/v1.

Goal: <one sentence>
Files: <paths>
Constraints: <do not touch X, preserve Y>
Test plan: <commands>
Definition of done: <observable check>
```

When Codex hands back, expect a PR. Run a code review (use `/review` skill or codex-review mode) before merging.

## Handoff checklists

### Before frontend starts on a new feature

- [ ] Read `03_FRONTEND_MAP.md`.
- [ ] Read `05_API_CONTRACTS.md` for the relevant route.
- [ ] Confirm localStorage keys that must stay stable.
- [ ] Confirm current backend persistence decision (Supabase vs PocketBase).
- [ ] Confirm whether ELU analytics is staying.

### Before backend starts on a new feature

- [ ] Read `04_BACKEND_MAP.md`.
- [ ] Read `06_DATABASE_MAP.md`.
- [ ] Read `07_AUTH_AND_SECURITY.md`.
- [ ] Decide Supabase vs PocketBase if relevant.
- [ ] Freeze the API contract before writing the implementation.

### Before either changes shared flows

- [ ] Identify owner.
- [ ] Identify API / schema impact.
- [ ] Identify localStorage migration impact.
- [ ] Update tests.
- [ ] Update docs (this folder).

## Definition of done (per PR)

- [ ] `bun run typecheck`
- [ ] `bun run lint`
- [ ] `bun run test:e2e`
- [ ] `bun run eval` (STRICT=1 if agents touched)
- [ ] Manual smoke: 4-step onboarding → drop → match → request intro
- [ ] Voice rules (`CLAUDE.md`): no em dashes, no marketing language
- [ ] Docs updated where relevant
- [ ] `.env.example` updated if new keys
- [ ] CI green
- [ ] Linked issue closed

## Conflict resolution

| Situation | Resolution |
|---|---|
| Frontend needs a new field on a route response | Open `contract:change` issue, follow process above |
| Backend needs to change response shape | Same: contract:change process, frontend coordinates |
| Both touch `src/lib/types.ts` in flight PRs | Merge backend first (contract is authoritative), frontend rebases |
| Both touch `tailwind.config.ts` | Frontend wins; backend rarely needs tokens |
| Both touch `.env.example` | Merge in any order, both should re-pull and verify |
| Disagreement on an API code | Backend chooses; document rationale in `05_API_CONTRACTS.md` |

## Voice rules (`CLAUDE.md`)

Apply to all user-facing copy and all docs in this repo. Both sides enforce.

1. No em dashes.
2. No "not X, not Y, but Z" parallel constructions.
3. No inflated significance ("stands as", "serves as").
4. No promotional adjectives ("vibrant", "rich").
5. No "tapestry", "interplay", "intricate", "delve", "underscore", "landscape" used abstractly.
6. No bolded inline-header lists like `**Speed:** description`. Use real subsections.
7. No emoji decoration of headings or bullets.
8. No knowledge-cutoff hedges or "in conclusion, the future looks bright" closures.
9. Headings are sentence case.
10. Vary sentence length. Short punchy lines mixed with longer ones. Have opinions.

## First coordination decisions (open questions)

These need an explicit alignment between the two sides before more work lands:

1. **One-match Drop or three-match Drop** as the API contract? Spec says three with diversity rule; current `local-drop.ts` supports both `generateSingleDrop` and `generateLocalDrop` paths.
2. **Supabase or PocketBase** for the next backend milestone? PocketBase scaffolding is dormant; pick one and prune.
3. Should verification proof upload exist before public beta, or is the soft signal (LinkedIn URL + acceptance email subject) enough for tier 1?
4. Is Browse part of v1 as a forum (current implementation), or should it return to a cohort directory (per spec section 2 "the home is a curated drop, not a directory")? Today it's a forum-style posts list.
5. Should public Pass URLs use stable `user_id`, random share IDs, or both? Current `/pass/[id]` uses raw `user_id`, which leaks user enumeration potential.
6. Is the magic-link flow the right v1 auth, or do we need passkey / OAuth as fallback?
7. Drop cadence: Mon/Wed/Fri at 9pm PT — confirm timezone handling for `drops.cycle_week`.

Track resolutions as separate issues with the `decision:` label.

## When in doubt

- Frontend question that touches API → ask in the GitHub issue thread, do not edit `schema.ts` unilaterally.
- Backend question that touches UX → ask the frontend collaborator before changing error codes or response shapes.
- Both: when in doubt, write a note in `docs/codebase-map/` and link from the PR.
