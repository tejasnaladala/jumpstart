# Database map

## Engine and version

PostgreSQL via Supabase. Extensions:

- `pgvector` (1536-dim cosine similarity)
- `pg_trgm` (likely; UNKNOWN — verify in `0001_init.sql` extension list)

Migrations in `supabase/migrations/`:
- `0001_init.sql` — 11 tables, indexes, baseline RLS
- `0002_complete_rls.sql` — 24 RLS policies, helper function `is_verified_user()`, security touch-ups

## Tables (11)

### `users` — primary attendee identity

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | PK |
| `email` | text | not null | unique |
| `linkedin_url` | text | | unique, nullable |
| `phone` | text | | nullable |
| `name` | text | not null | |
| `location` | text | | nullable |
| `trust_tier` | trust_tier enum | `'provisional'` | `provisional | verified | peer_vouched` |
| `verification_artifact_id` | uuid | | references `verifications.id` (no FK constraint — risk) |
| `created_at` | timestamptz | `now()` | |
| `last_active` | timestamptz | `now()` | |
| `deleted_at` | timestamptz | | soft delete |

**Indexes:** `users_last_active_idx (last_active desc)`

**RLS:**
- SELECT — `auth.uid() = id` (own row only)
- UPDATE — `auth.uid() = id`, plus `REVOKE update on trust_tier from authenticated` (privilege escalation guard, service role only)

**Read sites:** `src/lib/auth/session.ts:69-72` (trust tier on session)
**Write sites:** Service role only for trust tier; user-self-update for non-tier columns (TODO: not yet wired in prod)

---

### `founder_cards` — public profile, 1:1 with users, holds embeddings

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | PK |
| `user_id` | uuid | not null | FK users(id) cascade, unique |
| `building_summary` | text | not null | |
| `looking_for` | text | not null | |
| `can_help_with` | text | not null | |
| `talk_to_me_if` | text | not null | |
| `tags` | text[] | `{}` | GIN indexed |
| `intents` | text[] | `{}` | |
| `embedding` | vector(1536) | nullable | OpenAI text-embedding shape |
| `open_to_async` | bool | `true` | |
| `open_to_in_person` | bool | `true` | |
| `paused` | bool | `false` | |
| `updated_at` | timestamptz | `now()` | |
| `version` | int | `1` | |

**Indexes:**
- `founder_cards_tags_idx` GIN on `tags`
- `founder_cards_embedding_idx` IVFFLAT `vector_cosine_ops` lists=100
- `founder_cards_updated_at_idx (updated_at desc)`

**RLS:**
- SELECT — both parties verified, via `is_verified_user(auth.uid())`
- INSERT/ALL/DELETE — `user_id = auth.uid()`

**Read sites:** `/api/drops` (TODO), `/api/browse` (TODO), Matchmaker agent
**Write sites:** Onboarding flow (TODO in prod), profile edit

**Risks:** No partial index on `paused = false` despite hot read filter. IVFFLAT lists=100 with only ~2,000 rows is aggressive but acceptable.

---

### `intent_interviews` — onboarding transcript + structured intent

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | PK |
| `user_id` | uuid | not null | FK users(id) cascade |
| `transcript` | jsonb | not null | full conversation |
| `structured_intent` | jsonb | not null | parsed intent and tags |
| `created_at` | timestamptz | `now()` | |

**Indexes:** none

**RLS:** SELECT/INSERT — `user_id = auth.uid()`

**Risk:** No index on `(user_id, created_at)` for "recent interviews" queries. JSONB unstructured.

---

### `verifications` — trust tier audit trail

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | PK |
| `user_id` | uuid | not null | FK users(id) cascade |
| `method` | text | not null | linkedin / twitter / photo |
| `artifact_url` | text | | |
| `artifact_expires_at` | timestamptz | | retention cron deletes after this |
| `classifier_score` | int | | 0–100 |
| `submitted_at` | timestamptz | `now()` | |
| `reviewed_at` | timestamptz | | |
| `reviewer_id` | uuid | | FK users(id) |
| `decision` | text | | |

**Indexes:** none (risk: admin queries scan)

