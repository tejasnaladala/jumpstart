# Auth and security

## Auth flow (magic link, production target)

1. User submits email at `/signup`. **(currently mock localStorage; not yet wired to Supabase Auth)**
2. Supabase sends magic link.
3. User clicks the link, lands on a callback URL handled by `@supabase/ssr`.
4. Browser receives `sb-...-auth-token` cookie (chunked as `.0`, `.1`, … if large).
5. Subsequent `/api/*` requests pass through `src/middleware.ts`. Cookie regex: `^sb-.+-auth-token(\.\d+)?$`.
6. Route handler calls `requireSession()` (`src/lib/auth/session.ts:103`) which calls `getSession()` which does:
   - Constructs SSR client with anon key + cookies.
   - `supabase.auth.getUser()` validates the cookie.
   - `select trust_tier from users where id = auth.uid()` (anon-key path; RLS allows own row).
   - Returns `SessionUser { id, email, trust_tier }` or `null`.
7. `requireSession()` throws `UnauthorizedError` (401) on null.

## Auth flow (stub mode)

1. App boots **without** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. `JUMPSTART_ALLOW_STUB=1` must be set explicitly.
3. `getSession()` returns the deterministic `DEV_USER`:

   ```ts
   {
     id: DEFAULT_ME.user_id,
     email: "tejas@local.dev",
     trust_tier: "verified",
   }
   ```

4. Middleware `PUBLIC_API_ROUTES` (`/api/health`, `/api/cron`) bypass cookie check; everything else requires Supabase to be configured **or** stub mode allowed.
5. Production hardening: `NODE_ENV=production` is **not enough** to disable stub. Vercel preview also runs `NODE_ENV=production`; the explicit flag is the actual gate.

## Admin gate

`src/app/admin/layout.tsx` forces dynamic rendering and calls `getAdmin()`. `src/lib/auth/admin.ts:26`:

1. `getSession()` first.
2. Dev-admin bypass if `JUMPSTART_DEV_ADMIN=1` AND (`NODE_ENV !== "production"` OR `JUMPSTART_PRIVATE_BETA=1`).
3. Allowlist: `JUMPSTART_ADMIN_EMAILS` CSV (case-insensitive).
4. Empty allowlist → admin disabled entirely.

`requireAdmin()` throws 403 if neither path qualifies.

**Risk:** `JUMPSTART_DEV_ADMIN=1` + `JUMPSTART_PRIVATE_BETA=1` + `NODE_ENV=production` together grants any authenticated user admin. This is the closed-beta tunnel mode. For the public beta, set `JUMPSTART_PRIVATE_BETA` to empty and rely on `JUMPSTART_ADMIN_EMAILS`.

## API auth matrix

| Route | Session | Rate limit | Zod | Notes |
|---|---|---|---|---|
| `/api/health` | — | — | — | public, dependency probe |
| `/api/cron/retention` | bearer `CRON_SECRET` | — | — | Vercel Cron only |
| `/api/browse` | ✅ | `browse_min` (60/m) | ✅ | |
| `/api/drops` | ✅ | `drops_day` (5/d) | ✅ | |
| `/api/intros` | ✅ | `intros_hour` (10/h) + `intros_day` (30/d) | ✅ | self-intro check, ownership check, safety classifier |
| `/api/onboarding/interview` | ✅ | `onboarding_min` (30/m) | ✅ | |

## Rate-limit strategy

`src/lib/auth/rate-limit.ts`. Per-user identifier from `session.id`.

**Production (Upstash):**

- Sliding-window via `@upstash/ratelimit`.
- One `Ratelimit` per tier per identifier (no global singleton).
- Per-key cache map at line 27 (`upstashByKey`).

**Dev / private-beta (in-memory):**

- `memBuckets` Map of timestamps per key per identifier.
- `memMutex` per-key mutex prevents race across cold starts.
- Cleanup every 60s.
- **Hard prod gate** at line 150: throws unless Upstash configured OR `JUMPSTART_PRIVATE_BETA=1`.

## Secret handling

**Search results:** No `sk-`, `Bearer `, or hex strings of suspicious length found in source. All secrets use `process.env.*`.

**Env wiring:**

- `ANTHROPIC_API_KEY` — only read in `src/lib/agents/runner.ts:14,29`.
- `CRON_SECRET` — only read in `src/app/api/cron/retention/route.ts:25`, compared via `timingSafeEqual` after length-padding.
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — passed to Upstash client.
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public, intentionally `NEXT_PUBLIC_*`.
- `SUPABASE_SERVICE_ROLE_KEY` — server-only, must never appear under `NEXT_PUBLIC_*`. Currently only referenced (not yet instantiated) in code.

**Logs do not include:**

- Anthropic key
- Cron secret
- Service role key
- User passwords (no password auth)

**Logs DO include (today):**

- OTP demo codes via `console.info("[stub] ...demo_code")` in stub mode only — was visible in console; commit `82d2514` removed visible-UI display, but the console log may persist. Verify before public beta.

**Recommendation:** Add an env-loading helper that fails fast at startup if production is missing required keys.

## Cron auth

`src/app/api/cron/retention/route.ts:11`:

1. Reads `authorization` header.
2. If missing or `CRON_SECRET` empty → 503.
3. Decoded as `Bearer <token>`. Both sides padded to equal length, then `timingSafeEqual` compares.
4. Mismatch → 403.
5. Match → proceeds (currently to a 503 because deletion is unimplemented).

## Security headers (`vercel.json`)

