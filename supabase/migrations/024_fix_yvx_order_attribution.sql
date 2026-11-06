-- Migration: 024_fix_yvx_order_attribution.sql
-- Purpose: Corrects vendor_id attribution in yvx_create_order_v2 to ensure product ownership is captured.

begin;

-- 1. Update yvx_price_and_reserve to include vendor_id in the JSON result.
-- (This requires replacing the function to add vendor_id to the line object)
create or replace function public.yvx_price_and_reserve(p_items jsonb, p_currency text default null)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  rec record;
  prod record;
  v_lines jsonb := '[]'::jsonb;
  v_subtotal numeric := 0;
  v_currency text := null;
  v_has_physical boolean := false;
  v_unit numeric;
  v_base numeric;
  v_cur text;
  v_req text := nullif(upper(btrim(coalesce(p_currency, ''))), '');
  v_var_id uuid;
  v_var_label text;
  v_var_delta numeric;
  v_var_stock int;
begin
  if v_req is not null and v_req not in ('ETB', 'USD') then
    raise exception 'YVX_INVALID_CURRENCY';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'YVX_EMPTY_CART';
  end if;
  if jsonb_array_length(p_items) > 20 then
    raise exception 'YVX_TOO_MANY_ITEMS';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_items) i
    where coalesce(i->>'slug', '') = ''
      or not (
        case when coalesce(i->>'qty', '') ~ '^[0-9]{1,2}$'
          then (i->>'qty')::int between 1 and 20
          else false end
      )
      or (coalesce(i->>'variant_id', '') <> ''
        and (i->>'variant_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
  ) then
    raise exception 'YVX_INVALID_ITEM';
  end if;

  for rec in
    select (i->>'slug') as slug,
      nullif(i->>'variant_id', '') as variant_id,
      sum((i->>'qty')::int)::int as qty
    from jsonb_array_elements(p_items) i
    group by 1, 2
    order by 1, 2
  loop
    if rec.qty > 50 then
      raise exception 'YVX_INVALID_ITEM';
    end if;

    select id, name, price, currency, price_etb, price_usd, stock, product_type, vendor_id into prod
    from public.products
    where slug = rec.slug and is_published = true
    for update;
    if not found then
      raise exception 'YVX_PRODUCT_UNAVAILABLE:%', rec.slug;
    end if;

    v_var_id := null; v_var_label := null; v_var_delta := 0; v_var_stock := null;
    if rec.variant_id is not null then
      select id, label, price_delta, stock
      into v_var_id, v_var_label, v_var_delta, v_var_stock
      from public.product_variants
      where id = rec.variant_id::uuid and product_id = prod.id and is_active = true
      for update;
      if not found then
        raise exception 'YVX_VARIANT_UNAVAILABLE:%', rec.slug;
      end if;
    elsif exists (select 1 from public.product_variants
      where product_id = prod.id and is_active = true) then
      raise exception 'YVX_VARIANT_REQUIRED:%', rec.slug;
    end if;

    if v_req is null then
      v_cur := prod.currency;
      v_base := prod.price;
    else
      v_cur := v_req;
      v_base := case when v_req = 'ETB' then prod.price_etb else prod.price_usd end;
      if v_base is null then
        raise exception 'YVX_PRICE_UNAVAILABLE:%', rec.slug;
      end if;
      if coalesce(v_var_delta, 0) <> 0 and v_cur <> prod.currency then
        raise exception 'YVX_VARIANT_DELTA_CURRENCY:%', rec.slug;
      end if;
    end if;

    if v_currency is null then
      v_currency := v_cur;
    elsif v_currency <> v_cur then
      raise exception 'YVX_MIXED_CURRENCY';
    end if;

    v_unit := round(v_base + coalesce(v_var_delta, 0), 2);
    if v_unit < 0 then
      raise exception 'YVX_BAD_PRICE:%', rec.slug;
    end if;

    if prod.product_type = 'physical' then
      v_has_physical := true;
      if v_var_id is not null and v_var_stock is not null then
        if v_var_stock < rec.qty then
          raise exception 'YVX_OUT_OF_STOCK:%', rec.slug;
        end if;
        update public.product_variants set stock = stock - rec.qty where id = v_var_id;
      else
        if prod.stock < rec.qty then
          raise exception 'YVX_OUT_OF_STOCK:%', rec.slug;
        end if;
        update public.products set stock = stock - rec.qty where id = prod.id;
      end if;
    end if;

    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'product_id', prod.id,
      'variant_id', v_var_id,
      'name', prod.name,
      'variant_label', v_var_label,
      'type', prod.product_type,
      'qty', rec.qty,
      'unit_price', v_unit,
      'line_total', round(v_unit * rec.qty, 2),
      'vendor_id', prod.vendor_id -- Added vendor_id
    ));
    v_subtotal := v_subtotal + round(v_unit * rec.qty, 2);
  end loop;

  return jsonb_build_object(
    'lines', v_lines,
    'subtotal', v_subtotal,
    'currency', v_currency,
    'has_physical', v_has_physical
  );
