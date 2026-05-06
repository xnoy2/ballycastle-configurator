-- =====================================================================
-- Enable realtime for client_notifications
-- Run this if you already ran migration_client_notifications.sql
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- =====================================================================

-- Needed so Supabase realtime can filter by client_id (non-PK column)
alter table client_notifications replica identity full;

-- Add to the realtime publication so INSERT events are broadcast
alter publication supabase_realtime add table client_notifications;
