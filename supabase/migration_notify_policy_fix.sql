-- =====================================================================
-- Fix notification INSERT policy — paste this in Supabase SQL Editor
-- Safe to re-run. Does NOT touch the publication (avoids duplicate error).
-- =====================================================================

drop policy if exists "Anyone authenticated can insert notifications" on client_notifications;
drop policy if exists "Service role can insert notifications"         on client_notifications;

-- Allow any logged-in user (admin) to insert notifications for any client
create policy "Anyone authenticated can insert notifications"
  on client_notifications for insert
  with check (true);

-- Replica identity full — needed for realtime row filtering
alter table client_notifications replica identity full;
