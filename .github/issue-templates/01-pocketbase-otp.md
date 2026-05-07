## Brief

Wire the OTP module to PocketBase + Resend (email) + Twilio (phone). Today the verification step at `/onboarding/verification` runs entirely in the browser via `localStorage`. Closed-beta needs real delivery so a friend can verify on a different device than they sign up on.

## Context

- `src/lib/verification/otp.ts` - the stub OTP module. Read the file header for the design intent.
- `src/app/onboarding/verification/page.tsx:140-210` - the UI calls `sendOtp()` and `verifyOtp()` from a client component. The send branch returns `demo_code` in stub mode (now hidden, only logged via `console.info`).
- `pocketbase/schema.json` - the schema scaffold. Add a collection for `otp_codes` with fields: `id`, `channel` (email | phone), `target` (string, indexed), `code_hash` (sha256 of the code), `sent_at` (datetime), `expires_at` (datetime), `verified_at` (datetime, nullable), `attempts` (int, default 0).
- `scripts/start-pocketbase.sh` - starts a local PocketBase at `:8090`. Use this for local testing.
- `.env.example` lines for `RESEND_API_KEY` (already present).

The promotion path:
- `send()` in `otp.ts` writes a row in PocketBase (server-side via `next/headers` and a server action), generates a code, hashes it, and dispatches:
  - email: `POST https://api.resend.com/emails` with `RESEND_API_KEY`
  - phone: Twilio Programmable Messaging API
- `verify()` reads the row, checks expiry, hashes the submitted code, compares, marks `verified_at`. Returns the same `VerifyResult` shape so the UI doesn't change.

## Acceptance

- [ ] `src/lib/verification/otp.ts` keeps its public surface (`send`, `verify`, `isVerified`, `verifiedTarget`). Same return types.
- [ ] When `RESEND_API_KEY` and `TWILIO_*` env vars are present, real delivery fires. When absent, the stub-mode branch still works (so closed-beta keeps testing).
- [ ] `JUMPSTART_FORCE_STUBS=1` overrides everything and forces stub mode (matches the existing pattern in `src/lib/auth/session.ts`).
- [ ] Code is hashed before write. The plain code is never stored in PocketBase.
- [ ] Rate limit (1 send / minute / channel) preserved. Move the limit from `localStorage` to PocketBase or to the in-memory limiter at `src/lib/auth/rate-limit.ts`.
- [ ] PocketBase schema migration committed in `pocketbase/schema.json` and a one-time bootstrap in `scripts/start-pocketbase.sh` so the collection is created on first run.
- [ ] Build passes: `npm run build` and `npx tsc --noEmit`.
- [ ] No new console errors at `/onboarding/verification` end to end (send code, type code, verify, advance to next step).

## Out of scope

- Migrating the rest of the app (Founder Card, posts, threads) to PocketBase. That's a separate issue.
- Real auth (magic-link login). Stub session in `src/lib/auth/session.ts` stays for now.
- Updating `harness/lib/assertions.ts` - it doesn't currently exercise OTP and shouldn't.

## Useful skills

- `/codex` for an independent diff review focused on hash handling and rate-limit correctness.
- `/fool` to challenge whether server-side OTP is actually needed for a 2-person closed beta or if we should hold this for v1.5.

## Notes

- Resend free tier is 3000/month - plenty for 50 closed-beta users.
- Twilio costs ~$0.008/SMS. Budget this in the env-var docs at the top of `.env.example`.
- Keep the comment header in `otp.ts` updated to reflect the new architecture.
