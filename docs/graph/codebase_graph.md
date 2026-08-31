# Codebase graph summary

## Major clusters

1. Frontend app shell
   - `src/app/layout.tsx`
   - `src/app/(app)/layout.tsx`
   - `src/components/TopBar.tsx`
   - `src/components/BottomNav.tsx`
   - `src/components/FounderPass.tsx`
   - Main routes under `src/app/(app)/**`

2. Local closed-beta state
   - `src/lib/mock/me.ts`
   - `src/lib/mock/cohort.ts`
   - `src/lib/drop/**`
   - `src/lib/forum/posts.ts`
   - `src/lib/inbox/threads.ts`
   - `src/lib/moderation/queue.ts`
   - `src/lib/verification/otp.ts`

3. Backend API and auth
   - `src/proxy.ts`
   - `src/app/api/**/route.ts`
   - `src/lib/auth/**`
   - `src/lib/api/schema.ts`
   - `src/lib/auth/rate-limit.ts`

4. Agent system
   - `src/lib/agents/runner.ts`
   - `src/lib/agents/log.ts`
   - Agent prompt definitions in `src/lib/agents/*.ts`
   - `evals/**`

5. Persistence plans
   - `supabase/migrations/**`
   - `pocketbase/schema.json`
   - `src/lib/pocketbase/client.ts`

6. Deployment and ops
   - `vercel.json`
   - `.github/workflows/**`
   - `scripts/**`
   - `harness/**`

## Critical paths

Signup/onboarding:

```text
SignupPage
  -> localStorage jumpstart.signup
  -> Identity
  -> Verification + OTP + moderation queue
  -> Intent
  -> Card Review
  -> jumpstart.me
  -> drop eligibility
```

Drop:

```text
Card Review
  -> setEligibleDrop
  -> DropPage
  -> localStorage delivered_match
  -> MatchCard
  -> MatchDetailPage
```

Intro:

```text
MatchDetailPage
  -> POST /api/intros
  -> requireSession
  -> checkLimit
  -> IntroRequestSchema
  -> safetyClassifier via runAgent
  -> local outgoing Thread
```

Admin health:

```text
AdminLayout
  -> getAdmin
  -> AdminHealthPage
  -> GET /api/health
  -> Supabase/Anthropic/Upstash probes
```

## Ownership boundaries

Frontend:

- Pages/components and current local user-facing stores.
- Visual behavior and local UX.

Backend:

- API routes, auth, env flags, rate limits, agents, persistence, deployment.

Shared:

- `src/lib/types.ts`
- API contracts
- LocalStorage-to-DB migration surfaces
- Admin curation/moderation
- Verification proof workflow

## Most connected modules

- `src/lib/mock/me.ts`: read by Drop, Match, You, Inbox, Feed, Admin Curate, Admin Moderation.
- `src/lib/types.ts`: central domain type source for cards, matches, drops, intros, agents.
- `src/lib/auth/session.ts`: app shell and API handlers depend on it.
- `src/lib/api/schema.ts`: API validation and error shape.
- `src/lib/drop/**`: onboarding, Drop page, admin curation, notifications.
- `src/lib/agents/runner.ts`: shared execution path for live and stub agents.

## Highest-risk nodes

- `api:drops`: production DB read TODO.
- `api:intros`: production ownership and DB insert TODO.
- `api:cron-retention`: authenticated but deletion TODO.
- `page:onboarding-verification`: client-side proof and OTP handling.
- `page:onboarding-card`: location mismatch.
- `unknown:backend-choice`: Supabase versus PocketBase decision.
- `risk:stale-tests`: e2e tests mismatch current product.

## Import notes

The JSON graph is intentionally higher-level than a raw import graph. It is meant for Obsidian or Graphify-style navigation by system concept: routes, services, data models, external services, flows, risks, and ownership boundaries.

Graphify was not available in the local environment, so the graph is emitted as JSON and Markdown for later import.
