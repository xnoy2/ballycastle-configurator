-- =====================================================================
-- BCF CONFIGURATOR — CREATE QUOTE PDF STORAGE BUCKET
-- Run in: Supabase Dashboard → SQL Editor → New Query
--
-- Creates a public bucket for storing generated quote PDFs.
-- The edge function uploads to this bucket using the service role key
-- (bypasses RLS), so only one policy is needed: allow public read.
-- =====================================================================

-- Create the bucket (public = anyone with the URL can download the PDF)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'quote-pdfs',
  'quote-pdfs',
  true,
  5242880,          -- 5 MB max per file
  '{application/pdf}'
)
on conflict (id) do nothing;

-- Allow public read (so the download link in the email works without auth)
create policy "Public read quote PDFs"
  on storage.objects for select
  using ( bucket_id = 'quote-pdfs' );
