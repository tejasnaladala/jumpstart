# todo: data

## Pre-launch (week 1)
- [ ] Provision a real Supabase project (production env)
- [ ] Run 0001_init.sql against it
- [ ] Add 0002_seeds.sql with the cohort starter tag taxonomy
- [ ] Verify every RLS policy denies what it should (write 5 negative tests)
- [ ] Add explicit RLS policy for verifications, intent_interviews, agent_logs
- [ ] Replace src/lib/mock/me.ts with src/lib/db/users.ts that reads from Supabase
- [ ] Replace src/lib/mock/cohort.ts with src/lib/db/cohort.ts (paginated query, RLS-enforced)
- [ ] Add src/lib/db/embed.ts that calls Voyage or OpenAI embeddings on card create/update

## Retention and privacy (week 1-2)
- [ ] Add scheduled function: delete verifications.artifact_url after 24 hours from review
- [ ] Add scheduled function: nightly recompute candidate top-50 graph per user
- [ ] Add data-classification doc enumerating every PII column and its retention rule
- [ ] Verify GDPR delete: full account purge in 7 days, intro records anonymized

## Continuous
- [ ] Add a daily migration check in CI (verifies forward + reverse on a fresh DB)
- [ ] Add a query log audit: every query that returns more than 100 rows gets reviewed weekly
