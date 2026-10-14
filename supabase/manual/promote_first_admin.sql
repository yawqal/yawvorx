-- YAWVOREX: make YOUR account the first administrator. Run in the Supabase SQL Editor ONLY.
-- 1) Register on your website first. 2) Supabase > Authentication > Users > tap your email > copy "User UID".
-- 3) Replace PASTE_YOUR_USER_UID_HERE below (keep the quotes). Do not share the UID publicly.
-- Your user_roles table holds ONE row per user (customer or admin), so this sets your row to admin.
-- To remove admin rights later, run:  update public.user_roles set role = 'customer' where user_id = 'THE_UID';

insert into public.user_roles (user_id, role)
values ('PASTE_YOUR_USER_UID_HERE', 'admin')
on conflict (user_id) do update set role = 'admin';

select u.email, r.role from public.user_roles r join auth.users u on u.id = r.user_id where r.role = 'admin';
