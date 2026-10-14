-- YAWVOREX 001b1: product variants and images. Creates missing tables only. Safe to run more than once.
-- Run in order: 001b1, then 001b2, then 001b3.

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 60),
  sku text unique,
  price_delta numeric(12,2) not null default 0,
  stock integer check (stock is null or stock >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists yvx_variants_product_idx on public.product_variants (product_id);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  alt_text text not null default '' check (char_length(alt_text) <= 200),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists yvx_images_product_idx on public.product_images (product_id);

-- link order_items to variants now that the variants table exists
alter table public.order_items drop constraint if exists yvx_order_items_variant_fk;
alter table public.order_items add constraint yvx_order_items_variant_fk foreign key (variant_id) references public.product_variants(id) on delete set null;
select 'OK: 001b1 finished' as result;
