-- Jumpstart initial schema. Section 18 of docs/superpowers/specs/2026-05-05-jumpstart-design.md.

create extension if not exists vector;

-- ENUMS

create type trust_tier as enum ('provisional', 'verified', 'peer_vouched');
create type match_type as enum ('domain_peer', 'cofounder_shape', 'weird_adjacent', 'city_match');
create type intro_response as enum ('pending', 'accept', 'decline', 'save', 'expired');
create type drop_status as enum ('queued', 'sent', 'opened');
create type match_action as enum ('skip', 'save', 'request', 'not_relevant');
create type meeting_outcome as enum ('worth', 'neutral', 'waste');

-- USERS

create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  linkedin_url text unique,
  phone text,
  name text not null,
  location text,
  trust_tier trust_tier not null default 'provisional',
  verification_artifact_id uuid,
  created_at timestamptz not null default now(),
  last_active timestamptz not null default now(),
  deleted_at timestamptz
);

create index users_last_active_idx on users (last_active desc);

-- FOUNDER CARDS

create table founder_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  building_summary text not null,
  looking_for text not null,
  can_help_with text not null,
  talk_to_me_if text not null,
  tags text[] not null default '{}'::text[],
  intents text[] not null default '{}'::text[],
  embedding vector (1536),
  open_to_async boolean not null default true,
  open_to_in_person boolean not null default true,
  paused boolean not null default false,
  updated_at timestamptz not null default now(),
  version int not null default 1,
  unique (user_id)
);

create index founder_cards_tags_idx on founder_cards using gin (tags);
create index founder_cards_embedding_idx on founder_cards using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index founder_cards_updated_at_idx on founder_cards (updated_at desc);

-- INTENT INTERVIEWS

create table intent_interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  transcript jsonb not null,
  structured_intent jsonb not null,
  created_at timestamptz not null default now()
);

-- VERIFICATIONS

create table verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  method text not null,
  artifact_url text,
  artifact_expires_at timestamptz,
  classifier_score int,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewer_id uuid references users (id),
  decision text
);

-- DROPS

create table drops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  cycle_week date not null,
  generated_at timestamptz not null default now(),
  sent_at timestamptz,
  opened_at timestamptz,
  status drop_status not null default 'queued'
);

create unique index drops_user_cycle_idx on drops (user_id, cycle_week);

-- MATCHES

create table matches (
  id uuid primary key default gen_random_uuid(),
  drop_id uuid not null references drops (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  candidate_user_id uuid not null references users (id) on delete cascade,
  match_type match_type not null,
  score real not null,
  reasoning_trace jsonb,
  explanation text not null,
  suggested_opener text not null,
  position int not null check (position between 1 and 3),
  shown_at timestamptz,
  viewed_at timestamptz,
  action match_action,
  action_at timestamptz
);

create index matches_drop_idx on matches (drop_id);
create index matches_candidate_idx on matches (candidate_user_id);
create index matches_action_idx on matches (action) where action is not null;

-- INTROS

create table intros (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references users (id) on delete cascade,
  recipient_id uuid not null references users (id) on delete cascade,
  match_id uuid references matches (id) on delete set null,
  note text,
  sent_at timestamptz not null default now(),
  response intro_response not null default 'pending',
  response_at timestamptz,
  contact_unlocked_at timestamptz,
  email_sent_at timestamptz
);

create index intros_requester_idx on intros (requester_id);
create index intros_recipient_idx on intros (recipient_id);
create index intros_response_idx on intros (response);

-- MEETINGS

create table meetings (
  id uuid primary key default gen_random_uuid(),
  intro_id uuid not null references intros (id) on delete cascade,
  occurred boolean,
  occurred_at timestamptz,
  outcome meeting_outcome,
  feedback_text text,
  recorded_at timestamptz not null default now()
);

-- REPORTS

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references users (id) on delete cascade,
  reported_user_id uuid not null references users (id) on delete cascade,
  reason text not null,
  context jsonb,
  classifier_score int,
  status text not null default 'open',
  action_taken text,
  created_at timestamptz not null default now()
);

-- AGENT LOGS

create table agent_logs (
  id uuid primary key default gen_random_uuid(),
  agent_name text not null,
  user_id uuid references users (id) on delete set null,
  prompt text not null,
  response text,
  model text,
  tokens_in int default 0,
  tokens_out int default 0,
  latency_ms int,
  cost_usd numeric(10, 6) default 0,
  feedback_signal jsonb,
  invoked_at timestamptz not null default now()
);

create index agent_logs_user_idx on agent_logs (user_id, invoked_at desc);
create index agent_logs_agent_idx on agent_logs (agent_name, invoked_at desc);

-- TASTE PROFILES

create table taste_profiles (
  user_id uuid primary key references users (id) on delete cascade,
  embedding vector (1536),
  preferred_match_types jsonb,
  diversity_inject text[],
  last_updated timestamptz not null default now()
);

-- ROW LEVEL SECURITY

alter table users enable row level security;
alter table founder_cards enable row level security;
alter table intent_interviews enable row level security;
alter table verifications enable row level security;
alter table drops enable row level security;
alter table matches enable row level security;
alter table intros enable row level security;
alter table meetings enable row level security;
alter table reports enable row level security;
alter table agent_logs enable row level security;
alter table taste_profiles enable row level security;

-- Read policies. Verified attendees see verified attendees only.

create policy "verified can read verified cards"
on founder_cards for select
to authenticated
using (
  exists (
    select 1 from users self where self.id = auth.uid() and self.trust_tier in ('verified', 'peer_vouched')
  )
  and exists (
    select 1 from users target where target.id = founder_cards.user_id and target.trust_tier in ('verified', 'peer_vouched')
  )
);

-- Users can always edit their own card.

create policy "users edit own card"
on founder_cards for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Drops, matches, intros, meetings, reports: only the owning user.

create policy "drops are private to user"
on drops for select
to authenticated
using (user_id = auth.uid());

create policy "matches visible to drop owner"
on matches for select
to authenticated
using (user_id = auth.uid());

create policy "intros visible to participants"
on intros for select
to authenticated
using (requester_id = auth.uid() or recipient_id = auth.uid());

-- Agent logs are admin-only at the application level (no policy granting access here).
