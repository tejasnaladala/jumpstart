# Backend map

## Framework

Next.js 15.1 app router route handlers under `src/app/api/`. Every handler is a `route.ts` exporting `GET`, `POST`, etc. Runtime is Node (default; no `runtime = "edge"` declared anywhere). Vercel `iad1` region.

## Route handlers

| Method | Path | File | Auth | Rate limit | Zod | Calls |
|---|---|---|---|---|---|---|
| GET | `/api/health` | `src/app/api/health/route.ts:161` | none (public) | none | none | `probeSupabase`, `probeAnthropic`, `probeUpstash` |
| GET | `/api/cron/retention` | `src/app/api/cron/retention/route.ts:11` | `Bearer ${CRON_SECRET}` (timingSafeEqual) | none | none | TODO: Supabase delete loop. Returns 503 today. |
| GET | `/api/browse` | `src/app/api/browse/route.ts:11` | `requireSession()` | `browse_min` (60/min) | `BrowseQuerySchema` | reads MOCK_COHORT, paginates |
| POST | `/api/drops` | `src/app/api/drops/route.ts:12` | `requireSession()` | `drops_day` (5/day) | `DropRequestSchema` (optional) | `loadMeFromDb()` (TODO), `generateLocalDrop` |
| POST | `/api/intros` | `src/app/api/intros/route.ts:8` | `requireSession()` | `intros_hour` (10/h), `intros_day` (30/d) | `IntroRequestSchema` | `assertMatchOwnership` (TODO in prod), `runAgent(safetyClassifier)` |
| POST | `/api/onboarding/interview` | `src/app/api/onboarding/interview/route.ts:14` | `requireSession()` | `onboarding_min` (30/min) | `InterviewSchema` | `runAgent(onboardingInterviewer)` |

All routes return `Response.json(...)` for success and `jsonError(status, code, message, extras?)` for failures. See `src/lib/api/schema.ts:23` for the `jsonError` helper.

## Middleware behavior

`src/middleware.ts` matches `"/api/:path*"`.

1. **Public bypass.** `/api/health` and `/api/cron/*` skip the cookie check. The cron route does its own bearer-token validation; health is intentionally public.
2. **Stub-mode gate.** If `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` are missing **and** `JUMPSTART_ALLOW_STUB !== "1"`, returns `500 SUPABASE_NOT_CONFIGURED`. With `JUMPSTART_ALLOW_STUB=1`, passes through to the route handler.
3. **Cookie presence check.** When Supabase is configured, looks for any cookie matching `^sb-.+-auth-token(\.\d+)?$`. Supabase SSR can chunk auth tokens (`.0`, `.1`, …); the regex accepts both. Missing cookie → `401 UNAUTHORIZED`. Closes a P2 finding from a prior code review.
4. **Note in source:** "Treat as perf hint, NOT security boundary." The route handler's `requireSession()` is the actual auth check.

## Auth flow

### Magic link (production target)

1. User submits email at `/signup`.
2. Supabase Auth sends magic link (UNKNOWN: not yet wired in code; mock writes to `localStorage`).
3. User clicks link → Supabase redirect URL → middleware validates auth cookie → `getSession()` reads `auth.getUser()` → DB query for `users.trust_tier` → returns `SessionUser { id, email, trust_tier }`.
4. `requireSession()` throws `UnauthorizedError` (401) if any step returns null.

Files: `src/lib/auth/session.ts:39` (`getSession`), `:53` (DB read), `:103` (`requireSession`).

### Stub mode (dev / closed-beta tunnel)

1. App boots without `NEXT_PUBLIC_SUPABASE_URL`.
2. `JUMPSTART_ALLOW_STUB=1` is required to take this path.
3. `getSession()` short-circuits to a hardcoded `DEV_USER`:
   ```ts
   const DEV_USER: SessionUser = {
     id: DEFAULT_ME.user_id,
     email: "tejas@local.dev",
     trust_tier: "verified",
   };
   ```
4. Production hardening: `NODE_ENV=production` is **not sufficient** to disable stub (Vercel preview also runs production). The explicit flag is the gate.

