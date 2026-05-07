# Backend Owner Brief

This file is written for the backend owner working with Opus 4.7.

## Backend Architecture

Jumpstart uses Next.js App Router route handlers under `src/app/api/**` as the backend surface. The intended backend stack appears to be Supabase Auth plus Supabase Postgres, with Anthropic-backed agents and Upstash Redis rate limiting. A PocketBase schema and client also exist, but no runtime import of `src/lib/pocketbase.ts` was found during static audit.

The key backend problem is that product UI is ahead of backend persistence. The app has real-looking routes and migrations, but several production write paths still throw or remain local/demo only.

## Routes

| Method | Path | Handler | Auth | Status |
| --- | --- | --- | --- | --- |
| `GET` | `/api/health` | `src/app/api/health/route.ts` | Public | Implemented. |
| `GET` | `/api/browse` | `src/app/api/browse/route.ts` | Supabase session | Implemented against Supabase, not consumed by UI. |
| `POST` | `/api/drops` | `src/app/api/drops/route.ts` | Supabase session | Blocked by `loadMeFromDb` TODO. |
| `POST` | `/api/intros` | `src/app/api/intros/route.ts` | Supabase session unless stub mode | Stub path works; production DB write/ownership check TODO. |
| `POST` | `/api/onboarding/interview` | `src/app/api/onboarding/interview/route.ts` | Supabase session | Implemented, not consumed by UI. |
| `GET` | `/api/cron/retention` | `src/app/api/cron/retention/route.ts` | `Bearer CRON_SECRET` | Auth gate implemented; deletion TODO returns `503`. |

See `docs/codebase-map/05_API_CONTRACTS.md` for request/response shapes.

## Services

| Service | File | Role |
| --- | --- | --- |
| Supabase server client | `src/lib/supabase/server.ts` | Server-side Supabase client and cookie/session handling. |
| Supabase browser client | `src/lib/supabase/client.ts` | Browser Supabase client for future client-side auth/data flows. |
| Auth helpers | `src/lib/auth.ts` | `getSession`, `requireSession`, `getAdmin`, auth failure helpers. |
| Middleware | `src/middleware.ts` | Lightweight API cookie gate; not a replacement for route auth. |
| Runtime config | `src/lib/config.ts` | Stub flag and app config. |
| Rate limiting | `src/lib/rate-limit.ts` | Upstash-backed rate limit utility. |
| Agent client | `src/lib/agents/client.ts` | Anthropic SDK wrapper. |
| Agent registry | `src/lib/agents/registry.ts` | Product agent inventory. |
| Safety classifier | `src/lib/agents/safety.ts` | Used by intro requests. |
| Onboarding interviewer | `src/lib/agents/onboarding.ts` | Used by onboarding interview route. |
| Agent log | `src/lib/agents/log.ts` | File logging currently; Supabase insert TODO. |

## Database Layer

Primary candidate: Supabase Postgres migrations in `supabase/migrations`.

Important tables:

| Table | Purpose |
| --- | --- |
| `users` | Founder/user profile, role, verification status, trust, admin flag. |
| `founder_cards` | Founder pass/card data. |
| `intent_interviews` | Onboarding answers and extracted signals. |
| `verifications` | Verification proof metadata and review status. |
| `drops` | User requests/offers. |
| `matches` | Match lifecycle. |
| `intros` | Intro request lifecycle. |
| `meetings` | Scheduled meeting metadata. |
| `reports` | Moderation reports. |
| `agent_logs` | Intended agent audit log persistence. |
| `taste_profiles` | Personalization/feedback signals. |

RLS policies are present in `supabase/migrations/0002_rls_policies.sql`. Generated types exist in `src/lib/database.types.ts`, but `package.json` references missing post-generation scripts.

PocketBase candidate:

| File | Status |
| --- | --- |
| `pocketbase/pb_schema.json` | Defines alternate collections. |
| `src/lib/pocketbase.ts` | Client helper exists. |
| Runtime imports | None found. |

## Auth

Protected API routes should call `requireSession()` from `src/lib/auth.ts`. App routes under `src/app/(app)/layout.tsx` also gate rendering with `getSession()`.

`src/middleware.ts` performs a fast cookie presence check for `/api/**` except `/api/health` and `/api/cron/**`. This is only a coarse gate and can produce false positives or false negatives depending on cookie state. Route-level auth remains the actual boundary.

Admin helpers exist via `getAdmin()`, but admin UI and policies need a production review before real operations are exposed.

## Secrets And Config

Required backend-sensitive env vars:

| Variable | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Agent calls. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key. |
| `UPSTASH_REDIS_REST_URL` | Rate limit Redis endpoint. |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limit Redis token. |
| `CRON_SECRET` | Retention cron authorization. |

No secret values should be committed or copied into docs. Add explicit env validation before production use.

## External Integrations

| Integration | Files | Risk |
| --- | --- | --- |
| Supabase | `src/lib/supabase/**`, `supabase/migrations/**` | Main backend candidate; needs full write-path wiring. |
| Anthropic | `src/lib/agents/**` | Cost, latency, retry, safety, and observability policy needed. |
| Upstash | `src/lib/rate-limit.ts` | Confirm all sensitive endpoints apply rate limiting. |
| Vercel Cron | `vercel.json`, `src/app/api/cron/retention/route.ts` | Cron route is intentionally non-destructive. |
| ELU Analytics | `src/app/layout.tsx`, `vercel.json` | CSP and privacy review needed. |
| PocketBase | `pocketbase/**`, `src/lib/pocketbase.ts` | Unresolved backend direction. |

