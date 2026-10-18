-- NOT RUN - owner runs in Supabase.
-- Proposal only: review each result and confirm the live grants before applying.
-- This does not alter the live audit_log columns.

revoke truncate on table public.audit_log from service_role;

-- Check for any remaining TRUNCATE grants on audit_log, including inherited grants.
select grantee, privilege_type, is_grantable
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'audit_log'
  and privilege_type = 'TRUNCATE'
order by grantee;

-- Inspect anon grants on tables that contain administrative or customer-private data.
select table_name, privilege_type, grantee
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee = 'anon'
  and table_name in (
    'audit_log', 'user_roles', 'orders', 'order_items', 'manual_payments',
    'service_requests', 'support_tickets', 'support_messages', 'notifications',
    'digital_files', 'customer_addresses', 'wishlist_items'
  )
order by table_name, privilege_type;

-- Confirm RLS is enabled on application-owned public tables.
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

-- List policies for owner review; this proposal intentionally makes no policy changes.
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
