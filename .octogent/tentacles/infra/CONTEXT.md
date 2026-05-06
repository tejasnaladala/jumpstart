# Tentacle: infra

## Scope
Deploy pipeline, secrets, environment variables, monitoring, CI/CD, hosting, DNS, observability, on-call.

## Files owned
- vercel.json
- .github/workflows/**
- .env.example
- middleware.ts (to be created)
- monitoring/** (to be created: Sentry config, log shipping)

## What good looks like
- Deploy is one command (vercel deploy --prod) and takes under 90 seconds.
- Every secret is in Vercel env vars, never committed.
- Sentry catches every runtime error with breadcrumbs.
- Synthetic uptime check pings /api/health every 60 seconds.
- Cost dashboard exists for Anthropic, Resend, Supabase.
- Rollback is one command (vercel rollback) and takes under 30 seconds.

## Boundaries
- This tentacle owns the path from commit to live production.
- This tentacle does not own application logic.
- This tentacle does not own moderation queue UI; trust-safety owns that.

## Done state for v1
- vercel.json with security headers and Bun build command.
- CI workflow with typecheck + build + evals + e2e on PR.
- Weekly autoresearch cron workflow.

## Open todos
See todo.md.
