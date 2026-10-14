-- YAWVOREX 000c: turns on Row Level Security and adds the 8 base read policies. Run AFTER 000b. New project only. Safe to run more than once.

alter table public.categories       enable row level security;
alter table public.products         enable row level security;
alter table public.profiles         enable row level security;
alter table public.user_roles       enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;
alter table public.service_requests enable row level security;

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories" on public.categories for select to public using (true);
drop policy if exists "Public can read published products" on public.products;
create policy "Public can read published products" on public.products for select to public using (is_published = true);
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles for select to authenticated using (id = (select auth.uid()));
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
drop policy if exists "Users can read own role" on public.user_roles;
create policy "Users can read own role" on public.user_roles for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Users can read own orders" on public.orders;
create policy "Users can read own orders" on public.orders for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Users can read own order items" on public.order_items;
create policy "Users can read own order items" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = (select auth.uid())));
drop policy if exists "Users can read own service requests" on public.service_requests;
create policy "Users can read own service requests" on public.service_requests for select to authenticated using (user_id = (select auth.uid()));

select 'OK: 000c finished' as result;
