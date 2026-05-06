-- =====================================================================
-- Add image_url to extras table
-- Safe to re-run.
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- =====================================================================

alter table extras
  add column if not exists image_url text;
