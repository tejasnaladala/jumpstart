# todo: trust-safety

## Pre-launch CRITICAL (week 1)
- [ ] **Harden Safety Classifier against prompt injection**: wrap user content with a per-request UUID nonce delimiter, reject responses where the model echoes the nonce or where it returned a recommendation that contradicts a fast pattern check (link spam, obvious harassment regex)
- [ ] **Implement 24-hour acceptance screenshot deletion**: Supabase pg_cron or Vercel Cron Function that queries `verifications WHERE artifact_expires_at < now()`, deletes the storage object, nulls artifact_url
- [ ] **Add per-user rate limit on intros**: 10/hr, 30/day, with Upstash Ratelimit
- [ ] **Add per-recipient cap**: 8 incoming pending intros per week, enforce on send
- [ ] **Audit RLS write policies** on meetings, reports, taste_profiles, intent_interviews, verifications. Add INSERT policies scoped to auth.uid()
- [ ] **Block agent_logs from client read paths**. Service-role only.

## Pre-launch HIGH (week 1-2)
- [ ] Build moderation queue UI at /admin/moderation (founder-only)
- [ ] Add report flow on every match detail page
- [ ] Add block flow with persistent block table
- [ ] Add a "save for later" UX on the recipient side instead of a hard decline button
- [ ] Add automated PII detection on card fields (Safety Classifier already does this, ensure it runs on every save)

## Privacy (week 2)
- [ ] Write a privacy.md doc enumerating every PII column, retention rule, and access path
- [ ] Implement GDPR delete endpoint: full purge in 7 days, intro records anonymized
- [ ] Add a transparency page listing what we collect and why
- [ ] Watermark generated share-card images with the user's id (so leaks are traceable)

## Continuous
- [ ] Weekly review of moderation queue. Founder reviews 100% of flags in week 1, top 5% after.
- [ ] Monthly Safety Classifier eval refresh with new attack cases
- [ ] Quarterly red-team session (use the autoresearch-claude-code skill against /api/intros)
