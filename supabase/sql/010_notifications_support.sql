-- NOT RUN - owner runs in Supabase
-- Adds customer notifications and support conversations with owner/admin RLS.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  body text not null default '' check (char_length(body) <= 2000),
  href text check (href is null or (href like '/%' and href not like '//%')),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists yvx_notifications_user_idx on public.notifications (user_id, created_at desc);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null check (char_length(subject) between 3 and 160),
  status text not null default 'open' check (status in ('open','in_progress','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);
create index if not exists yvx_support_tickets_user_idx on public.support_tickets (user_id, updated_at desc);
create index if not exists yvx_support_tickets_status_idx on public.support_tickets (status, updated_at desc);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists yvx_support_messages_ticket_idx on public.support_messages (ticket_id, created_at);

drop trigger if exists yvx_support_ticket_updated on public.support_tickets;
create trigger yvx_support_ticket_updated before update on public.support_tickets
  for each row execute function public.yvx_set_updated_at();

alter table public.notifications enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
revoke all on public.notifications, public.support_tickets, public.support_messages from anon, authenticated;
grant select, insert, update (read_at) on public.notifications to authenticated;
grant insert, select, update (status, closed_at) on public.support_tickets to authenticated;
grant insert, select on public.support_messages to authenticated;

drop policy if exists "yvx: customers read own notifications" on public.notifications;
create policy "yvx: customers read own notifications" on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "yvx: customers mark own notifications read" on public.notifications;
create policy "yvx: customers mark own notifications read" on public.notifications
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
drop policy if exists "yvx: admins manage notifications" on public.notifications;
create policy "yvx: admins manage notifications" on public.notifications
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "yvx: customers read own support tickets" on public.support_tickets;
create policy "yvx: customers read own support tickets" on public.support_tickets
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "yvx: customers open own support tickets" on public.support_tickets;
create policy "yvx: customers open own support tickets" on public.support_tickets
  for insert to authenticated with check (user_id = (select auth.uid()) and status = 'open');
drop policy if exists "yvx: customers close own support tickets" on public.support_tickets;
create policy "yvx: customers close own support tickets" on public.support_tickets
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and status = 'closed');
drop policy if exists "yvx: admins manage support tickets" on public.support_tickets;
create policy "yvx: admins manage support tickets" on public.support_tickets
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "yvx: customers read own ticket messages" on public.support_messages;
create policy "yvx: customers read own ticket messages" on public.support_messages
  for select to authenticated using (
    exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = (select auth.uid()))
  );
drop policy if exists "yvx: customers reply to open own tickets" on public.support_messages;
create policy "yvx: customers reply to open own tickets" on public.support_messages
  for insert to authenticated with check (
    sender_id = (select auth.uid())
    and exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = (select auth.uid()) and t.status <> 'closed')
  );
drop policy if exists "yvx: admins manage support messages" on public.support_messages;
create policy "yvx: admins manage support messages" on public.support_messages
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
