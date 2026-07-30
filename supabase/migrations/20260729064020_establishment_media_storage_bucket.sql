/*
# Establishment media storage bucket

## Purpose
Adds a dedicated private storage bucket `establishment-media` for
organization/establishment images (logo, premises photos, official
documents) uploaded during onboarding, with row-level security policies.

## Changes
1. New Storage bucket: `establishment-media` (private — uploads/reads go
   through authenticated policies, not a public CDN).
2. Storage policies (SELECT/INSERT/UPDATE/DELETE) scoped to the
   authenticated owner of the folder path `establishment-media/<user_id>/...`.

## Security
- Only the authenticated user whose `auth.uid()` matches the first path
  segment may read or write objects under their own folder.
- Admins (via `public.is_admin()`) may read all objects so they can review
  uploaded media during the approval step.
- No anon access to this bucket.
*/

insert into storage.buckets (id, name, public, avif_autodetection)
values ('establishment-media', 'establishment-media', false, false)
on conflict (id) do nothing;

-- Owner can read their own media
drop policy if exists "owner_read_own_media" on storage.objects;
create policy "owner_read_own_media"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'establishment-media'
    and auth.uid() = (storage.foldername(name))[1]::uuid
  );

-- Admin can read all establishment media (review step)
drop policy if exists "admin_read_all_media" on storage.objects;
create policy "admin_read_all_media"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'establishment-media' and public.is_admin());

-- Owner can upload into their own folder
drop policy if exists "owner_insert_own_media" on storage.objects;
create policy "owner_insert_own_media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'establishment-media'
    and auth.uid() = (storage.foldername(name))[1]::uuid
  );

-- Owner can update/delete their own media
drop policy if exists "owner_update_own_media" on storage.objects;
create policy "owner_update_own_media"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'establishment-media'
    and auth.uid() = (storage.foldername(name))[1]::uuid
  )
  with check (
    bucket_id = 'establishment-media'
    and auth.uid() = (storage.foldername(name))[1]::uuid
  );

drop policy if exists "owner_delete_own_media" on storage.objects;
create policy "owner_delete_own_media"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'establishment-media'
    and auth.uid() = (storage.foldername(name))[1]::uuid
  );
