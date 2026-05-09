# Backend Owner Brief

This file is written for the backend owner working with Opus 4.7.

> **Review note (2026-05-07):** This brief was rewritten on the `docs/codebase-intelligence-map` PR after a cross-check found that the original draft referenced several non-existent file paths (`src/lib/auth.ts`, `src/lib/agents/client.ts`, `src/lib/rate-limit.ts`, `pocketbase/pb_schema.json`, `0002_rls_policies.sql`, etc.). All paths below have been verified against the actual repo on `implementation/v1`.

## Backend architecture

Jumpstart uses Next.js 15 App Router route handlers under `src/app/api/**`. The intended backend stack:

- **Supabase Postgres** with `pgvector` for the canonical store (auth, founder cards, drops, matches, intros, agent logs).
- **Supabase Auth** (magic link) for sessions. Currently `src/app/signup/page.tsx` is a mock localStorage flow, not yet wired to Supabase Auth.
- **Anthropic Claude** for the eight agents (Sonnet 4.5 + Haiku 4.5).
- **Upstash Redis** for rate limiting (sliding window).
- **Resend** for transactional email (TODO).
- **PocketBase** scaffolding exists at `pocketbase/schema.json` and `src/lib/pocketbase/client.ts`, currently dormant. Decision pending.

The key backend problem is that product UI is ahead of backend persistence. Routes and migrations exist, but several production write paths still throw 503 in real environments. The fallback path (stub mode + localStorage) works end to end.

## Routes

| Method | Path | Handler | Auth | Status |
| --- | --- | --- | --- | --- |
| `GET` | `/api/health` | `src/app/api/health/route.ts` | Public | Working. Probes Supabase + Anthropic + Upstash. |
| `GET` | `/api/browse` | `src/app/api/browse/route.ts` | `requireSession()` | Working in stub mode against `MOCK_COHORT`. Production DB read TODO. |
| `POST` | `/api/drops` | `src/app/api/drops/route.ts:12` | `requireSession()` | Blocked by `loadMeFromDb` TODO at `route.ts:53`. Returns 503 `DROPS_NOT_IMPLEMENTED` in prod. |
| `POST` | `/api/intros` | `src/app/api/intros/route.ts:8` | `requireSession()` (stub bypass requires both `JUMPSTART_ALLOW_STUB=1` and missing Supabase) | Stub path works. Production ownership check throws at `route.ts:152` (returns 503 `INTROS_NOT_IMPLEMENTED`). |
| `POST` | `/api/onboarding/interview` | `src/app/api/onboarding/interview/route.ts:14` | `requireSession()` | Working. Frontend wizard does not yet consume it (UI uses local heuristic stubs). |
| `GET` | `/api/cron/retention` | `src/app/api/cron/retention/route.ts:11` | `Bearer ${CRON_SECRET}` (constant-time compare) | Auth gate works. Deletion logic TODO at `route.ts:51`. Returns 503 `RETENTION_NOT_IMPLEMENTED`. |

See `docs/codebase-map/05_API_CONTRACTS.md` for request/response shapes.

## Services (verified file paths)