**RLS:** SELECT/INSERT — `user_id = auth.uid()`. Admin reads via service role.

**Risk:** No `(user_id, submitted_at)` index. Cron retention reads `artifact_expires_at < now()` — needs index.

---

### `drops` — weekly delivery container

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | PK |
| `user_id` | uuid | not null | FK users(id) cascade |
| `cycle_week` | date | not null | week marker |
| `generated_at` | timestamptz | `now()` | |
| `sent_at` | timestamptz | | |
| `opened_at` | timestamptz | | |
| `status` | drop_status enum | `'queued'` | `queued | sent | opened` |

**Indexes:** `drops_user_cycle_idx UNIQUE(user_id, cycle_week)`

**RLS:** SELECT/INSERT — `user_id = auth.uid()`

**Risk:** No index on `status` or `sent_at` for admin queries. `cycle_week` is `date`, not week marker — timezone semantics are unclear (PT vs UTC).

---

### `matches` — three slots per drop

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | PK |
| `drop_id` | uuid | not null | FK drops(id) cascade |
| `user_id` | uuid | not null | FK users(id) cascade — recipient (drop owner) |
| `candidate_user_id` | uuid | not null | FK users(id) cascade — suggested match |
| `match_type` | match_type enum | not null | `domain_peer | cofounder_shape | weird_adjacent | city_match` |
| `score` | real | not null | 0..1 |
| `reasoning_trace` | jsonb | | debug |
| `explanation` | text | not null | user-facing reason |
| `suggested_opener` | text | not null | half-written opener |
| `position` | int | check 1..3 | slot in drop |
| `shown_at` | timestamptz | | |
| `viewed_at` | timestamptz | | |
| `action` | match_action enum | | `skip | save | request | not_relevant` |
| `action_at` | timestamptz | | |

**Indexes:**
- `matches_drop_idx (drop_id)`
- `matches_candidate_idx (candidate_user_id)`
- `matches_action_idx (action)` partial WHERE `action IS NOT NULL`

**RLS:** SELECT/INSERT/UPDATE — `user_id = auth.uid()`

**Risk:** No `(score)` index for analytics. JSONB `reasoning_trace` unbounded.

---

### `intros` — intro request between two users

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | PK |
| `requester_id` | uuid | not null | FK users(id) cascade |
| `recipient_id` | uuid | not null | FK users(id) cascade |
| `match_id` | uuid | | FK matches(id) on delete set null |
| `note` | text | | optional 0–500 chars |
| `sent_at` | timestamptz | `now()` | |
| `response` | intro_response enum | `'pending'` | `pending | accept | decline | save | expired` |
| `response_at` | timestamptz | | |
| `contact_unlocked_at` | timestamptz | | |
| `email_sent_at` | timestamptz | | |

**Indexes:**
- `intros_requester_idx (requester_id)`
- `intros_recipient_idx (recipient_id)`
- `intros_response_idx (response)`

**RLS:**
- SELECT — `requester_id = auth.uid() OR recipient_id = auth.uid()`
- INSERT — must be requester AND match must belong to requester AND recipient must equal candidate (cold-spam guard)
- UPDATE — `recipient_id = auth.uid()` (only recipient updates response)
- DELETE — `requester_id = auth.uid()`

**Risk:** Composite index `(response, response_at)` would help "recent accepts" queries. `contact_unlocked_at` business rule unclear.

---

### `meetings` — post-meeting feedback per participant

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | PK |
| `intro_id` | uuid | not null | FK intros(id) cascade |
| `occurred` | bool | | |
| `occurred_at` | timestamptz | | |
| `outcome` | meeting_outcome enum | | `worth | neutral | waste` |
| `feedback_text` | text | | |
| `recorded_at` | timestamptz | `now()` | |
| `author_id` | uuid | not null | FK users(id) (added in 0002) |

**Indexes:** `meetings_intro_author_idx UNIQUE(intro_id, author_id)`

**RLS:** SELECT/INSERT/UPDATE/DELETE based on participant or author check.

**Risk:** `occurred` and `outcome` nullable; meaning of NULL ambiguous.

---

