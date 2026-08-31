# Data flows

End-to-end traces of the main user journeys. Each flow names the files involved, where data lives, and where failures could occur.

## Flow 1: Sign up → onboarding → first drop

**Today (stub mode):**

1. **`/signup`** (`src/app/signup/page.tsx`)
   - User enters email + LinkedIn URL.
   - Writes `localStorage.jumpstart.signup`.
   - Redirects to `/onboarding/identity`.
2. **`/onboarding/identity`** → `/onboarding/card` → `/onboarding/intent` → `/onboarding/verification`
   - Each step uses `useDraftState` to autosave to `localStorage.jumpstart.draft.<step>`.
   - `verification` calls stub `otp.send()` → returns `{ ok, demo_code }`. The code is rendered visually-hidden post-commit `82d2514`.
3. **App shell at `/drop`**
   - `(app)/layout.tsx` calls `getSession()`. Stub mode returns `DEV_USER`.
   - `/drop/page.tsx` calls `loadMe()` (localStorage), then `generateLocalDrop(me, MOCK_COHORT)`.
   - Renders three `MatchCard`s.
4. **Tap a card → `/match/[id]`**
   - Reads match by id via `getMatchById(id)` (deterministic local).

**Production target:**

1. `/signup` posts to Supabase Auth → magic link → callback URL → cookie.
2. Onboarding wizard finalizes by calling `/api/onboarding/interview` once per turn (or a batch endpoint), then writes `founder_cards` row.
3. `/drop` server-loads via Matchmaker agent invocation against `founder_cards` filtered by tags / intent.
4. Match detail loads the row from `matches` table.

**Failure modes:**

- Stub: localStorage cleared by user → drafts lost (no toast).
- Prod: magic link expired → user lands on signup page silently (UNKNOWN: error path not yet defined).

---

## Flow 2: Request intro

1. User on `/match/[id]` taps "Request intro".
2. Sheet opens, prefilled with `suggested_opener` (editable).
3. Submit → `POST /api/intros` with `{ match_id, recipient_id, note? }`.
4. **Server (`src/app/api/intros/route.ts`):**
   - `requireSession()` → `requester_id`.
   - Zod parse `IntroRequestSchema`.
   - Self-intro check (`requester_id !== recipient_id`).
   - `assertMatchOwnership` (TODO in prod; stub mode skips).
   - Two rate-limit checks: `intros_hour` then `intros_day`.
   - `runAgent(safetyClassifier, { artifact_type: "intro_note", artifact_text: note, context })`.
     - Stub fallback: regex check.
     - Real agent: Haiku 4.5, returns `{ risk_score, recommendation, reasons }`.
   - `recommendation` in `["block", "escalate"]` → `recordSafetyBlock()`, return `400 SAFETY_BLOCK`.
   - Otherwise: insert `intros` row (TODO prod), append to inbox thread (stub: localStorage).
5. Frontend: success → redirect to `/inbox`. `SAFETY_BLOCK` → toast.

**Failure modes:**

- Anthropic timeout (stub fallback runs).
- Agent returns malformed JSON (parse step throws → 500 AGENT_ERROR).
- Rate limit exhausted (429 with help text).
- Note contains spam keywords (regex match) → `SAFETY_BLOCK`.

---

## Flow 3: Accept / decline an intro (target flow, not yet wired)

1. Recipient sees the intro in `/inbox`.
2. Tap accept → `PATCH /api/intros/{id}` with `{ response: "accept" }`.
3. **Server:** RLS `recipient_id = auth.uid()` enforces only recipient can update.
4. On accept, server triggers Resend email to both with contact + calendar link.
5. Update `intros.response_at`, `email_sent_at`, `contact_unlocked_at`.

**Status:** the PATCH route does not yet exist; today the inbox is localStorage. Backend owner item.

---

## Flow 4: Health check

1. Anyone hits `GET /api/health` (no auth).
2. The route returns `{ ok: true, status: "alive" }` without reading provider configuration or making a network request.
3. Frontend `/admin/health` polls every 10s and renders recent local liveness.

**Failure modes:**

- The application process or route fails, so the request itself errors.
- A provider can be unavailable while liveness stays green; inspect authenticated operator diagnostics and server logs for readiness.

---

## Flow 5: Cron retention

1. Vercel Cron hits `GET /api/cron/retention` daily 3am UTC.
2. **Server checks** `Authorization: Bearer ${CRON_SECRET}`. Mismatch → 403.
3. Currently returns 503 `RETENTION_NOT_IMPLEMENTED`.
4. **Target behavior:**
   - `select id, artifact_url from verifications where artifact_expires_at < now()`.
   - Delete each storage object via service role.
   - Insert `retention_audit` row.
   - Return `{ deleted: n, audited: n }`.

---

## Flow 6: Agent invocation (any agent)

