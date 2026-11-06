-- Migration: 025_add_ledger_structure.sql
-- Purpose: Adds necessary indexes and constraints to support financial ledger operations.

begin;

-- Ensure ledger is correctly indexed for financial queries (vendor/affiliate dashboards)
create index if not exists earnings_ledger_beneficiary_idx on public.earnings_ledger (beneficiary_user_id, payable_at);
create index if not exists earnings_ledger_order_idx on public.earnings_ledger (order_id);

-- Constraints to ensure data integrity
alter table public.earnings_ledger add constraint valid_amount check (amount <> 0);

commit;
