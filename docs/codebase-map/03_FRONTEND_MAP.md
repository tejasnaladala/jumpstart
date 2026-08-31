# Frontend map

## Framework

Next.js 15.1 app router on React 19, TypeScript 5.7, Tailwind 3.4, Radix UI primitives, framer-motion 11. Bun is the package manager. Dev port is 3030.

Default rendering is RSC; client components opt in via `"use client"`. The `(app)` route group at `src/app/(app)/` provides a shared authenticated shell with `BottomNav`, `RouteTransition`, and analytics identify-on-mount.

## Routes

### Public

| URL | File | Purpose | Notes |
|---|---|---|---|
| `/` | `src/app/page.tsx` | Landing: hero, stats counter, Founder Pass preview, CohortGlobe | Reads MOCK_COHORT |
| `/signup` | `src/app/signup/page.tsx` | Email + LinkedIn entry | Mock magic link, writes `localStorage.jumpstart.signup` |
| `/pass/[id]` | `src/app/pass/[id]/page.tsx` | Public read-only Founder Pass | Calls `/api/browse?id=` |

### Onboarding (4-step wizard, layout-wrapped)

| URL | File | Step | Drives |
|---|---|---|---|
| `/onboarding/identity` | `onboarding/identity/page.tsx` | 1 | name, age, city, oneLine |
| `/onboarding/card` | `onboarding/card/page.tsx` | 2 | building / looking_for / can_help / talk_to_me_if |
| `/onboarding/intent` | `onboarding/intent/page.tsx` | 3 | tags + intent multi-select |
| `/onboarding/verification` | `onboarding/verification/page.tsx` | 4 | phone OTP + ticket photo |

All four use `useDraftState` (`src/lib/hooks/useDraftState.ts`) for autosave to `localStorage`.

### Authenticated app shell `(app)`

| URL | File | Purpose | Hits |
|---|---|---|---|
| `/drop` | `(app)/drop/page.tsx` | Curated match delivery + countdown | `local-drop.ts`, localStorage |
| `/drop` (loading) | `(app)/drop/loading.tsx` | Suspense skeleton | — |
| `/match/[id]` | `(app)/match/[id]/page.tsx` | Match detail + intro request modal | `getMatchById` (local), `POST /api/intros` |
| `/browse` | `(app)/browse/page.tsx` | Forum-style posts | localStorage `loadPosts`, `loadVotes` |
| `/browse/[id]` | `(app)/browse/[id]/page.tsx` | Post detail + thread | localStorage |
| `/inbox` | `(app)/inbox/page.tsx` | Tabbed inbox | localStorage threads |
| `/inbox/[id]` | `(app)/inbox/[id]/page.tsx` | Thread conversation | localStorage |
| `/you` | `(app)/you/page.tsx` | Founder Pass + edit + sign out | `loadMe` |

### Admin (gated by allowlist; `dynamic = "force-dynamic"`)

| URL | File | Purpose |
|---|---|---|
| `/admin` | `admin/page.tsx` | Hub of admin tiles |
| `/admin/health` | `admin/health/page.tsx` | Local liveness history (polls `/api/health` every 10s) |
| `/admin/curate` | `admin/curate/page.tsx` | Manual match curation (closed-beta) |
| `/admin/moderation` | `admin/moderation/page.tsx` | Moderation queue |
| `/admin/logs` | `admin/logs/page.tsx` | Agent invocation logs |
| `/admin/cohort` | `admin/cohort/page.tsx` | Cohort analytics |

## Layouts

- `src/app/layout.tsx` — root: fonts (Instrument_Serif, Geist, Geist_Mono), providers, PostHog tag, Toast
- `src/app/(app)/layout.tsx` — auth gate, `BottomNav`, `RouteTransition` (AnimatePresence), `EluIdentify`
- `src/app/onboarding/layout.tsx` — wraps the 4 wizard steps with progress indicator
- `src/app/admin/layout.tsx` — `dynamic = "force-dynamic"`, calls `getAdmin()`, redirects if null

## Components

