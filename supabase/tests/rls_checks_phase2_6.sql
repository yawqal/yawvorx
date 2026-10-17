-- Read-only verification queries. Safe to run in the Supabase SQL editor.

-- Any rows returned here are public tables without RLS enabled.
select schemaname, tablename
from pg_tables
where schemaname = 'public'
  and rowsecurity is false
order by tablename;

-- Inventory every public table and its RLS status.
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

-- List the policies currently attached to public tables.
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
