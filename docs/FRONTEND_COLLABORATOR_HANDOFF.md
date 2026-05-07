# Frontend Collaborator Handoff

This file is written for the frontend owner working in `tejasnaladala/jumpstart`.

## Product Read

Jumpstart appears to be a closed-beta founder matchmaking app. Users join, complete identity and verification steps, answer intent questions, create a founder pass, browse or match with other founders, request intros, and manage lightweight conversations.

The current UI is substantially demo/local-first. The product experience is fuller than the backend implementation: many flows use `localStorage` and demo data while backend APIs exist but are incomplete or not consumed.

## Frontend Structure

| Area | Files | Notes |
| --- | --- | --- |
| App shell | `src/app/layout.tsx`, `src/app/globals.css`, `src/components/MobileShell.tsx`, `src/components/NavDock.tsx` | Mobile-first app frame and global styling. |
| Landing/signup | `src/app/page.tsx`, `src/app/signup/page.tsx` | Closed-beta entry and demo user bootstrap. |
| Onboarding | `src/app/onboarding/identity/page.tsx`, `src/app/onboarding/verification/page.tsx`, `src/app/onboarding/intent/page.tsx`, `src/app/onboarding/card/page.tsx` | Client-local onboarding flow. |
| App routes | `src/app/(app)/drop/page.tsx`, `src/app/(app)/browse/page.tsx`, `src/app/(app)/match/page.tsx`, `src/app/(app)/inbox/page.tsx`, `src/app/(app)/you/page.tsx` | Auth-gated by `src/app/(app)/layout.tsx`, but page data is mostly local. |
| Public pass | `src/app/pass/[id]/page.tsx` | Public founder pass route. |
| Admin UI | `src/app/admin/applications/page.tsx`, `src/app/admin/moderation/page.tsx` | Admin concepts exist; backend authorization needs tightening before production use. |

## Pages And Routes

| Route | Owner | Data source today | Backend dependency |
| --- | --- | --- | --- |
| `/` | Frontend | Static/page state | None. |
| `/signup` | Frontend/shared | `localStorage` | Future Supabase signup/session flow. |
| `/onboarding/identity` | Frontend | `localStorage` | Future user profile persistence. |
| `/onboarding/verification` | Shared | Client-local OTP/proof | Needs backend verification API/storage before real data. |
| `/onboarding/intent` | Frontend/shared | Hardcoded local interview questions | Could consume `POST /api/onboarding/interview`. |
| `/onboarding/card` | Frontend/shared | `localStorage` | Future `founder_cards` write. |
| `/drop` | Frontend/shared | `localStorage`, `GET /api/health` | Could consume `POST /api/drops` after backend fix. |
| `/browse` | Frontend/shared | Demo/local feed | Could consume `GET /api/browse`. |
| `/match` | Frontend/shared | Demo/local match data, `POST /api/intros` | Intro API is stub-only or incomplete in production. |
| `/inbox` | Frontend | `localStorage` | No implemented backend thread/message API. |
| `/you` | Frontend | `localStorage` | Future user/card read. |
| `/pass/[id]` | Frontend/shared | Local/demo lookup | Future public `founder_cards` read. |

## Components

Important frontend components:

| Component | File | Notes |
| --- | --- | --- |
| `FounderPass` | `src/components/FounderPass.tsx` | Core founder card visual. Preserve field semantics when polishing. |
| `DropComposer` | `src/components/DropComposer.tsx` | Drop creation UI; backend write is not reliable yet. |
| `CandidateStack` | `src/components/CandidateStack.tsx` | Browse/match UI surface. |
| `InboxThread` | `src/components/InboxThread.tsx` | Conversation UI; no backend thread API found. |
| `MobileShell` | `src/components/MobileShell.tsx` | App shell layout. |
| `NavDock` | `src/components/NavDock.tsx` | App navigation. |
| `FilterPanel` | `src/components/FilterPanel.tsx` | Stale/dead code candidate; confirm before deleting. |

