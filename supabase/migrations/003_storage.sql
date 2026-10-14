-- YAWVOREX migration 003: storage buckets. Run THIRD.
-- product-images and portfolio-images are public (pictures shown on the site).
-- digital-files is PRIVATE: no visitor or customer can read it. Phase 5 serves downloads with short-lived signed links.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('product-images',   'product-images',   true,  5242880,  array['image/jpeg','image/png','image/webp']),
  ('portfolio-images', 'portfolio-images', true,  5242880,  array['image/jpeg','image/png','image/webp']),
  ('digital-files',    'digital-files',    false, 52428800, null)
on conflict (id) do update
  set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "yvx: admins manage site files" on storage.objects;
create policy "yvx: admins manage site files" on storage.objects for all to authenticated
  using (bucket_id in ('product-images','portfolio-images','digital-files') and public.is_admin())
  with check (bucket_id in ('product-images','portfolio-images','digital-files') and public.is_admin());
select 'OK: 003 finished' as result;
