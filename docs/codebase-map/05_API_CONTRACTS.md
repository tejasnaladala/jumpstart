# API contracts

Every API surface, with method, path, request shape, response shape, auth requirement, and known issues. The Zod source of truth is `src/lib/api/schema.ts`.

## Common envelope

**Success:** `Response.json(payload, { status })` where `payload` shape is per-route.

**Error:** `jsonError(status, code, message, extras?)` returns:

```ts
{
  error: string,    // human-readable
  code:  string,    // stable, machine-parseable
  ...extras         // optional fields, e.g. retry_in_ms, fields
}
```

Stable error codes:

| Code | HTTP | Meaning |
|---|---|---|
| `BAD_JSON` | 400 | Body could not be parsed as JSON |
| `VALIDATION` | 400 | Zod validation failed (also returns `fields[]`) |
| `SELF_INTRO` | 400 | User tried to intro themselves |
| `SAFETY_BLOCK` | 400 | Safety classifier blocked the artifact |
| `UNAUTHORIZED` | 401 | Missing or invalid session |
| `FORBIDDEN` | 403 | Cron token mismatch or admin-required |
| `MATCH_NOT_OWNED` | 403 | Match doesn't belong to caller (verified against `src/app/api/intros/route.ts:62`) |
| `RATE_LIMITED` | 429 | With `retry_in_ms`, `help` |
| `SESSION_ERROR` | 500 | Session reading failed |
| `AGENT_ERROR` | 500 | Agent runner threw |
| `SUPABASE_NOT_CONFIGURED` | 500 | Supabase env missing and stub not allowed |
| `CRON_NOT_CONFIGURED` | 503 | `CRON_SECRET` env var not set on the deployment |
| `DROPS_NOT_IMPLEMENTED` | 503 | Real drop generation not wired (stub-mode required) |
| `INTROS_NOT_IMPLEMENTED` | 503 | Intro flow needs DB; stub mode required |
| `RETENTION_NOT_IMPLEMENTED` | 503 | Cron retention deletion not yet implemented |

## Routes

### `GET /api/health`

**File:** `src/app/api/health/route.ts`

**Auth:** none (public).

**Rate limit:** none.

**Request:** —

**Response (200):**

```ts
{
  ok: true,
  status: "alive"
}
```

**Notes:**
- Performs no outbound calls and cannot create provider traffic.
- Frontend consumer: `/admin/health` (poll every 10s).
- This endpoint proves process liveness only. Provider readiness belongs in a separately authenticated operator surface.

---

### `GET /api/cron/retention`

**File:** `src/app/api/cron/retention/route.ts:11`

**Auth:** `Authorization: Bearer ${CRON_SECRET}`. Constant-time comparison via `timingSafeEqual` (padded to equal length first).

**Rate limit:** none.

**Request:** —

**Response (200):** `{ deleted: number, audited: number, ts: string }` — when implemented.

**Response (503 `CRON_NOT_CONFIGURED`):** `CRON_SECRET` env is missing entirely (`src/app/api/cron/retention/route.ts:16`).

**Response (403 `FORBIDDEN`):** Bearer token mismatch (`route.ts:26`).

**Response (503 `RETENTION_NOT_IMPLEMENTED`):** `CRON_SECRET` is set and Bearer matches, but Supabase service-role envs are missing OR the deletion logic is still a TODO (`route.ts:34, 51`). Returns 503 honestly so monitors fail loudly when the real deletion path is missing.

**Notes:**
- Vercel Cron schedule: `0 3 * * *` (daily 3am UTC).
- The route checks BOTH `NEXT_PUBLIC_SUPABASE_URL` AND `SUPABASE_SERVICE_ROLE_KEY` before declaring "configured" (`route.ts:30-32`).
- TODO: SELECT `verifications WHERE artifact_expires_at < now()`, DELETE storage object, NULL the artifact columns, INSERT `retention_audit` row.

---

### `GET /api/browse`

**File:** `src/app/api/browse/route.ts:11`

**Auth:** `requireSession()`.

**Rate limit:** `browse_min` (60/min per user).

**Request (query):**

```ts
BrowseQuerySchema {
  q?: string,                // free text (max 80 chars, trimmed)
  tags?: string[],           // max 20, kebab-case
  page?: number,             // default 1
  limit?: number,            // default 20, max 50
}
```

