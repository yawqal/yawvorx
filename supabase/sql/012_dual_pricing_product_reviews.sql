-- NOT RUN - owner runs in Supabase.
-- Proposal only: dual-price columns and verified-purchase product reviews.
-- The existing price/currency columns remain unchanged and authoritative until the owner
-- separately reviews and updates the yvx_price_and_reserve / yvx_create_order RPCs.

alter table public.products add column if not exists price_etb numeric(12,2);
alter table public.products add column if not exists price_usd numeric(12,2);

update public.products
set price_etb = price
where price_etb is null and upper(currency) = 'ETB';

update public.products
set price_usd = price
where price_usd is null and upper(currency) = 'USD';

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 10 and 2000),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);

create index if not exists yvx_product_reviews_public_idx
  on public.product_reviews (product_id, created_at desc)
  where is_hidden = false;

alter table public.product_reviews enable row level security;
revoke all on public.product_reviews from anon, authenticated;
grant select (id, product_id, rating, body, is_hidden, created_at) on public.product_reviews to anon, authenticated;
grant insert on public.product_reviews to authenticated;
grant update (is_hidden) on public.product_reviews to authenticated;

drop policy if exists "yvx: public read visible product reviews" on public.product_reviews;
create policy "yvx: public read visible product reviews" on public.product_reviews
  for select to anon, authenticated
  using (not is_hidden or public.is_admin());

drop policy if exists "yvx: verified buyers write one product review" on public.product_reviews;
create policy "yvx: verified buyers write one product review" on public.product_reviews
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.orders o
      join public.order_items oi on oi.order_id = o.id
      where o.user_id = (select auth.uid())
        and o.payment_status = 'paid'
        and oi.product_id = product_reviews.product_id
    )
  );

drop policy if exists "yvx: admins hide product reviews" on public.product_reviews;
create policy "yvx: admins hide product reviews" on public.product_reviews
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
