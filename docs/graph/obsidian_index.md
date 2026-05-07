# Jumpstart codebase graph index

#architecture #frontend #backend #api #database #auth #security #risk #handoff

## Start here

- [[00_README]]
- [[01_SYSTEM_OVERVIEW]]
- [[02_REPO_STRUCTURE]]
- [[03_FRONTEND_MAP]]
- [[04_BACKEND_MAP]]
- [[05_API_CONTRACTS]]
- [[06_DATABASE_MAP]]
- [[07_AUTH_AND_SECURITY]]
- [[08_DATA_FLOWS]]
- [[09_DEPENDENCIES_AND_CONFIG]]
- [[10_RISKS_AND_TECH_DEBT]]
- [[11_COLLABORATION_GUIDE]]
- [[12_ONBOARDING]]

## Role handoffs

- [[FRONTEND_COLLABORATOR_HANDOFF]] #frontend #handoff
- [[BACKEND_OWNER_BRIEF]] #backend #handoff

## Graph files

- `codebase_nodes.json` #architecture
- `codebase_edges.json` #architecture
- [[codebase_graph]] #architecture #risk

## Major clusters

### Frontend #frontend

- Landing and signup: `src/app/page.tsx`, `src/app/signup/page.tsx`
- Onboarding: `src/app/onboarding/**`
- Authenticated app: `src/app/(app)/**`
- Components: `src/components/**`
- Styling: `src/app/globals.css`, `tailwind.config.ts`

### Backend #backend

- APIs: `src/app/api/**`
- Auth: `src/lib/auth/**`, `src/middleware.ts`
- Schemas: `src/lib/api/schema.ts`
- Agents: `src/lib/agents/**`
- Rate limits: `src/lib/auth/rate-limit.ts`
- Deployment: `vercel.json`, `.github/workflows/**`

### Database #database

- Supabase migrations: `supabase/migrations/**`
- PocketBase beta schema: `pocketbase/schema.json`
- LocalStorage stores: `src/lib/forum/posts.ts`, `src/lib/inbox/threads.ts`, `src/lib/drop/**`, `src/lib/moderation/queue.ts`, `src/lib/verification/otp.ts`

### Security #auth #security

- Session: `src/lib/auth/session.ts`
- Admin: `src/lib/auth/admin.ts`
- Middleware: `src/middleware.ts`
- Cron auth: `src/app/api/cron/retention/route.ts`
- CSP/headers: `vercel.json`

## Important risk links

- [[10_RISKS_AND_TECH_DEBT]] #risk
- [[07_AUTH_AND_SECURITY]] #security
- [[06_DATABASE_MAP]] #database
- [[05_API_CONTRACTS]] #api
