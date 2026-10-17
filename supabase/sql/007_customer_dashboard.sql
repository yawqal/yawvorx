-- NOT RUN - owner runs in Supabase
-- Adds customer-owned addresses and wishlist rows, plus customer request creation.

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Home' check (char_length(label) between 1 and 60),
  full_name text not null check (char_length(full_name) between 2 and 100),
  phone text not null check (char_length(phone) between 3 and 30),
  address_line text not null check (char_length(address_line) between 3 and 300),
  city text not null check (char_length(city) between 2 and 100),
  region text,
  country text not null check (char_length(country) between 2 and 100),
  postal_code text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists yvx_customer_addresses_user_idx on public.customer_addresses (user_id, created_at desc);

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);
create index if not exists yvx_wishlist_user_idx on public.wishlist_items (user_id, created_at desc);

alter table public.customer_addresses enable row level security;
alter table public.wishlist_items enable row level security;
revoke all on public.customer_addresses, public.wishlist_items from anon, authenticated;
grant select, insert, update, delete on public.customer_addresses, public.wishlist_items to authenticated;

drop policy if exists "yvx: customers manage own addresses" on public.customer_addresses;
create policy "yvx: customers manage own addresses" on public.customer_addresses
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "yvx: customers manage own wishlist" on public.wishlist_items;
create policy "yvx: customers manage own wishlist" on public.wishlist_items
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

grant insert on public.service_requests to authenticated;
drop policy if exists "yvx: customers create own requests" on public.service_requests;
create policy "yvx: customers create own requests" on public.service_requests
  for insert to authenticated with check (user_id = (select auth.uid()));
