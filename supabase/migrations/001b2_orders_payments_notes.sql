-- YAWVOREX 001b2: order history, manual payments, internal notes. Creates missing tables only. Safe to run more than once.
-- Run in order: 001b1, then 001b2, then 001b3.

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists yvx_history_order_idx on public.order_status_history (order_id, created_at);

create table if not exists public.manual_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  method text not null check (char_length(method) between 1 and 60),
  reference text check (reference is null or char_length(reference) <= 200),
  status text not null default 'submitted' check (status in ('submitted','verified','rejected')),
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint yvx_manual_verified_ck check (status <> 'verified' or (verified_by is not null and verified_at is not null))
);
create index if not exists yvx_manual_order_idx on public.manual_payments (order_id);

-- Internal notes live in their OWN admin-only table, because customers can read their own service_requests rows.
create table if not exists public.service_request_notes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  note text not null check (char_length(note) between 1 and 2000),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists yvx_notes_request_idx on public.service_request_notes (request_id, created_at);
select 'OK: 001b2 finished' as result;