### Primitives `src/components/primitive/`

| Component | Props | Used by |
|---|---|---|
| `Button.tsx` | `variant`, `size`, `loading`, `block` | Every CTA |
| `Input.tsx` | `label`, `type`, `placeholder`, `value`, `maxLength`, `showCounter` | Signup, onboarding |
| `Avatar.tsx` | `name`, `size` | MatchCard, match detail |
| `Pill.tsx` | `size`, `accent` | Browse posts, You page (trust tier) |
| `Sheet.tsx` | `open`, `onOpenChange` | Match detail (request modal), inbox |
| `Toast.tsx` | `useToast()` hook | Global |
| `Kbd.tsx` | label | Admin health |
| `StampSeal.tsx` | `topLabel`, `bottomLabel`, `size`, `rotate` | Landing footer, You page |
| `DraftIndicator.tsx` | `status` | Onboarding (idle / dirty / saving / saved / error) |
| `AccordionLine.tsx` | items | Browse post detail |

### Product components `src/components/`

| Component | Used by | Notes |
|---|---|---|
| `MatchCard.tsx` | `/drop` | Hover tween (y: -2, scale 1.005), Link to `/match/[id]` |
| `FounderPass.tsx` | Landing, `/you`, `/pass/[id]` | 720×480 SVG ticket with perforation cuts |
| `FounderCard.tsx` | Browse author avatars | Compact 4-line card |
| `TopBar.tsx` | All app pages | Sticky header with back nav |
| `BottomNav.tsx` | App shell | Floating pill: Drop / Browse / You / Inbox |
| `CohortGlobe.tsx` | Landing | d3-geo + Canvas + RAF, 12 anchor city pulses |
| `GlobeLazy.tsx` | Landing hero | Dynamic import wrapper for CohortGlobe |
| `DropCountdown.tsx` | `/drop` | Time-until eligible |
| `AnimatedCounter.tsx` | Landing stats | useEffect tween |
| `Reveal.tsx` | Landing | IntersectionObserver fade-up |
| `BlurReveal.tsx` | Landing | Per-character blur-in |
| `MagneticButton.tsx` | Landing CTAs | Mouse-tracking pull |
| `Marquee.tsx` | Landing band, `/you` | Infinite scroll text |
| `RouteTransition.tsx` | App shell | AnimatePresence wrapper |
| `EluIdentify.tsx` | App shell | ELU analytics identify on mount |
| `motion.tsx` | All motion pages | `fadeUpItem`, `staggerList`, `SPRING_SOFT`, `SPRING_TIGHT`, `EASE` |
| `ProgressBar.tsx` | Onboarding | StepDots |
| `FilterPanel.tsx` | `/browse` | Category buttons |
| `Logo.tsx` | Headers | SVG logo |

### Cut from landing (still in repo)

`RotatingWord.tsx`, `TypeAsImage.tsx`, `SmokeBackground.tsx`, `TypewriterText.tsx`. Per the prelaunch review they were red-teamed out. Removable but harmless to keep.

## State management

- **Local form state.** `useDraftState` autosaves the four onboarding steps to `localStorage` keys `jumpstart.draft.<step>`. Status fed to `DraftIndicator`.
- **Stub data state.** `localStorage` keys hold mock posts (`jumpstart.forum.posts`), votes, inbox threads, OTP demo codes, drop delivery records. See `src/lib/forum/posts.ts`, `src/lib/inbox/threads.ts`, `src/lib/drop/delivery.ts`, `src/lib/verification/otp.ts`, `src/lib/moderation/queue.ts`.
- **No global store.** No Redux, Zustand, Jotai, or Context-based store. Each page reads from `localStorage` or props.
- **No SWR / React Query.** Data fetching is plain `fetch`.
- **Server data.** Pages that need server data are server components (e.g., admin layout calls `getAdmin()` directly).

## Styling system

### Tokens (`tailwind.config.ts`)