Or, when called from `/pass/[id]`:

```
?id=<user_id>     // returns single founder card
```

**Response (200):**

```ts
// list mode
{ items: FounderCard[], page: number, limit: number, total: number }

// single mode
{ card: FounderCard }
```

**Notes:**
- Backed by MOCK_COHORT in stub mode. Production reads `founder_cards` (TODO).
- Tag filter is AND across requested tags.

---

### `POST /api/drops`

**File:** `src/app/api/drops/route.ts:12`

**Auth:** `requireSession()`.

**Rate limit:** `drops_day` (5/day per user).

**Request body:** none. (Earlier versions accepted body for the user payload; that was removed because it bypassed auth in stub mode. The route is now `POST` only — `GET` was removed.)

**Response (200, stub mode):**

```ts
{
  drop_id: string,           // "drop_<Date.now()>" — verified at route.ts:46
  user_id: string,           // server-derived from session
  matches: Match[],          // from generateLocalDrop(me); top picks with diversity rule
  generated_at: string       // ISO timestamp
}
```

The richer `Drop` type from `src/lib/types.ts` (with `cycle_week`, `sent_at`, `opened_at`) is the database-row shape. The route does not yet emit those fields.

**Response (503, prod):** `{ error, code: "DROPS_NOT_IMPLEMENTED" }` until `loadMeFromDb()` is wired (`route.ts:53`).

**Notes:**
- Frontend consumer: `/admin/curate` (admin) and the future `/drop` server-side load.
- Stub path uses `generateLocalDrop` over `DEFAULT_ME` from `src/lib/mock/me.ts` (not over `MOCK_COHORT` directly; `local-drop.ts` reads `MOCK_COHORT` itself for candidates).

---

### `POST /api/intros`

**File:** `src/app/api/intros/route.ts:8`

**Auth:** `requireSession()`. Self-intro check (`requester !== recipient`) returns `SELF_INTRO`.

**Rate limit:** `intros_hour` (10/h) AND `intros_day` (30/d). Hits both, returns `RATE_LIMITED` if either exhausted.

**Request body:**

```ts
IntroRequestSchema {
  match_id: string,           // accepts UUID or "match_<...>"
  recipient_id: string,       // accepts UUID or "u_<...>"
  note?: string,              // 0–500 chars, optional
}
```

**Response (200):**

```ts
{
  accepted: true,
  intro_id: string,           // "intro_<Date.now()>" — route.ts:106
  match_id: string,           // echoed from request
  requester_id: string,       // server-derived from session
  recipient_id: string,       // echoed from request
  sent_at: string             // ISO timestamp
}
```

There is no `thread_id` in the server response — thread modeling is a frontend localStorage concept today.

**Response (400 SAFETY_BLOCK):**

```ts
{
  error: "Your note was flagged. Please rewrite without sales language or external links.",
  code: "SAFETY_BLOCK"
  // The route does NOT echo reasons[] back to the client (no attacker oracle).
  // Reasons are written server-side via recordSafetyBlock() to the agent log.
}
```

**Response (403 MATCH_NOT_OWNED):** Caller is not the drop owner of this match (`route.ts:62`).

**Response (503 INTROS_NOT_IMPLEMENTED):** Returned when the ownership check throws because Supabase is configured but the `matches` table query is still a TODO (`route.ts:64, 152`).

**Notes:**
- Calls `runAgent(safetyClassifier, { artifact_type: "intro_note", artifact_text: note, context: { sender_id, recipient_id, recent_artifacts: 0 } })`. Stub fallback (when `result.via === "stub"`): regex check for spam (`http|click here|earn \$|bitcoin|nigerian prince|crypto giveaway|wire transfer`) and harassment (`kill|hate|slur|racist`). See `route.ts:84-89`.
- Safety blocks logged via `recordSafetyBlock()` (server-side only).
- Stub-mode ownership check (when `JUMPSTART_ALLOW_STUB=1` and Supabase NOT configured): only validates id-prefix shape (`match_*`, `u_*` or `fc_*`).
- Frontend UX: on `SAFETY_BLOCK`, toast "rewrite without sales language or external links."

