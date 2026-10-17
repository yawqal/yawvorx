-- NOT RUN - owner runs in Supabase
-- Product type and digital_files storage references are defined by 001a and 001b3.
-- Migration 003 creates product-images, portfolio-images, and the private digital-files bucket.
-- This phase keeps that bucket private and adds owner-only, paid-order read policies.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('digital-files', 'digital-files', false, 52428800, null)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

alter table public.digital_files enable row level security;
grant select on public.digital_files to authenticated;

drop policy if exists "yvx: customers read purchased digital files" on public.digital_files;
create policy "yvx: customers read purchased digital files" on public.digital_files
  for select to authenticated using (
    exists (
      select 1
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.product_id = digital_files.product_id
        and oi.product_type = 'digital'
        and (digital_files.variant_id is null or digital_files.variant_id = oi.variant_id)
        and o.user_id = (select auth.uid())
        and o.payment_status = 'paid'
    )
  );

drop policy if exists "yvx: customers sign purchased digital files" on storage.objects;
create policy "yvx: customers sign purchased digital files" on storage.objects
  for select to authenticated using (
    bucket_id = 'digital-files'
    and exists (
      select 1
      from public.digital_files df
      join public.order_items oi on oi.product_id = df.product_id
      join public.orders o on o.id = oi.order_id
      where df.storage_bucket = storage.objects.bucket_id
        and df.storage_path = storage.objects.name
        and oi.product_type = 'digital'
        and (df.variant_id is null or df.variant_id = oi.variant_id)
        and o.user_id = (select auth.uid())
        and o.payment_status = 'paid'
    )
  );
