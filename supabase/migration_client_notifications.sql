-- =====================================================================
-- Client notifications table
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- =====================================================================

create table if not exists client_notifications (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid references auth.users(id) on delete cascade not null,
  title       text not null,
  body        text,
  read        boolean default false,
  created_at  timestamptz default now()
);

create index if not exists idx_client_notifications_client_id on client_notifications(client_id);

-- RLS
alter table client_notifications enable row level security;

create policy "Client can read own notifications"
  on client_notifications for select
  using (client_id = auth.uid());

create policy "Client can mark own notifications read"
  on client_notifications for update
  using (client_id = auth.uid());

-- Service role AND authenticated admin can insert
create policy "Service role can insert notifications"
  on client_notifications for insert
  with check (true);

-- Required for realtime row-level filtering to work on non-PK columns
alter table client_notifications replica identity full;

-- Enable realtime delivery to subscribed clients
alter publication supabase_realtime add table client_notifications;
