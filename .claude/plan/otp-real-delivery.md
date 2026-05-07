# Plan: Real OTP delivery (issue #2)

Source workflow: `/multi-backend` (Codex-led).
Date: 2026-05-07.
Owner: tejas-claude.
Reviewers: Codex (analyzer + architect already done; reviewer runs after Phase 4).

## Decision

**Solution 1 + async relaxation.** Vercel route handlers as the public OTP API. `src/lib/verification/otp.ts` becomes a thin client facade that calls `/api/verification/otp/{send,verify}` unless `JUMPSTART_FORCE_STUBS=1` or required real-mode env is incomplete. `send()` and `verify()` return `Promise<...>` instead of plain values; verification page gets two `await` keywords.

Rejected: PocketBase-owned hooks (Solution 2). Higher effort, worse Supabase migration story later.

## Resolved decisions

1. Phone normalization: `libphonenumber-js/min` (new npm dep, ~50KB), default country US for numbers without `+`.
2. Verify target recovery: `verify(channel, code)` stays targetless publicly. The client facade reads the pending target from localStorage and sends it to the route handler privately. Cleared localStorage between send and verify on the same device returns `no_pending` and the user must resend.
3. localStorage in real mode: keep storing pending target + verified marker; never store the code. Stub mode keeps storing the code (already does).
4. Runtime: `export const runtime = "nodejs"` on both route handlers. PocketBase admin auth + Node `crypto` + env handling stays predictable on Vercel.
5. Hashing: server-side SHA-256 of `(channel + normalized_target + pepper)` for target hash, and `(channel + normalized_target + code + pepper)` for code hash. Pepper is `OTP_HASH_PEPPER`, server-only.
6. Rate limit: new key `otp_send_min` (1/min/identifier). Identifier is `channel:target_hash`.
7. Brute-force throttle on verify: `attempts` counter on the OTP row. Max 5 mismatches before returning `rate_limit`.
8. TTL: 10 minutes per code (matches existing stub).

## Files (14)

### Docs / config

