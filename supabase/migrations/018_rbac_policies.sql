-- YAWVOREX 018: RBAC Policies
-- Apply RLS policies to new RBAC tables.

begin;

-- 1. user_roles_v2: Select own, Admin ALL
create policy "yvx: users read own roles" on public.user_roles_v2
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

create policy "yvx: admin all user roles" on public.user_roles_v2
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Audit Trigger for user_roles_v2
create trigger trg_audit_user_roles
  after insert or update or delete on public.user_roles_v2
  for each row execute function public.log_security_event();

-- 2. role_applications: User insert own, Admin update
create policy "yvx: users apply roles" on public.role_applications
  for insert to authenticated with check (user_id = auth.uid());

create policy "yvx: admin manage applications" on public.role_applications
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Audit Trigger for role_applications
create trigger trg_audit_role_apps
  after insert or update or delete on public.role_applications
  for each row execute function public.log_security_event();

-- 3. account_status: Select own, Admin update
create policy "yvx: users read own status" on public.account_status
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

create policy "yvx: admin manage status" on public.account_status
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 4. Audit Log: Append-only
-- No public INSERT policy; only the trigger (SECURITY DEFINER) can insert.

create policy "yvx: admin read audit" on public.security_audit_logs
  for select to authenticated using (public.is_admin());

-- 5. Scope Policies
create policy "yvx: public read scopes" on public.permission_scopes for select to authenticated using (true);

create policy "yvx: users read own role scopes" on public.user_role_scopes
  for select to authenticated using (exists (select 1 from public.user_roles_v2 ur where ur.id = user_role_scopes.user_role_id and ur.user_id = auth.uid()) or public.is_admin());

-- 6. Trigger for Last Admin Protection
create trigger trg_prevent_last_admin_removal
  before update or delete on public.user_roles_v2
  for each row execute function public.prevent_last_admin_removal();

commit;
