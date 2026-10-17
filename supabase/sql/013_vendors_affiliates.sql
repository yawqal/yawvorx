-- NOT RUN - owner runs in Supabase.
-- Vendor application review and referral visit tracking proposal.
-- Does not change authentication, checkout, or any yvx_* RPC.

create table if not exists public.vendor_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  business_name text not null check (char_length(business_name) between 2 and 120),
  contact_value text not null check (char_length(contact_value) between 3 and 150),
  description text not null check (char_length(description) between 20 and 2000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text check (admin_note is null or char_length(admin_note) <= 1000),
  referral_code text unique check (referral_code is null or referral_code ~ '^[A-F0-9]{10}$'),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists yvx_vendor_applications_status_idx
  on public.vendor_applications (status, created_at desc);

create table if not exists public.affiliate_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-F0-9]{10}$'),
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.affiliate_events (
  id uuid primary key default gen_random_uuid(),
  affiliate_code_id uuid not null references public.affiliate_codes(id) on delete cascade,
  event_type text not null check (event_type in ('click', 'signup')),
  referred_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check ((event_type = 'click' and referred_user_id is null) or
         (event_type = 'signup' and referred_user_id is not null))
);

create index if not exists yvx_affiliate_events_code_type_idx
  on public.affiliate_events (affiliate_code_id, event_type, created_at desc);
create unique index if not exists yvx_affiliate_events_signup_once_idx
  on public.affiliate_events (affiliate_code_id, referred_user_id)
  where event_type = 'signup';

alter table public.vendor_applications enable row level security;
alter table public.affiliate_codes enable row level security;
alter table public.affiliate_events enable row level security;

revoke all on public.vendor_applications, public.affiliate_codes, public.affiliate_events from anon, authenticated;
grant select on public.vendor_applications to authenticated;
grant insert (user_id, business_name, contact_value, description) on public.vendor_applications to authenticated;
grant update (status, admin_note, reviewed_by, reviewed_at, referral_code) on public.vendor_applications to authenticated;
grant select, insert, update, delete on public.affiliate_codes to authenticated;
grant select on public.affiliate_events to authenticated;
grant insert (affiliate_code_id, event_type) on public.affiliate_events to authenticated, anon;
grant select (id, code, is_active) on public.affiliate_codes to anon;

drop policy if exists "yvx: applicants read own vendor application" on public.vendor_applications;
create policy "yvx: applicants read own vendor application" on public.vendor_applications
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "yvx: applicants create pending application" on public.vendor_applications;
create policy "yvx: applicants create pending application" on public.vendor_applications
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and status = 'pending'
    and admin_note is null
    and reviewed_by is null
    and reviewed_at is null
    and referral_code is null
  );
drop policy if exists "yvx: admins manage vendor applications" on public.vendor_applications;
create policy "yvx: admins manage vendor applications" on public.vendor_applications
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "yvx: approved referral codes are public" on public.affiliate_codes;
create policy "yvx: approved referral codes are public" on public.affiliate_codes
  for select to anon, authenticated using (is_active or public.is_admin());
drop policy if exists "yvx: admins manage affiliate codes" on public.affiliate_codes;
create policy "yvx: admins manage affiliate codes" on public.affiliate_codes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "yvx: approved affiliates record clicks" on public.affiliate_events;
create policy "yvx: approved affiliates record clicks" on public.affiliate_events
  for insert to anon, authenticated with check (
    event_type = 'click'
    and referred_user_id is null
    and exists (
      select 1 from public.affiliate_codes c
      where c.id = affiliate_code_id and c.is_active
    )
  );
drop policy if exists "yvx: admins read affiliate events" on public.affiliate_events;
create policy "yvx: admins read affiliate events" on public.affiliate_events
  for select to authenticated using (public.is_admin());
drop policy if exists "yvx: admins manage affiliate events" on public.affiliate_events;
create policy "yvx: admins manage affiliate events" on public.affiliate_events
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
