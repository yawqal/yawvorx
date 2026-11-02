-- Migration: 021_add_vendor_to_products.sql
-- Purpose: Link products to vendors.

begin;

alter table public.products add column if not exists vendor_id uuid references public.vendors(id);

-- Update RLS for products to allow vendors to manage their products
-- This requires a function to check if the user is the vendor of the product
create or replace function public.is_product_vendor(product_id uuid)
returns boolean
language sql
security definer
as $$
  select exists (
    select 1 from public.products p
    join public.vendors v on p.vendor_id = v.id
    where p.id = product_id and v.user_id = auth.uid()
  );
$$;

drop policy if exists "yvx: vendors manage own products" on public.products;
create policy "yvx: vendors manage own products" on public.products
  for all to authenticated using (public.is_product_vendor(id)) with check (public.is_product_vendor(id));

commit;
