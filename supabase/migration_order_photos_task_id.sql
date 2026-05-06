-- =====================================================================
-- BCF ORDER PHOTOS — add task_id so photos can be linked to a task
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- =====================================================================

alter table order_photos
  add column if not exists task_id uuid references stage_tasks(id) on delete set null;
