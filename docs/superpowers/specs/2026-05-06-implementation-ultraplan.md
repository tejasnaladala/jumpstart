# Implementation ultraplan

Date: 2026-05-06
Status: PROPOSED, awaiting your approval before execution
Branch: implementation/v1
Source spec: docs/superpowers/specs/2026-05-05-jumpstart-design.md

This is the comprehensive plan to take the Jumpstart codebase from "running on localhost with stub agents" to "live in production at SS-2026 cohort scale, with continuous research loops on agent quality and abuse defense."

It is the product of four planning lenses: ultraplan (multi-perspective analysis), octo-plan (department tentacles), autoplan (CEO + eng + design + DX review), and autoresearch (continuous experiment loops). Each tentacle has its own CONTEXT.md and todo.md under `.octogent/tentacles/`.

## 1. Context recap

### What exists today

A working Next.js 15 app with all v1 routes built: landing, signup, four-step onboarding, drop home, match detail with intro request flow, browse with tag filter, you. Eight agent prompt definitions (Onboarding Interviewer, Profile Synthesizer, Matchmaker, Match Explainer, Opener Drafter, Feedback Learner, Safety Classifier, Cohort Analyst) with parse contracts and a runner that calls Claude or falls back to local heuristic stubs. Four API routes: onboarding interview, drops, intros, browse. Supabase migration with eleven tables, pgvector, and partial RLS. Eval runner with cases for two agents. CI workflow with typecheck, build, evals, and Playwright. Vercel config with security headers. Branch `implementation/v1` has 13 commits.

### What does not exist

No real authentication wiring. No Supabase client connected. No rate limiting. No retries or timeouts in the agent runner. No prompt injection hardening on the safety classifier. No screenshot-deletion job. No middleware. No eval cases for six of eight agents. No agent_logs writes. No actual e2e Playwright tests. No production secrets, no domain, no monitoring.

## 2. Multi-perspective analysis

Three independent reviewers ran in parallel on the codebase. Their findings, reduced to the highest-confidence items.

### Feasibility

The Next.js plus Supabase plus Anthropic stack is fine for 8000 users. The codebase is not yet ready for any real users. Each API route trusts request body fields like `requester_id` and `me`, which means once the database is wired the first malicious caller can write any user's row. The Matchmaker prompt assumes a "top 50 from nightly graph job" that does not exist and the embedding column has no producer. The runner has no caching, no batching, no retry, and no agent_logs persistence. At 8000 users on weekly drops with Sonnet pricing the cost projection in the spec is plausible only with prompt caching enabled, and right now it is not.

### Risk

Critical: zero auth on every API route plus a route that trusts the body's `requester_id` is an IDOR-shaped impersonation primitive. Combined with the `/api/browse` endpoint that returns the cohort to anyone, an unauth attacker can scrape user IDs and post intros on behalf of any founder before the system is even paywalled. The Safety Classifier itself is prompt-injection vulnerable: user content is concatenated inside a triple-quote fence with no nonce delimiter, which an attacker can break out of to force a `recommendation: allow` JSON. Six tables have RLS enabled but no policies, which means service-role writes go unchecked and client-role writes silently fail. The acceptance-screenshot 24-hour deletion is documented in the UI but has no implementation, which is a GDPR exposure. There is no rate limit, so a loop against `/api/drops` drains the Anthropic budget in minutes.

### Architecture

Missing: a repository layer (API routes import mock fixtures directly), Zod validation at every API boundary (`zod` is in deps but unused), an agent log writer (cost and latency are computed and dropped), prompt caching (system blocks are large and identical per agent and not cached), JSON-mode discipline on parse (one prose line throws). Over-built or drift-prone: the `via: "stub" | "claude" | "error"` field leaks dev-mode shape into production responses; the local stub at runner level returns a fundamentally different code path than the real agent (`/api/drops` does not even go through the runner, it calls a separate `generateLocalDrop`). Stub-mode is not gated to `NODE_ENV !== 'production'`, so a missing key in prod silently downgrades to deterministic templates without an alert.

### Net assessment