`isStubMode()` returns true iff `!supabaseConfigured() && stubAllowed()`.

### Admin layer

`src/lib/auth/admin.ts:26`. `getAdmin()` runs after `getSession()` and either:
- **Dev-admin bypass:** `JUMPSTART_DEV_ADMIN=1` AND (`NODE_ENV !== "production"` OR `JUMPSTART_PRIVATE_BETA=1`).
- **Allowlist:** `JUMPSTART_ADMIN_EMAILS` CSV match (case-insensitive). Empty list → admin disabled entirely.

`requireAdmin()` throws 403 if neither matches.

## Server lib modules

| Module | Files | Purpose | Key exports |
|---|---|---|---|
| `agents/` | `runner.ts`, 8 agent files, `types.ts`, `log.ts` | Claude wrapper with retries, prompt cache, JSON prefill, cost tracking | `runAgent(def, input)`, `RunResult<O>` |
| `agents/log` | `log.ts:93` | JSONL log + Supabase TODO. 10 MB cap, 5 rotations | `logAgentRun()`, `recordSafetyBlock()` |
| `auth/session` | `session.ts:39` | Session read or stub | `getSession`, `requireSession`, `isStubMode`, `SessionUser` |
| `auth/rate-limit` | `rate-limit.ts:131` | Upstash + in-memory + hard prod gate | `checkLimit(key, identifier)` |
| `auth/admin` | `admin.ts:26` | Admin allowlist + dev bypass | `getAdmin`, `requireAdmin`, `AdminForbiddenError` |
| `api/schema` | `schema.ts:23` | Zod for every API boundary; ID acceptance for UUID + stub prefixes | `IntroRequestSchema`, `InterviewSchema`, `BrowseQuerySchema`, `jsonError`, `genericValidationErrors` |
| `drop/delivery` | `delivery.ts:29` | Hand-curated match storage in localStorage (closed-beta) | `buildCuratedMatch`, `deliverMatch`, `loadDeliveredMatch`, `findPendingDeliveries` |
| `drop/eligibility` | `eligibility.ts` | Drop readiness checks |
| `drop/notification` | `notification.ts` | Resend integration TODO |
| `drop/schedule` | `schedule.ts` | Drop timing |
| `match/local-drop` | `local-drop.ts:103` | Deterministic scoring + classify + diversity | `generateLocalDrop`, `generateSingleDrop`, `classify`, `score` |
| `verification/otp` | `otp.ts:101` | Stub OTP via localStorage; demo code returned in stub mode | `send`, `verify`, `isVerified`, `verifiedTarget` |
| `moderation/queue` | `queue.ts` | localStorage mod queue (closed-beta) | `loadQueue`, `saveQueue` |
| `forum/posts` | `posts.ts` | Mock forum posts |
| `inbox/threads` | `threads.ts` | Inbox thread logic |
| `inbox/sound` | `sound.ts` | Sound notifications |
| `pocketbase/client` | `client.ts:34` | Dormant fetch wrapper, activates only if env URL present | `getClient`, `isConfigured`, `PocketBaseClient` |
| `safety` | (glue layer) | Safety classifier integration |
| `types` | `types.ts` | Shared domain types | `FounderCard`, `Match`, `Drop`, `IntroRequest`, `AgentInvocation`, `MatchType`, `TrustTier`, `Intent` |
| `mock` | `cohort.ts`, `me.ts` | Closed-beta defaults | `MOCK_COHORT`, `DEFAULT_ME` |

## Database access

Today, only auth reads from Supabase:

- `getSession()` reads `users.trust_tier` via the SSR client (anon key).

Everything else is **stubbed pending Supabase wiring**:

- `/api/drops` — `loadMeFromDb()` throws "not implemented" at `src/app/api/drops/route.ts:54`.
- `/api/intros` — `assertMatchOwnership()` throws when not stub at `src/app/api/intros/route.ts:152`.
- `/api/cron/retention` — deletion logic is TODO at `src/app/api/cron/retention/route.ts:51`. Returns 503 honestly so monitors fail loudly.
- `src/lib/agents/log.ts:98` — Supabase service-role insert for `agent_logs` is TODO.

