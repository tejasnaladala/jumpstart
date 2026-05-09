# Wire drops + intros + agent logs + cron retention to Supabase

Branch: `backend/wire-drops-and-intros-supabase`
Date: 2026-05-07
Author: Tejas + Opus 4.7
Status: ready for implementation

## Goal

Close the P0 backend gaps so production deploys can serve real traffic. Today every stateful route returns 503 in prod (`DROPS_NOT_IMPLEMENTED`, `INTROS_NOT_IMPLEMENTED`, `RETENTION_NOT_IMPLEMENTED`) and agent logs vanish on cold start. This branch wires four code paths to Supabase, adds one migration, ships a seed script, and adds route-handler tests. Magic-link auth is out of scope (separate branch).

## Three perspectives

### Backend

1. **Single source of truth for Supabase clients.** New file `src/lib/supabase/server.ts` exports two factories:
   - `getServerClient(cookieStore)` — anon key, validates the user via cookie. RLS applies. Reuse from `auth/session.ts`.
   - `getServiceRoleClient()` — service-role key, bypasses RLS. Used by cron + agent log writer + ownership check (which needs to read across users for the candidate).
2. **Wire `loadMeFromDb`** in `src/app/api/drops/route.ts:53`. Read the founder card by `user_id` via the anon client (RLS allows own row). Map DB row → `FounderCard` type. Return 503 only when the row is missing or the env is misconfigured.
3. **Wire `assertMatchOwnership`** in `src/app/api/intros/route.ts:121`. Use the service-role client because we need `matches.user_id` and `matches.candidate_user_id` and the requester may not yet be authorized to see the row through RLS until we know they own it. Validate three things: (a) match exists, (b) match.user_id == requester_id, (c) match.candidate_user_id == recipient_id. Throw `MatchOwnershipError` for any failure. Production now succeeds; stub-mode prefix-shape check stays for dev.
4. **Insert intro row.** When ownership and safety pass, insert a row into `intros (requester_id, recipient_id, match_id, note, sent_at, response='pending')`. Return DB-generated `intro_id`. The current `intro_${Date.now()}` shape is preserved when `isStubMode()`.
5. **Wire agent log Supabase insert.** `src/lib/agents/log.ts:logAgentRun` now does a service-role insert into `agent_logs` when `SUPABASE_SERVICE_ROLE_KEY` is present. File logging stays as a fallback for dev and as a belt-and-suspenders trail in prod (Vercel filesystem is ephemeral but the row also goes to Supabase). The writer must never throw — log failures are swallowed.
6. **Cron retention deletion.** `src/app/api/cron/retention/route.ts` becomes real:
   - Migration `0003_retention_audit.sql` adds the `retention_audit` table with `(id, run_at, deleted_count, audited_count, error)`.
   - The route uses the service-role client, selects `verifications WHERE artifact_expires_at < now() AND artifact_url IS NOT NULL`, deletes each storage object (best-effort; does not fail the whole batch on a single 404), nulls the artifact columns, inserts a `retention_audit` row, returns `{ deleted, audited, ts }`.
7. **Seed script.** `scripts/seed-cohort.ts` reads a CSV from `--file <path>` (default `data/cohort.csv`), upserts into `users` (by email) and `founder_cards` (by user_id). Idempotent. Uses service-role client. Skips rows missing required fields. Logs counts.

### Frontend

No frontend changes in this PR. Response shapes documented in `docs/codebase-map/05_API_CONTRACTS.md` are preserved exactly. Confirm:
- `POST /api/drops` returns `{ drop_id, user_id, matches, generated_at }` whether stub or prod.
- `POST /api/intros` returns `{ accepted, intro_id, match_id, requester_id, recipient_id, sent_at }` (in prod the `intro_id` is a real UUID; stub mode keeps `intro_${Date.now()}`).

When the frontend wants to consume `/api/drops`, it can flip a flag in its own PR with no contract change.

### Security

