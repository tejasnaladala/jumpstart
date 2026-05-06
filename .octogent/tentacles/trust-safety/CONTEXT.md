# Tentacle: trust-safety

## Scope
Verification, abuse detection, intro send safety, moderation queue, privacy, data retention, GDPR/CCPA compliance.

## Files owned
- src/lib/agents/safety-classifier.ts
- src/app/api/intros/route.ts (safety part)
- src/app/api/admin/** (to be created: moderation queue UI)
- middleware.ts (auth gating, owned with infra)
- supabase/migrations/00xx_retention.sql (jobs)

## What good looks like
- Every intro note passes through the Safety Classifier before send.
- Acceptance screenshots auto-delete within 24 hours of review.
- Reports route to a moderation queue with under 4-hour SLA.
- Per-recipient cap of 8 incoming intros per week.
- No public phone numbers, no exact location, ever.
- A live abuse-attempt log at `~/.jumpstart/security/attempts.jsonl`.

## Boundaries
- This tentacle does not own auth (infra owns it) but specifies what it must guarantee.
- This tentacle does not own UI for the moderation dashboard, but specifies what it must show.

## Done state for v1
- Safety Classifier definition exists.
- Schema has reports, verifications tables.
- 24-hour deletion is documented but not implemented.

## Open todos
See todo.md.
