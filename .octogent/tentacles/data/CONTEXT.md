# Tentacle: data

## Scope
Database schema, migrations, seed data, embeddings, RLS policies, data retention jobs, queries, vector indexes.

## Files owned
- supabase/**
- src/lib/db/** (to be created)
- src/lib/mock/** (replaced by real DB calls in production)
- scripts/seed-cohort.ts (to be created)

## What good looks like
- Every table has RLS enabled and at least one policy.
- Every PII column is documented in a data-classification doc.
- Embeddings are recomputed nightly and have an ivfflat index.
- A retention job deletes acceptance screenshots within 24 hours of review.
- Migrations are versioned and reversible.
- A read replica serves the Cohort Analyst queries to keep load off primary.

## Boundaries
- This tentacle does not own how queries are called. Agents and API routes own that.
- This tentacle does not own how Supabase auth works. Infra owns auth setup.

## Done state for v1
- 0001_init.sql: full schema with 11 tables, pgvector, RLS for cards/drops/matches/intros.
- Mock data fixture works for dev.

## Open todos
See todo.md.