| Service | File(s) | Role |
| --- | --- | --- |
| Session auth | `src/lib/auth/session.ts` | `getSession`, `requireSession`, `isStubMode`, `SessionUser`. Reads `users.trust_tier` after `auth.getUser()`. |
| Admin gating | `src/lib/auth/admin.ts` | `getAdmin`, `requireAdmin`, `AdminForbiddenError`. Allowlist + dev-admin bypass. |
| Rate limiting | `src/lib/auth/rate-limit.ts` | `checkLimit`. Upstash `Ratelimit.slidingWindow` + in-memory fallback + hard prod gate at line 150. |
| API middleware | `src/middleware.ts` | Auth fast-fail for `/api/*`. Public bypass list: `/api/health`, `/api/cron/*`. Cookie regex: `^sb-.+-auth-token(\.\d+)?$`. |
| Zod schemas | `src/lib/api/schema.ts` | Every API contract. ID accepts UUID + stub prefixes (`u_`, `fc_`, `match_`, `drop_`). |
| Domain types | `src/lib/types.ts` | `FounderCard`, `Match`, `Drop`, `IntroRequest`, `AgentInvocation`, `MatchType`, `TrustTier`, `Intent`. |
| Agent runner | `src/lib/agents/runner.ts:61` | `runAgent(def, input)`. Retry x3 with jittered backoff. Sonnet 30s/2048 tok, Haiku 15s/1024 tok. Prompt cache. JSON prefill. Cost tracking. |
| Agent log writer | `src/lib/agents/log.ts:93` | `logAgentRun`, `recordSafetyBlock`. JSONL in dev (10MB cap, 5 rotations). Supabase service-role insert TODO at line 98. |
| Onboarding interviewer agent | `src/lib/agents/onboarding-interviewer.ts` | Sonnet 4.5. `FALLBACK_QUESTIONS` stub. |
| Profile synthesizer agent | `src/lib/agents/profile-synthesizer.ts` | Sonnet 4.5. `synthesizeCardLocal` (in `src/lib/agents/synthesize-local.ts`) is the stub. |
| Matchmaker agent | `src/lib/agents/matchmaker.ts` | Sonnet 4.5. `local-drop` stub. |
| Match explainer agent | `src/lib/agents/match-explainer.ts` | Sonnet 4.5. Inline templates stub. |
| Opener drafter agent | `src/lib/agents/opener-drafter.ts` | Haiku 4.5. Inline templates stub. |
| Feedback learner agent | `src/lib/agents/feedback-learner.ts` | Sonnet 4.5. |
| Safety classifier agent | `src/lib/agents/safety-classifier.ts` | Haiku 4.5. Per-call nonce defends prompt injection. Used by `/api/intros`. |
| Cohort analyst agent | `src/lib/agents/cohort-analyst.ts` | Sonnet 4.5. |
| Reengagement drafter agent | `src/lib/agents/reengagement-drafter.ts` | Haiku 4.5. Not yet wired into a route. |
| Local match generator | `src/lib/match/local-drop.ts:103` | Deterministic stub. Score: `tags*3 + intents*2 + sameCity*1`. Diversity: ≥2 distinct match types. |
| Mock fixtures | `src/lib/mock/cohort.ts`, `src/lib/mock/me.ts` | `MOCK_COHORT` (~50 founders, also exposes `COHORT_TAGS`), `DEFAULT_ME`. |
| Verification stub | `src/lib/verification/otp.ts:101` | Stub OTP via localStorage. Demo code returned in stub-mode response. |
| Drop curation | `src/lib/drop/delivery.ts:29` | Hand-curated match storage. localStorage closed-beta only. |
| PocketBase client | `src/lib/pocketbase/client.ts:34` | Dormant. Activates only with `NEXT_PUBLIC_POCKETBASE_URL`. |

There is **no** `src/lib/auth.ts`, `src/lib/config.ts`, `src/lib/rate-limit.ts`, `src/lib/agents/client.ts`, `src/lib/agents/registry.ts`, `src/lib/agents/safety.ts`, `src/lib/agents/onboarding.ts`, `src/lib/pocketbase.ts`, `src/lib/database.types.ts`, or `src/lib/supabase/{server,client}.ts`. An earlier draft referenced these; they do not exist.

## Database layer

Migrations:

- `supabase/migrations/0001_init.sql` — 11 tables, indexes, baseline RLS, enums, `pgvector(1536)` on `founder_cards.embedding` and `taste_profiles.embedding`.
- `supabase/migrations/0002_complete_rls.sql` — adds 24 RLS policies, helper function `is_verified_user()`, security touch-ups (`REVOKE update on trust_tier`, etc.). Filename is `0002_complete_rls.sql`, **not** `0002_rls_policies.sql`.

Tables (eleven):

