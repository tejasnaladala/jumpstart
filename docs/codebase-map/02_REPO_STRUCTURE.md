# Repo structure

## Top level

```
.
├── .claude/                    Claude Code settings, hooks, agents
├── .env.example                Required envs + flag matrix
├── .eslintrc.json              ESLint
├── .git/
├── .github/                    CI workflows (ci.yml, autoresearch.yml)
├── .gitignore
├── .octogent/                  Multi-agent department/tentacle config (dormant)
├── .vision-kb/                 Vision knowledge base (research artifacts)
├── CLAUDE.md                   Project context for Claude (load-bearing event facts)
├── CONTRIBUTING.md             How to contribute
├── README.md                   Quickstart + autonomous stack pointers
├── autoresearch.ideas.md       Backlog of measurable optimization targets
├── bun.lock                    Bun lockfile (76 KB)
├── docs/                       Operating manuals + this codebase-map + the design spec
├── evals/                      Eval cases + runner (8 suites)
├── harness/                    Persona harness + coordinator + delegation
├── next-env.d.ts
├── next.config.js              Next.js config (minimal)
├── package.json                Scripts, deps, devDeps
├── playwright.config.ts        E2E config
├── pocketbase/                 Sidecar BaaS scaffolding (dormant)
├── postcss.config.js
├── public/                     Static assets (world-110m.json, fonts, images)
├── scripts/                    Launch / monitor / watchdog / checkpointer / migrations
├── src/                        Application code (see below)
├── supabase/migrations/        SQL schema + RLS
├── tailwind.config.ts          Editorial design tokens
├── tests/e2e/                  Playwright happy-path
├── tsconfig.json
├── tsconfig.tsbuildinfo
└── vercel.json                 Build, regions, cron, security headers, CSP
```

## src/ tree