No use of `pgvector` in code yet (the column exists; the query path is empty).

Service-role client (`SUPABASE_SERVICE_ROLE_KEY`) is referenced in env but not yet instantiated for cron / logging. That work belongs to the backend owner.

## PocketBase coexistence

`src/lib/pocketbase/client.ts:34` exists as a closed-beta fallback. It is dormant: `isConfigured()` returns true only if `NEXT_PUBLIC_POCKETBASE_URL` is set. Default is `http://localhost:8090`. Token stored at `localStorage.jumpstart.pb.token`.

The `pocketbase/` directory at the repo root has a `schema.json` (collections: `users`, `founder_cards`, `drops`, `threads`, `posts`, `moderation`) and likely `pb_migrations/`. UNKNOWN: full state, pending decision whether to wire it for the 2,000-attendee beta or migrate straight to Supabase.

Recommendation: **keep dormant for now**, write the decision-doc-and-cut PR after `/api/drops` and `/api/intros` are wired against Supabase.

## Cron jobs

Only one configured (Vercel `vercel.json`):

| Path | Schedule (UTC) | Auth | Status |
|---|---|---|---|
| `/api/cron/retention` | `0 3 * * *` daily 3am | `Bearer ${CRON_SECRET}` (constant-time compare) | Returns 503 until deletion implemented |

The cron handler:
1. Reads `authorization` header.
2. Pads both sides to equal length, `timingSafeEqual` compares.
3. If `CRON_SECRET` is empty, returns 503.
4. The deletion loop (delete acceptance-screenshot artifacts whose `expires_at < now`, audit-trail to `retention_audit`) is **not implemented**.

## Rate limiting

`src/lib/auth/rate-limit.ts`. Per-user identifier from `session.id`. Tier definitions:

```
intros_hour:    10 / 1h
intros_day:     30 / 1d
drops_day:       5 / 1d
onboarding_min: 30 / 1m
browse_min:     60 / 1m
```

**Production:** Upstash `Ratelimit.slidingWindow`. Per-key limiters cached in `upstashByKey: Map`. No global singleton (a prior review caught a version that shared one limiter across keys).

**Dev / private-beta:** in-memory sliding window with mutex per key, periodic cleanup every 60s.

**Hard gate** at `src/lib/auth/rate-limit.ts:150`: throws unless Upstash configured **or** `JUMPSTART_PRIVATE_BETA=1`. Prevents accidentally shipping the in-memory fallback to public production.

## External integrations

| Service | Env keys | Used by | File |
|---|---|---|---|
| Anthropic | `ANTHROPIC_API_KEY`; kill: `JUMPSTART_DISABLE_ANTHROPIC=1`; force stub: `JUMPSTART_FORCE_STUBS=1` | All agents | `src/lib/agents/runner.ts:14`, instantiated `:29` |
| Upstash Redis | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Rate limiting | `src/lib/auth/rate-limit.ts:9` |
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Auth (current); future cron/logging | `src/lib/auth/session.ts:10,53`, `src/app/api/health/route.ts:51` |
| Resend | `RESEND_API_KEY` | Intro accept email (TODO) | `src/lib/drop/notification.ts` (deferred) |
| PostHog | `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` | Frontend analytics | root layout |
| ELU Analytics | (TBD) | Frontend identify | `src/components/EluIdentify.tsx` |

## Error handling pattern

All API routes follow this shape:

```
ok      Response.json(payload, { status: 200 })
fail    jsonError(status, code, message, extras?)
        // returns: { error: message, code, ...extras }
```