| Table | Purpose | Notes |
| --- | --- | --- |
| `users` | Identity, `trust_tier` enum (`provisional`/`verified`/`peer_vouched`) | RLS: own row only. `trust_tier` revoked from `authenticated` (service role only). |
| `founder_cards` | 1:1 with users. Tags + intents + `embedding vector(1536)` | GIN on tags, IVFFLAT cosine on embedding (lists=100). RLS: verified-to-verified read. |
| `intent_interviews` | Onboarding transcript + structured intent | JSONB. No indexes (risk). |
| `verifications` | Trust tier audit, `artifact_expires_at` drives cron retention | No indexes (risk for admin queries). |
| `drops` | Weekly delivery container | UNIQUE(user_id, cycle_week). Date type — timezone unclear. |
| `matches` | Three slots per drop | `match_type` enum, partial index on `action`. |
| `intros` | Intro request | RLS: chained ownership check on insert (requester owns match). |
| `meetings` | Per-participant feedback | UNIQUE(intro_id, author_id). |
| `reports` | Safety reports | `status` is text not enum (risk). |
| `agent_logs` | Audit of every Claude call | Service role only. Unbounded growth risk. |
| `taste_profiles` | Future preference vector(1536) | Currently unused. |

Generated types: there is **no** `src/lib/database.types.ts`. Domain types are hand-written in `src/lib/types.ts`. `package.json` has `db:generate` but the script file is missing.

PocketBase: `pocketbase/schema.json` exists (defines `users`, `founder_cards`, `drops`, `threads`, `posts`, `moderation`). `src/lib/pocketbase/client.ts` is dormant. Decision pending.

## Auth

`src/lib/auth/session.ts:39` is the actual security boundary. `requireSession()` at `:103` throws `UnauthorizedError` (401) when `getSession()` returns null. `getSession()` validates the Supabase auth cookie and reads `users.trust_tier` to populate `SessionUser { id, email, trust_tier }`.

Stub mode: when Supabase envs are missing AND `JUMPSTART_ALLOW_STUB=1`, `getSession()` returns the deterministic `DEV_USER` from `src/lib/mock/me.ts`. Production hardening: `NODE_ENV=production` is not sufficient to disable stub (Vercel preview also runs production). The explicit flag is the gate.

`src/middleware.ts` provides a fast-fail cookie presence check at the edge. It is a perf hint, not a security boundary; the route handler enforces.

Admin: `src/lib/auth/admin.ts:26`. Allowlist (`JUMPSTART_ADMIN_EMAILS` CSV) + dev bypass (`JUMPSTART_DEV_ADMIN=1` + non-prod or `JUMPSTART_PRIVATE_BETA=1`). Empty allowlist → admin disabled.

## Secrets and config

Required envs (from `.env.example`):

| Variable | Owner | Purpose |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | backend | Agent calls. Killed by `JUMPSTART_DISABLE_ANTHROPIC=1`. |
| `NEXT_PUBLIC_SUPABASE_URL` | shared | Public Supabase URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | shared | Public Supabase anon key. |
| `SUPABASE_SERVICE_ROLE_KEY` | backend | Server-only. Used by cron + agent_logs (TODO). |
| `UPSTASH_REDIS_REST_URL` | backend | Rate limiting. |
| `UPSTASH_REDIS_REST_TOKEN` | backend | Rate limiting. |
| `CRON_SECRET` | backend | Cron retention bearer. |
| `RESEND_API_KEY` | backend | Email (TODO). |
| `NEXT_PUBLIC_POSTHOG_KEY` / `_HOST` | frontend | Analytics. |

Mode flags (load-bearing — see flag matrix at the bottom of `.env.example`):

