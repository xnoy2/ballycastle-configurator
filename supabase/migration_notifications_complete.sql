-- =====================================================================
-- COMPLETE client_notifications setup — safe to re-run
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- This replaces migration_client_notifications.sql and
-- migration_notifications_realtime.sql — run this one file only.
-- =====================================================================

-- 1. Create table
create table if not exists client_notifications (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid references auth.users(id) on delete cascade not null,
  title       text not null,
  body        text,
  read        boolean default false,
  created_at  timestamptz default now()
);

create index if not exists idx_client_notifications_client_id
  on client_notifications(client_id);

-- 2. Enable RLS
alter table client_notifications enable row level security;

-- 3. Drop any old policies so this is safe to re-run
drop policy if exists "Client can read own notifications"         on client_notifications;
drop policy if exists "Client can mark own notifications read"    on client_notifications;
drop policy if exists "Service role can insert notifications"     on client_notifications;
drop policy if exists "Anyone authenticated can insert notifications" on client_notifications;

-- 4. Client policies
create policy "Client can read own notifications"
  on client_notifications for select
  using (client_id = auth.uid());

create policy "Client can mark own notifications read"
  on client_notifications for update
  using (client_id = auth.uid());

-- 5. Insert policy — allows any authenticated user (including admin) to insert
--    The admin inserts on behalf of clients using the client's user id.
create policy "Anyone authenticated can insert notifications"
  on client_notifications for insert
  with check (auth.role() = 'authenticated');

-- 6. Replica identity FULL — required so Supabase realtime can filter
--    rows by client_id (a non-primary-key column) in the subscription
alter table client_notifications replica identity full;

-- 7. Add to realtime publication (idempotent — skips if already added)
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'client_notifications'
  ) then
    alter publication supabase_realtime add table client_notifications;
  end if;
end $$;
