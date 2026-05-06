# todo: infra

## Pre-launch blockers (week 1)
- [ ] **Add Next.js middleware.ts that validates the Supabase session on every /api/* call** (security review CRITICAL #1)
- [ ] **Add CSP and HSTS to vercel.json security headers** (security review HIGH #5)
- [ ] **Add rate limiting on /api/intros (10/hr) and /api/drops (5/day) via Upstash Ratelimit** (security review HIGH #6)
- [ ] Provision Supabase production project and inject keys into Vercel env
- [ ] Provision Anthropic key and inject into Vercel env
- [ ] Provision Resend key, configure domain DNS for sender authentication
- [ ] Wire Sentry: server and edge runtime
- [ ] Wire PostHog: page views, drop opens, intro requests
- [ ] Set up custom domain and SSL
- [ ] Add /api/health endpoint and synthetic monitor

## Hardening (week 1-2)
- [ ] Add a /api/admin guard that checks an allowlist of operator emails
- [ ] Add a deploy preview environment for every PR (Vercel default but verify)
- [ ] Add a database migrations job (CI runs supabase db diff against the production schema)
- [ ] Cost dashboard: pull daily numbers from Anthropic, Resend, Supabase, Vercel APIs and write to a simple HTML page

## On-call (continuous)
- [ ] Define paging rules: Sentry critical → Slack, error rate > 1% → page founder
- [ ] Weekly retro: read /retro skill output, file the top action item per week
- [ ] Quarterly disaster recovery drill: restore from Supabase snapshot to a fresh project
