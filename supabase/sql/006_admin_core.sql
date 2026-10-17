-- NOT RUN - owner runs in Supabase.
-- The live audit_log id has no default; inserts require it to be generated.
-- Verify id is an identity column before running.

grant insert on public.audit_log to authenticated;

drop policy if exists "yvx: admins append audit log" on public.audit_log;
create policy "yvx: admins append audit log" on public.audit_log
  for insert to authenticated with check (public.is_admin() and actor = (select auth.uid()));