## Broken Or Fragile Backend Areas

| Priority | Area | Evidence |
| --- | --- | --- |
| P0 | Drop creation | `src/app/api/drops/route.ts` throws from `loadMeFromDb`. |
| P0 | Intro creation | `src/app/api/intros/route.ts` throws before production DB write. |
| P0 | Retention cron | `src/app/api/cron/retention/route.ts` returns `503` after auth. |
| P0 | Verification | `src/app/onboarding/verification/page.tsx` stores proof/OTP in client-local state. |
| P1 | Database choice | Supabase and PocketBase coexist without a decision record. |
| P1 | Type/script drift | `package.json` references missing `scripts/generate-types.ts` and `scripts/seed-cohort.ts`. |
| P1 | Test drift | `tests/e2e/happy-path.spec.ts` appears stale. |
| P1 | CI trigger drift | `.github/workflows/ci.yml` targets `master` only. |

## Security Concerns

- Replace client-local verification proof storage with backend storage and review metadata before collecting real proofs.
- Add request validation consistently on all state-changing APIs.
- Add rate limiting to intro, onboarding interview, drop creation, auth-sensitive, and admin routes.
- Review RLS policies against the final product model, especially admin/moderation and public founder pass access.
- Upgrade Next.js from `15.1.5` after reviewing current security advisories.
- Tighten CSP in `vercel.json`; current policy permits `unsafe-inline`.
- Add structured logging without storing sensitive proof or intro contents unnecessarily.

## Missing Tests

Current Playwright tests appear written for an older UI state. Backend-specific tests for route handlers, auth failures, validation failures, RLS expectations, and agent stub behavior were not found.

Minimum backend test set:

| Area | Test |
| --- | --- |
| Auth | Protected APIs reject missing/invalid sessions. |
| Drops | Valid session can create drop; invalid body rejected; self/data ownership enforced. |
| Intros | Valid match ownership enforced; safety block path works; duplicate intro handled. |
| Browse | Returns only allowed candidates and does not leak private data. |
| Retention | Unauthorized cron rejected; authorized dry-run/delete behavior explicit. |
| Agents | Stub and live modes are separated; malformed LLM output is handled. |

## Refactor Plan

1. Write a short ADR deciding Supabase versus PocketBase.
2. Make `src/lib/repositories/**` or equivalent backend repository helpers for `users`, `drops`, `matches`, `intros`, and `verifications`.
3. Convert `/api/drops` from TODO to a Supabase-backed write path.
4. Convert `/api/intros` from stub/TODO into a real transaction or explicitly feature-flag production off.
5. Move verification from local-only UI into a backend-backed proof metadata flow.
6. Persist agent logs into `agent_logs` with redaction and failure isolation.
7. Repair scripts and tests so CI reflects the actual app.

## API Stabilization Plan

| Step | Contract |
| --- | --- |
| 1 | Freeze `FounderCard` fields shared with frontend, especially `location`, `city`, and `region`. |
| 2 | Define stable request/response schemas in shared TypeScript or route-local Zod. |
| 3 | Keep local stub mode for frontend development, but make production failure explicit. |
| 4 | Update `docs/codebase-map/05_API_CONTRACTS.md` with every contract change. |
| 5 | Add route-handler tests before frontend rewires UI state to backend state. |

## Frontend Dependency Map

| Frontend area | Backend dependency | Current gap |
| --- | --- | --- |
| Signup/auth | Supabase Auth or invite system | Signup is local demo. |
| Onboarding identity | `users` profile update | No API consumed. |
| Verification | `verifications` plus storage/review | Proof is local. |
| Intent interview | `POST /api/onboarding/interview` and `intent_interviews` | Route exists but UI does not consume it. |
| Founder card | `founder_cards` write/read | Card is local. |
| Drop composer | `POST /api/drops` | API blocked by TODO. |
| Browse | `GET /api/browse` | API exists but UI uses local/demo data. |
| Match/intro | `POST /api/intros`, `matches`, `intros` | Stub path exists; production write blocked. |
| Inbox | Threads/messages model | No backend thread/message API found. |

## Clarify With Frontend Collaborator

1. Which localStorage keys and demo states must remain available while backend APIs are introduced?
2. What is the expected post-intro UI behavior?
3. Should the browse experience be deterministic for beta or algorithmic from day one?
4. Which founder card fields are visible publicly?
5. What exact loading/error states should API-backed pages expose?

## Opus Prompt

Paste this into Opus 4.7:

```text
You are the backend owner for tejasnaladala/jumpstart on branch implementation/v1. Read docs/codebase-map/04_BACKEND_MAP.md, docs/codebase-map/05_API_CONTRACTS.md, docs/codebase-map/06_DATABASE_MAP.md, docs/codebase-map/07_AUTH_AND_SECURITY.md, docs/codebase-map/10_RISKS_AND_TECH_DEBT.md, docs/codebase_registry.json, and docs/BACKEND_OWNER_BRIEF.md.

Do not change frontend UI. First decide whether the next backend milestone should use Supabase only, PocketBase only, or a staged bridge, and explain the decision with file evidence. Then patch the smallest backend surface needed to make POST /api/drops, POST /api/intros, and GET /api/cron/retention either production-real with Supabase or explicitly feature-flagged behind NEXT_PUBLIC_USE_STUBS. Preserve local stub behavior for frontend development. Add or update backend-focused tests where the repo already supports them. After patching, summarize API contract changes and any required frontend follow-up.
```

