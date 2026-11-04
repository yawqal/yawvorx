-- Migration: 022_add_vendor_to_order_items.sql
-- Purpose: Add vendor tracking to order items for attribution.

begin;

-- Assuming order_items table exists from earlier phases.
-- If not, this needs to be checked.
alter table if exists public.order_items add column if not exists vendor_id uuid references public.vendors(id);

-- Update RLS for order_items if needed? 
-- The existing RLS should be sufficient, but we should make sure vendors can see their own order items.
-- This might need a policy, but let's stick to the attribution part first.

commit;
