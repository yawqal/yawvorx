-- Migration: 027_add_order_earnings_trigger.sql
-- Purpose: Automates earnings ledger creation upon successful order payment.

begin;

create or replace function public.yvx_handle_order_payment_update()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  -- Trigger when order payment status changes to 'paid'
  if (NEW.payment_status = 'paid' and OLD.payment_status <> 'paid') then
    -- Idempotency check: Ensure no earnings already exist for this order to prevent duplicates
    if not exists (
      select 1 from public.earnings_ledger 
      where order_id = NEW.id and entry_type = 'sale'
    ) then
      perform public.yvx_record_order_earnings(NEW.id);
    end if;
  end if;
  
  return NEW;
end;
$function$;

-- Apply trigger to orders table
create trigger trg_yvx_order_payment_update
after update of payment_status on public.orders
for each row
execute function public.yvx_handle_order_payment_update();

commit;
