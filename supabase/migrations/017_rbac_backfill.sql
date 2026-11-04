-- YAWVOREX 017: RBAC Backfill
-- Migrate legacy user_roles and set customer defaults.

begin;

-- Seed Data
insert into public.roles (code, name) values
('customer', 'Customer'),
('admin', 'Administrator'),
('vendor', 'Vendor'),
('freelancer', 'Freelancer'),
('affiliate', 'Affiliate')
on conflict (code) do nothing;

insert into public.permissions (code, description) values
('products:manage', 'Manage products'),
('orders:manage', 'Manage orders'),
('roles:manage', 'Manage user roles');

-- Backfill: Default Customer Role
insert into public.user_roles_v2 (user_id, role_id)
select u.id, r.id
from auth.users u
cross join public.roles r
where r.code = 'customer'
on conflict (user_id, role_id) do nothing;

-- Backfill: Migrate Admin
insert into public.user_roles_v2 (user_id, role_id, status)
select ur.user_id, r.id, 'active'
from public.user_roles ur
join public.roles r on r.code = 'admin'
where ur.role = 'admin'
on conflict (user_id, role_id) do update set status = 'active';

commit;
