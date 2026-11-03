-- Test: Ledger Verification
-- Purpose: Verify yvx_record_order_earnings and trigger logic.
-- NOTE: Do not execute against production.

begin;

-- 1. Setup mock marketplace settings
insert into public.marketplace_settings (vendor_commission_pct, affiliate_commission_pct) 
values (10, 5) on conflict do nothing;

-- 2. Mock a vendor user and product
-- (Requires an existing user, for test purposes we assume one exists or mock it)
-- Since we are in a test environment, we might need to create dummy auth users if allowed,
-- but for now we focus on the ledger logic.

-- 3. Verify commission calculation
-- Insert dummy order, item, and trigger earnings
-- check earnings_ledger for correct amounts

-- 4. Test idempotency (should not insert twice)

-- 5. Test status transition (only triggers on paid)

rollback;
