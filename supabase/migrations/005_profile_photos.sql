-- Optional profile photo setup. Review and apply manually to the intended Supabase project.
-- Photos are private; authenticated users can access objects only in their own UUID folder.

alter table public.profiles add column if not exists avatar_path text;
grant update (avatar_path) on public.profiles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-photos', 'profile-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "yvx: users read own profile photos" on storage.objects;
create policy "yvx: users read own profile photos" on storage.objects
for select to authenticated
using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "yvx: users upload own profile photos" on storage.objects;
create policy "yvx: users upload own profile photos" on storage.objects
for insert to authenticated
with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "yvx: users delete own profile photos" on storage.objects;
create policy "yvx: users delete own profile photos" on storage.objects
for delete to authenticated
using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
