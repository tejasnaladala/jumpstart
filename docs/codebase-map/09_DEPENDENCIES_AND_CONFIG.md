# Dependencies and config

## Runtime dependencies (`package.json`)

| Package | Version | Why |
|---|---|---|
| `next` | 15.1.5 | App router, RSC |
| `react`, `react-dom` | 19.0.0 | Latest React |
| `typescript` | 5.7.3 | Strict TS |
| `@anthropic-ai/sdk` | 0.40.1 | Agent calls |
| `@supabase/ssr`, `@supabase/supabase-js` | 0.10.2 / 2.105.3 | Auth + DB |
| `@upstash/ratelimit`, `@upstash/redis` | 2.0.8 / 1.38.0 | Rate limiting |
| `zod` | 3.24.1 | Validation |
| `framer-motion` | 11.18.0 | Animations |
| `tailwindcss` | 3.4.17 | Styling |
| `tailwind-merge`, `clsx`, `class-variance-authority` | 2.6.0 / 2.1.1 / 0.7.1 | Tailwind ergonomics |
| `@radix-ui/react-dialog`, `dropdown-menu`, `label`, `progress`, `slot`, `toast` | 1.1.5–2.1.5 | Accessible primitives |
| `lucide-react` | 0.469.0 | Icons |
| `d3-geo`, `topojson-client` | 3.1.1 / 3.1.0 | CohortGlobe |

## Dev dependencies

| Package | Version | Why |
|---|---|---|
| `@playwright/test` | 1.50.0 | E2E |
| `@types/*` | matching majors | Type defs |
| `tsx` | 4.19.2 | TS execution for scripts |
| `autoprefixer`, `postcss` | 10.4.20 / 8.5.1 | CSS pipeline |

## Bun lockfile

`bun.lock` (76 KB) is committed. Bun is the package manager; `bun install` reproduces.

## Scripts

| Command | Action |
|---|---|
| `bun run dev` | `next dev -p 3030` |
| `bun run build` | `next build` |
| `bun run start` | `next start -p 3030` |
| `bun run lint` | `next lint` |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run eval` | `tsx evals/run-all.ts` |
| `bun run eval:explainer` / `:safety` / `:onboarding` | individual eval suites |
| `bun run test:e2e` | Playwright |
| `bun run harness` / `:once` / `:loop` / `:persona` | persona harness |
| `bun run harness:assert` / `:metrics` | invariant + metrics |
| `bun run coord` / `:once` / `:loop` | autonomous coordinator |
| `bun run research` / `:once` / `:loop` | autoresearch |
| `bun run assert:loop` | assertion loop |
| `bun run db:generate` | `tsx scripts/generate-types.ts` (**file missing**) |
| `bun run db:seed` | `tsx scripts/seed-cohort.ts` (**file missing**) |
| `bun run db:migrate` | `supabase db push` |
| `bun run db:migrate:dry` | `supabase db push --dry-run` |

## Environment variables

From `.env.example`. Treat all as required in prod unless noted.

### Anthropic

- `ANTHROPIC_API_KEY` — required unless `JUMPSTART_FORCE_STUBS=1`.

### Supabase

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)

### Resend

- `RESEND_API_KEY` (TODO when notification wires)

### PostHog

- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST` (default `https://us.posthog.com`)

### Upstash

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### Cron

- `CRON_SECRET`

### Mode flags (load-bearing — see `.env.example` flag matrix)

- `JUMPSTART_FORCE_STUBS` — force stubs even with real keys
- `JUMPSTART_ALLOW_STUB` — allow deterministic dev session
- `JUMPSTART_PRIVATE_BETA` — allow in-memory rate limit + dev-admin pair + stub-friendly health
- `JUMPSTART_DEV_ADMIN` — admin bypass (paired with `PRIVATE_BETA` in prod)
- `JUMPSTART_ADMIN_EMAILS` — CSV allowlist
- `JUMPSTART_DISABLE_ANTHROPIC` — kill switch for spend incidents

### Mode matrix (from `.env.example`)

| Mode | FORCE_STUBS | ALLOW_STUB | PRIVATE_BETA | DEV_ADMIN | DISABLE_ANTHROPIC |
|---|---|---|---|---|---|
| Local dev (full stubs) | — | 1 | — | — | — |
| Local dev (real Anthropic) | — | 1 | — | — | — |
| Tunneled private beta | — | 1 | 1 | 1 | — |
| Production (real) | — | — | — | — | — |
| Anthropic spend incident | prod-set | — | — | — | 1 |