- **YC base palette:** `bg #F4F1DB`, `surface #FDFDF8`, `ink #16140F`, `accent #FF6600`
- **Editorial extensions:** `ivory`, `stamp` (deep orange), `espresso` (dark inverted-surface)
- **Type:** Instrument_Serif (display), Geist (body), Geist_Mono (timestamps, folios)
- **Sizes:** xxs (10px) → 5xl (48px) with custom line heights
- **Radii:** xs 4px → 3xl 24px (default 8px)
- **Shadows:** `card`, `hover`, `focus` (2.5px accent halo)
- **Animations:** `fade-up` (320ms), `fade-in` (220ms), `shimmer` (1.6s), `marquee`, `blink`

### Globals (`src/app/globals.css`)

- Light color-scheme, antialiasing, 22×22 dot pattern background fixed
- `.ed-serial` (mono uppercase tnum), `.ed-rule` (border + accent tick), `.ed-folio` (large folio numbers)
- `prose` defaults max 70ch
- Focus ring: 2.5px accent halo + 1px divider, no outline
- Selection: accent bg + white text

## API consumption

Every frontend `fetch` call grouped by endpoint:

| Endpoint | Method | Caller | Payload | Response handler |
|---|---|---|---|---|
| `/api/intros` | POST | `/match/[id]` (request modal submit) | `IntroRequestSchema { match_id, recipient_id, note? }` | success: redirect to `/inbox`; safety block: toast "rewrite without sales language" |
| `/api/browse` | GET | `/pass/[id]` | query `?id=<user_id>` | `{ card }` or 404 toast |
| `/api/health` | GET | `/admin/health` (poll every 10s) | — | render local process liveness |
| `/api/drops` | GET | `/admin/curate` | — | list pending drops |
| `/api/onboarding/interview` | POST | (called via `/onboarding` flow when wired) | `InterviewSchema` | `next_question` or `is_final` |

Frontend also calls a few built-in handlers via Server Actions / RSC, but the explicit fetches above are the surface.

## Animations / motion

- `framer-motion` 11. Spring presets in `motion.tsx` (`SPRING_SOFT { damping: 22, stiffness: 240 }`, `SPRING_TIGHT { damping: 28, stiffness: 320 }`, `EASE [0.22, 1, 0.36, 1]`).
- Most pages use `staggerList` + `fadeUpItem` for entrance.
- `Reveal` via `IntersectionObserver`.
- `MagneticButton` listens to mousemove.
- `RouteTransition` uses `AnimatePresence` with `mode="wait"`.

## Auth UI

| Step | Page | What happens |
|---|---|---|
| Sign up | `/signup` | Mock: writes email+LinkedIn to `localStorage.jumpstart.signup`, redirects to onboarding |
| Verify | `/onboarding/verification` | Stub OTP via `otp.ts`. In stub mode, demo code is returned in response and was previously logged to console (now hidden, commit `82d2514`) |
| Session | App shell | `getSession()` server-side. In stub mode returns `DEV_USER`. Redirect to `/signup` if null |
| Sign out | `/you` | Wipes `localStorage.jumpstart.*`, redirects home |

The real magic-link path through Supabase is **not yet wired**. See risks.

## Map / visualization

- **CohortGlobe** (`src/components/CohortGlobe.tsx`) renders a Canvas globe with d3-geo. Source data: `public/world-110m.json` (TopoJSON 110m). 12 anchor cities pulse on a RAF loop.
- **GlobeLazy** dynamically imports CohortGlobe on the landing page hero (Suspense boundary).

## Frontend-only logic

Files that run purely in the client/server-without-DB layer:

- `src/lib/match/local-drop.ts` — score + classify + diversity rule. The same logic is intended to be replaced by the Matchmaker agent's output, but is also the offline stub for the agent.
- `src/lib/mock/cohort.ts` — `MOCK_COHORT` (~50 founders).
- `src/lib/mock/me.ts` — `DEFAULT_ME` for `DEV_USER`.
- `src/lib/forum/posts.ts` — localStorage forum (with seed-on-first-load).
- `src/lib/inbox/threads.ts` — localStorage threads.
- `src/lib/drop/delivery.ts` — localStorage delivery record (closed-beta hand-curation).
- `src/lib/moderation/queue.ts` — localStorage mod queue.
- `src/lib/verification/otp.ts` — localStorage OTP store.

