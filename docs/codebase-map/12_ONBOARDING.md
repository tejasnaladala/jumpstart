# Onboarding for a new engineer

## 30-minute path

First 5 minutes:

1. Read `README.md`.
2. Read `docs/codebase-map/01_SYSTEM_OVERVIEW.md`.
3. Open `package.json`.
4. Open `src/app/layout.tsx` and `src/app/(app)/layout.tsx`.

Next 10 minutes:

1. Trace signup/onboarding:
   - `src/app/signup/page.tsx`
   - `src/app/onboarding/identity/page.tsx`
   - `src/app/onboarding/verification/page.tsx`
   - `src/app/onboarding/intent/page.tsx`
   - `src/app/onboarding/card/page.tsx`
2. Read local storage helpers:
   - `src/lib/hooks/useDraftState.ts`
   - `src/lib/mock/me.ts`
   - `src/lib/verification/otp.ts`

Next 10 minutes:

1. Trace authed app:
   - `src/app/(app)/drop/page.tsx`
   - `src/app/(app)/match/[id]/page.tsx`
   - `src/app/(app)/browse/page.tsx`
   - `src/app/(app)/inbox/page.tsx`
   - `src/app/(app)/you/page.tsx`
2. Trace API handlers:
   - `src/app/api/intros/route.ts`
   - `src/app/api/health/route.ts`
   - `src/app/api/drops/route.ts`

Final 5 minutes:

1. Read `src/lib/auth/session.ts`.
2. Read `src/lib/auth/rate-limit.ts`.
3. Read `supabase/migrations/0001_init.sql`.
4. Read `docs/codebase-map/10_RISKS_AND_TECH_DEBT.md`.

## How to run locally

Expected:

```bash
bun install
bun run dev
```

App URL:

```text
http://localhost:3030
```

For local stub auth without Supabase:

```bash
JUMPSTART_ALLOW_STUB=1 JUMPSTART_FORCE_STUBS=1 bun run dev
```

PowerShell equivalent:

```powershell
$env:JUMPSTART_ALLOW_STUB="1"
$env:JUMPSTART_FORCE_STUBS="1"
bun run dev
```

## Useful commands

```bash
bun run typecheck
bun run lint
bun run build
bun run eval
bun run test:e2e
```

Note: this audit did not run tests because `node_modules` was not installed and the user asked not to install packages unless required for static analysis.

## Debug common issues

| Symptom | Likely cause | Files to check |
|---|---|---|
| Redirects to `/signup` from app pages | No session and stub not allowed | `src/app/(app)/layout.tsx`, `src/lib/auth/session.ts` |
| API returns `SUPABASE_NOT_CONFIGURED` | Supabase missing and `JUMPSTART_ALLOW_STUB` not set | `src/proxy.ts` |
| `/api/intros` returns 503 | Real DB ownership path not wired | `src/app/api/intros/route.ts` |
| `/api/drops` returns 503 | Real DB card read not wired | `src/app/api/drops/route.ts` |
| Drop waits forever | No delivered localStorage match for eligible drop | `src/app/(app)/drop/page.tsx`, `src/lib/drop/delivery.ts` |
| Admin redirects to home | Email not in allowlist or dev admin flags missing | `src/lib/auth/admin.ts` |
| Founder Pass has blank location | Identity/card field mismatch | `src/app/onboarding/identity/page.tsx`, `src/app/onboarding/card/page.tsx` |
| e2e tests fail on old selectors | Tests stale against current UI | `tests/e2e/happy-path.spec.ts` |

## First flows to trace

Signup to saved card:

```text
/signup
  -> localStorage jumpstart.signup
  -> /onboarding/identity
  -> jumpstart.onboarding.identity
  -> /onboarding/verification
  -> jumpstart.onboarding.verification + jumpstart.otp.*
  -> /onboarding/intent
  -> jumpstart.onboarding.intent
  -> /onboarding/card
  -> jumpstart.me + jumpstart.drop.next_at
```

Intro:

```text
/match/[id]
  -> getMatchById(generateLocalDrop(loadMe()))
  -> POST /api/intros
  -> requireSession
  -> rate limits
  -> Zod validation
  -> stub ownership or TODO DB ownership
  -> safetyClassifier
  -> local outgoing thread
```

Admin health:

```text
/admin/health
  -> admin layout getAdmin
  -> GET /api/health every 4s
  -> Supabase/Anthropic/Upstash probes
```

Manual Drop curation:

```text
/admin/curate
  -> findPendingDeliveries(loadMe())
  -> buildCuratedMatch()
  -> deliverMatch()
  -> /drop reads jumpstart.drop.delivered_match.<dropIso>
```

## Files to avoid casual edits

- `src/lib/auth/session.ts`
- `src/lib/auth/admin.ts`
- `src/lib/auth/rate-limit.ts`
- `src/proxy.ts`
- `src/app/api/intros/route.ts`
- `src/app/api/drops/route.ts`
- `src/app/api/cron/retention/route.ts`
- `supabase/migrations/**`
- `vercel.json`
