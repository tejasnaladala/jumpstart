## Brief

Polish the post detail page at `/browse/[id]`. Today the TopBar shows "Post" with the author as subtitle in compact-variant serif (small), and the actual post title is buried in the body. Detail page hierarchy is inverted vs. the rest of the editorial system.

## Context

- `src/app/(app)/browse/[id]/page.tsx` - the page in question. Look at lines 84-180 for the main render.
- `src/components/TopBar.tsx` - reuse `variant="compact"` here (it's correct for sub-pages) but the page body needs a real serif h2 masthead under the TopBar.
- Reference implementation: see how `src/app/(app)/match/[id]/page.tsx:218` was bumped to `font-display text-3xl sm:text-4xl` in commit `ed85b62` for the same reason.
- The fool review on May 7 (commit `ed85b62`) flagged the missing ed-rule masthead on `/browse/[id]`.

## Acceptance

- [ ] `/browse/[id]` shows the post title as a `font-display text-3xl sm:text-4xl lg:text-5xl text-ink leading-[1.05]` h1 inside the body section (not in the TopBar).
- [ ] An ed-serial dateline above the title shows `§ Post / {category} / {timeAgo}`.
- [ ] Accent rule (`<div aria-hidden className="h-px bg-accent w-12" />`) under the title separates from body copy.
- [ ] The compact TopBar still shows "Post" + author subtitle and the back arrow to `/browse`. Don't change TopBar itself.
- [ ] Comments section gets a section-header treatment matching the new masthead pattern (small serif "Comments" h2 + ed-serial count).
- [ ] Visual diff at 1440x900 and 414x896 (run `npx tsx harness/scripts/design-audit-shoot.ts`). Drop both screenshots in the PR body.
- [ ] Build passes.

## Out of scope

- Refactoring the comment posting logic. The `appendComment` function in `src/lib/forum/posts.ts` stays as is.
- Threading replies. Comments are flat for v1.
- Soft-flagged warning UI changes. Existing toast behavior stays.

## Useful skills

- `/design-review` after implementing — designer's eye QA against the rest of the editorial system.
- `/codex` on the diff before push.