end;
$function$;

-- 2. Update yvx_create_order_v2 to capture vendor_id from pricing results
create or replace function public.yvx_create_order_v2(
  p_items jsonb,
  p_customer jsonb,
  p_idempotency_key text,
  p_payment_method text default 'whatsapp'::text,
  p_currency text default null,
  p_referral_token uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_result jsonb;
  v_order_id uuid;
  v_code text;
  v_owner uuid;
  v_uid uuid := auth.uid();
  v_line jsonb;
begin
  -- Price and reserve items (now includes vendor_id)
  v_result := public.yvx_price_and_reserve(p_items, p_currency);
  
  -- Existing create_order logic (calling old yvx_create_order)
  -- Note: We must handle order creation FIRST, then process lines to populate vendor_id
  -- The existing yvx_create_order creates the order and items, but doesn't fill vendor_id.
  -- This V2 function needs to call yvx_create_order to get the order created,
  -- then patch the items.

  -- WARNING: The current yvx_create_order logic creates items. We need to avoid double-creation.
  -- The current v2 just calls the old function and patches. That is fine, 
  -- but we need to pass the vendor_id through from v_priced which is v_result.
  
  -- Let's just update the items directly after creation.
  -- The existing yvx_create_order creates the order and items.
  -- We already have the logic to patch order_items in v2, 
  -- let's just make it robust.

  -- We need to call yvx_create_order to get the order created.
  -- Actually the original v2 called yvx_create_order.
  -- We should keep calling yvx_create_order as it handles order creation.
  
  declare
    v_order_res jsonb;
  begin
     -- Need to pass same args
     v_order_res := public.yvx_create_order(p_items, p_customer, p_idempotency_key, p_payment_method, p_currency);
     
     if coalesce((v_order_res->>'duplicate')::boolean, false) then
         return v_order_res;
     end if;
     
     select id into v_order_id from public.orders where order_ref = v_order_res->>'order_ref';
     
     -- Patch vendor_id on order_items
     -- Use the v_result from yvx_price_and_reserve to get the vendor_id mapping
     for v_line in select value from jsonb_array_elements(v_result->'lines') loop
        update public.order_items
        set vendor_id = (v_line->>'vendor_id')::uuid
        where order_id = v_order_id
          and product_id = (v_line->>'product_id')::uuid
          and (v_line->>'variant_id' is null or variant_id = (v_line->>'variant_id')::uuid);
     end loop;

     -- Existing referral logic
     if p_referral_token is not null then
         select r.affiliate_code into v_code
             from public.referral_visits r
             where r.token = p_referral_token
                   and r.created_at > now() - make_interval(days => public.yvx_referral_cookie_days());
         if v_code is not null then
             select a.user_id into v_owner
                 from public.vendor_applications a
                     where a.referral_code = v_code and a.status = 'approved'
                           limit 1;
             if v_owner is not null and v_owner is distinct from v_uid then
                 update public.orders set affiliate_code = v_code where id = v_order_id;
             end if;
         end if;
     end if;
     
     return v_order_res;
  end;
end;
$function$;

commit;
