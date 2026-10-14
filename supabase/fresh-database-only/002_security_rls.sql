-- YAWVOREX migration 002: admin check, table permissions, Row Level Security.
-- Run SECOND (after 001). Safe to run more than once.

-- ---------- Admin check (reads the protected user_roles table, cannot be faked by the browser) ----------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_roles where user_id = (select auth.uid()) and role = 'admin'
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------- Start from zero permissions, then grant only what is needed ----------
revoke all on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;

grant usage on schema public to anon, authenticated;

-- Public catalog (RLS below limits rows to published/approved ones)
grant select on public.categories, public.products, public.product_variants, public.product_images,
  public.portfolio_projects, public.site_settings to anon, authenticated;

-- Signed-in customers: own data only (RLS enforces "own")
grant select on public.profiles, public.orders, public.order_items, public.user_roles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;   -- cannot touch id or anything else

-- Admin-managed tables. A normal customer holds these grants too, but RLS blocks every row for them.
grant insert, update, delete on public.categories, public.products, public.product_variants,
  public.product_images, public.portfolio_projects, public.site_settings,
  public.orders, public.order_items to authenticated;
grant select, insert, update, delete on public.service_requests, public.manual_payments,
  public.digital_files, public.order_status_history to authenticated;
-- NOTE: user_roles has NO insert/update/delete grant for anyone. Roles change only in the SQL Editor.
-- NOTE: anon (not signed in) has NO write access to anything.

-- ---------- Turn on Row Level Security everywhere ----------
alter table public.profiles             enable row level security;
alter table public.user_roles           enable row level security;
alter table public.categories           enable row level security;
alter table public.products             enable row level security;
alter table public.product_variants     enable row level security;
alter table public.product_images       enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;
alter table public.order_status_history enable row level security;
alter table public.manual_payments      enable row level security;
alter table public.service_requests     enable row level security;
alter table public.portfolio_projects   enable row level security;
alter table public.site_settings        enable row level security;
alter table public.digital_files        enable row level security;

-- ---------- profiles ----------
drop policy if exists "profiles: read own" on public.profiles;
drop policy if exists "profiles: update own" on public.profiles;
drop policy if exists "profiles: admin read" on public.profiles;
create policy "profiles: read own"   on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "profiles: update own" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "profiles: admin read" on public.profiles for select to authenticated using (public.is_admin());

-- ---------- user_roles (read-only for the website; a user may see only their own role) ----------
drop policy if exists "roles: read own" on public.user_roles;
create policy "roles: read own" on public.user_roles for select to authenticated using (user_id = (select auth.uid()));

-- ---------- categories ----------
drop policy if exists "categories: public read active" on public.categories;
drop policy if exists "categories: admin all" on public.categories;
create policy "categories: public read active" on public.categories for select to anon, authenticated using (is_active);
create policy "categories: admin all" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- products ----------
drop policy if exists "products: public read published" on public.products;
drop policy if exists "products: admin all" on public.products;
create policy "products: public read published" on public.products for select to anon, authenticated using (status = 'published');
create policy "products: admin all" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- product_variants ----------
drop policy if exists "variants: public read" on public.product_variants;
drop policy if exists "variants: admin all" on public.product_variants;
create policy "variants: public read" on public.product_variants for select to anon, authenticated
  using (is_active and exists (select 1 from public.products p where p.id = product_id and p.status = 'published'));
create policy "variants: admin all" on public.product_variants for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- product_images ----------
drop policy if exists "images: public read" on public.product_images;
drop policy if exists "images: admin all" on public.product_images;
create policy "images: public read" on public.product_images for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.status = 'published'));
create policy "images: admin all" on public.product_images for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- portfolio_projects ----------
drop policy if exists "portfolio: public read published" on public.portfolio_projects;
drop policy if exists "portfolio: admin all" on public.portfolio_projects;
create policy "portfolio: public read published" on public.portfolio_projects for select to anon, authenticated using (status = 'published');
create policy "portfolio: admin all" on public.portfolio_projects for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- site_settings ----------
drop policy if exists "settings: public read approved" on public.site_settings;
drop policy if exists "settings: admin all" on public.site_settings;
create policy "settings: public read approved" on public.site_settings for select to anon, authenticated using (is_public);
create policy "settings: admin all" on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- orders and order_items: customers read ONLY their own; only admins change them ----------
drop policy if exists "orders: read own" on public.orders;
drop policy if exists "orders: admin all" on public.orders;
create policy "orders: read own" on public.orders for select to authenticated using (user_id = (select auth.uid()));
create policy "orders: admin all" on public.orders for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "order_items: read own" on public.order_items;
drop policy if exists "order_items: admin all" on public.order_items;
create policy "order_items: read own" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));
create policy "order_items: admin all" on public.order_items for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- Admin-only tables (no customer or visitor policy exists, so they are denied) ----------
drop policy if exists "status_history: admin all" on public.order_status_history;
drop policy if exists "manual_payments: admin all" on public.manual_payments;
drop policy if exists "service_requests: admin all" on public.service_requests;
drop policy if exists "digital_files: admin all" on public.digital_files;
create policy "status_history: admin all"   on public.order_status_history for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "manual_payments: admin all"  on public.manual_payments      for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "service_requests: admin all" on public.service_requests     for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "digital_files: admin all"    on public.digital_files        for all to authenticated using (public.is_admin()) with check (public.is_admin());