## Styling And Design System

The app uses Tailwind CSS via `tailwind.config.ts` and global styles in `src/app/globals.css`. UI direction is mobile-first and founder/social-product oriented. There is no formal component library or token package beyond Tailwind config and local components.

Preserve the existing app routes and business field names until backend contracts are stable. Visual polish can happen safely in components and page files, but avoid changing storage/API shapes without coordination.

## API Calls Used By Frontend

| Frontend file | API | Status |
| --- | --- | --- |
| `src/app/(app)/drop/page.tsx` | `GET /api/health` | Implemented. Used as a backend health signal. |
| `src/app/(app)/match/page.tsx` | `POST /api/intros` | Stub path can return success; production persistence is TODO. |
| Map/visual code if present | `/world-110m.json` | Static asset under `public/`. |

Backend APIs that exist but are not currently consumed:

| API | Handler | Note |
| --- | --- | --- |
| `GET /api/browse` | `src/app/api/browse/route.ts` | Supabase-backed candidate feed. |
| `POST /api/drops` | `src/app/api/drops/route.ts` | Blocked by TODO. |
| `POST /api/onboarding/interview` | `src/app/api/onboarding/interview/route.ts` | Anthropic-backed synthesis route. |

## Mock And Demo Data

| File | Purpose |
| --- | --- |
| `src/lib/demo-data.ts` | Demo founder/cards/feed data. |
| `src/lib/local-store.ts` | Local persistence helpers. |
| `src/lib/types.ts` | Shared UI/domain types used by local data and components. |

The frontend currently treats local storage as product state. Coordinate before replacing it because several journeys depend on those keys.

## What Not To Touch Casually

- Do not change `src/app/api/**` unless coordinating with the backend owner.
- Do not change `supabase/**`, `pocketbase/**`, or `src/lib/auth.ts` without backend agreement.
- Do not change request/response shapes for `/api/intros`, `/api/browse`, `/api/drops`, or `/api/onboarding/interview` without updating `docs/codebase-map/05_API_CONTRACTS.md`.
- Do not build production verification UX on the current client-local proof/OTP behavior.

## Backend Assumptions To Preserve

- Auth-gated app routes expect a Supabase-backed session through `src/app/(app)/layout.tsx`.
- Backend APIs use `requireSession()` for protected requests.
- Stub behavior is controlled by `NEXT_PUBLIC_USE_STUBS` in `src/lib/config.ts`.
- Core backend models are `users`, `founder_cards`, `drops`, `matches`, `intros`, `verifications`, `intent_interviews`, and `agent_logs`.

## Questions For Backend Owner

1. Is Supabase the canonical backend, or should PocketBase remain part of the plan?
2. What should the stable `FounderCard` field contract be: `location`, `city`, `region`, or all three?
3. Should onboarding intent use `POST /api/onboarding/interview`, or remain deterministic/client-authored for now?
4. What should happen after an intro request succeeds: inbox thread, email, notification, or moderation queue?
5. What verification proof storage and review workflow should the UI support?

## Recommended Frontend Cleanup Plan

| Order | Task | Coordination |
| --- | --- | --- |
| 1 | Fix onboarding field mismatch between identity and card creation. | Confirm with backend field contract. |
| 2 | Separate local demo state adapters from future API state adapters. | Shared. |
| 3 | Make loading/error/empty states consistent for browse, match, drop, and inbox. | Frontend. |
| 4 | Wire `/browse` and `/drop` to backend APIs only after backend marks them stable. | Shared. |
| 5 | Refresh Playwright e2e selectors after UI cleanup. | Shared. |

## Suggested Order Of Work

Start with visual/system cleanup that does not alter backend contracts: app shell, navigation, card polish, form ergonomics, empty states, and responsive behavior. Then pair with the backend owner on API-backed browse/drop/intro flows. Treat verification and auth as coordinated production features, not isolated UI polish.

