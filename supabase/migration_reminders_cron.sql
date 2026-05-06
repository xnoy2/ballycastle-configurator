-- =====================================================================
-- BCF ANNUAL REMINDERS — pg_cron job
-- Run in: Supabase Dashboard → SQL Editor → New Query
--
-- BEFORE RUNNING:
--   Replace the two placeholders below with your real values:
--
--   YOUR_PROJECT_REF  → found in Supabase Dashboard URL:
--                       https://supabase.com/dashboard/project/YOUR_PROJECT_REF
--
--   YOUR_SERVICE_ROLE_KEY → Supabase Dashboard →
--                           Project Settings → API → service_role key
-- =====================================================================


-- ── 1. Enable required extensions ─────────────────────────────────────
create extension if not exists pg_cron;
create extension if not exists pg_net;


-- ── 2. Schedule the cron job ──────────────────────────────────────────
-- Runs at 9:00am UTC on the 1st of every month
select cron.schedule(
  'bcf-send-monthly-reminders',          -- job name (unique)
  '0 9 1 * *',                           -- cron: 9am on 1st of every month
  $$
  select net.http_post(
    url     := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body    := jsonb_build_object(
      'month', to_char(now(), 'FMMonth')  -- passes e.g. "April"
    )
  );
  $$
);


-- ── 3. Verify the job was created ─────────────────────────────────────
-- Run this after to confirm:
-- select * from cron.job;


-- ── TO REMOVE THE JOB (if needed) ─────────────────────────────────────
-- select cron.unschedule('bcf-send-monthly-reminders');