- `JUMPSTART_FORCE_STUBS` — force local heuristics
- `JUMPSTART_ALLOW_STUB` — allow deterministic dev session (the only stub-mode gate)
- `JUMPSTART_PRIVATE_BETA` — allow in-memory rate-limit fallback in prod + dev-admin pair
- `JUMPSTART_DEV_ADMIN` — paired with `PRIVATE_BETA` for tunnel-beta admin bypass
- `JUMPSTART_ADMIN_EMAILS` — CSV allowlist
- `JUMPSTART_DISABLE_ANTHROPIC` — spend-incident kill switch

There is no `NEXT_PUBLIC_USE_STUBS`; an earlier draft referenced it. Do not add it.

## External integrations

| Integration | Files | Risk |
| --- | --- | --- |
| Anthropic | `src/lib/agents/runner.ts:14,29`, all eight agent files | Cost limits not enforced; only tracked. Add per-user quota and spend alert. |
| Supabase | `src/lib/auth/session.ts:53` (only call site today), migrations | Most write paths are TODO. Wire founder_cards, matches, intros, agent_logs, retention. |
| Upstash | `src/lib/auth/rate-limit.ts:9` | Hard prod gate at line 150 prevents accidental in-memory leak. Verify env. |
| Vercel Cron | `vercel.json:8-12`, `src/app/api/cron/retention/route.ts` | Cron is intentionally non-destructive (returns 503) until deletion implemented. |
| ELU Analytics | `src/components/EluIdentify.tsx`, `vercel.json` CSP `https://elu.dev` | CSP allows; no opt-out UI. |
| PostHog | root layout, `vercel.json` CSP | Frontend-only. |
| PocketBase | `src/lib/pocketbase/client.ts:34`, `pocketbase/schema.json` | Dormant. Decide drop or wire. |
| Resend | `src/lib/drop/notification.ts` | Not yet wired. |

## Broken or fragile backend areas

| Priority | Area | Evidence |
| --- | --- | --- |
| P0 | Drop creation | `src/app/api/drops/route.ts:53` `loadMeFromDb` throws "not implemented". Endpoint returns 503 in prod. |
| P0 | Intro creation | `src/app/api/intros/route.ts:152` `assertMatchOwnership` throws when not stub. 503 in prod. |
| P0 | Retention cron | `src/app/api/cron/retention/route.ts:51` returns 503 `RETENTION_NOT_IMPLEMENTED` after auth/Supabase checks. |
| P0 | Magic-link auth | `src/app/signup/page.tsx:44-50` is mock localStorage; no Supabase Auth wiring yet. |
| P0 | Agent log persistence | `src/lib/agents/log.ts:98` Supabase insert is TODO. JSONL in `/tmp` is ephemeral on Vercel. |
| P0 | Seed script | `package.json` `db:seed` references `scripts/seed-cohort.ts` which does not exist. |
| P1 | Database choice | Supabase + PocketBase coexist without an ADR. |
| P1 | Cost controls | `src/lib/agents/runner.ts` tracks cost but does not enforce per-user or daily caps. |
| P1 | Type/script drift | `package.json` `db:generate` references `scripts/generate-types.ts` which does not exist. |
| P1 | Test drift | `tests/e2e/happy-path.spec.ts` is the only e2e file; backend route tests are missing. |
| P2 | Safety classifier stub | Regex-only fallback at `src/app/api/intros/route.ts:84-89` misses contextual spam. |
| P2 | Admin allowlist empty by default | `src/lib/auth/admin.ts:34`. Founder must populate `JUMPSTART_ADMIN_EMAILS` before launch. |
| P2 | OTP demo code in response | `src/lib/verification/otp.ts:130` returns `demo_code` in stub mode response. Strip before public beta. |
| P2 | `agent_logs` retention | Sensitive prompts retained indefinitely. Plan TTL or partition. |
| P3 | `/api/health` exposes dependency status | `src/app/api/health/route.ts:170`. Consider admin-gating in prod. |
| P3 | `pgvector` lists=100 with ~2,000 rows | Aggressive tuning; REINDEX after seed. |

## Security concerns