```
src/
├── app/
│   ├── (app)/                  Authenticated app shell (route group)
│   │   ├── layout.tsx          Auth gate, BottomNav, RouteTransition, EluIdentify
│   │   ├── browse/
│   │   │   ├── page.tsx        Forum-style posts (Show, Ask, Feedback, Hiring)
│   │   │   └── [id]/page.tsx   Post detail + thread view
│   │   ├── drop/
│   │   │   ├── page.tsx        Curated match delivery + countdown
│   │   │   └── loading.tsx     Skeleton fallback
│   │   ├── inbox/
│   │   │   ├── page.tsx        Tabbed inbox (requests, active, sent)
│   │   │   └── [id]/page.tsx   Thread conversation
│   │   ├── match/
│   │   │   └── [id]/page.tsx   Match detail, intro request modal
│   │   └── you/
│   │       └── page.tsx        Founder Pass + edit + sign out
│   ├── admin/                  Admin pages (gated by allowlist)
│   │   ├── page.tsx            Hub
│   │   ├── cohort/             Cohort analytics
│   │   ├── curate/             Manual match curation
│   │   ├── health/             Live dependency probe
│   │   ├── logs/               Agent logs
│   │   └── moderation/         Moderation queue
│   ├── api/                    Route handlers (the backend)
│   │   ├── browse/route.ts
│   │   ├── cron/retention/route.ts
│   │   ├── drops/route.ts
│   │   ├── health/route.ts
│   │   ├── intros/route.ts
│   │   └── onboarding/interview/route.ts
│   ├── onboarding/             4-step wizard
│   │   ├── layout.tsx
│   │   ├── card/page.tsx       Step 4: founder card editor
│   │   ├── identity/page.tsx   Step 1: name, location, oneLine
│   │   ├── intent/page.tsx     Step 3: tags + intent multi-select
│   │   └── verification/page.tsx Step 2: phone + ticket photo
│   ├── pass/[id]/page.tsx      Public read-only Founder Pass
│   ├── signup/page.tsx         Email + LinkedIn entry (mock)
│   ├── globals.css             Editorial base styles + dot pattern
│   ├── layout.tsx              Root layout (fonts, providers)
│   └── page.tsx                Landing
│
├── components/
│   ├── primitive/              Base UI (Button, Input, Avatar, Pill, Sheet, Toast, Kbd, StampSeal, DraftIndicator, AccordionLine)
│   ├── AnimatedCounter.tsx
│   ├── BlurReveal.tsx
│   ├── BottomNav.tsx
│   ├── CohortGlobe.tsx         d3-geo + Canvas globe
│   ├── DropCountdown.tsx
│   ├── EluIdentify.tsx         Analytics identify-on-mount
│   ├── FilterPanel.tsx
│   ├── FounderCard.tsx
│   ├── FounderPass.tsx         720×480 SVG ticket
│   ├── GlobeLazy.tsx           Dynamic import wrapper for CohortGlobe
│   ├── Logo.tsx
│   ├── MagneticButton.tsx      Mouse-tracking pull effect
│   ├── Marquee.tsx
│   ├── MatchCard.tsx
│   ├── ProgressBar.tsx         StepDots
│   ├── Reveal.tsx              IntersectionObserver fade-up
│   ├── RotatingWord.tsx        (cut from landing)
│   ├── RouteTransition.tsx     AnimatePresence wrapper
│   ├── SmokeBackground.tsx     (cut)
│   ├── TopBar.tsx
│   ├── TypeAsImage.tsx         (cut)
│   ├── TypewriterText.tsx
│   └── motion.tsx              fadeUpItem, staggerList, SPRING_SOFT, SPRING_TIGHT, EASE
│
├── lib/
│   ├── agents/                 8 Claude agent definitions + runner + log
│   ├── api/
│   │   └── schema.ts           Zod schemas for every route boundary
│   ├── auth/
│   │   ├── admin.ts            Admin allowlist + dev bypass
│   │   ├── rate-limit.ts       Upstash + in-memory fallback
│   │   └── session.ts          getSession, requireSession, isStubMode
│   ├── drop/
│   │   ├── delivery.ts         Manual match curation (closed-beta only)
│   │   ├── eligibility.ts      Drop readiness checks
│   │   ├── notification.ts     (Deferred until Resend wired)
│   │   └── schedule.ts         Drop timing
│   ├── forum/
│   │   └── posts.ts            Mock forum posts (localStorage)
│   ├── hooks/
│   │   └── useDraftState.ts    Onboarding form draft persistence
│   ├── inbox/
│   │   ├── sound.ts
│   │   └── threads.ts          Inbox thread logic
│   ├── match/
│   │   └── local-drop.ts       Deterministic match generator (the stub)
│   ├── mock/
│   │   ├── cohort.ts           MOCK_COHORT (~50 founders, plus 12 personas)
│   │   └── me.ts               DEFAULT_ME for stub auth
│   ├── moderation/
│   │   └── queue.ts            localStorage-backed mod queue
│   ├── pocketbase/
│   │   └── client.ts           Dormant fetch wrapper
│   ├── safety/                 Safety classifier glue
│   ├── verification/
│   │   └── otp.ts              Stub OTP send/verify
│   └── types.ts                FounderCard, Match, Drop, IntroRequest, AgentInvocation
│
└── middleware.ts               Auth fast-fail at /api/*
```

## evals/ tree

```
evals/
├── cases/                      One JSON per agent
│   ├── cohort-analyst.json
│   ├── feedback-learner.json
│   ├── match-explainer.json
│   ├── matchmaker.json
│   ├── onboarding-interviewer.json
│   ├── opener-drafter.json
│   └── profile-synthesizer.json
└── run-all.ts                  Runner; emits METRIC lines
```

## harness/ tree

```
harness/
├── README.md
├── runner.ts                   CLI entry (once / loop / persona)
├── lib/
│   ├── activity.ts             Activity log writer
│   ├── applier.ts              Atomic file edits + rollback
│   ├── assertions.ts           Continuous invariant checks
│   ├── coordinator.ts          Persona state machine
│   ├── findings.ts             Extract observations from logs
│   ├── metrics.ts              Aggregator + METRIC emitter
│   ├── proposals.ts            Findings → edits, scope guard
│   ├── realism.ts              Behavioral simulation
│   ├── reviewers.ts            Codex + Fool review
│   ├── session.ts              Playwright session wrapper
│   └── state.ts                Per-persona JSON state
├── personas/
│   └── seed.ts                 12 archetype personas
└── scripts/
    ├── assertion-loop.ts
    ├── autoresearch.ts
    ├── coordinator.ts
    ├── delegation-loop.ts
    └── run-assertions.ts
```

## scripts/ inventory