1. Caller invokes `runAgent(agentDef, input)` (`src/lib/agents/runner.ts:139`).
2. Runner gets the Anthropic client via `getClient()`. Returns null if:
   - `JUMPSTART_DISABLE_ANTHROPIC=1` (kill switch), OR
   - `ANTHROPIC_API_KEY` empty, OR
   - `JUMPSTART_FORCE_STUBS=1`.
3. If null → caller's stub fallback runs.
4. If real:
   - Prompt cache on system block.
   - `messages.create` with model-specific timeout (Sonnet 30s, Haiku 15s) and `max_output_tokens` (2048 / 1024).
   - JSON prefill: `{ role: "assistant", content: "{" }` to force JSON output.
   - Up to 3 attempts with jittered exponential backoff.
5. Parse via agent-defined `parse()` (Zod). On parse fail, throw `AGENT_PARSE_ERROR`.
6. Compute cost from token usage and hardcoded prices ($3 / $15 Sonnet, $1 / $5 Haiku per MTok).
7. `logAgentRun()` writes JSONL (dev) or Supabase (TODO prod).
8. Return `RunResult<O> { ok, output, tokens_in, tokens_out, cost_usd, latency_ms, attempts, via }`.

---

## Flow 7: Drop generation (target end-to-end)

1. Cron or in-app trigger calls drop logic.
2. **Server:**
   - Read user's `founder_cards` row (incl. `embedding`).
   - Read top-50 candidates from `founder_cards` ranked by `<embedding> <-> :user_embedding` (cosine).
   - Filter exclusions: paused users, `recent_shown_user_ids` (from `matches` history).
   - Call **Matchmaker agent** (Sonnet 4.5) with the top-50. Returns `picks[]` (3 with diversity rule).
   - For each pick:
     - Call **Match Explainer** (Sonnet 4.5) → `{ explanation, specificity_anchor }`.
     - Call **Opener Drafter** (Haiku 4.5) → `{ opener }`.
   - Insert `drops` row + 3 `matches` rows.
3. Notify user (push or email; TODO).

**Today:** the deterministic `local-drop.ts` is the stand-in.

---

## Flow 8: Post-meeting feedback (Phase 3)

1. 48h after `intros.response = 'accept'`, send a one-tap prompt: "did you meet?"
2. User taps → `POST /api/meetings` (route TODO).
3. Insert `meetings` row (`occurred`, `outcome`).
4. **Feedback Learner** agent re-runs nightly to update `taste_profiles.embedding` and `preferred_match_types`.

---

## Frontend → backend → DB → external service

```
Browser
  │
  ▼
Next.js page (RSC or client)
  │ fetch / Server Action
  ▼
Next.js API route (`src/app/api/.../route.ts`)
  │ requireSession() → DB read (Supabase anon)
  │ checkLimit() → Upstash
  │ runAgent() → Anthropic
  │ Resend (TODO)
  ▼
Supabase Postgres
```

## Failure modes (cross-cutting)

| Layer | Failure | Effect | Recovery |
|---|---|---|---|
| Middleware | Stub gate trips | 500 `SUPABASE_NOT_CONFIGURED` | Set env or `JUMPSTART_ALLOW_STUB=1` |
| Session | Cookie invalid | 401 `UNAUTHORIZED` | Re-auth |
| Rate limit | Quota exhausted | 429 with `retry_in_ms` | Wait |
| Zod | Invalid input | 400 `VALIDATION` with `fields[]` | Caller fixes payload |
| Safety | Risk score high | 400 `SAFETY_BLOCK` with reasons | Caller rewrites |
| Agent | Anthropic 5xx | retry up to 3, then fall back to stub or 500 | Stub returns generic answer |
| DB | Supabase down | Provider-backed routes fail; `/api/health` remains local liveness | Inspect authenticated diagnostics and server logs |
| Cron | Token mismatch | 403 | Check Vercel env |

## Stub-mode honesty matrix

| Flag set | Auth | Anthropic | Rate limit | Effect |
|---|---|---|---|---|
| (none in prod) | Real Supabase | Real Anthropic | Upstash | Production |
| `JUMPSTART_ALLOW_STUB=1` (no Supabase) | DEV_USER | per-key | per-key | Dev / preview |
| `JUMPSTART_FORCE_STUBS=1` | per-flag | local heuristic | per-flag | Plane mode |
| `JUMPSTART_PRIVATE_BETA=1` | per-flag | per-flag | in-memory allowed | Tunnel beta |
| `JUMPSTART_DEV_ADMIN=1` (with PRIVATE_BETA) | session | per-flag | per-flag | Founder bypass for /admin |
| `JUMPSTART_DISABLE_ANTHROPIC=1` | per-flag | nil | per-flag | Spend-incident kill |

## Tracing tips

- Every agent call writes a JSONL line: `agent`, `via`, `tokens_in/out`, `cost_usd`, `latency_ms`, `attempts`.
- Every safety block writes a JSONL line tagged `event: safety_block`.
- `/api/health` intentionally contains no environment or dependency metadata.
- Rate-limit responses include `retry_in_ms` and human help text.
