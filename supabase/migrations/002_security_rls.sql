-- YAWVOREX 002: admin check, permissions, and Row Level Security. Run AFTER 001a, 001b, 001c.
-- Your 8 existing policies are KEPT (they are correct and read-only). This file only ADDS admin policies and
-- policies for the new tables. Safe to run more than once.
-- Why grants matter: your report showed anon and authenticated had NO select/insert/update/delete rights on these tables,
-- so the site could not read anything yet. It also showed unneeded TRUNCATE/REFERENCES/TRIGGER rights, which are removed here.

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.user_roles where user_id = (select auth.uid()) and role = 'admin');
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Reset rights on exactly the YAWVOREX tables, then grant only what is needed.
revoke all on public.categories, public.products, public.product_variants, public.product_images,
  public.portfolio_projects, public.site_settings, public.profiles, public.user_roles, public.orders,
  public.order_items, public.order_status_history, public.manual_payments, public.service_requests,
  public.service_request_notes, public.digital_files from anon, authenticated;

grant usage on schema public to anon, authenticated;

grant select on public.categories, public.products, public.product_variants, public.product_images,
  public.portfolio_projects, public.site_settings to anon, authenticated;
grant select on public.profiles, public.user_roles, public.orders, public.order_items, public.service_requests to authenticated;
grant update (display_name, phone) on public.profiles to authenticated;

-- Admin-managed tables. A normal customer holds these rights too, but RLS blocks every row for them.
grant insert, update, delete on public.categories, public.products, public.product_variants, public.product_images,
  public.portfolio_projects, public.site_settings, public.orders, public.order_items, public.service_requests to authenticated;
grant select, insert, update, delete on public.order_status_history, public.manual_payments,
  public.service_request_notes, public.digital_files to authenticated;
-- user_roles: NO insert/update/delete right for anyone. Roles change only in the SQL Editor.
-- anon (not signed in): read-only on public catalog tables, nothing else.

alter table public.categories            enable row level security;
alter table public.products              enable row level security;
alter table public.product_variants      enable row level security;
alter table public.product_images        enable row level security;
alter table public.portfolio_projects    enable row level security;
alter table public.site_settings         enable row level security;
alter table public.profiles              enable row level security;
alter table public.user_roles            enable row level security;
alter table public.orders                enable row level security;
alter table public.order_items           enable row level security;
alter table public.order_status_history  enable row level security;
alter table public.manual_payments       enable row level security;
alter table public.service_requests      enable row level security;
alter table public.service_request_notes enable row level security;
alter table public.digital_files         enable row level security;

-- Public reads for the NEW tables (your existing products/categories policies already cover those two)
drop policy if exists "yvx: public read variants" on public.product_variants;
create policy "yvx: public read variants" on public.product_variants for select to anon, authenticated
  using (is_active and exists (select 1 from public.products p where p.id = product_id and p.is_published));

drop policy if exists "yvx: public read images" on public.product_images;
create policy "yvx: public read images" on public.product_images for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.is_published));

drop policy if exists "yvx: public read published projects" on public.portfolio_projects;
create policy "yvx: public read published projects" on public.portfolio_projects for select to anon, authenticated using (is_published);

drop policy if exists "yvx: public read approved settings" on public.site_settings;
create policy "yvx: public read approved settings" on public.site_settings for select to anon, authenticated using (is_public);

-- Admin full access (verified by the database through is_admin())
drop policy if exists "yvx: admin all categories" on public.categories;
create policy "yvx: admin all categories" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "yvx: admin all products" on public.products;
create policy "yvx: admin all products" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "yvx: admin all variants" on public.product_variants;
create policy "yvx: admin all variants" on public.product_variants for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "yvx: admin all images" on public.product_images;
create policy "yvx: admin all images" on public.product_images for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "yvx: admin all projects" on public.portfolio_projects;
create policy "yvx: admin all projects" on public.portfolio_projects for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "yvx: admin all settings" on public.site_settings;
create policy "yvx: admin all settings" on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "yvx: admin all orders" on public.orders;
create policy "yvx: admin all orders" on public.orders for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "yvx: admin all order items" on public.order_items;
create policy "yvx: admin all order items" on public.order_items for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "yvx: admin all requests" on public.service_requests;
create policy "yvx: admin all requests" on public.service_requests for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "yvx: admin read profiles" on public.profiles;
create policy "yvx: admin read profiles" on public.profiles for select to authenticated using (public.is_admin());

-- Admin-ONLY tables: no customer or visitor policy exists, so they are denied.
drop policy if exists "yvx: admin all history" on public.order_status_history;
create policy "yvx: admin all history" on public.order_status_history for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "yvx: admin all manual payments" on public.manual_payments;
create policy "yvx: admin all manual payments" on public.manual_payments for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "yvx: admin all notes" on public.service_request_notes;
create policy "yvx: admin all notes" on public.service_request_notes for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "yvx: admin all digital files" on public.digital_files;
create policy "yvx: admin all digital files" on public.digital_files for all to authenticated using (public.is_admin()) with check (public.is_admin());
select 'OK: 002 finished' as result;
