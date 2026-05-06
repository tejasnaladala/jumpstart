-- Complete RLS policies for the tables that had RLS enabled but no
-- policies in 0001_init.sql. Closes red-team CP1 finding (silent fails or
-- service-role free-for-all).
--
-- Pattern: every user can SELECT/UPSERT their own rows. Cross-user reads are
-- forbidden except via the founder_cards visibility rule already established
-- (verified attendees can read other verified attendees' cards).
-- Service-role bypasses RLS for admin tasks (moderation, scheduled jobs).

-- INTENT INTERVIEWS

create policy "users read own interview"
on intent_interviews for select to authenticated
using (user_id = auth.uid());

create policy "users insert own interview"
on intent_interviews for insert to authenticated
with check (user_id = auth.uid());

-- VERIFICATIONS

create policy "users read own verification"
on verifications for select to authenticated
using (user_id = auth.uid());

create policy "users insert own verification"
on verifications for insert to authenticated
with check (user_id = auth.uid());

-- MEETINGS
-- Both participants can READ. Each writes feedback attributed to themselves
-- via author_id. Closes Fool CP2 finding #6 (one party pre-writing the
-- other's outcome).

alter table meetings add column if not exists author_id uuid references users (id) on delete cascade;
create unique index if not exists meetings_intro_author_idx on meetings (intro_id, author_id);

create policy "participants read meeting"
on meetings for select to authenticated
using (
  exists (
    select 1 from intros
    where intros.id = meetings.intro_id
      and (intros.requester_id = auth.uid() or intros.recipient_id = auth.uid())
  )
);

create policy "participants insert own meeting feedback"
on meetings for insert to authenticated
with check (
  author_id = auth.uid()
  and exists (
    select 1 from intros
    where intros.id = meetings.intro_id
      and (intros.requester_id = auth.uid() or intros.recipient_id = auth.uid())
  )
);

create policy "authors update own meeting feedback"
on meetings for update to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

-- DELETE policies for GDPR right-to-erasure. Users can delete their own
-- artifacts. Cascades from users.deleted_at handle the rest at the data
-- layer; these policies cover direct authenticated deletes.

create policy "users delete own card"
on founder_cards for delete to authenticated
using (user_id = auth.uid());

create policy "users delete own intros"
on intros for delete to authenticated
using (requester_id = auth.uid());

create policy "users delete own meeting feedback"
on meetings for delete to authenticated
using (author_id = auth.uid());

-- REPORTS

create policy "reporter inserts own report"
on reports for insert to authenticated
with check (reporter_id = auth.uid());

create policy "reporter reads own report"
on reports for select to authenticated
using (reporter_id = auth.uid());

-- TASTE PROFILES

create policy "users read own taste profile"
on taste_profiles for select to authenticated
using (user_id = auth.uid());

create policy "users update own taste profile"
on taste_profiles for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "users insert own taste profile"
on taste_profiles for insert to authenticated
with check (user_id = auth.uid());

-- AGENT LOGS

-- Application code uses the service role to write here. No client-role
-- policy is granted, so authenticated callers cannot read or write
-- agent_logs at all. Founder-side moderation reads via service role.
revoke all on agent_logs from authenticated, anon;

-- INTROS: allow inserts where the requester is the session user, and
-- updates where the recipient is the session user (for accept/decline).

create policy "user requests own intro"
on intros for insert to authenticated
with check (requester_id = auth.uid());

create policy "recipient updates response"
on intros for update to authenticated
using (recipient_id = auth.uid())
with check (recipient_id = auth.uid());

-- DROPS: only the owning user can insert (via server) and update.

create policy "user owns own drops insert"
on drops for insert to authenticated
with check (user_id = auth.uid());

-- MATCHES: only the drop owner can update (action, action_at).

create policy "drop owner updates own match"
on matches for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "drop owner inserts own match"
on matches for insert to authenticated
with check (user_id = auth.uid());

-- USERS: read own row, update own row.

alter table users enable row level security;

create policy "users read own user row"
on users for select to authenticated
using (id = auth.uid());

create policy "users update own user row"
on users for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- FOUNDER CARDS: ensure the existing "verified can read verified cards"
-- policy from 0001 stays as the SELECT policy. Add explicit insert on top.

create policy "users insert own card"
on founder_cards for insert to authenticated
with check (user_id = auth.uid());