| Header | Value |
|---|---|
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `no-referrer` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), interest-cohort=()` |
| `Content-Security-Policy` | (see below) |

**CSP breakdown:**

- `default-src 'self'`
- `script-src 'self' 'unsafe-inline' https://*.vercel-insights.com https://*.posthog.com https://elu.dev`
- `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`
- `img-src 'self' data: https://ui-avatars.com https://api.dicebear.com https://*.posthog.com`
- `font-src 'self' https://fonts.gstatic.com`
- `connect-src 'self' https://*.supabase.co https://*.upstash.io https://api.anthropic.com https://*.posthog.com`
- `worker-src blob:`
- `frame-ancestors 'none'`
- `base-uri 'self'`
- `form-action 'self'`

**Note:** `'unsafe-inline'` on scripts is needed for Next.js hydration. Acceptable trade-off; tighten with nonce-based CSP later if XSS becomes a concern.

## Sensitive data in logs / errors

- `jsonError(...)` returns generic codes; user input is never echoed.
- Stack traces are not returned to clients.
- `agent_logs` (DB) stores full prompts and responses for debugging — sensitive. Plan retention.
- `.jumpstart-logs/agent.jsonl` (dev only) stores same. Vercel `/tmp` is ephemeral.

## CORS

No explicit CORS middleware. Next.js defaults same-origin only on API routes. Frontend and backend are same-origin in practice.

## CI/CD posture (`.github/workflows/ci.yml`)

| Job | Runs on | Steps |
|---|---|---|
| `build` | PR + push to master | `bun install`, `typecheck`, `lint`, `build` |
| `evals` | PR + push to master | `bun run eval` with `STRICT=1` and `ANTHROPIC_API_KEY` (stub mode if missing) |
| `e2e` | PR only | install + Playwright Chromium + build + `bun run test:e2e` |

Secrets exposed to workflow: only `ANTHROPIC_API_KEY`. No DB credentials in CI.

`.github/workflows/autoresearch.yml` runs Mondays 09:00 UTC for the weekly eval baseline.

## Top 10 security risks (ranked)

| # | Risk | Severity | File | Mitigation |
|---|---|---|---|---|
| 1 | Magic-link auth not yet wired (mock localStorage in `signup`) | P0 | `src/app/signup/page.tsx:44-50` | Wire Supabase Auth before any real users |
| 2 | Stub-mode bypass in production | P0 | `src/lib/auth/session.ts:35-46` | Verify Vercel envs do not include `JUMPSTART_ALLOW_STUB=1` for public beta |
| 3 | Admin auth grants any session under `DEV_ADMIN=1 + PRIVATE_BETA=1` | P0 | `src/lib/auth/admin.ts:18-24` | Ensure `JUMPSTART_ADMIN_EMAILS` populated in prod; turn `PRIVATE_BETA` off |
| 4 | Cron retention is single-secret, no rotation logic | P1 | `src/app/api/cron/retention/route.ts:12-27` | Plan quarterly rotation; consider Vercel signed cron header when available |
| 5 | OTP demo codes may still hit `console.info` | P1 | `src/lib/verification/otp.ts`, `verification/page.tsx:169,195` | Strip `console.*` calls in stub mode for prod build |
| 6 | CSP allows `'unsafe-inline'` scripts | P1 | `vercel.json:25` | Acceptable for Next.js; revisit with nonce-based CSP later |
| 7 | In-memory rate limit usable in prod under `PRIVATE_BETA=1` | P1 | `src/lib/auth/rate-limit.ts:103-122` | Hard gate exists; turn off `PRIVATE_BETA` for public beta |
| 8 | Match ownership check unimplemented in prod | P2 | `src/app/api/intros/route.ts:152` | Wire DB query; otherwise 503s clog the path |
| 9 | Verification screenshots stored as data URLs in localStorage (browser-side, but unencrypted) | P2 | `src/app/onboarding/verification/page.tsx:136-144` | Acceptable for closed beta; encrypt before public launch |
| 10 | No request-id / trace-id in error envelope | P3 | all routes | Add `x-request-id` to header + envelope |

## Required mitigations (ordered)

1. Wire Supabase magic-link auth (kills risk #1).
2. Populate `JUMPSTART_ADMIN_EMAILS` in Vercel envs (mitigates #3).
3. Implement cron retention deletion + audit insert (closes the data-leakage runway).
4. Wire `assertMatchOwnership()` so `/api/intros` works in prod (mitigates #8 and unblocks Phase 1).
5. Strip `console.info` from `otp.ts` / `verification/page.tsx` in stub mode for prod build (mitigates #5).
6. Document/automate Vercel env audit before promoting to public beta. Verify `JUMPSTART_ALLOW_STUB`, `JUMPSTART_PRIVATE_BETA`, `JUMPSTART_DEV_ADMIN`, `JUMPSTART_FORCE_STUBS` are empty.
7. Plan agent log retention / partitioning (PII concern).
8. Optional: nonce-based CSP for scripts.
9. Optional: request-id propagation for error correlation.
10. Optional: Sentry / observability integration for runtime errors.

## Verification checklist before public beta

- [ ] `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` set
- [ ] `ANTHROPIC_API_KEY` set
- [ ] `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` set
- [ ] `RESEND_API_KEY` set (when notification wiring lands)
- [ ] `CRON_SECRET` set, rotated
- [ ] `JUMPSTART_ADMIN_EMAILS` populated
- [ ] `JUMPSTART_ALLOW_STUB`, `JUMPSTART_FORCE_STUBS`, `JUMPSTART_PRIVATE_BETA`, `JUMPSTART_DEV_ADMIN`, `JUMPSTART_DISABLE_ANTHROPIC` all empty
- [ ] Magic-link auth flow tested end-to-end
- [ ] `/api/drops`, `/api/intros`, `/api/cron/retention` no longer return 503
- [ ] Agent log persistence to Supabase verified
- [ ] Run `/cso` skill or external pen test on the deployed URL