---

### `POST /api/onboarding/interview`

**File:** `src/app/api/onboarding/interview/route.ts:14`

**Auth:** `requireSession()`.

**Rate limit:** `onboarding_min` (30/min per user).

**Request body:**

```ts
InterviewSchema {
  identity: { name: string, email: string, location?: string, oneLine?: string },
  history: { role: "user" | "assistant", content: string }[],
  questionsAsked: number,    // 0..8
}
```

**Response (200):**

```ts
{
  next_question: string,
  is_final: boolean,
  reasoning?: string         // omitted in prod
}
```

**Response (500 AGENT_ERROR):** Anthropic call failed and stub fallback also threw. Rare.

**Notes:**
- Calls `runAgent(onboardingInterviewer, ...)`. Stub fallback returns `FALLBACK_QUESTIONS[questionsAsked]`.
- Frontend maintains the conversation history client-side and POSTs the full history each turn (no server-side state).

---

## Auth and rate-limit matrix (cross-reference)

| Route | Session | Rate tier | Zod | Public? |
|---|---|---|---|---|
| `/api/health` | — | — | — | ✅ public |
| `/api/cron/retention` | bearer | — | — | ❌ cron only |
| `/api/browse` | ✅ | `browse_min` | ✅ | — |
| `/api/drops` | ✅ | `drops_day` | ✅ | — |
| `/api/intros` | ✅ | `intros_hour` + `intros_day` | ✅ | — |
| `/api/onboarding/interview` | ✅ | `onboarding_min` | ✅ | — |

## ID conventions

`src/lib/api/schema.ts` accepts both UUIDs and stub prefixes for graceful dev handoff:

| Prefix | Meaning | Example |
|---|---|---|
| `u_` | user | `u_dev_tejas` |
| `fc_` | founder card | `fc_priya_fintech` |
| `match_` | match | `match_2026-05-06_1` |
| `drop_` | drop | `drop_u_dev_tejas_2026-05-06` |
| `intro_` | intro | `intro_<nanoid>` |
| `thread_` | inbox thread | `thread_<nanoid>` |

In production, all of these become UUIDs from `gen_random_uuid()` per the migration. Both shapes coexist via the regex in `IdSchema`.

## Tag conventions

- Lowercase kebab-case: `ai-agents`, `hardtech`, `india`, `sf`, `cofounder`, `solo`, `undergrad`.
- 1–4 words per tag.
- Max 20 tags per `BrowseQuerySchema.tags`.
- Authoritative taxonomy lives in `src/lib/mock/cohort.ts` (see `COHORT_TAGS`).

## Frontend consumer map

| Endpoint | Frontend file | UI |
|---|---|---|
| `POST /api/intros` | `src/app/(app)/match/[id]/page.tsx` | Request modal submit |
| `GET /api/browse?id=` | `src/app/pass/[id]/page.tsx` | Public Founder Pass |
| `GET /api/health` | `src/app/admin/health/page.tsx` | Local liveness history |
| `GET /api/drops` | `src/app/admin/curate/page.tsx` | Pending drops list |
| `POST /api/onboarding/interview` | `src/app/onboarding/*` (when wired) | Conversational interview |

## Known issues

| # | Issue | Where | Severity |
|---|---|---|---|
| 1 | `/api/drops` returns 503 in prod until DB wired | `drops/route.ts:54` | P0 |
| 2 | `/api/intros` ownership check throws in prod | `intros/route.ts:152` | P0 |
| 3 | `/api/cron/retention` returns 503 (deletion not implemented) | `cron/retention/route.ts:51` | P1 |
| 4 | No authenticated provider-readiness endpoint exists | `health/route.ts` | P2 |
| 5 | `/api/onboarding/interview` not yet called from frontend wizard | (frontend) | P2 |
| 6 | No request-id / trace-id in error envelope; harder to correlate logs | all | P3 |
| 7 | `BrowseQuerySchema.tags` accepts arbitrary kebab-case; no enum validation against COHORT_TAGS | `schema.ts` | P3 |

## Change process

Both sides edit `src/lib/api/schema.ts` only via PR. Add a row to `08_DATA_FLOWS.md` for any new endpoint. Update this file in the same PR. Run `bun run typecheck` after.
