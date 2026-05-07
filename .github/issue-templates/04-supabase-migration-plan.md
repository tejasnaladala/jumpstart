## Brief

Write a migration plan (NOT the migration itself) from `localStorage` mocks to Supabase Postgres. Today the cohort, posts, threads, founder cards, OTP records, and moderation queue all live in `localStorage` per browser. v1.5 needs server-side state so two devices stay in sync.

## Context

- `src/lib/mock/` - all current mocks. Read `me.ts`, `cohort.ts`, `intros.ts`, `safety.ts`, `notifications.ts`.
- `src/lib/forum/posts.ts` - posts + comments + votes, all localStorage.
- `src/lib/inbox/threads.ts` - DM threads, all localStorage.
- `src/lib/moderation/queue.ts` - admin queue, all localStorage.
- `src/lib/verification/otp.ts` - OTP records (separate issue migrating these to PocketBase, but plan must reconcile).
- `docs/superpowers/specs/2026-05-05-jumpstart-design.md` - the original design doc has Postgres + pgvector schemas; cross-reference but note the spec assumed 8000-user scale.

The deliverable is a markdown file at `docs/migrations/localstorage-to-supabase.md` covering:

1. Schema (table names, columns, indexes, foreign keys, RLS policies).
2. Migration order (which collections move first, which can wait).
3. Read/write boundary - which client code stays the same, which has to swap.
4. Backward compat - how existing localStorage state coexists during the cutover.
5. Test plan - how to verify no data loss across the migration.
6. Rollback - the kill switch if Postgres goes down.

## Acceptance

- [ ] `docs/migrations/localstorage-to-supabase.md` exists and is at least 500 words.
- [ ] Every existing `localStorage` key in the codebase is accounted for (grep `jumpstart\.` to find them all).
- [ ] Schema has at minimum: `users`, `founder_cards`, `drops`, `matches`, `posts`, `comments`, `threads`, `messages`, `moderation_queue`. RLS policies sketched.
- [ ] Migration order has a "shippable in a week" milestone and a "v1.5 complete" milestone.
- [ ] Cross-reference to issue #1 (PocketBase OTP) - PocketBase is for OTP only, Supabase is for everything else, both run in parallel during transition.
- [ ] Plan includes how `src/lib/auth/session.ts` ties into Supabase Auth (magic links).

## Out of scope

- Implementing the migration. Plan only.
- Replacing PocketBase with Supabase. PocketBase stays for OTP unless the plan argues otherwise.
- Vector search / pgvector. v1.5+ feature.

## Useful skills

- `/architecture-designer` for the schema sketch.
- `/codex` for a sanity check on the plan once written.
- `/fool` to challenge whether Supabase is the right destination vs. just consolidating on PocketBase.