The vision is solid and the spec is locked. The UI is shippable. The agent system architecture is right but the runner is too thin. The data layer schema is right but the policies and the wiring are not. The biggest single risk between today and shipping is the auth gap, which makes RLS decorative.

## 3. Tentacle decomposition (octo-plan)

Seven long-running departments. Each owns a slice of the system and a queue of work that does not stop. CONTEXT.md plus todo.md at `.octogent/tentacles/<name>/`.

| Tentacle | Owns | Top pre-launch blocker |
|---|---|---|
| frontend-ux | App pages, components, design system, copy quality | Real e2e test coverage, swap localStorage for server session |
| agents | Eight prompts, runner, eval suites, golden cases | Add eval cases for 6 agents, retry/timeout/caching in runner, persist agent_logs |
| data | Schema, migrations, embeddings, retention jobs | Provision real Supabase, add missing RLS policies, build embedding pipeline |
| infra | Deploy, secrets, monitoring, CI/CD, on-call | Auth middleware, rate limiting, CSP/HSTS, Sentry/PostHog wiring |
| trust-safety | Verification, abuse, intro safety, privacy | Prompt-injection harden, 24-hour deletion job, per-recipient cap, moderation queue |
| growth | Acquisition, viral loops, YC handoff | Hand-list 50 SS-2026 attendees, share-card renderer |
| research | Autoresearch sessions, eval runner, cohort dashboards | E1 to E6 experiment queue, shadow-mode framework |

## 4. Multi-role review (autoplan)

CEO, eng, design, and DX perspectives on the plan as a whole.

### CEO review

Scope check. The plan is heavy on shipping correctly and light on shipping at all. There is a real risk that the team (me) spends week one fixing security findings instead of getting one founder to actually use the product. Mitigation: ship to a 10-person closed beta with auth, rate limiting, and the safety hardening done, and accept that the polished-everything version is week three not week one. The YC outreach trigger remains 1000 verified users and 30 days, not the perfection of every experiment.

The plan is correctly skeptical about the cohort-after-90-days question (parking lot critique C002). I would also push to set a hard kill switch: if drops have not produced 50 marked-useful meetings by day 45, we publicly say it didn't work and write a postmortem. Optional success is a feature.

### Eng review

Architecture check. The seven-tentacle decomposition is right. The pre-launch blockers are correctly prioritized: auth before everything, then rate limiting, then prompt injection, then retention. The runner hardening is correctly framed as a single PR (retry, timeout, cache, log writer) rather than spread across files. The repository layer needs to land before any DB-backed feature branches go in or we will refactor twice.

Concern: the eval suite covers two agents. Without 50-case golden sets for at least Matchmaker and Match Explainer, the autoresearch loops cannot meaningfully tune. The eval-cases work is on the critical path for E1 and E2.

### Design review

UX check. The current dev experience is polished enough for the closed beta. Two gaps. The intent interview animation needs better latency masking when calls go to Claude (current implementation has a 700ms fake "thinking" delay). And the loading state on `/drop` is good but still feels brittle on first page load with a cold cache. The /design-review skill should run weekly against the live URL and file findings into the frontend-ux tentacle.

### DX review

Contributor onboarding. A new contributor today gets the README, runs `bun install` and `bun run dev`, and the app works without keys. That is a 10/10 onboarding for the prototype. After production wiring lands the onboarding becomes 10x harder: real Supabase keys, real Anthropic key, real Resend domain. Mitigation: add a `dev:offline` mode that explicitly uses local fallbacks and a `dev:online` mode that requires keys, and document the difference. CLAUDE.md already mentions stub-mode but the toggling is implicit; make it explicit.

## 5. Continuous research loops (autoresearch)

Six experiments queued. Each is a separate autoresearch session, started from `/autoresearch <goal>`, with an eval suite as the metric source. Defined in `.octogent/tentacles/research/todo.md`.