### `reports` — user safety reports

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | PK |
| `reporter_id` | uuid | not null | FK users(id) cascade |
| `reported_user_id` | uuid | not null | FK users(id) cascade |
| `reason` | text | not null | spam / harassment / fake (text, not enum — risk) |
| `context` | jsonb | | |
| `classifier_score` | int | | |
| `status` | text | `'open'` | should be enum |
| `action_taken` | text | | |
| `created_at` | timestamptz | `now()` | |

**Indexes:** none (risk)

**RLS:** SELECT/INSERT — `reporter_id = auth.uid()`. Admin via service role.

**Risk:** `status` is text not enum. No `(status, created_at)` or `(reported_user_id)` indexes for admin moderation queue.

---

### `agent_logs` — Claude API call audit

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | uuid | `gen_random_uuid()` | PK |
| `agent_name` | text | not null | |
| `user_id` | uuid | | FK users(id) on delete set null |
| `prompt` | text | not null | |
| `response` | text | | |
| `model` | text | | |
| `tokens_in` | int | `0` | |
| `tokens_out` | int | `0` | |
| `latency_ms` | int | | |
| `cost_usd` | numeric(10, 6) | `0` | |
| `feedback_signal` | jsonb | | |
| `invoked_at` | timestamptz | `now()` | |

**Indexes:**
- `agent_logs_user_idx (user_id, invoked_at desc)`
- `agent_logs_agent_idx (agent_name, invoked_at desc)`

**RLS:** REVOKE ALL from `authenticated`, `anon`. Service role only.

**Risks:** Sensitive data (full prompts and responses) logged indefinitely. No retention TTL or partition strategy. Estimated 8 agents × 2,000 users × frequent calls → fast row growth. **Plan retention or partition.**

---

### `taste_profiles` — learned preference vector (Phase 3)

| Column | Type | Default | Notes |
|---|---|---|---|
| `user_id` | uuid | PK | FK users(id) cascade |
| `embedding` | vector(1536) | | |
| `preferred_match_types` | jsonb | | |
| `diversity_inject` | text[] | | |
| `last_updated` | timestamptz | `now()` | |

**Indexes:** none (risk: no IVFFLAT yet)

**RLS:** SELECT/UPDATE/INSERT — `user_id = auth.uid()`

**Status:** unused in current code. Will be populated by Feedback Learner agent in Phase 3.

---

### `retention_audit` (UNKNOWN — referenced by cron, not seen in migration excerpt)

The cron retention route states it will write to `retention_audit`. Verify the migration includes it; if not, add it.

## Relationship diagram

```
users
 ├── founder_cards     (1:1 user_id, cascade)
 ├── intent_interviews (1:many user_id, cascade)
 ├── verifications     (1:many user_id, cascade)
 ├── drops             (1:many user_id, cascade)
 │    └── matches      (1:many drop_id, cascade)
 │         └── intros  (0..1 match_id, set null)
 │              └── meetings (1:many intro_id, cascade)
 ├── intros (1:many requester_id OR recipient_id, cascade)
 ├── reports (1:many reporter_id OR reported_user_id, cascade)
 ├── agent_logs (1:many user_id, set null)
 └── taste_profiles (1:1 user_id, cascade)
```

## Vector embeddings

- **`founder_cards.embedding`** — `vector(1536)`. Index: IVFFLAT cosine, lists=100.
  - Source: OpenAI `text-embedding-3-large` (assumed; UNKNOWN — verify in any embedding generation script)
  - Query path: Matchmaker agent ranks top-50 candidates by cosine similarity (TODO: not yet implemented in app code)
- **`taste_profiles.embedding`** — `vector(1536)`. No index yet. Phase 3.

**Performance note:** With ~2,000 rows, lists=100 (≈20 rows/list) is aggressive. Bulk-insert seed will need `REINDEX` after.

## Generated types file

There is no auto-generated `database.types.ts`. Hand-written domain types live in `src/lib/types.ts`:

