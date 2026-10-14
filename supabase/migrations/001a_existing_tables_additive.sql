-- YAWVOREX 001a: ADD missing columns/rules to your EXISTING tables. Nothing is dropped, renamed, retyped or deleted.
-- Written for your actual schema (from your inspection report). Safe to run more than once.
-- Run order: 001a, 001b, 001c, 002, 003, then (optional) 004.

-- profiles (existing: id, created_at, display_name)
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();
alter table public.profiles drop constraint if exists yvx_profiles_lengths_ck;
alter table public.profiles add constraint yvx_profiles_lengths_ck check (char_length(display_name) <= 100 and char_length(phone) <= 30);

-- products (existing: price, stock, is_published, image_url, currency ... are KEPT and used as they are)
alter table public.products add column if not exists product_type text not null default 'physical';
alter table public.products add column if not exists is_demo boolean not null default false;
alter table public.products drop constraint if exists yvx_products_type_ck;
alter table public.products add constraint yvx_products_type_ck check (product_type in ('digital','physical'));
create index if not exists yvx_products_category_idx on public.products (category_id);
create index if not exists yvx_products_published_idx on public.products (is_published, created_at desc);

-- orders (existing: status, payment_status, currency, total, customer_name, customer_email ... are KEPT)
alter table public.orders add column if not exists order_ref text;
alter table public.orders add column if not exists payment_method text;
alter table public.orders add column if not exists subtotal numeric(12,2);
alter table public.orders add column if not exists shipping_total numeric(12,2) not null default 0;
alter table public.orders add column if not exists customer_phone text;
alter table public.orders add column if not exists delivery_address text;
alter table public.orders add column if not exists delivery_city text;
alter table public.orders add column if not exists delivery_country text;
alter table public.orders add column if not exists customer_notes text;
alter table public.orders add column if not exists updated_at timestamptz not null default now();
update public.orders set order_ref = 'YVX-' || upper(substr(replace(id::text, '-', ''), 1, 8)) where order_ref is null;
alter table public.orders alter column order_ref set default ('YVX-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)));
alter table public.orders alter column order_ref set not null;
create unique index if not exists yvx_orders_order_ref_uq on public.orders (order_ref);
create index if not exists yvx_orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists yvx_orders_status_idx on public.orders (status);
create index if not exists yvx_orders_payment_status_idx on public.orders (payment_status);
alter table public.orders drop constraint if exists yvx_orders_method_ck;
alter table public.orders add constraint yvx_orders_method_ck check (payment_method in ('whatsapp','manual'));
alter table public.orders drop constraint if exists yvx_orders_amounts_ck;
alter table public.orders add constraint yvx_orders_amounts_ck check (shipping_total >= 0 and (subtotal is null or (subtotal >= 0 and total = subtotal + shipping_total)));
alter table public.orders drop constraint if exists yvx_orders_notes_ck;
alter table public.orders add constraint yvx_orders_notes_ck check (char_length(customer_notes) <= 1000);

-- order_items (existing: id bigint, order_id, product_id, product_name, quantity, unit_price)
alter table public.order_items add column if not exists variant_id uuid;
alter table public.order_items add column if not exists variant_label text;
alter table public.order_items add column if not exists product_type text;
alter table public.order_items add column if not exists line_total numeric generated always as (unit_price * quantity) stored;
alter table public.order_items add column if not exists created_at timestamptz not null default now();
alter table public.order_items drop constraint if exists yvx_order_items_type_ck;
alter table public.order_items add constraint yvx_order_items_type_ck check (product_type in ('digital','physical'));
create index if not exists yvx_order_items_order_idx on public.order_items (order_id);

-- service_requests (existing: customer_name, customer_email, service_type, details, status, user_id)
alter table public.service_requests add column if not exists contact_method text;
alter table public.service_requests add column if not exists contact_value text;
alter table public.service_requests add column if not exists budget text;
alter table public.service_requests add column if not exists deadline date;
alter table public.service_requests add column if not exists reference_url text;
alter table public.service_requests add column if not exists updated_at timestamptz not null default now();
alter table public.service_requests drop constraint if exists yvx_requests_contact_ck;
alter table public.service_requests add constraint yvx_requests_contact_ck check (contact_method in ('Telegram','WhatsApp','Email','Phone'));
alter table public.service_requests drop constraint if exists yvx_requests_url_ck;
alter table public.service_requests add constraint yvx_requests_url_ck check (reference_url ~* '^https?://');
alter table public.service_requests drop constraint if exists yvx_requests_details_ck;
alter table public.service_requests add constraint yvx_requests_details_ck check (char_length(details) <= 2000);
create index if not exists yvx_requests_status_idx on public.service_requests (status, created_at desc);
create index if not exists yvx_requests_user_idx on public.service_requests (user_id);
select 'OK: 001a finished' as result;
