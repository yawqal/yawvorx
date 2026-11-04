-- Migration: 023_vendor_order_items_rls.sql
-- Purpose: Secure vendor isolation on order_items using vendor_id attribution.

begin;

-- 1. Ensure order_items.vendor_id can be safely filtered
-- (It already exists as nullable uuid)

-- 2. Create vendor isolation policy
-- Vendors can see order items where they are the attributed vendor (vendor_id matches their user_id).
-- This relies on order_items.vendor_id being populated by yvx_create_order_v2 at order time.

drop policy if exists "yvx: vendors read own order items" on public.order_items;
create policy "yvx: vendors read own order items"
  on public.order_items
  for select
  to authenticated
  using (
    vendor_id is not null
    and vendor_id = auth.uid()
  );

commit;