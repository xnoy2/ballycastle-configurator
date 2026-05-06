-- =====================================================================
-- Add stage_id to order_photos
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- =====================================================================

alter table order_photos
  add column if not exists stage_id uuid references build_stages(id) on delete set null;

-- Index for fast lookups by stage
create index if not exists order_photos_stage_id_idx on order_photos(stage_id);
