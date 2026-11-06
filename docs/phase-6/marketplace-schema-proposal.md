# Marketplace Schema Extension Proposal (Phase 6)

## Overview
This proposal extends the existing YAWVOREX database schema to support multi-vendor operations while maintaining backward compatibility for existing products and orders.

## New Tables

### `vendors`
Stores vendor profile information.
```sql
create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id),
  store_name text not null,
  store_slug text not null unique,
  description text,
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### `vendor_ledger`
Immutable financial tracking.
```sql
create table public.vendor_ledger (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id),
  order_allocation_id uuid, -- Reference to a sub-order/allocation
  amount numeric not null,
  entry_type text not null check (entry_type in ('sale', 'commission_deduction', 'refund', 'payout')),
  created_at timestamptz not null default now()
);
```

## Modifications to Existing Tables

### `products`
Link products to vendors.
```sql
alter table public.products add column vendor_id uuid references public.vendors(id);
```

### `orders`
Phase 5 introduced `yvx_create_order` which handles order creation. We will adapt the fulfillment logic to link items to vendors.

---
## Rollback Plan
All changes are additive or use `alter table add column`. Rollback is possible by dropping new columns/tables.
