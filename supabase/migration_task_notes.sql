-- =====================================================================
-- BCF STAGE TASKS — add notes column for task completion details
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- =====================================================================

alter table stage_tasks add column if not exists notes text;
