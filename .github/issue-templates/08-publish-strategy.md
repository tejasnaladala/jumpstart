## Brief

Publish the landing page on LinkedIn + X to drive waitlist signups. We deliberately decided NOT to use paid distribution (Simplr Ads, Meta, etc.) because the audience is ~2000 specific accepted YC SS 2026 founders, not a TikTok-shoppable demographic. Organic founder Twitter + LinkedIn is the right channel.

## Context

- Landing page now has a waitlist gate at `/#waitlist`. POST /api/waitlist captures email + handle + building-line, dedupes by email, rate-limits per IP. Storage: `experiments/waitlist.jsonl`.
- Founder direction (May 7): Simplr Ads ruled out (wrong fit; reviews flag pricing high; creative shape is video-first vs editorial brand).
- Voice rules: editorial, sentence-case, no AI slop, no promotional adjectives, no em-dashes.

## What to ship

1. **Three post drafts** (markdown, in `docs/launch/posts/`) for X (1 short, 1 thread of 4-6) and LinkedIn (1 long-form). Each must:
   - Open with a concrete line about the cohort (2000 founders, July 25-26 Chase Center).
   - Show one specific moment of the product (the countdown, the four lines on the Pass, the "1 match Mon Wed Fri at 9pm PT" cadence).
   - Link to the landing page with a tracked `?source=` query param so we attribute waitlist signups by channel (`?source=x-thread`, `?source=linkedin-long`, etc.).
   - End with a CTA that points to the waitlist, not /signup.
2. **Track sources end-to-end**: the `WaitlistForm` already accepts a `source` prop. Wire `searchParams.source` from the URL into the form so signups carry the right attribution.
3. **OG image**: the landing page metadata uses `metadataBase` but no custom OG image. Ship `src/app/opengraph-image.tsx` (or similar) with the hero copy + Founder Pass treatment so LinkedIn/X previews are not the default Next.js placeholder.
4. **Founder digest entry**: append a NEEDS_YOUR_CALL line to `experiments/founder-digest.md` summarizing the publish push and the waitlist conversion target so the autonomous stack can track the 7-day result.

## Acceptance

- [ ] Three post drafts exist at `docs/launch/posts/{x-short,x-thread,linkedin-long}.md` and follow the voice rules.
- [ ] The landing page reads `?source=` from URL and feeds it through to `/api/waitlist`.
- [ ] An OG image ships at `src/app/opengraph-image.{tsx,jpg,png}` and renders correctly in LinkedIn + X share previews (verify with https://www.opengraph.xyz/ or `npx unfurl-link <url>`).
- [ ] Build passes.
- [ ] Test the LinkedIn / X preview by sharing a staging URL into a draft post.

## Out of scope

- Paid promotion (we ruled it out).
- Email list / newsletter signup. Waitlist is the only conversion in v1.
- Multi-variant testing infrastructure. Pick one set of post drafts and ship.

## Useful skills

- `/humanizer` on every post draft.
- `/codex` on the OG image + searchParams wiring.
- `/design-review` on the OG image at the OpenGraph standard 1200x630.

## Notes

- ELU Analytics is already wired in the (app) shell, so signed-in attribution works once a user converts. For the public landing page, source tracking via query param is the only attribution channel.
- The waitlist endpoint stores entries in `experiments/waitlist.jsonl`; a future PR (linked to issue #5 Supabase migration) moves this to Postgres.