| ID | Target | Metric | Cadence | Cost cap |
|---|---|---|---|---|
| E1 | Match Explainer prompt tuning | eval pass rate vs golden set | weekly auto | $50/wk |
| E2 | Matchmaker scoring weights | simulated request rate vs replay corpus | monthly manual | $80/mo |
| E3 | Safety Classifier threshold sweep | precision/recall on labeled abuse set | monthly | $30/mo |
| E4 | Onboarding Interviewer length | completion rate × card quality | one-shot, A/B in prod | $0 |
| E5 | Drop format (1 vs 3 vs 5) | meeting useful rate per drop | one-shot, post week 4 | $0 |
| E6 | Cohort Analyst digest length | founder open + click rate | monthly | $5/mo |

The completed `vision-consolidation` session (11 runs, 85 to 94) is in `experiments/worklog.md` and the knowledge base is in `.vision-kb/`. That session is closed; the spec is locked.

## 6. Phased execution

Five phases, each with a checkpoint that must pass before the next starts. Total: roughly 4 weeks to first live user, 8 weeks to YC outreach trigger.

### Phase A: Wire to real services (week 1, days 1 to 3)

Goal. Replace mock layer with real Supabase + Anthropic + Resend.

Steps.
1. Provision Supabase production project. Run migration 0001. Verify all 11 tables.
2. Add `@supabase/ssr` and `@supabase/supabase-js`. Build `src/lib/db/` repository layer for users, founder_cards, drops, matches, intros, meetings, reports, verifications.
3. Add `middleware.ts` that validates the Supabase session on every `/api/*` route. Reject unauthenticated requests with 401.
4. Replace `loadMe()`/`saveMe()` with `getMe(req)` server-side and a `useMe()` client hook backed by `/api/me`.
5. Replace direct mock imports in API routes. The mock fixture survives only as a seed script.
6. Add Zod schemas at every API boundary.
7. Wire Anthropic key. Verify a real drop is produced end-to-end.
8. Wire Resend. Send the intro accept email from a test address.

Checkpoint A. Authenticated user can sign up, complete onboarding, see a Drop generated by real Claude, request an intro, recipient receives a real email on accept. Local stub fully gated to NODE_ENV development.

Risk: missing RLS policy causes silent fail on a write. Mitigation: write 5 negative-case RLS tests in CI.
Rollback: revert to commit before middleware.ts lands. Removing the middleware reopens the IDOR hole, so rollback only between A and B in dev environment.

### Phase B: Harden (week 1, days 4 to 7)

Goal. Close every CRITICAL and HIGH security finding.

Steps.
1. Add Upstash Ratelimit. Apply to `/api/intros` (10/hr/30/day) and `/api/drops` (5/day).
2. Add per-recipient cap of 8 incoming pending intros per week.
3. Harden Safety Classifier: per-request UUID nonce delimiter around user content, secondary check that the response does not echo the nonce, fast pattern check fallback for obvious cases.
4. Add INSERT/UPDATE/DELETE RLS policies for meetings, reports, taste_profiles, intent_interviews, verifications.
5. Block agent_logs from client read paths entirely. Service-role write only.
6. Add CSP and HSTS to vercel.json.
7. Implement 24-hour acceptance screenshot deletion via a Vercel Cron Function.
8. Make runner production-grade: jittered retry, 30s timeout, prompt caching on system blocks, JSON-mode discipline (prefill or tool use), single `logAgentRun()` writer to agent_logs.
9. Persist agent_logs row on every invocation.

Checkpoint B. Security review re-run shows zero CRITICAL findings, fewer than 3 HIGH. Stub-mode regressions impossible (production refuses to start without ANTHROPIC_API_KEY).

Risk: a hardening change breaks a working flow. Mitigation: every step lands as its own PR with the e2e test suite green.
Rollback: per-PR revert. The middleware change is the only one that cannot revert without reopening the IDOR hole.

### Phase C: Ship (week 2)

Goal. Public URL, working domain, 10 real users.

Steps.
1. Vercel project link. Production deploy.
2. Custom domain + SSL.
3. Sentry server + edge runtime.
4. PostHog page views and key events.
5. /api/health endpoint plus synthetic monitor.
6. Hand-deliver invites to 10 SS-2026 attendees from founder's network.
7. Watch every drop for the first 50 users. Approve manually.