1. `package.json` — add `libphonenumber-js` and `pocketbase` deps; add `test:otp` script using Node test runner with `tsx`.
2. `.env.example` — document `OTP_HASH_PEPPER`, `OTP_FROM_EMAIL`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_PHONE`, `POCKETBASE_URL`, `POCKETBASE_ADMIN_EMAIL`, `POCKETBASE_ADMIN_PASSWORD`. `RESEND_API_KEY` already present.
3. `pocketbase/schema.json` — add `otp_codes` collection: `channel`, `target_hash`, `code_hash`, `sent_at`, `expires_at`, `verified_at`, `attempts`. Index `(channel, target_hash, verified_at, expires_at)`. All public CRUD rules closed.

### Library

4. `src/lib/verification/types.ts` — central types. `OtpChannel`, `OtpRecord`, `SendResult`, `VerifyResult`. `SendResult.reason` adds `config_incomplete | delivery_failed`. `VerifyResult.reason` adds `rate_limit`, `attempts_remaining`.
5. `src/lib/verification/target.ts` — `normalizeEmailTarget`, `normalizePhoneTarget`, `normalizeOtpTarget`. Email lowercases after trim; phone returns E.164.
6. `src/lib/verification/config.ts` — `getOtpServerConfig(): OtpRealConfig | OtpStubConfig`. Resolves `mode: "real" | "stub"` based on env presence + `JUMPSTART_FORCE_STUBS`.
7. `src/lib/verification/hash.ts` — `hashTarget`, `hashOtpCode`, `timingSafeEqualHex`. Node `crypto` only (server-side).
8. `src/lib/pocketbase/server.ts` — authenticated PocketBase admin client. Cached at module scope; re-auths on auth failure.
9. `src/lib/verification/store.ts` — `OtpCodeStore` interface + `createPocketBaseOtpCodeStore`. CRUD on `otp_codes`.
10. `src/lib/verification/delivery.ts` — `deliverOtp` that dispatches via Resend (HTTP) or Twilio (HTTP basic auth + form encoding). Never logs the code.
11. `src/lib/verification/service.ts` — orchestrator. Normalizes, rate-limits, hashes, persists, delivers, verifies. Dependency-injectable for tests (`OtpServiceDeps` carries config, store, now, randomCode, deliver, checkLimit).

### Routes

12. `src/app/api/verification/otp/send/route.ts` — `POST`. Body `{ channel, target }`. Maps service result to 200/400/429/503/500. Node runtime.
13. `src/app/api/verification/otp/verify/route.ts` — `POST`. Body `{ channel, target, code }`. Same status mapping. Node runtime.

### Client + UI

14. `src/lib/verification/otp.ts` — REWRITTEN. Public surface preserved (`load`, `save`, `clear`, `send`, `verify`, `isVerified`, `verifiedTarget`) but `send` and `verify` now return `Promise<...>`. Calls fetch in real mode, localStorage in stub mode.
15. `src/app/onboarding/verification/page.tsx` — add `await` at the four call sites (`onSendEmailCode`, `onSendPhoneCode`, `onVerifyEmailCode`, `onVerifyPhoneCode`). No other UI changes.
16. `src/lib/auth/rate-limit.ts` — extend `LimiterKey` with `"otp_send_min"`; add `LIMITS.otp_send_min = { limit: 1, window: "1 m" }`.

### Tests

17. `src/lib/verification/service.test.ts` — Node test runner with `tsx`. Mocks store, delivery, config, clock, random code, rate-limit. Covers: stub happy path, real happy path, expiry, mismatch, attempts throttle, send rate-limit, phone normalization to E.164, invalid target.
18. `src/lib/verification/otp.test.ts` — fake `window.localStorage` + mocked `fetch`. Covers: stub-mode send/verify, pending-target recovery, cleared-storage `no_pending`, real-mode never stores code client-side.

(Total: 18 files, but #15 and #16 are minimal edits, and three of the new lib files are <50 lines.)

## Build order (preserves type-check at every step)

1. `package.json`, `.env.example`
2. `types.ts`, `target.ts`, `config.ts`, `hash.ts`
3. `rate-limit.ts` (add the limiter key)
4. `pocketbase/server.ts`, `store.ts`
5. `delivery.ts`, `service.ts`
6. API route handlers
7. `otp.ts` rewrite
8. Verification page awaits
9. `pocketbase/schema.json`
10. Tests

## Test plan (smoke, must pass before PR)

- `npm run typecheck` clean
- `npm run test:otp` — service + facade tests, all green
- Stub-mode send/verify happy path: `demo_code` returned and surfaces in console.info
- Real-mode send/verify happy path with mocked store + mocked delivery
- Expired code → `expired`
- Mismatched code → `mismatch`, attempts incremented
- 5 mismatches → `rate_limit`
- 1/min send limiter hit → `rate_limit` with `retry_after_ms`
- Phone normalization: `(415) 555 0123` → `+14155550123`; reject `12345`
- Cleared localStorage between send and verify → `no_pending`

## What this does NOT include

- Twilio toll-free verification ramp (US carrier registration). Not blocking 50 closed-beta users.
- Resend domain verification. The `OTP_FROM_EMAIL` must be a verified Resend sender; ops follow-up.
- Migration of EXISTING localStorage OTP records to the server. Closed-beta-of-2 means there are at most 4 OTP records total.
- Supabase migration. That's issue #5; this plan stays portable to it via `OtpCodeStore` interface.

## Risk register

1. **Async API contract drift** — verification page gets two `await`s. Type checker enforces; should be a 30-second fix if drift creeps in.
2. **Phone normalization edge cases** — `libphonenumber-js/min` is robust but international US-defaults can mis-parse local-format Indian numbers without the `+`. Mitigation: surface `invalid_target` and prompt user to include country code.
3. **PocketBase admin auth caching** — if the cached token expires mid-flight we get a 401 and re-auth retries once. If PB is down entirely, 503 to the client. Mitigation: explicit `service.test.ts` covers re-auth.
4. **Brute-force on verify** — capped at 5 attempts per OTP record. Beyond that requires a fresh send (which is itself rate-limited). Both layers needed.

## Operational follow-ups (not blocking the PR)

- Provision Resend sender domain, Twilio account + phone, PocketBase host (Fly.io / Railway / dedicated VM).
- Generate `OTP_HASH_PEPPER` (32 random bytes hex) and store in Vercel project env.
- Wire health probe at `/api/health` to optionally check PocketBase + Resend reachability when the keys are set.
