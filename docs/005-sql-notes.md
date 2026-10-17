# SQL / RPC notes

Reconstructed from code, verify against Supabase.

## `yvx_create_order`

Called by `src/components/forms/CheckoutForm.tsx`.

- Parameters:
  - `p_items`: array of `{ slug: string, variant_id: string | null, qty: number }`.
  - `p_customer`: object containing `name`, `phone`, `email`, `address`, `city`, `country`, and `notes` strings.
  - `p_idempotency_key`: string.
  - `p_payment_method`: `"manual"` or `"whatsapp"`.
- Expected result: object with `order_ref: string`, optional `guest_token: string`, `total: number`, `currency: string`, and optional `duplicate: boolean`.

## `yvx_track_order`

Called by `src/components/shop/TrackForm.tsx`.

- Parameters: `p_order_ref: string` and `p_token: string`.
- Expected result: `null` when no matching order is returned, or an object with `order_ref`, `status`, `payment_status`, `currency`, `subtotal`, `shipping_total`, `total`, `created_at`, and `items`. Each item is expected to contain `name`, nullable `variant`, `qty`, and `unit_price`.

## `yvx_price_and_reserve`

No call, parameter shape, or return shape for this RPC was found in the application code or tracked migrations. Verify its interface directly against Supabase before using or documenting it further.

## `site_settings`

The tracked migration `supabase/migrations/001b3_portfolio_settings_files.sql` defines `public.site_settings` with:

- `key text` primary key, constrained to lowercase letters, digits, `.`, `_`, and `-`.
- `value jsonb not null`.
- `is_public boolean not null default false`.
- `updated_at timestamptz not null default now()`.
- `updated_by uuid` referencing `auth.users(id)` with `on delete set null`.

The tracked RLS migration grants public reads only for rows marked `is_public` and limits writes to admins through `public.is_admin()`.
