-- YAWVOREX 001b3: portfolio, site settings, digital files. Creates missing tables only. Safe to run more than once.
-- Run in order: 001b1, then 001b2, then 001b3.

create table if not exists public.portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (char_length(slug) between 1 and 100 and slug !~ '[^a-z0-9-]'),
  title text not null check (char_length(title) between 1 and 120),
  category text,
  summary text not null default '',
  brief text not null default '',
  approach text not null default '',
  deliverables text[] not null default '{}',
  tags text[] not null default '{}',
  live_url text check (live_url is null or live_url ~* '^https?://'),
  cover_image_path text,
  is_demo boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists yvx_portfolio_published_idx on public.portfolio_projects (is_published, created_at desc);

create table if not exists public.site_settings (
  key text primary key check (key !~ '[^a-z0-9_.-]'),
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
create index if not exists yvx_digital_product_idx on public.digital_files (product_id);
select 'OK: 001b3 finished' as result;
