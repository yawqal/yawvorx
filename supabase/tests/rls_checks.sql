-- YAWVOREX manual security checks. Run each numbered block SEPARATELY in the SQL Editor.
-- These were NOT executed by the author. Run them yourself and compare with "Expected".

-- 1. Visitor (not signed in) can read published products only.
--    Expected: a number (published products only), no error.
begin; set local role anon; select count(*) from public.products; rollback;

-- 2. Visitor cannot read orders.   Expected: ERROR permission denied for table orders
begin; set local role anon; select * from public.orders; rollback;

-- 3. Visitor cannot write products. Expected: ERROR permission denied for table products
begin; set local role anon; insert into public.products (slug, name, price) values ('x','x',1); rollback;

-- 4. Visitor cannot read manual payments or digital files. Expected: ERROR permission denied (each)
begin; set local role anon; select * from public.manual_payments; rollback;
begin; set local role anon; select * from public.digital_files; rollback;

-- 5. Visitor cannot read private settings. Expected: no 'payment' row
begin; set local role anon; select key from public.site_settings; rollback;

-- 6. Signed-in customer cannot grant themselves a role.
--    Replace the UID with any real user UID that is NOT an admin.  Expected: ERROR permission denied for table user_roles
begin; set local role authenticated; select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-000000000001', 'admin'); rollback;

-- 7. Signed-in non-admin sees zero rows of admin-only tables.  Expected: 0
begin; set local role authenticated; select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select count(*) from public.service_requests; rollback;

-- 8. is_admin() is false for a non-admin.  Expected: false
begin; set local role authenticated; select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select public.is_admin(); rollback;
