## Brief

The `/browse` (Feed) empty state is generic ("Nothing here yet. Be the first to post."). Founder direction (May 7): "Make everything smooth and cohesive." The empty state should match the editorial system on the rest of the app.

## Context

- `src/app/(app)/browse/page.tsx:189-195` - the empty-state branch.
- For tone, look at `src/app/(app)/drop/page.tsx:175-198` (the "Match being prepared" state). That's the editorial empty-state pattern: small ed-rule, mono caps eyebrow, italic display-serif headline, brief muted body, ed-rule out.
- `seedDemoPostsIfNeeded()` in `src/lib/forum/posts.ts:215-292` seeds 4 posts on first visit, so the empty state only triggers when:
  - User cleared posts via signup wipe but the seed flag persisted (rare bug)
  - Filter selected with zero matches (common)

## Acceptance

- [ ] Empty state renders an editorial card matching the `PreparingMatch` pattern: top accent rule, mono caps eyebrow, italic display-serif h2, body copy, bottom accent rule.
- [ ] Two distinct copy variants: one for "no posts at all" and one for "no posts in this filter".
- [ ] Filter-selected empty state suggests: try a different category OR be the first to post in this one (with a button that opens the composer with that category preselected).
- [ ] Clicking the suggested category-preselect button opens the composer with the right category active.
- [ ] Build passes.
- [ ] Visual diff at 1440x900 (laptop) and 414x896 (phone). Drop both screenshots in the PR body.

## Out of scope

- Changing the seed data.
- Refactoring `PostRow` or the compose card.
- Real-time updates (the page already refreshes on submit).

## Useful skills

- `/design-review` after implementing.
- `/humanizer` on the empty-state copy. No AI-slop language; keep it short.
