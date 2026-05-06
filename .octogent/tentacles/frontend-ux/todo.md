# todo: frontend-ux

## Pre-launch (week 1-2)
- [ ] Add real Playwright e2e test for the full happy path: signup → onboarding → drop → request intro → accept
- [ ] Add a `playwright.config.ts` (currently missing per test infra audit)
- [ ] Verify keyboard-only navigation works on every screen
- [ ] Add real loading skeletons to /drop while matches generate
- [ ] Ensure 320px viewport on iPhone SE has no horizontal scroll
- [ ] Add error boundaries on every route
- [ ] Replace localStorage in mock/me.ts with a server-backed session (Supabase Auth)
- [ ] Add `/onboarding/interview` server-driven flow that calls the actual agent (currently uses local fallback)
- [ ] Polish empty states for Browse (when filters return zero)
- [ ] Polish error states for /match/[id] when match id is unknown

## Polish (week 2-3)
- [ ] Add framer-motion micro-interactions to drop reveal (already animation-fade-up, can be richer)
- [ ] Generate proper OG image for landing page social previews
- [ ] Add favicon set
- [ ] Add color contrast audit (target WCAG AA)
- [ ] Run /design-review skill on the live app, log findings, fix top issues

## Continuous
- [ ] Visual regression snapshots for the 5 hero screens
- [ ] Reading-time analytics on landing page sections