## Frontend risks

| # | Risk | File | Severity |
|---|---|---|---|
| 1 | Magic-link auth is mock; real Supabase flow not wired. Closed-beta only. | `src/app/signup/page.tsx:44-50` | P1 |
| 2 | `/pass/[id]` has no error boundary if `/api/browse` fails | `src/app/pass/[id]/page.tsx` | P2 |
| 3 | `/admin/health` polling has no retry/backoff; silent network failure | `src/app/admin/health/page.tsx` | P3 |
| 4 | localStorage stores user-authored text; if any view ever switched to raw HTML injection, an XSS surface opens. Currently all rendering is via React text nodes. | various | P2 (latent) |
| 5 | `EluIdentify` fires unconditionally; no opt-out UI | `src/components/EluIdentify.tsx` | P2 (privacy) |
| 6 | `CohortGlobe` runs continuous RAF, can be CPU-heavy on low-power devices | `src/components/CohortGlobe.tsx` | P3 |
| 7 | `useDraftState` doesn't encrypt; verification screenshots stored as data URLs in localStorage | `src/app/onboarding/verification/page.tsx` | P2 |
| 8 | Match detail does not validate `params.id` shape before passing to `getMatchById`; relies on local-drop's null-handling | `src/app/(app)/match/[id]/page.tsx` | P3 |
| 9 | Drop matches generated deterministically from MOCK_COHORT; match IDs stable per session only | `src/lib/match/local-drop.ts` | P3 |
| 10 | "Preview as others see you" toast on `/you` instead of an actual preview view | `src/app/(app)/you/page.tsx` | P3 |

## Files frontend collaborator should own

- `src/app/(app)/**` — every authenticated page
- `src/app/onboarding/**` — wizard
- `src/app/page.tsx`, `src/app/signup/page.tsx`, `src/app/pass/[id]/page.tsx`
- `src/components/**` — every component
- `src/lib/hooks/**` — React hooks
- `src/lib/match/local-drop.ts` — keep parity with Matchmaker agent output shape
- `src/lib/mock/**` — fixtures
- `tailwind.config.ts`, `src/app/globals.css` — design system
- `public/**` — static assets
- `tests/e2e/happy-path.spec.ts` — happy path E2E (frontend can extend it)

## Files frontend should NOT touch

- `src/app/api/**` — route handlers
- `src/lib/agents/**` — Claude agents
- `src/lib/auth/**` — session, admin, rate limit
- `src/lib/api/schema.ts` — request/response Zod (propose a change, do not edit unilaterally)
- `src/lib/safety/**`, `src/lib/moderation/**`, `src/lib/verification/**`, `src/lib/forum/**`, `src/lib/inbox/**`, `src/lib/drop/**` — server-shaped logic
- `src/proxy.ts` — auth fast-fail
- `src/app/admin/**` — admin pages (read-only dashboards, not feature work)
- `supabase/**`, `evals/**`, `harness/**`, `scripts/**`, `.github/**`, `vercel.json`

## Clean handoff notes

1. The frontend works **end to end in stub mode** today. `bun install && bun run dev` boots the app at `http://localhost:3030` with the deterministic dev user; no API keys needed.
2. The match data on `/drop` comes from `local-drop.ts`. When the backend wires the real Matchmaker agent, the same `Match` shape will return; UI does not change.
3. Tabs are **Drop / Browse / You** in v1. No Pods, Micro-meetups, Relationship Map, or Follow-up tracker. They are explicitly parked.
4. Voice rules in `CONTRIBUTING.md` apply to all UI copy. No em dashes. Sentence-case headings. Vary length.
5. The Founder Pass and the Founder Card are the same identity object presented two ways. Don't introduce a separate model.
6. The **landing page is sacred** — it is the conversion surface. Coordinate any change with the founder before shipping.
