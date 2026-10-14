-- YAWVOREX 001c: helper functions and triggers. Your report showed NO existing triggers on these tables or on auth.users,
-- so nothing can duplicate. All names start with yvx_ so nothing you already have is replaced. Safe to run more than once.

create or replace function public.yvx_set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists yvx_profiles_updated on public.profiles;
create trigger yvx_profiles_updated before update on public.profiles for each row execute function public.yvx_set_updated_at();
drop trigger if exists yvx_products_updated on public.products;
create trigger yvx_products_updated before update on public.products for each row execute function public.yvx_set_updated_at();
drop trigger if exists yvx_orders_updated on public.orders;
create trigger yvx_orders_updated before update on public.orders for each row execute function public.yvx_set_updated_at();
drop trigger if exists yvx_requests_updated on public.service_requests;
create trigger yvx_requests_updated before update on public.service_requests for each row execute function public.yvx_set_updated_at();
drop trigger if exists yvx_variants_updated on public.product_variants;
create trigger yvx_variants_updated before update on public.product_variants for each row execute function public.yvx_set_updated_at();
drop trigger if exists yvx_manual_updated on public.manual_payments;
create trigger yvx_manual_updated before update on public.manual_payments for each row execute function public.yvx_set_updated_at();
drop trigger if exists yvx_portfolio_updated on public.portfolio_projects;
create trigger yvx_portfolio_updated before update on public.portfolio_projects for each row execute function public.yvx_set_updated_at();
drop trigger if exists yvx_settings_updated on public.site_settings;
create trigger yvx_settings_updated before update on public.site_settings for each row execute function public.yvx_set_updated_at();

-- Order history: records status changes AND payment_status changes. It can never block an order change.
create or replace function public.yvx_log_order_changes() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_status_history (order_id, from_status, to_status, changed_by, note)
    values (new.id, null, new.status, auth.uid(), 'order created');
  else
    if new.status is distinct from old.status then
      insert into public.order_status_history (order_id, from_status, to_status, changed_by)
      values (new.id, old.status, new.status, auth.uid());
    end if;
    if new.payment_status is distinct from old.payment_status then
      insert into public.order_status_history (order_id, from_status, to_status, changed_by, note)
      values (new.id, old.status, new.status, auth.uid(), 'payment_status: ' || old.payment_status || ' -> ' || new.payment_status);
    end if;
  end if;
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists yvx_orders_log on public.orders;
create trigger yvx_orders_log after insert or update of status, payment_status on public.orders
  for each row execute function public.yvx_log_order_changes();

-- New sign-ups get a profile row (display name only). Roles are NEVER taken from sign-up data.
-- If this ever fails, the sign-up still succeeds.
create or replace function public.yvx_handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  begin
    insert into public.profiles (id, display_name)
    values (new.id, nullif(left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 100), ''))
    on conflict (id) do nothing;
  exception when others then
    null;
  end;
  return new;
end;
$$;

drop trigger if exists yvx_on_auth_user_created on auth.users;
create trigger yvx_on_auth_user_created after insert on auth.users
  for each row execute function public.yvx_handle_new_user();

-- profiles for accounts that already exist
insert into public.profiles (id) select id from auth.users on conflict (id) do nothing;

revoke all on function public.yvx_set_updated_at() from public, anon, authenticated;
revoke all on function public.yvx_log_order_changes() from public, anon, authenticated;
revoke all on function public.yvx_handle_new_user() from public, anon, authenticated;
select 'OK: 001c finished' as result;