Checkpoint C. 10 verified users have completed onboarding, received at least one drop, and at least 3 intros are accepted. Sentry has fewer than 5 errors.

Risk: a real user finds an edge case. Mitigation: the founder watches the moderation queue daily for the first two weeks.
Rollback: `vercel rollback` to the prior deploy.

### Phase D: Operate (week 3 to ongoing)

Goal. Hands-off operation with the agent loops doing the work.

Steps.
1. Cohort Analyst daily digest emailed to founder at 6am.
2. Weekly `/retro` skill produces a markdown retro of the past week.
3. Weekly autoresearch cron runs E1 (Match Explainer tuning).
4. Re-engagement Drafter agent (9th agent, post-launch) re-engages users who haven't opened a drop in 3 weeks.
5. Founder spends under 1 hour/day operating. The rest is shipping.

Checkpoint D. Founder hours per day under 1 hour by week 4. Drop personalization lift over baseline measurable in eval.

Risk: an agent regression goes undetected because evals only run weekly. Mitigation: shadow-mode framework so any prompt change deploys to 5% of traffic first.
Rollback: agent prompts are versioned; rollback is reverting the prompt file.

### Phase E: Grow (week 3 to YC outreach)

Goal. 1000 verified users, 30 days of metrics, send YC outreach email.

Steps.
1. Public landing live, founder LinkedIn post.
2. Referral codes activated.
3. Share-card renderer for "Find me on Jumpstart" badge.
4. Daily growth review against funnel metrics.
5. At 1000 verified plus 30 days, send the YC outreach email (template in spec section 27) with the handoff package.

Checkpoint E. 1000 verified, 65%+ meeting useful rate, 5+ written testimonials, YC outreach sent.

Risk: bad PR if a high-profile abuse case happens. Mitigation: trust-safety SLA tightened during launch (founder reviews 100% of flagged content for first 4 weeks).
Rollback: pause public landing, revert to closed beta.

## 7. Rollback strategies summary

| Phase | Rollback | Cost |
|---|---|---|
| A | `git revert` to before middleware. Test stays in dev. | Low |
| B | Per-PR revert. Hardening lands in 8 small PRs. | Low |
| C | `vercel rollback`. Atomic. | Negligible |
| D | Agent prompt file revert. | Low |
| E | Pause landing, revert to closed beta. | Reputational only |

## 8. Open questions for you

1. **Are you accepted to YC SS 2026?** Open question from spec section 30. Affects launch positioning.
2. **Vercel project access and domain.** I cannot provision these without you. Either grant me access or run the four-line commands yourself (linked in the README).
3. **Supabase project tier.** Free tier covers 8000 users for read but not for vector search at full cohort scale. Confirm Pro tier ($25/mo) when we provision.
4. **Anthropic spend cap.** Spec estimates $2400/wk at full scale. Confirm budget. I propose a hard cap of $500/wk for the first month with alerts.
5. **Closed beta size.** I assume 10. Could be 50 if your network is denser. Tell me a number.
6. **Pricing.** Spec says free during SS. Confirm. Decide post-SS pricing later.
7. **Domain.** `jumpstart.dev`? `jumpstart.fyi`? Something else? Tell me the one to register.
8. **Founder Card paused state.** Spec section 29 documents but does not spec. Should pause hide from Browse, Drops, both?

## 9. What I propose to do next

If you say go on this plan:

1. I start Phase A immediately. The first deliverable is an end-to-end signup-to-drop flow against a real Supabase project running in a deploy preview, with the auth middleware in place.
2. I work serially through phases A, B, C with no further approval gates. I check in at each checkpoint with a paragraph plus a localhost preview.
3. The autoresearch loop continues in the background on E1 (Match Explainer tuning) starting in Phase D.
4. The seven tentacles each get their own background queue. Most are mine to drive. Growth tentacle needs your help (network outreach is yours).

If you want changes:
- Push back on the phase order.
- Tell me to scope down (e.g., skip E1 to E6 until after launch).
- Tell me to scope up (e.g., add a payments tentacle for post-SS pricing).
- Tell me to slow down or speed up the closed beta.

Standing by.
