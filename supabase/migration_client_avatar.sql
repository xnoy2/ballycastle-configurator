-- =====================================================================
-- Client profile avatar support
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- =====================================================================

-- Add avatar_url column to client_profiles
alter table client_profiles
  add column if not exists avatar_url text;

-- Create avatars storage bucket (public so signed URLs aren't needed)
insert into storage.buckets (id, name, public, allowed_mime_types)
values ('avatars', 'avatars', true, array['image/jpeg','image/png','image/webp','image/heic','image/gif'])
on conflict (id) do nothing;

-- RLS: clients can upload/update their own avatar
create policy "Client can upload own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Client can update own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- RLS: clients can update their own profile
create policy "Client can update own profile"
  on client_profiles for update
  using (id = auth.uid());
