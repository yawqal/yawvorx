# Dual-pricing and product reviews proposal

## Dual pricing

`supabase/sql/012_dual_pricing_product_reviews.sql` adds nullable `products.price_etb` and `products.price_usd`. It backfills only the matching column for each existing `price`/`currency` row and leaves `price` and `currency` unchanged. The migration is a proposal; do not run it until the owner has reviewed it.

The admin editor and storefront display the two prices only when both columns are available and both contain valid values. Before the columns exist, the server retries with the existing product columns and the UI continues to use `price` and `currency`. No checkout, cart, reservation, or payment price changes are made by this proposal; the current single price remains authoritative.

### Required RPC change before dual prices can affect checkout

The current application call to `yvx_create_order` supplies `p_items`, `p_customer`, `p_idempotency_key`, and `p_payment_method`; `p_customer` currently has no currency choice. The existing function call is not changed in this phase. To support a customer's selected currency, the owner must review the live function signatures and update both pricing paths together:

1. Add a validated `p_currency` argument (`ETB` or `USD`) to the checkout caller and `yvx_create_order` signature. Pass it through unchanged to the pricing/reservation helper.
2. In `yvx_price_and_reserve`, select `price_etb` when `p_currency = 'ETB'` and `price_usd` when `p_currency = 'USD'`; reject a missing selected price rather than silently using the other currency or a zero. Preserve the existing variant, stock-reservation, and transaction semantics.
3. In `yvx_create_order`, call the updated pricing helper with the same currency, persist that currency on the order, and persist the corresponding unit price on each order item. Recalculate totals in the same transaction from those server-side values; never trust client-supplied totals.
4. Review variant price deltas: the existing schema has a single `price_delta`. Decide whether it remains denominated in the selected currency or needs separate ETB/USD deltas, and ensure the helper applies a delta only in that selected currency.
5. Update RPC grants/owners as appropriate, then test reservation rollback, duplicate idempotency keys, both currencies, missing prices, variants, and concurrent stock changes in a staging Supabase project.

`yvx_price_and_reserve` is not called by tracked application code, and its live signature/implementation is not available in this repository. The precise existing signature and transaction details must be verified in Supabase before an owner writes or runs any RPC migration. This document is a proposal, not authorization to change or execute the RPC.

## Verified-purchase reviews

The SQL proposal creates `product_reviews`. Inserts are authenticated-only and RLS checks for a paid order owned by the same user containing that product. A unique constraint enforces one review per user/product. Public reads exclude hidden reviews; an administrator can hide/unhide rows. No reviewer identity is exposed in the storefront.

The API and UI use the existing order's `payment_status = 'paid'` state and require no payment provider, balance, or payout behavior.
Review submissions are IP-rate-limited to five per minute per running server instance; the production caveat is the same as the security review's in-memory limiter.
