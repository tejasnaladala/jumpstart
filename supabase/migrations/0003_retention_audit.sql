-- Audit table for the retention cron. Each successful run inserts one row
-- so we can answer "did the daily retention job actually run, and what did
-- it touch" without grepping logs.
--
-- The table is service-role-only. No RLS policies are added because no
-- authenticated or anon user should ever read or write it.

create table retention_audit (
  id uuid primary key default gen_random_uuid(),
  run_at timestamptz not null default now(),
  deleted_count int not null default 0,
  audited_count int not null default 0,
  error text
);

create index retention_audit_run_at_idx on retention_audit (run_at desc);

revoke all on retention_audit from authenticated, anon;
