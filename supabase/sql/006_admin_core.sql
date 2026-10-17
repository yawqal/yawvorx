-- NOT RUN - owner runs in Supabase
-- Adds an admin-only audit trail for management actions.

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check (char_length(action) between 1 and 80),
  entity text not null check (char_length(entity) between 1 and 80),
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_log add column if not exists actor_id uuid references auth.users(id) on delete set null;
alter table public.audit_log add column if not exists action text;
alter table public.audit_log add column if not exists entity text;
alter table public.audit_log add column if not exists entity_id text;
alter table public.audit_log add column if not exists details jsonb not null default '{}'::jsonb;
alter table public.audit_log add column if not exists created_at timestamptz not null default now();

create index if not exists yvx_audit_log_created_idx on public.audit_log (created_at desc);
alter table public.audit_log enable row level security;
revoke all on public.audit_log from anon, authenticated;
grant select, insert on public.audit_log to authenticated;

drop policy if exists "yvx: admins read audit log" on public.audit_log;
create policy "yvx: admins read audit log" on public.audit_log
  for select to authenticated using (public.is_admin());
drop policy if exists "yvx: admins append audit log" on public.audit_log;
create policy "yvx: admins append audit log" on public.audit_log
  for insert to authenticated with check (public.is_admin() and actor_id = (select auth.uid()));
