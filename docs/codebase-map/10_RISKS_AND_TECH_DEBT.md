# Risks and tech debt

Comprehensive ranked list. P0 = production blocker. P1 = ship-blocker for public beta. P2 = before scaling. P3 = quality-of-life.

## P0 — production blockers

| # | Risk | Where | Fix |
|---|---|---|---|
| 1 | Magic-link auth is mock localStorage; no Supabase Auth wiring | `src/app/signup/page.tsx:44-50` | Wire `@supabase/ssr` magic link send + callback before any real users |
| 2 | `/api/drops` `loadMeFromDb()` throws "not implemented" | `src/app/api/drops/route.ts:54` | Add Supabase server client + `select * from founder_cards where user_id = :id` |
| 3 | `/api/intros` `assertMatchOwnership()` throws in prod | `src/app/api/intros/route.ts:152` | Add `select id from matches where id = :match and user_id = :requester` |
| 4 | `/api/cron/retention` returns 503 indefinitely | `src/app/api/cron/retention/route.ts:51` | Implement deletion + `retention_audit` insert |
| 5 | Agent log persistence to Supabase is TODO | `src/lib/agents/log.ts:98` | Wire service-role client INSERT into `agent_logs` |
| 6 | `scripts/seed-cohort.ts` referenced by `db:seed` but missing | `package.json` | Create the script (CSV import → upsert) |

## P1 — ship-blockers for public beta

| # | Risk | Where | Fix |
|---|---|---|---|
| 7 | Stub auth bypass possible if envs misconfigured in Vercel | `src/lib/auth/session.ts:35-46` | Audit env on every prod deploy; ensure `JUMPSTART_ALLOW_STUB` empty |
| 8 | Admin gate trivial under `JUMPSTART_DEV_ADMIN=1 + PRIVATE_BETA=1` | `src/lib/auth/admin.ts:18-24` | Empty those flags in public beta; populate `JUMPSTART_ADMIN_EMAILS` |
| 9 | In-memory rate limit usable in prod under `PRIVATE_BETA=1` | `src/lib/auth/rate-limit.ts:103-122` | Hard gate exists at line 150; turn off `PRIVATE_BETA` for public beta |
| 10 | OTP demo codes may still hit `console.info` | `src/lib/verification/otp.ts`, `verification/page.tsx:169,195` | Strip console calls in stub mode for prod build |
| 11 | Cron secret has no rotation logic | `src/app/api/cron/retention/route.ts` | Quarterly rotate, document in launch-playbook |
| 12 | Safety classifier stub fallback uses naive regex (false negatives on context-dependent spam) | `src/app/api/intros/route.ts:84-89` | Require real Haiku in prod (no `JUMPSTART_FORCE_STUBS`); widen patterns |
| 13 | No production cost controls on Anthropic spend | `src/lib/agents/runner.ts` | Add per-user daily quota, max-tokens cap, alert at 80% threshold |
| 14 | Safety classifier prompt-injection nonce check is parse-time only | `src/lib/agents/safety-classifier.ts:59-135` | Move nonce validation before JSON decode |
| 15 | Resend not wired for intro accept emails | `src/lib/drop/notification.ts` | Implement when `/api/intros` accept route lands |

## P2 — before scaling beyond closed-beta

| # | Risk | Where | Fix |
|---|---|---|---|
| 16 | `agent_logs` grows unbounded; sensitive prompts retained | DB | 30-day TTL or partitioning by `invoked_at` |
| 17 | `verifications`, `intent_interviews` lack hot-path indexes | DB | Add `(user_id, created_at desc)`, `(artifact_expires_at)` |
| 18 | `reports.status` is text, not enum | DB | Convert or add CHECK |
| 19 | Verification screenshots stored as data URLs in localStorage | `verification/page.tsx:136-144` | Encrypt before public launch |
| 20 | Public liveness does not cover dependency readiness | `health/route.ts` | Add a separately authenticated operator readiness check before external launch |
| 21 | EluIdentify fires unconditionally; no opt-out UI | `src/components/EluIdentify.tsx` | Add user consent toggle in Settings (Phase 2) |
| 22 | PocketBase scaffolding present, dormant; decide drop or wire | `src/lib/pocketbase/`, `pocketbase/` | Decision PR + cleanup |
| 23 | `pass/[id]` has no error boundary if API fails | `pass/[id]/page.tsx` | Add error.tsx + skeleton |
| 24 | `/admin/health` polling has no retry/backoff | `admin/health/page.tsx` | Exponential backoff on failure |
| 25 | Match ownership check isn't enforced as DB constraint, only RLS | `intros/route.ts` | Already RLS-enforced on insert; document |
| 26 | Matchmaker diversity rule relies on prompt; not enforced at parse | `src/lib/agents/matchmaker.ts:48` | Add hard check in `parse()` that rejects <2 distinct types |
| 27 | Vercel `/tmp` is ephemeral; agent JSONL logs lost on cold start | `src/lib/agents/log.ts:14` | See P0 #5 (move to Supabase) |

## P3 — quality of life

