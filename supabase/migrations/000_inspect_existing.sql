-- YAWVOREX: READ-ONLY inspection of your existing database. It changes NOTHING.
-- Run it in the Supabase SQL Editor. The result is ONE cell of text: long-press it, copy it, and paste it to Claude.
-- It contains table/column names, rules and row COUNTS only. It does not contain passwords, keys, emails or table data.

with t(name) as (values ('categories'),('orders'),('order_items'),('products'),('profiles'),('service_requests'),('user_roles'))
select string_agg(kind || ' | ' || obj || ' | ' || detail, E'\n' order by kind, obj, detail) as report
from (
  select 'A.column' as kind, c.table_name::text as obj,
         (c.column_name::text || ' ' || c.data_type::text
          || case when c.is_nullable = 'NO' then ' NOT NULL' else '' end
          || coalesce(' DEFAULT ' || c.column_default::text, '')) as detail
  from information_schema.columns c join t on t.name = c.table_name where c.table_schema = 'public'
  union all
  select 'B.constraint', cl.relname::text, con.conname::text || ': ' || pg_get_constraintdef(con.oid)
  from pg_constraint con join pg_class cl on cl.oid = con.conrelid join pg_namespace n on n.oid = cl.relnamespace
  join t on t.name = cl.relname where n.nspname = 'public'
  union all
  select 'C.rls', c.relname::text, 'row level security enabled = ' || c.relrowsecurity::text
  from pg_class c join pg_namespace n on n.oid = c.relnamespace join t on t.name = c.relname where n.nspname = 'public'
  union all
  select 'D.policy', tablename::text, policyname::text || ' [' || cmd::text || '] roles=' || roles::text
         || ' using=' || coalesce(qual, '-') || ' check=' || coalesce(with_check, '-')
  from pg_policies where schemaname in ('public', 'storage')
  union all
  select 'E.trigger', cl.relname::text, pg_get_triggerdef(tg.oid)
  from pg_trigger tg join pg_class cl on cl.oid = tg.tgrelid join pg_namespace n on n.oid = cl.relnamespace
  where not tg.tgisinternal
    and ((n.nspname = 'public' and cl.relname in (select name from t)) or (n.nspname = 'auth' and cl.relname = 'users'))
  union all
  select 'E2.auth_users_trigger_function', 'auth.users', pg_get_functiondef(tg.tgfoid)
  from pg_trigger tg join pg_class cl on cl.oid = tg.tgrelid join pg_namespace n on n.oid = cl.relnamespace
  where not tg.tgisinternal and n.nspname = 'auth' and cl.relname = 'users'
  union all
  select 'F.function', p.proname::text, 'security_definer=' || p.prosecdef::text || ' args=(' || pg_get_function_identity_arguments(p.oid) || ')'
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public'
  union all
  select 'G.grants', g.table_name::text, g.grantee::text || ': ' || string_agg(g.privilege_type::text, ',' order by g.privilege_type::text)
  from information_schema.role_table_grants g join t on t.name = g.table_name
  where g.table_schema = 'public' and g.grantee in ('anon', 'authenticated')
  group by g.table_name, g.grantee
  union all
  select 'H.row_count', name, (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from public.%I', name), false, true, '')))[1]::text
  from t
  union all
  select 'I.yawvorex_table_already_present', table_name::text, 'exists'
  from information_schema.tables
  where table_schema = 'public' and table_name in ('product_variants','product_images','order_status_history','manual_payments','portfolio_projects','site_settings','digital_files')
) x;
