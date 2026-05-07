# Frontend Collaborator Handoff

This file is written for the frontend collaborator working in `tejasnaladala/jumpstart`.

> **Review note (2026-05-07):** This brief was rewritten on the `docs/codebase-intelligence-map` PR after a cross-check found several non-existent file paths (`src/components/MobileShell.tsx`, `NavDock.tsx`, `DropComposer.tsx`, `CandidateStack.tsx`, `InboxThread.tsx`, `src/lib/demo-data.ts`, `src/lib/local-store.ts`, `src/app/admin/applications/page.tsx`, `src/app/(app)/match/page.tsx`, `src/lib/auth.ts`, and an `NEXT_PUBLIC_USE_STUBS` env that is not in the codebase). All paths below have been verified against the actual repo on `implementation/v1`.

## Product read

Jumpstart is the AI-routed pre-event matchmaker for **YC AI Startup School 2026** (~2,000 hand-picked attendees, 2 days at Chase Center, San Francisco, July 25-26, 2026). The product surface is intentionally tiny: three tabs (Drop, Browse, You) plus an inbox. Curated drops Mon, Wed, Fri at 9pm PT through the ~8-week pre-event window.

The current UI is substantially stub/local-first. The product experience runs end to end in stub mode (`bun run dev`); many flows use `localStorage` and mock data while backend APIs exist but are not yet wired into the UI for the production paths.

## Frontend structure (verified)

| Area | Files |
| --- | --- |
| Root layout | `src/app/layout.tsx`, `src/app/globals.css`, `tailwind.config.ts` |
| App shell (authenticated) | `src/app/(app)/layout.tsx`, `src/components/BottomNav.tsx`, `src/components/RouteTransition.tsx`, `src/components/EluIdentify.tsx` |
| Editorial top bar | `src/components/TopBar.tsx` |
| Landing | `src/app/page.tsx`, `src/components/CohortGlobe.tsx`, `src/components/GlobeLazy.tsx`, `src/components/FounderPass.tsx` |
| Signup | `src/app/signup/page.tsx` (mock) |
| Onboarding wizard | `src/app/onboarding/layout.tsx`, `src/app/onboarding/identity/page.tsx`, `src/app/onboarding/card/page.tsx`, `src/app/onboarding/intent/page.tsx`, `src/app/onboarding/verification/page.tsx` |
| App tabs | `src/app/(app)/drop/page.tsx`, `src/app/(app)/browse/page.tsx`, `src/app/(app)/inbox/page.tsx`, `src/app/(app)/you/page.tsx` |
| Sub-pages | `src/app/(app)/match/[id]/page.tsx`, `src/app/(app)/browse/[id]/page.tsx`, `src/app/(app)/inbox/[id]/page.tsx` |
| Public pass | `src/app/pass/[id]/page.tsx` |
| Admin (gated) | `src/app/admin/page.tsx`, `src/app/admin/{health,curate,moderation,logs,cohort}/page.tsx`, `src/app/admin/layout.tsx` |

There is no `MobileShell.tsx` or `NavDock.tsx`. The app shell is `(app)/layout.tsx` + `BottomNav.tsx`. There is no `/match/page.tsx` (only `/match/[id]/page.tsx`). There is no `/admin/applications` (admin tabs are health, curate, moderation, logs, cohort).

## Pages and routes

| Route | Owner | Data source today | Backend dependency |
| --- | --- | --- | --- |
| `/` | frontend | MOCK_COHORT samples on landing | none |
| `/signup` | frontend/shared | localStorage `jumpstart.signup` | future Supabase magic link |
| `/onboarding/identity` | frontend | `useDraftState` localStorage | future user profile insert |
| `/onboarding/card` | frontend/shared | localStorage | future `founder_cards` write |
| `/onboarding/intent` | frontend | localStorage hardcoded questions today | could consume `POST /api/onboarding/interview` |
| `/onboarding/verification` | shared | client-local OTP + ticket photo | future `verifications` write + storage |
| `/drop` | frontend/shared | `local-drop.ts` over `MOCK_COHORT` + localStorage | will consume `POST /api/drops` once DB wired |
| `/match/[id]` | frontend/shared | `getMatchById` (local) | calls `POST /api/intros` already |
| `/browse` | frontend | localStorage forum posts | will consume `GET /api/browse` for cohort directory if direction shifts |
| `/browse/[id]` | frontend | localStorage post detail | none |
| `/inbox`, `/inbox/[id]` | frontend | localStorage threads | future thread/message API |
| `/you` | frontend | `loadMe` from localStorage | future user/card read |
| `/pass/[id]` | frontend/shared | `GET /api/browse?id=` (single mode) | works today |
| `/admin/*` | backend | server-rendered | gated by `getAdmin()` |

## Components (verified)

Primitives at `src/components/primitive/`:

`Button`, `Input`, `Avatar`, `Pill`, `Sheet`, `Toast`, `Kbd`, `StampSeal`, `DraftIndicator`, `AccordionLine`.

Product components at `src/components/`:

| Component | File | Notes |
| --- | --- | --- |
| `MatchCard` | `src/components/MatchCard.tsx` | Drop tab tile, hover tween, link to `/match/[id]` |
| `FounderPass` | `src/components/FounderPass.tsx` | 720×480 SVG ticket; preserve field semantics |
| `FounderCard` | `src/components/FounderCard.tsx` | Compact card for browse author display |
| `TopBar` | `src/components/TopBar.tsx` | Editorial masthead |
| `BottomNav` | `src/components/BottomNav.tsx` | Floating pill: Drop / Browse / You / Inbox |
| `CohortGlobe` | `src/components/CohortGlobe.tsx` | d3-geo + Canvas globe, RAF-driven |
| `GlobeLazy` | `src/components/GlobeLazy.tsx` | Dynamic-import wrapper for CohortGlobe |
| `DropCountdown` | `src/components/DropCountdown.tsx` | Countdown to next drop |
| `AnimatedCounter` | `src/components/AnimatedCounter.tsx` | Stat tween |
| `Reveal` | `src/components/Reveal.tsx` | IntersectionObserver fade-up |
| `BlurReveal` | `src/components/BlurReveal.tsx` | Per-character blur-in |
| `MagneticButton` | `src/components/MagneticButton.tsx` | Mouse-tracking pull |
| `Marquee` | `src/components/Marquee.tsx` | Infinite scroll text |
| `RouteTransition` | `src/components/RouteTransition.tsx` | AnimatePresence wrapper |
| `EluIdentify` | `src/components/EluIdentify.tsx` | ELU analytics identify on mount |
| `motion` | `src/components/motion.tsx` | Spring presets `SPRING_SOFT`, `SPRING_TIGHT`, `EASE`, `staggerList`, `fadeUpItem` |
| `ProgressBar` | `src/components/ProgressBar.tsx` | StepDots for onboarding |
| `FilterPanel` | `src/components/FilterPanel.tsx` | Browse category filter |
| `Logo` | `src/components/Logo.tsx` | SVG logo |

Cut from landing (still in repo, removable): `RotatingWord.tsx`, `TypeAsImage.tsx`, `SmokeBackground.tsx`, `TypewriterText.tsx`.

There is no `MobileShell`, `NavDock`, `CandidateStack`, `DropComposer`, or `InboxThread` component. An earlier draft referenced these.

## Styling and design system

- Tailwind via `tailwind.config.ts` with the editorial YC palette (`bg #F4F1DB`, `surface #FDFDF8`, `ink #16140F`, `accent #FF6600`) plus extensions (`ivory`, `stamp`, `espresso`).
- Type: Instrument_Serif (display), Geist (body), Geist_Mono (timestamps, folios).
- Animations: `fade-up`, `fade-in`, `shimmer`, `marquee`, `blink` keyframes.
- Globals at `src/app/globals.css`: 22×22 dot-pattern background, focus ring with 2.5px accent halo, `.ed-serial`, `.ed-rule`, `.ed-folio` editorial classes.
- No formal component library beyond Radix primitives + Tailwind. Frontend collaborator owns visual polish; coordinate any token rename with the founder.

## API calls used by the frontend

| Frontend file | API | Status |
| --- | --- | --- |
| `src/app/(app)/match/[id]/page.tsx` | `POST /api/intros` | Stub path returns success; production DB write is TODO. |
| `src/app/pass/[id]/page.tsx` | `GET /api/browse?id=<user_id>` | Single-card mode works in stub; prod TODO. |
| `src/app/admin/health/page.tsx` | `GET /api/health` (poll every 4s) | Working. |
| `src/app/admin/curate/page.tsx` | `GET /api/drops` (admin pending list) | Stub path works. |

Backend APIs that exist but the wizard does not yet consume:

| API | Handler | Note |
| --- | --- | --- |
| `GET /api/browse` | `src/app/api/browse/route.ts` | Cohort listing; UI uses `MOCK_COHORT` directly today. |
| `POST /api/drops` | `src/app/api/drops/route.ts` | Drop generation; UI uses `local-drop` today. |
| `POST /api/onboarding/interview` | `src/app/api/onboarding/interview/route.ts` | Onboarding turn; UI uses local heuristic stubs. |

See `docs/codebase-map/05_API_CONTRACTS.md` for verified request/response shapes.

## Mock and demo data (verified)