| Script | Purpose |
|---|---|
| `launch-autonomous.sh` | Bring up the 8-process stack |
| `stop-autonomous.sh` | Clean shutdown (kills watchdog first) |
| `verify-stack.sh` | One-shot health, exits 0/2/1 |
| `monitor.sh` | Live terminal dashboard, 3s refresh |
| `watchdog.ps1` | 30s liveness probes, restarts dead procs |
| `checkpointer.ps1` | 5min auto-commit of safe-zone changes |
| `caffeinate.ps1` | Holds Windows awake, lid-close-safe |
| `harness-loop.sh` | Runs the persona harness in a loop |
| `loop.sh` | Custom voice-rules linter loop |
| `reset-memory.sh` | Wipes harness state |
| `start-pocketbase.sh` | Optional dev sidecar |

## supabase/migrations/

```
0001_init.sql                   11 tables + indexes + initial RLS
0002_complete_rls.sql           Adds 24 RLS policies + helper function
```

## .github/workflows/

```
ci.yml                          build → typecheck → lint → eval (strict) → e2e (PR only)
autoresearch.yml                Weekly Monday eval run
```

## .octogent/tentacles/

```
agents/                         Agent definitions + evals
data/                           Schema + seed + migrations
frontend-ux/                    Drop / Browse / You rendering
growth/                         Cohort metrics + funnel
infra/                          Harness + CI + observability
research/                       Eval suite design + trend analysis
trust-safety/                   Safety classifier + intro blocking
README.md                       Tentacle system overview
```

Status: scaffolded but inactive. The in-process coordinator handles tentacle work today.

## docs/ (existing operating manuals + this map)

```
autonomous-stack.md             8-process operating manual
design-brief.md
design-prompts.md
external-tools.md               gstack + autoresearch setup
imessage-ditto-debate.md        Decision doc
launch-playbook.md              Pre-launch checklist
monitoring-quickstart.md        Single page to keep open
pocketbase-setup.md
prelaunch-review-synthesis.md   12-agent prelaunch review output
superpowers/specs/2026-05-05-jumpstart-design.md   THE DESIGN SPEC
codebase-map/                   This folder
graph/                          Knowledge graph artifacts (see ../graph/)
codebase_registry.json          Canonical machine-readable registry
FRONTEND_COLLABORATOR_HANDOFF.md
BACKEND_OWNER_BRIEF.md
```

## Important files (top 20 by load-bearingness)

1. `docs/superpowers/specs/2026-05-05-jumpstart-design.md` — design spec, source of truth
2. `CLAUDE.md` — corrected event facts that override the spec
3. `package.json` — scripts (every workflow has a bun command)
4. `.env.example` — flag matrix
5. `src/lib/agents/runner.ts` — every agent call goes through this
6. `src/lib/auth/session.ts` — auth + stub mode
7. `src/lib/auth/rate-limit.ts` — limit definitions + prod gate
8. `src/middleware.ts` — auth fast-fail
9. `src/lib/api/schema.ts` — every API contract
10. `src/lib/types.ts` — shared types
11. `src/lib/match/local-drop.ts` — deterministic match scoring
12. `supabase/migrations/0001_init.sql` — schema
13. `supabase/migrations/0002_complete_rls.sql` — RLS
14. `src/app/api/intros/route.ts` — most complex route (auth + rate + safety + ownership)
15. `src/app/api/drops/route.ts` — drop endpoint with stubbed DB read
16. `src/app/api/cron/retention/route.ts` — cron + bearer + 503-honest
17. `vercel.json` — deploy + cron + CSP
18. `harness/scripts/coordinator.ts` — autonomous editor with safe-zone gate
19. `harness/personas/seed.ts` — the 12 personas that drive the live app
20. `evals/run-all.ts` — eval orchestrator

## Dead or unclear files

- `pocketbase/` — entire directory is dormant. Not currently used; kept for closed-beta fallback decision.
- `src/components/RotatingWord.tsx`, `TypeAsImage.tsx`, `SmokeBackground.tsx`, `TypewriterText.tsx` — built but cut from landing. Removable.
- `scripts/seed-cohort.ts` — referenced by `bun run db:seed` in `package.json`, but the file does not exist. Either stub it or remove the script entry.
- `scripts/generate-types.ts` — referenced by `bun run db:generate`, also missing. Same call.
- `src/components/EluIdentify.tsx` — added in `1e62991`. Confirm with founder whether ELU is keeping or this is a try-out.
