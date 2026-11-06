-- Migration: 020_vendors_table.sql
-- Purpose: Create vendors table to manage marketplace vendors.

begin;

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  store_name text not null,
  store_slug text not null unique,
  description text,
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS policies
alter table public.vendors enable row level security;

-- Allow vendors to read their own profile
drop policy if exists "yvx: vendors read own profile" on public.vendors;
create policy "yvx: vendors read own profile" on public.vendors
  for select to authenticated using (user_id = (select auth.uid()));

-- Allow admins to manage vendors
drop policy if exists "yvx: admins manage vendors" on public.vendors;
create policy "yvx: admins manage vendors" on public.vendors
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

commit;
