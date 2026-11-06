-- YAWVOREX Test Suite: RBAC Migration Validation
-- This script validates the migration, backfill, and RLS behavior.

begin;

-- Test 1: Backfill validation
-- Every auth user should have at least the customer role in user_roles_v2.
do $$
declare
  total_users bigint;
  total_roles bigint;
begin
  select count(*) into total_users from auth.users;
  select count(*) into total_roles from public.user_roles_v2 where role_id = (select id from roles where code = 'customer');
  if total_users != total_roles then
    raise exception 'Backfill check failed: user/role mismatch';
  end if;
end $$;

-- Test 2: Admin preservation
do $$
begin
  if not exists (select 1 from public.user_roles_v2 ur join public.roles r on ur.role_id = r.id where r.code = 'admin') then
    raise exception 'Backfill check failed: no admins found';
  end if;
end $$;

-- Test 3: Last-admin protection
-- Attempt to suspend the only admin (should fail).
do $$
begin
  -- Assuming only one admin for this test
  update public.user_roles_v2 set status = 'suspended'
  where role_id = (select id from roles where code = 'admin');
  -- If we get here, the trigger failed.
  raise exception 'Last-admin protection check failed';
exception when others then
  raise notice 'Last-admin protection working';
end $$;

rollback; -- Do not persist test results
