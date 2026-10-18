-- NOT RUN - owner runs in Supabase after review.
-- Dual-currency checkout: adds optional p_currency (ETB or USD) to yvx_price_and_reserve and yvx_create_order.
-- p_currency null = old behaviour (product legacy price and currency).
-- Old function signatures are dropped in the same transaction to avoid overload ambiguity.

begin;

drop function if exists public.yvx_create_order(jsonb, jsonb, text, text);
drop function if exists public.yvx_price_and_reserve(jsonb);

create function public.yvx_price_and_reserve(p_items jsonb, p_currency text default null)
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

    select id, name, price, currency, price_etb, price_usd, stock, product_type into prod
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
      'line_total', round(v_unit * rec.qty, 2)
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

create function public.yvx_create_order(
  p_items jsonb,
  p_customer jsonb,
  p_idempotency_key text,
  p_payment_method text default 'whatsapp'::text,
  p_currency text default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_uid uuid := auth.uid();
  v_name text;
  v_phone text;
  v_email text;
  v_address text;
  v_city text;
  v_country text;
  v_notes text;
  v_existing record;
  v_priced jsonb;
  v_shipping numeric := 0;
  v_ship_cfg jsonb;
  v_ship_raw text;
  v_total numeric;
  v_subtotal numeric;
  v_order_id uuid;
  v_ref text;
  v_token text;
  v_line jsonb;
begin
  if p_idempotency_key is null
    or length(p_idempotency_key) < 16
    or length(p_idempotency_key) > 100 then
    raise exception 'YVX_BAD_IDEMPOTENCY_KEY';
  end if;
  perform pg_advisory_xact_lock(hashtext(p_idempotency_key));

  select id, order_ref, total, currency into v_existing
  from public.orders where idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object(
      'order_ref', v_existing.order_ref,
      'total', v_existing.total,
      'currency', v_existing.currency,
      'duplicate', true
    );
  end if;

  if p_customer is null or jsonb_typeof(p_customer) <> 'object' then
    raise exception 'YVX_INVALID_CUSTOMER';
  end if;
  if p_payment_method is null or p_payment_method not in ('whatsapp', 'manual') then
    raise exception 'YVX_INVALID_PAYMENT_METHOD';
  end if;

  v_name := btrim(coalesce(p_customer->>'name', ''));
  v_phone := btrim(coalesce(p_customer->>'phone', ''));
  v_email := nullif(btrim(coalesce(p_customer->>'email', '')), '');
  v_address := nullif(btrim(coalesce(p_customer->>'address', '')), '');
  v_city := nullif(btrim(coalesce(p_customer->>'city', '')), '');
  v_country := nullif(btrim(coalesce(p_customer->>'country', '')), '');
  v_notes := nullif(btrim(coalesce(p_customer->>'notes', '')), '');

  if char_length(v_name) < 2 or char_length(v_name) > 100 then
    raise exception 'YVX_INVALID_NAME';
  end if;
  if char_length(v_phone) < 7 or char_length(v_phone) > 30
    or v_phone !~ '^[0-9+() -]+$' then
    raise exception 'YVX_INVALID_PHONE';
  end if;
  if v_email is not null and (
    char_length(v_email) > 200
    or v_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$') then
    raise exception 'YVX_INVALID_EMAIL';
  end if;
  if char_length(coalesce(v_address, '')) > 300
    or char_length(coalesce(v_city, '')) > 100
    or char_length(coalesce(v_country, '')) > 100
    or char_length(coalesce(v_notes, '')) > 1000 then
    raise exception 'YVX_FIELD_TOO_LONG';
  end if;

  if v_uid is not null then
    if (select count(*) from public.orders
      where user_id = v_uid and created_at > now() - interval '1 hour') >= 10 then
      raise exception 'YVX_RATE_LIMIT';
    end if;
  else
    if (select count(*) from public.orders
      where customer_phone = v_phone and created_at > now() - interval '1 hour') >= 5 then
      raise exception 'YVX_RATE_LIMIT';
    end if;
  end if;

  v_priced := public.yvx_price_and_reserve(p_items, p_currency);

  if (v_priced->>'has_physical')::boolean then
    if v_address is null or v_city is null then
      raise exception 'YVX_ADDRESS_REQUIRED';
    end if;
    select value into v_ship_cfg from public.site_settings where key = 'shipping';
    if v_ship_cfg is not null then
      v_ship_raw := v_ship_cfg->>('flat_fee_' || lower(v_priced->>'currency'));
      if v_ship_raw is not null then
        v_shipping := case when v_ship_raw ~ '^[0-9]{1,7}(\.[0-9]{1,2})?$'
          then v_ship_raw::numeric else 0 end;
      else
        v_ship_raw := v_ship_cfg->>'flat_fee';
        v_shipping := case when v_ship_raw ~ '^[0-9]{1,7}(\.[0-9]{1,2})?$'
          then v_ship_raw::numeric else 0 end;
        if v_shipping > 0 then
          raise exception 'YVX_SHIPPING_CURRENCY_UNSET';
        end if;
      end if;
    end if;
    v_shipping := coalesce(v_shipping, 0);
  end if;

  v_subtotal := (v_priced->>'subtotal')::numeric;
  v_total := v_subtotal + v_shipping;

  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  v_ref := public.yvx_new_order_ref();

  insert into public.orders (
    user_id, order_ref, customer_name, customer_email, customer_phone,
    delivery_address, delivery_city, delivery_country, customer_notes,
    currency, subtotal, shipping_total, total, payment_method,
    guest_token_hash, idempotency_key
  ) values (
    v_uid, v_ref, v_name, v_email, v_phone,
    v_address, v_city, v_country, v_notes,
    v_priced->>'currency', v_subtotal, v_shipping, v_total, p_payment_method,
    encode(sha256(convert_to(v_token, 'UTF8')), 'hex'), p_idempotency_key
  ) returning id into v_order_id;

  for v_line in select value from jsonb_array_elements(v_priced->'lines') loop
    insert into public.order_items (
      order_id, product_id, variant_id, product_name, variant_label,
      product_type, quantity, unit_price
    ) values (
      v_order_id,
      (v_line->>'product_id')::uuid,
      nullif(v_line->>'variant_id', '')::uuid,
      v_line->>'name',
      v_line->>'variant_label',
      v_line->>'type',
      (v_line->>'qty')::int,
      (v_line->>'unit_price')::numeric
    );
  end loop;

  return jsonb_build_object(
    'order_ref', v_ref,
    'guest_token', v_token,
    'currency', v_priced->>'currency',
    'subtotal', v_subtotal,
    'shipping', v_shipping,
    'total', v_total,
    'duplicate', false
  );
end;
$function$;

-- Grants: checkout RPC is public (guest checkout). The pricing helper is internal only.
revoke all on function public.yvx_create_order(jsonb, jsonb, text, text, text) from public;
grant execute on function public.yvx_create_order(jsonb, jsonb, text, text, text) to anon, authenticated, service_role;

revoke all on function public.yvx_price_and_reserve(jsonb, text) from public, anon, authenticated;
grant execute on function public.yvx_price_and_reserve(jsonb, text) to service_role;

commit;

-- Check after running: expect exactly 2 rows (one per function).
select p.proname, pg_get_function_identity_arguments(p.oid) as args
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('yvx_create_order', 'yvx_price_and_reserve')
order by 1;