## Build commands

```
bun install
bun run typecheck      # tsc --noEmit
bun run lint           # next lint + custom voice rules
bun run build          # next build (also runs in CI)
```

## Dev commands

```
bun run dev            # http://localhost:3030
bun run test:e2e       # Playwright
bun run eval           # all eval suites; STRICT=1 for non-zero exit on fail
bun run harness:persona p_priya_fintech   # one synthetic founder end-to-end
bun run coord:once     # one round of autonomous coordinator
```

## Autonomous stack commands

```
bash scripts/launch-autonomous.sh   # 8-process bring-up
bash scripts/monitor.sh             # live dashboard
bash scripts/verify-stack.sh        # one-shot health (exit 0/2/1)
bash scripts/stop-autonomous.sh     # clean shutdown
```

PowerShell variants exist for Windows: `watchdog.ps1`, `checkpointer.ps1`, `caffeinate.ps1`.

## Deployment assumptions

- **Platform:** Vercel.
- **Region:** `iad1` (Vercel `vercel.json:7`).
- **Build:** `bun install` + `bun run build`.
- **Cron:** one entry — `/api/cron/retention` daily at 3am UTC.
- **Functions:** all routes default. No edge-runtime declarations.
- **Headers:** strict CSP + HSTS + X-Frame-Options DENY etc. (see `vercel.json:14-29`).

Production launch requires:

1. All envs set per `.env.example`.
2. Supabase project created + migrations applied (`bun run db:migrate`).
3. Seed cohort imported (script TODO).
4. Upstash configured.
5. Vercel env audit: no `JUMPSTART_*` flags except `JUMPSTART_ADMIN_EMAILS`.

## Missing config / drift

| # | Missing | Reference | Fix |
|---|---|---|---|
| 1 | `scripts/seed-cohort.ts` | `package.json db:seed` | Create the script |
| 2 | `scripts/generate-types.ts` | `package.json db:generate` | Use Supabase CLI `gen types` |
| 3 | Sentry DSN | spec calls for it | Add when wiring runtime monitoring |
| 4 | Resend onboarding sender | TODO | Add to `.env.example` when wired |
| 5 | PocketBase URL (optional) | `src/lib/pocketbase/client.ts` | Add `NEXT_PUBLIC_POCKETBASE_URL` to example or remove |
| 6 | ELU Analytics config | `src/components/EluIdentify.tsx` | Confirm whether keeping; add env if so |

## CI environment

- GitHub Actions, `oven-sh/setup-bun@v2`.
- Single secret used: `ANTHROPIC_API_KEY`.
- Eval job runs `STRICT=1` to fail on regression.
- E2E job runs Chromium-only.

## Optional integrations referenced but not yet wired

- Sentry (in the planned tech stack)
- Vercel AI SDK for streaming UI (planned; not in current deps)
- Clerk (alternative auth, not chosen)

## Voice / lint configuration

- `.eslintrc.json` (45 bytes) — minimal Next.js extends.
- `loop.sh` runs custom voice-rule checks (em dashes, console.log, marketing language). CI lint job calls `bun run lint` which runs `next lint`; the voice rules layer is separate.
- The voice rules in `CONTRIBUTING.md` are the authoritative source for copy.

## Tooling for the autonomous stack

- `tsx` — runs TS directly for harness/eval/coord scripts.
- `git` — used by `checkpointer.ps1` for safe-zone auto-commits.

## Versions of note

- Bun (lock present, version not pinned in package.json beyond engines)
- Node — UNKNOWN: no `engines` block in package.json. Vercel uses Node 20 by default.
- TypeScript 5.7 strict mode (`tsconfig.json`).

## What to set up for a new developer

```bash
# 1. clone + install
git clone https://github.com/tejasnaladala/jumpstart.git
cd jumpstart
bun install

# 2. minimal env
cp .env.example .env.local
# leave keys empty; set:
echo "JUMPSTART_ALLOW_STUB=1" >> .env.local

# 3. boot
bun run dev
# http://localhost:3030

# 4. exercise
bun run typecheck
bun run lint
bun run test:e2e
bun run eval
```

Optional (real Anthropic):

```bash
# add to .env.local
ANTHROPIC_API_KEY=<your-anthropic-api-key>
# remove JUMPSTART_FORCE_STUBS if set
```