```
TrustTier      = "provisional" | "verified" | "peer_vouched"
MatchType      = "domain_peer" | "cofounder_shape" | "weird_adjacent" | "city_match"
Intent         = "cofounder" | "collaborator" | "peer" | "friend"
FounderCard    { id, user_id, name, location, ..., updated_at }
Match          { id, drop_id, user_id, candidate, type, score, trace, explanation, opener, position, shown_at, action }
Drop           { id, user_id, cycle_week, matches[], generated_at, sent_at, opened_at }
IntroRequest   { ... }
AgentInvocation { ... }
IntentInterviewTurn { role, content }
```

**Risk:** `FounderCard.going_to_sf` exists in TypeScript but is not a column in `founder_cards`. It is denormalized client-side or stored in `intents`. Reconcile.

`package.json` has `db:generate: tsx scripts/generate-types.ts` but the script does not exist. Either implement using Supabase CLI (`supabase gen types typescript`) or remove the entry.

## Seed data

- `MOCK_COHORT` (`src/lib/mock/cohort.ts`) — closed-beta default ~50 founders.
- `harness/personas/seed.ts` — 12 YC-archetype personas for the harness (in-memory only).
- `package.json` references `db:seed: tsx scripts/seed-cohort.ts` but **the file is missing**.

**Action item:** Implement `scripts/seed-cohort.ts` to import the 2,000-attendee CSV before launch.

## Migration scripts

| Script | What it does | Status |
|---|---|---|
| `bun run db:migrate` | `supabase db push` | works (assuming Supabase CLI installed) |
| `bun run db:migrate:dry` | `supabase db push --dry-run` | works |
| `bun run db:generate` | `tsx scripts/generate-types.ts` | broken (file missing) |
| `bun run db:seed` | `tsx scripts/seed-cohort.ts` | broken (file missing) |

## Database risks (ranked)

| # | Risk | Mitigation | Effort |
|---|---|---|---|
| 1 | No seed script for the 2,000 attendee list | Implement `scripts/seed-cohort.ts` (CSV → INSERT) | 2h |
| 2 | `/api/drops` not wired to `founder_cards` | Add Supabase server client read | 1h |
| 3 | `/api/intros` ownership check throws | Wire `matches` query | 1h |
| 4 | `agent_logs` grows unbounded with sensitive prompts | 30-day TTL + partition by `invoked_at` | 4h |
| 5 | `reports.status` is text, not enum | Add CHECK or convert to enum | 1h |
| 6 | `taste_profiles` unused, has no index | Decide: drop or wait for Phase 3 + add IVFFLAT | 0.5h |
| 7 | `intent_interviews`, `verifications` lack indexes | Add `(user_id, created_at desc)` and `(artifact_expires_at)` | 0.5h |
| 8 | `drops.cycle_week` timezone semantics unclear | Document; add comment or rename `cycle_week_start_pt` | 0.25h |
| 9 | `users.verification_artifact_id` has no FK | Add FK with on delete set null | 0.5h |
| 10 | `matches.reasoning_trace` JSONB bloats hot row | Move to `match_debug_logs` if analytics pipe needs it | 2h |

## Backend owner action items (DB)

**Critical path before launch:**

1. Create `scripts/seed-cohort.ts`. CSV import, dedupe by email, upsert `users` + minimal `founder_cards`.
2. Wire `/api/drops` `loadMeFromDb()` (Supabase anon client + service role for cross-user reads).
3. Wire `/api/intros` `assertMatchOwnership()`.
4. Wire `agent_logs` insert in `src/lib/agents/log.ts:98`.
5. Implement cron retention deletion + `retention_audit` write.

**Before scaling beyond closed-beta:**

6. Add indexes flagged above (verifications, intent_interviews, reports).
7. Plan `agent_logs` TTL/partitioning.
8. Reconcile `FounderCard.going_to_sf` type-vs-schema drift.
9. Decide PocketBase fate.
10. Add `database.types.ts` generation via Supabase CLI.

## Things to verify with the owner

- Embedding model: confirm OpenAI `text-embedding-3-large` (1536-dim) is the source.
- `cycle_week`: is the semantics "Monday of the week in PT"? Document.
- Retention window: is 24h after upload the right TTL for verification screenshots?
- Whether to keep PocketBase scaffolding or remove.
