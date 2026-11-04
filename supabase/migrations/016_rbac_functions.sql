-- YAWVOREX 016: RBAC Functions
-- Logic for has_permission, is_admin compatibility, and audit triggers.

begin;

-- Helper: Check account status
create or replace function public.is_account_active(uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select not exists (
    select 1 from public.account_status where user_id = uid and status = 'suspended'
  );
$$;

-- RBAC Service Core: Permissions Check
create or replace function public.has_permission(uid uuid, perm_code text, scope_val uuid default null) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.user_roles_v2 ur
    join public.roles r on ur.role_id = r.id
    join public.role_permissions rp on r.id = rp.role_id
    join public.permissions p on rp.permission_id = p.id
    where ur.user_id = uid
      and ur.status = 'active'
      and ur.suspended_at is null
      and p.code = perm_code
      and public.is_account_active(uid)
      and (
        scope_val is null
        or exists (
          select 1 from public.user_role_scopes urs
          where urs.user_role_id = ur.id
            and urs.scope_value = scope_val
        )
      )
  );
$$;

-- Compatibility Bridge
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  -- New RBAC check
  select exists (
    select 1 from public.user_roles_v2 ur
    join public.roles r on ur.role_id = r.id
    where ur.user_id = auth.uid()
      and r.code = 'admin'
      and ur.status = 'active'
      and ur.suspended_at is null
      and public.is_account_active(auth.uid())
  )
  -- Fallback to legacy if no V2 roles exist (and no admin was migrated)
  or (
    not exists (select 1 from public.user_roles_v2 where user_id = auth.uid())
    and exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );
$$;

-- Audit Trigger
create or replace function public.log_security_event() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.security_audit_logs(actor_id, action, target_table, target_id, old_val, new_val)
  values (auth.uid(), TG_OP, TG_TABLE_NAME, coalesce(old.id, new.id), to_jsonb(old), to_jsonb(new));
  return new;
end;
$$;

-- Last-Admin Protection
create or replace function public.prevent_last_admin_removal() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  admin_count int;
begin
  if (TG_OP = 'DELETE' or (TG_OP = 'UPDATE' and new.status != 'active')) then
    select count(*) into admin_count
    from public.user_roles_v2 ur
    join public.roles r on ur.role_id = r.id
    where r.code = 'admin' and ur.status = 'active' and ur.suspended_at is null;

    if admin_count <= 1 then
      raise exception 'Cannot remove or suspend the last active administrator.';
    end if;
  end if;
  return new;
end;
$$;

commit;
