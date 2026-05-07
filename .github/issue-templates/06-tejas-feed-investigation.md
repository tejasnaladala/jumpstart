## Brief (Tejas-owned, not for delegation)

Founder said "feed not working" on May 7 but my headless interaction test passed end-to-end (4 seed posts render, compose 4 → 5, filter Show 5 → 2, click post → /browse/[id] with full title + body + comments).

I've left the issue open because I couldn't repro the bug from the outside. This issue tracks the investigation so the autonomous stack doesn't lose it.

## Context

- `harness/scripts/debug-feed.ts` - the headless test that passes.
- `experiments/screens/feed-debug/02-detail.png` - May 7 screenshot of the detail page; renders correctly.
- Original chat thread context - founder said "feed not working" without specifying the failure mode.

## Hypotheses

1. Compose `alert()` modals look like errors. Replace with toast.
2. Empty filter result shows the wrong empty state copy. (Owned by Mukund's Claude in #5.)
3. Detail page header is too thin compared to the masthead on /browse. (Owned by Mukund's Claude in #2.)
4. Post submission silently flagged the post and it landed in moderation queue without obvious feedback.
5. Browser cache served stale JS while I was rebuilding the production server.

## Plan

- Wait for founder reproduction details, OR ship the polish from #2 + #5 + alert→toast and see if "not working" resolves implicitly.
- Status:blocked unless the founder posts a screenshot or describes the failure mode.

## Out of scope

- Anything in #2 (detail polish), #5 (empty state). Those are owned separately.