| # | Risk | Where | Fix |
|---|---|---|---|
| 28 | No `database.types.ts` autogen | `package.json db:generate` | Use Supabase CLI |
| 29 | `FounderCard.going_to_sf` exists in TS but not schema | `src/lib/types.ts` vs migration | Reconcile (add column or move to `intents`) |
| 30 | `taste_profiles` table exists but unused | DB | Drop now or wait for Phase 3 |
| 31 | `matches.reasoning_trace` JSONB bloats hot row | DB | Move to debug table |
| 32 | `drops.cycle_week` is `date`; timezone semantics unclear | DB | Document or rename `cycle_week_start_pt` |
| 33 | `users.verification_artifact_id` has no FK constraint | DB | Add FK with on delete set null |
| 34 | No request-id / trace-id in error envelope | all routes | Add `x-request-id` header + `request_id` in error |
| 35 | Cohort globe runs continuous RAF (CPU-heavy on low-end devices) | `CohortGlobe.tsx` | IntersectionObserver pause when off-screen |
| 36 | Dead components from cut landing experiments | `RotatingWord`, `TypeAsImage`, `SmokeBackground`, `TypewriterText` | Delete or document why kept |
| 37 | `BrowseQuerySchema.tags` accepts arbitrary kebab-case (no enum) | `src/lib/api/schema.ts` | Validate against `COHORT_TAGS` |
| 38 | No Sentry / runtime error tracking | — | Add Sentry SDK |
| 39 | Eval coverage for Safety Classifier is 3 inline cases | `evals/run-all.ts:76-128` | Add `evals/cases/safety-classifier.json` with 10+ cases |
| 40 | Local stubs are unrealistically naive (always-allow safety, always-same matches) | `synthesize-local.ts`, `local-drop.ts` | Add randomness for variance testing |

## Dead code candidates

- `src/components/RotatingWord.tsx`, `TypeAsImage.tsx`, `SmokeBackground.tsx`, `TypewriterText.tsx` — cut from landing.
- `pocketbase/` directory + `src/lib/pocketbase/client.ts` — dormant.
- `src/lib/match/local-drop.ts` `RotatingWord` references — N/A (separate file).
- `tsconfig.tsbuildinfo` — should be gitignored (it's tracked).

Verify before deleting: run `bun run typecheck` and `bun run build` after.

## Refactor opportunities

| Opportunity | Benefit | Effort |
|---|---|---|
| Centralize stub-mode detection in one helper | DRY across session, rate-limit, admin | 1h |
| Extract retry/backoff into shared utility | Reused by `runner.ts`; could be reused by other external calls | 1h |
| Consolidate localStorage keys behind a typed accessor | Easier to migrate to PocketBase / Supabase | 2h |
| Pull JSON prefill / cache_control wiring into a shared `callClaude()` | One Anthropic surface, easier to swap models | 2h |
| Split `runner.ts` into `runner.ts` + `cost.ts` + `log.ts` | Single responsibility | 1h |
| Generate API client from Zod schemas (e.g., `zodios`) | Eliminate fetch-shape drift | 4h |

## Architecture risks

- **Two database options (Supabase + PocketBase) coexisting.** Decide one and prune the other before launch.
- **Stub mode is feature-rich.** Ten code paths branch on stubAllowed/forceStubs/etc. The right move: keep the flags, write a single test that asserts each combination. Today only some are end-to-end-tested.
- **Closed-beta uses localStorage for forum, inbox, mod queue, OTP.** The migration path to a real backend is non-trivial; plan it now.
- **No HTTP-level observability.** No Sentry, no Datadog, no OpenTelemetry. The autonomous stack writes JSONL to disk; not consumable from outside the host.
- **Cron is one job.** Add a "weekly drop generation" cron when Phase 2 lands.

## Performance risks

- **Cold-start of Anthropic** + 30s Sonnet timeout means a Drop generation could take 15-30s end-to-end. Frontend needs proper skeletons.
- **IVFFLAT lists=100 with ~2,000 rows is aggressive.** REINDEX after seed.
- **No concurrency limit on agent calls.** A traffic spike could fan out to many Anthropic requests simultaneously. Add a worker queue if drop scheduling becomes synchronous.
- **CohortGlobe RAF.** Pause when offscreen.

## Security risks (separate doc — see `07_AUTH_AND_SECURITY.md`)

The top-10 security ranking is mirrored in this list under P0/P1/P2.

## What to do first (suggested order)

1. **P0 #1** — wire Supabase magic-link auth.
2. **P0 #6** — write `scripts/seed-cohort.ts` so we can populate users.
3. **P0 #2, #3, #5** — wire DB reads/writes for `/api/drops`, `/api/intros`, `agent_logs`.
4. **P0 #4** — implement cron retention.
5. **P1 #13, #14, #16** — cost controls + nonce hardening + log retention.
6. **P1 #15** — Resend integration.
7. **P2 batch** — DB indexes, type drift, PocketBase decision.
8. **P3 batch** — observability, dead code cleanup, eval coverage.