1. **Service-role usage discipline.** The service-role client is server-only (never imported by anything under `src/app/(app)`, `src/components`, or any `"use client"` file). Lint can't catch this directly today, so I'll add a runtime guard: the factory throws if `typeof window !== "undefined"`.
2. **No PII in `agent_logs.prompt`.** The current `RunResult` carries `raw` (the model output) and we already store `input_summary` (240-char truncated JSON of input). I will store `input_summary` in `prompt` and `result.raw` in `response`. This is the same data the file logger already keeps; the change is just persistence target.
3. **No information leak in error responses.** All four affected routes already use `jsonError(...)` which never echoes user input. Continue that pattern.
4. **RLS still enforced for the anon path.** Drops route uses anon client → `select * from founder_cards where user_id = auth.uid()` is RLS-allowed. The service-role bypass is only used where cross-user reads are required (intros ownership, agent_logs writes, cron retention).
5. **Cron auth unchanged.** Constant-time bearer check stays. The new code only runs after the bearer matches.
6. **CSV seed cannot run without service role.** Script aborts with an explicit error if `SUPABASE_SERVICE_ROLE_KEY` is missing. No silent stubbing.
7. **Match ownership enforces both halves.** Bug class to avoid: only checking `user_id == requester` would let an attacker request an intro to a different user by spoofing `recipient_id`. We check both `user_id` and `candidate_user_id` against the request body.

## Migration plan

`supabase/migrations/0003_retention_audit.sql`:

```sql
create table retention_audit (
  id uuid primary key default gen_random_uuid(),
  run_at timestamptz not null default now(),
  deleted_count int not null default 0,
  audited_count int not null default 0,
  error text
);

create index retention_audit_run_at_idx on retention_audit (run_at desc);

revoke all on retention_audit from authenticated, anon;
```

No RLS policy is added; the table is service-role-only. `revoke all` enforces it.

## Test plan

Tests live at `tests/api/`. They use Bun's built-in test runner (already a dep via `tsx` workflow; we will use `node:test` for compatibility since Bun runs Node-style tests fine). Each test file mocks the Supabase server module so we don't need a live DB.

| File | What it covers |
|---|---|
| `tests/api/drops.test.ts` | 401 without session, 200 with stub session, 503 in prod when row missing, response shape matches contract |
| `tests/api/intros.test.ts` | 401 without session, 400 self-intro, 403 MATCH_NOT_OWNED in prod, 200 happy path with insert |
| `tests/api/retention.test.ts` | 503 CRON_NOT_CONFIGURED with no secret, 403 with bad bearer, 503 RETENTION_NOT_IMPLEMENTED with no service role, 200 happy path with deletion + audit insert |
| `tests/api/agent-log.test.ts` | logAgentRun in stub mode writes JSONL, in prod-config calls service-role insert and falls through to file on insert failure |

Bun test runner discovers `*.test.ts` automatically. We add a `package.json` entry `"test": "bun test"` if not present.

## Out of scope

- Magic-link auth wiring (`src/app/signup/page.tsx` mock → real Supabase Auth) — separate branch `backend/wire-supabase-auth`.
- Cost ceilings on Anthropic spend — separate branch `backend/agent-cost-ceilings`.
- Resend wiring for intro accept emails — separate branch `backend/resend-intro-accept`.
- PocketBase decision and cleanup — needs an ADR first.
- Frontend wiring of `/api/drops` POST into `/drop` page — frontend collaborator owns, separate PR.

## Definition of done

- [ ] `bun run typecheck` clean
- [ ] `bun run lint` clean
- [ ] `bun run eval` STRICT=1 passes
- [ ] All four new test files pass under `bun test`
- [ ] No file outside the planned set is touched (no churn in frontend, no stub-mode behavior change)
- [ ] Migration applies cleanly against a fresh Supabase project (verified by reviewer with `supabase db push --dry-run`)
- [ ] PR description references this design doc and links to the verified DoD

## Risks accepted

- Without a live Supabase to run against in this branch, the prod paths are exercised only through mocked tests. Reviewer must run `supabase db push` and a manual `curl` smoke against a real project before merging to master.
- Service-role client is loaded once and cached. If the env changes mid-process (Vercel rotations), we won't pick it up without a redeploy. This matches the current Anthropic client pattern.
- Seed script does not chunk inserts. For 2,000 rows the single batch should fit; if cohort grows past 5k we'll need pagination.