| File | Purpose |
| --- | --- |
| `src/lib/mock/cohort.ts` | `MOCK_COHORT` (~50 founders) and `COHORT_TAGS` taxonomy |
| `src/lib/mock/me.ts` | `DEFAULT_ME` (the deterministic dev user) |
| `src/lib/types.ts` | `FounderCard`, `Match`, `Drop`, `IntroRequest`, `MatchType`, `TrustTier`, `Intent` |
| `src/lib/match/local-drop.ts` | Deterministic match generator (the stub for the Matchmaker agent) |
| `src/lib/forum/posts.ts` | Mock forum posts (localStorage) |
| `src/lib/inbox/threads.ts` | Mock inbox threads (localStorage) |
| `src/lib/drop/delivery.ts` | Hand-curated match delivery via localStorage |
| `src/lib/moderation/queue.ts` | localStorage moderation queue |
| `src/lib/verification/otp.ts` | localStorage stub OTP |
| `src/lib/hooks/useDraftState.ts` | Onboarding form draft persistence |

There is no `src/lib/demo-data.ts` or `src/lib/local-store.ts`. An earlier draft referenced these.

## What not to touch casually

- Do not change `src/app/api/**` unless coordinating with the backend owner.
- Do not change `supabase/**`, `pocketbase/**`, or `src/lib/auth/**` without backend agreement (`auth/` is a directory of session/admin/rate-limit; there is no `src/lib/auth.ts`).
- Do not change request/response shapes in `src/lib/api/schema.ts` or `src/lib/types.ts` without updating `docs/codebase-map/05_API_CONTRACTS.md` in the same PR.
- Do not build production verification UX on the current client-local proof/OTP behavior.
- The landing page is the conversion surface. Coordinate any change with the founder before shipping.

## Backend assumptions to preserve

- Auth-gated app routes expect a session via `src/app/(app)/layout.tsx` calling `getSession()` from `src/lib/auth/session.ts`.
- Backend APIs use `requireSession()` for protected requests; in stub mode (`JUMPSTART_ALLOW_STUB=1` and missing Supabase) a deterministic `DEV_USER` is returned.
- The flag set is `JUMPSTART_*` (`FORCE_STUBS`, `ALLOW_STUB`, `PRIVATE_BETA`, `DEV_ADMIN`, `ADMIN_EMAILS`, `DISABLE_ANTHROPIC`). There is no `NEXT_PUBLIC_USE_STUBS`.
- Core backend models (in `supabase/migrations/0001_init.sql`): `users`, `founder_cards`, `intent_interviews`, `verifications`, `drops`, `matches`, `intros`, `meetings`, `reports`, `agent_logs`, `taste_profiles`. RLS lives in `supabase/migrations/0002_complete_rls.sql`.
- The `POST /api/intros` 200 response shape is `{ accepted, intro_id, match_id, requester_id, recipient_id, sent_at }`. There is no `thread_id` in the server response.
- The `POST /api/drops` 200 response shape is `{ drop_id, user_id, matches, generated_at }`.
- `MATCH_NOT_OWNED` returns **403**, not 400.

## Questions for backend owner

1. Is Supabase the canonical backend, or does PocketBase remain part of the plan? (Decision needed before launch.)
2. What is the stable `FounderCard` field contract? `src/lib/types.ts` has `going_to_sf` which is not a column in the migration; reconcile.
3. Should onboarding intent use `POST /api/onboarding/interview`, or remain deterministic / client-authored for now?
4. After an intro request succeeds, what UI surface gets the contact + calendar link (inbox thread, email both, in-app modal)?
5. What verification proof storage and review workflow should the UI support? Do we keep client-local for closed beta?
6. Should `/browse` stay as a forum (current) or return to a cohort directory per spec section 2?
7. Is the public Pass URL using stable `user_id` (current) acceptable, or do we need random share IDs to avoid enumeration?

## Recommended frontend cleanup plan

| Order | Task | Coordination |
| --- | --- | --- |
| 1 | Reconcile `FounderCard` field contract (esp. `going_to_sf`, `location`, `region`). | Backend |
| 2 | Add error and empty states to `/pass/[id]`, `/admin/health`, `/match/[id]`. | Frontend |
| 3 | Make loading/error/empty states consistent across Drop, Browse, Match, Inbox. | Frontend |
| 4 | Strip `console.info` calls from stub-mode OTP path before public beta. | Shared |
| 5 | Pause `CohortGlobe` RAF when offscreen. | Frontend |
| 6 | Remove cut landing components if confirmed dead (`RotatingWord`, `TypeAsImage`, `SmokeBackground`, `TypewriterText`). | Frontend |
| 7 | Wire `/onboarding/intent` to `POST /api/onboarding/interview` once backend confirms shape. | Shared |
| 8 | Wire `/drop` to `POST /api/drops` once `loadMeFromDb` is implemented. | Shared |
| 9 | Refresh `tests/e2e/happy-path.spec.ts` selectors after editorial UI changes. | Shared |

## Suggested order of work

Start with visual and ergonomic polish that does not change backend contracts: app shell, navigation, card polish, form ergonomics, empty states, responsive behavior, accessibility. Then pair with the backend owner on `/drop` and `/intros` once those routes return real data. Treat verification and magic-link auth as coordinated production features, not isolated UI polish.