Codes used:
- `VALIDATION`, `BAD_JSON`, `SELF_INTRO`, `SAFETY_BLOCK` (400)
- `UNAUTHORIZED` (401)
- `FORBIDDEN`, `MATCH_NOT_OWNED` (403)
- `RATE_LIMITED` (429, includes `retry_in_ms` and human help text)
- `SESSION_ERROR`, `AGENT_ERROR` (500)
- `SUPABASE_NOT_CONFIGURED`, `CRON_NOT_CONFIGURED`, `DROPS_NOT_IMPLEMENTED`, `INTROS_NOT_IMPLEMENTED`, `RETENTION_NOT_IMPLEMENTED` (503)

Validation never echoes user input back to the client. Server-side log captures detail; client gets a generic code.

## Backend risks (top 10)

| # | Risk | File | Severity |
|---|---|---|---|
| 1 | DB wiring missing in `/api/drops`, `/api/intros`, agent log persistence, cron retention. Features return 503; prod monitoring blind. | `src/app/api/drops/route.ts:54`, `intros/route.ts:152`, `cron/retention/route.ts:51`, `src/lib/agents/log.ts:98` | P0 |
| 2 | In-memory rate limit could leak past dev if Upstash misconfigured. Hard gate exists; verify env in deploy. | `src/lib/auth/rate-limit.ts:150` | P1 |
| 3 | Stub auth bypass in prod requires explicit `JUMPSTART_ALLOW_STUB=1` AND missing Supabase. Verify Vercel envs. | `src/lib/auth/session.ts:36` | P1 |
| 4 | Cron retention returns 503 indefinitely; screenshots accumulate in storage forever. | `src/app/api/cron/retention/route.ts` | P1 |
| 5 | Safety classifier stub fallback uses regex only (no contextual spam detection). | `src/app/api/intros/route.ts:84-89` | P2 |
| 6 | Admin allowlist empty by default; founder must populate `JUMPSTART_ADMIN_EMAILS` before launch. | `src/lib/auth/admin.ts:34` | P2 |
| 7 | PocketBase scaffolding still present; team must decide drop/wire before launch. | `src/lib/pocketbase/`, `pocketbase/` | P2 |
| 8 | OTP demo code returned in stub-mode response (intentional for dev). Remove `demo_code` field before public beta. | `src/lib/verification/otp.ts:130` | P2 |
| 9 | `/api/health` exposes dependency status to anyone. Lock to admin or rate-limit if reconnaissance becomes a concern. | `src/app/api/health/route.ts:170` | P3 |
| 10 | Vercel `/tmp` is ephemeral; agent JSONL logs lost on cold start. Move to Supabase per item 1. | `src/lib/agents/log.ts:14` | P3 |

## Files backend owner should touch

**Critical path (in order):**

1. `scripts/seed-cohort.ts` — create the file. `package.json` references it but it does not exist.
2. `src/app/api/drops/route.ts:54` — wire `loadMeFromDb()` to read `founder_cards` by `user_id`.
3. `src/app/api/intros/route.ts:152` — wire `assertMatchOwnership()` to query `matches`.
4. `src/lib/agents/log.ts:98` — wire service-role client INSERT into `agent_logs`.
5. `src/app/api/cron/retention/route.ts:51` — implement the deletion loop and `retention_audit` write.
6. Wire real Matchmaker agent into `/api/drops` (currently uses local-drop stub).

**Quality of life:**

7. `src/lib/drop/notification.ts` — wire Resend.
8. `src/lib/drop/delivery.ts:56` — migrate from localStorage to Supabase when curation grows.
9. `src/lib/pocketbase/client.ts` + `pocketbase/` — decide and either wire or remove.

## Files requiring frontend coordination

- `src/lib/api/schema.ts` — every API contract.
- `src/lib/types.ts` — `FounderCard`, `Match`, `Drop`, `IntroRequest`.
- `src/lib/match/local-drop.ts` — match shape and explanation/opener templates.
- `src/lib/auth/session.ts` — `SessionUser` shape.
- `src/lib/verification/otp.ts` — flow shape (frontend renders, backend validates).
- `src/app/api/intros/route.ts` — error codes and safety-block UX.
- `src/app/api/onboarding/interview/route.ts` — turn shape; the wizard maintains conversation history.
- `.env.example` — flag matrix changes affect both sides.
