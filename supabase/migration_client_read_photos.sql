-- =====================================================================
-- Allow clients to read order photos (table + storage)
-- Fixes: Photos & Files tab in client portal showing empty in production
--
-- Two missing policies:
--   1. SELECT on order_photos table  → clients can query their photo records
--   2. SELECT on storage.objects     → createSignedUrl succeeds for admin-uploaded photos
--
-- Safe to re-run (drops existing policy before recreating)
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- =====================================================================

-- 1. Table SELECT policy
drop policy if exists "Clients can view their order photos" on order_photos;

create policy "Clients can view their order photos"
  on order_photos for select
  to authenticated
  using (
    get_my_role() = 'client'
    and order_id in (
      select id from orders where client_id = auth.uid()
    )
  );

-- 2. Storage SELECT policy (needed for createSignedUrl on private bucket)
drop policy if exists "Clients can read their order photos from storage" on storage.objects;

create policy "Clients can read their order photos from storage"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'order-photos'
    and get_my_role() = 'client'
    and split_part(name, '/', 1) in (
      select id::text from orders where client_id = auth.uid()
    )
  );