- Replace mock signup with real Supabase Auth before any real user.
- Populate `JUMPSTART_ADMIN_EMAILS` in production. Empty list disables admin entirely.
- Audit Vercel envs at deploy time: ensure `JUMPSTART_ALLOW_STUB`, `JUMPSTART_FORCE_STUBS`, `JUMPSTART_PRIVATE_BETA`, `JUMPSTART_DEV_ADMIN` are all empty for public beta.
- Rotate `CRON_SECRET` quarterly. Document in `launch-playbook.md`.
- Strip `console.info` calls from `verification/page.tsx` in stub mode for prod build.
- Review RLS against the final product model; especially admin/moderation paths and public Founder Pass access via `/api/browse?id=`.
- CSP allows `'unsafe-inline'` on scripts (Next.js requirement). Revisit with nonce-based CSP later.
- Add structured logging without retaining sensitive proof or intro contents indefinitely.

## Missing tests

The single Playwright file at `tests/e2e/happy-path.spec.ts` is happy-path only and may be stale against the editorial UI changes.

Backend test minimum:

| Area | Test |
| --- | --- |
| Auth | Protected APIs reject missing/invalid sessions. Stub-mode bypass requires both flag AND missing Supabase. |
| Drops | Valid session returns shape `{ drop_id, user_id, matches, generated_at }`. Rate limit `drops_day` enforced. 503 in prod without DB wiring. |
| Intros | Self-intro returns `SELF_INTRO`. `MATCH_NOT_OWNED` returns 403. Safety block returns 400 `SAFETY_BLOCK` without echoing reasons. |
| Browse | Pagination, single-card mode, tag filter. |
| Retention | 403 on bad bearer; 503 `CRON_NOT_CONFIGURED` if `CRON_SECRET` empty; 503 `RETENTION_NOT_IMPLEMENTED` until logic lands. |
| Agents | Stub fallback when no key. Prompt-cache hit on second call. Cost calculation. |

## Refactor plan

1. Decide PocketBase vs Supabase. Write an ADR under `docs/decisions/`.
2. Create `scripts/seed-cohort.ts` to import the 2,000-attendee CSV (upsert by email).
3. Add a thin Supabase server-client helper (e.g., `src/lib/supabase/server.ts`) that returns either anon or service-role client based on call site. Wire `loadMeFromDb`, `assertMatchOwnership`, agent-log insert, and retention deletion behind it.
4. Add `database.types.ts` autogen via Supabase CLI (`supabase gen types typescript`).
5. Persist agent logs into `agent_logs` with redaction and failure isolation.
6. Add cost ceilings (per-user daily quota, spend alert at 80% threshold).
7. Wire Resend for intro accept emails.
8. Implement cron retention deletion + `retention_audit` table writes.
9. Fix `package.json` script drift (remove or implement `db:generate`, `db:seed`).
10. Backfill backend route-handler tests under `tests/api/`.

## API stabilization plan

| Step | Contract |
| --- | --- |
| 1 | Freeze `FounderCard` shape in `src/lib/types.ts`. Reconcile drift (e.g., `going_to_sf` exists in TS but not in schema). |
| 2 | Stabilize `src/lib/api/schema.ts`. New fields enter as optional. |
| 3 | Keep stub mode for frontend dev, but fail loudly (not silently) in prod via 503 codes. |
| 4 | Update `docs/codebase-map/05_API_CONTRACTS.md` with every contract change. |
| 5 | Add backend route-handler tests before frontend rewires UI to live data. |

## Frontend dependency map

| Frontend area | Backend dependency | Current gap |
| --- | --- | --- |
| Signup/auth | Supabase Auth magic link | Mock localStorage. |
| Onboarding identity | `users` profile insert + `intent_interviews` write | No API consumption today. |
| Verification | `verifications` + storage deletion via cron | Proof is local data URL. |
| Intent interview | `POST /api/onboarding/interview` | Route exists; UI uses local heuristic. |
| Founder card | `founder_cards` write/read | Card is local. |
| Drop tab | `POST /api/drops` returning the production shape | API blocked by TODO. UI consumes `local-drop`. |
| Browse | `GET /api/browse` paginated list | UI shows localStorage forum, not the cohort directory. |
| Match/intro | `POST /api/intros`, `matches`, `intros` | Stub path works; production write blocked by ownership TODO. |
| Inbox | Threads / messages model | No backend thread API; localStorage today. |
| Pass | `GET /api/browse?id=` | Single-card path works. |

