-- Function to record earnings upon order completion
create or replace function public.yvx_record_order_earnings(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_order_currency text;
  v_item record;
  v_comm_pct numeric;
  v_vendor_amount numeric;
  v_platform_amount numeric;
begin
  -- Get order details
  select currency into v_order_currency from public.orders where id = p_order_id;
  
  -- Get commission settings
  select vendor_commission_pct into v_comm_pct from public.marketplace_settings limit 1;
  v_comm_pct := coalesce(v_comm_pct, 0);

  -- Process items
  for v_item in 
    select oi.id, oi.vendor_id, oi.line_total 
    from public.order_items oi
    where oi.order_id = p_order_id and oi.vendor_id is not null
  loop
    v_platform_amount := round(v_item.line_total * (v_comm_pct / 100), 2);
    v_vendor_amount := v_item.line_total - v_platform_amount;

    -- Record vendor earnings
    insert into public.earnings_ledger (
      beneficiary_user_id, beneficiary_type, entry_type, order_id, order_item_id, 
      currency, base_amount, rate_pct, amount, payable_at
    ) values (
      v_item.vendor_id, 'vendor', 'sale', p_order_id, v_item.id,
      v_order_currency, v_item.line_total, (100 - v_comm_pct), v_vendor_amount,
      now() + interval '30 days' -- Example payout delay
    );
  end loop;
end;
$function$;
