-- YAWVOREX migration 001: tables, constraints, indexes, triggers.
-- Safe to run more than once. Run this FIRST.

create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;

-- ---------- Profiles (one per signed-up user; NO role stored here) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text check (full_name is null or char_length(full_name) <= 100),
  phone text check (phone is null or char_length(phone) <= 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Roles (written ONLY from the SQL Editor, never by the website) ----------
create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin')),
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

-- ---------- Catalog ----------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('product','portfolio')),
  name text not null check (char_length(name) between 1 and 80),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scope, slug)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 120),
  description text not null default '' check (char_length(description) <= 5000),
  product_type text not null check (product_type in ('digital','physical')),
  base_price numeric(12,2) not null check (base_price >= 0),
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_status_created_idx on public.products (status, created_at desc);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 60),
  sku text unique,
  price_delta numeric(12,2) not null default 0,
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists product_variants_product_idx on public.product_variants (product_id);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  alt_text text not null default '' check (char_length(alt_text) <= 200),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists product_images_product_idx on public.product_images (product_id);

-- ---------- Orders (created ONLY by trusted server code in Phase 5) ----------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_ref text not null unique default ('YVX-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in
    ('pending','awaiting_payment','payment_under_review','confirmed','processing','shipped','completed','cancelled','refunded')),
  payment_method text not null check (payment_method in ('whatsapp','manual')),
  currency text not null default 'USD' check (char_length(currency) = 3),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  shipping_total numeric(12,2) not null default 0 check (shipping_total >= 0),
  total numeric(12,2) not null check (total >= 0),
  customer_name text not null check (char_length(customer_name) between 2 and 100),
  customer_phone text not null check (char_length(customer_phone) between 7 and 30),
  customer_email text check (customer_email is null or char_length(customer_email) <= 200),
  delivery_address text,
  delivery_city text,
  delivery_country text,
  customer_notes text check (customer_notes is null or char_length(customer_notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_total_matches check (total = subtotal + shipping_total)
);
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status, created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  variant_label text,
  product_type text not null check (product_type in ('digital','physical')),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity between 1 and 100),
  line_total numeric(12,2) not null,
  created_at timestamptz not null default now(),
  constraint order_items_line_total_matches check (line_total = unit_price * quantity)
);
create index if not exists order_items_order_idx on public.order_items (order_id);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists order_status_history_order_idx on public.order_status_history (order_id, created_at);

create table if not exists public.manual_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  method text not null check (char_length(method) between 1 and 60),
  reference text check (reference is null or char_length(reference) <= 200),
  status text not null default 'submitted' check (status in ('submitted','verified','rejected')),
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint manual_payments_verified_has_actor check (status <> 'verified' or (verified_by is not null and verified_at is not null))
);
create index if not exists manual_payments_order_idx on public.manual_payments (order_id);

-- ---------- Client requests, portfolio, settings, files ----------
create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null check (char_length(name) between 2 and 80),
  contact_method text not null check (contact_method in ('Telegram','WhatsApp','Email','Phone')),
  contact_value text not null check (char_length(contact_value) between 3 and 120),
  service_slug text not null check (char_length(service_slug) <= 80),
  description text not null check (char_length(description) between 20 and 2000),
  budget text,
  deadline date,
  reference_url text check (reference_url is null or reference_url ~* '^https?://'),
  status text not null default 'new' check (status in ('new','contacted','in_progress','completed','declined')),
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists service_requests_status_idx on public.service_requests (status, created_at desc);

create table if not exists public.portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 120),
  summary text not null default '',
  brief text not null default '',
  approach text not null default '',
  deliverables text[] not null default '{}',
  tags text[] not null default '{}',
  live_url text check (live_url is null or live_url ~* '^https?://'),
  cover_image_path text,
  is_demo boolean not null default false,
  status text not null default 'draft' check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists portfolio_status_idx on public.portfolio_projects (status, created_at desc);

create table if not exists public.site_settings (
  key text primary key check (key ~ '^[a-z0-9_.-]+$'),
  value jsonb not null,
  is_public boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.digital_files (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  storage_bucket text not null default 'digital-files' check (storage_bucket = 'digital-files'),
  storage_path text not null,
  file_name text not null,
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes >= 0),
  created_at timestamptz not null default now(),
  unique (storage_bucket, storage_path)
);
create index if not exists digital_files_product_idx on public.digital_files (product_id);

-- ---------- updated_at triggers ----------
do $$
declare t text;
begin
  foreach t in array array['profiles','categories','products','product_variants','orders','manual_payments','service_requests','portfolio_projects','site_settings']
  loop
    execute format('drop trigger if exists %I on public.%I', t || '_set_updated_at', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_set_updated_at', t);
  end loop;
end $$;

-- ---------- Order status history (automatic) ----------
create or replace function public.log_order_status_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_status_history (order_id, from_status, to_status, changed_by) values (new.id, null, new.status, auth.uid());
  elsif new.status is distinct from old.status then
    insert into public.order_status_history (order_id, from_status, to_status, changed_by) values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end; $$;
drop trigger if exists orders_log_status on public.orders;
create trigger orders_log_status after insert or update of status on public.orders
  for each row execute function public.log_order_status_change();

-- ---------- Auto-create a profile when someone signs up ----------
-- Only the display name is copied. Roles are NEVER taken from sign-up data.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(left(new.raw_user_meta_data ->> 'full_name', 100), ''))
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Profiles for accounts created before this migration
insert into public.profiles (id) select id from auth.users on conflict (id) do nothing;

-- Trigger functions must not be callable from the website API
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.log_order_status_change() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