## Clarify with the frontend collaborator

1. Which localStorage keys must remain stable through the backend cutover (forum, inbox, mod queue, OTP, drop delivery, draft state)?
2. What is the expected post-intro UI behavior (thread visibility, contact unlock, calendar link timing)?
3. Should `/browse` stay as the forum (current) or return to a cohort directory per spec section 2?
4. Which Founder Card fields are visible publicly vs verified-only?
5. What loading and error states should API-backed pages expose (skeletons, retry, toast on 503)?
6. Should `/pass/[id]` use a stable `user_id` (current, enumeration risk) or a random share id?

## Recommended next backend implementation branch

`backend/wire-drops-and-intros-supabase` — single PR that:

1. Adds `src/lib/supabase/server.ts` (anon + service-role client factories).
2. Implements `loadMeFromDb` in `src/app/api/drops/route.ts`.
3. Implements `assertMatchOwnership` in `src/app/api/intros/route.ts:121-152` (replace the throw with the real Supabase query).
4. Adds `tests/api/drops.test.ts` and `tests/api/intros.test.ts` (route-handler integration tests via `supabase` test helper or fetch-against-localhost).
5. Runs `bun run typecheck`, `bun run eval` (STRICT=1), and the new backend tests.

Out of scope for that PR (separate branches): seed script, cron retention deletion, agent log persistence, magic link wiring, PocketBase decision.

## Opus prompt

Paste this into Opus 4.7 when ready to start the next backend branch:

```text
You are the backend owner for tejasnaladala/jumpstart on branch implementation/v1. Read docs/codebase-map/04_BACKEND_MAP.md, 05_API_CONTRACTS.md, 06_DATABASE_MAP.md, 07_AUTH_AND_SECURITY.md, 10_RISKS_AND_TECH_DEBT.md, docs/codebase_registry.json, and docs/BACKEND_OWNER_BRIEF.md.

Goal: wire POST /api/drops and POST /api/intros to real Supabase reads/writes on a new branch backend/wire-drops-and-intros-supabase. Preserve stub-mode behavior; production must succeed (no more 503 from these two routes once Supabase envs are set).

Constraints:
- Do not change frontend UI.
- Do not touch src/middleware.ts auth shape.
- Do not change Zod schemas in src/lib/api/schema.ts (contract stays).
- Preserve the response shapes documented in 05_API_CONTRACTS.md.
- Stub-mode flag set is JUMPSTART_*, not NEXT_PUBLIC_USE_STUBS.

Files to add or change:
- src/lib/supabase/server.ts (new): factories returning anon and service-role clients.
- src/app/api/drops/route.ts:53 (loadMeFromDb): real founder_cards.select for session.id.
- src/app/api/intros/route.ts:121-152 (assertMatchOwnership): real matches lookup; existing prefix-shape check stays for stub mode only.
- tests/api/drops.test.ts (new), tests/api/intros.test.ts (new): exercise auth, validation, ownership, safety block.

Definition of done:
- bun run typecheck clean.
- bun run lint clean.
- bun run eval STRICT=1 passes.
- New tests pass against a Supabase local container or stub.
- /api/drops returns { drop_id, user_id, matches, generated_at } in prod (no 503).
- /api/intros returns 403 MATCH_NOT_OWNED on bad ownership; 200 with { accepted, intro_id, match_id, requester_id, recipient_id, sent_at } on success.

Open the PR with title: "backend(intros, drops): wire Supabase reads and ownership check". Tag area:backend, priority:p0.
```
