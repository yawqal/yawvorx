-- YAWVOREX 019: RBAC Bootstrap (TEMPLATE)
-- Trusted operator MUST execute this once to promote the first admin.
-- Replace 'TARGET_USER_EMAIL_HERE' with the verified email address.

do $$
declare
  target_user_id uuid;
  admin_role_id bigint;
begin
  -- 1. Identify target user
  select id into target_user_id from auth.users where email = 'TARGET_USER_EMAIL_HERE';

  if target_user_id is null then
    raise exception 'Target user not found';
  end if;

  -- 2. Identify admin role
  select id into admin_role_id from public.roles where code = 'admin';

  -- 3. Idempotent grant
  insert into public.user_roles_v2 (user_id, role_id, status)
  values (target_user_id, admin_role_id, 'active')
  on conflict (user_id, role_id) do update set status = 'active';

  raise notice 'Admin bootstrap successful';
end $$;
