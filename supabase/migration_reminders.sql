-- =====================================================================
-- BCF REMINDERS TABLE
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- =====================================================================

create table if not exists reminders (
  id              uuid    primary key default gen_random_uuid(),
  order_id        uuid    not null references orders(id) on delete cascade,
  client_id       uuid    not null references client_profiles(id) on delete cascade,
  reminder_month  text    not null default 'January',
  notify_via      text    not null default 'Email'
                    check (notify_via in ('Email', 'Email + SMS', 'SMS only')),
  is_active       boolean not null default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (order_id)   -- one reminder setting per order
);

alter table reminders enable row level security;

create policy "Client can manage own reminder"
  on reminders for all
  using (client_id = auth.uid())
  with check (client_id = auth.uid());

create policy "Admin can manage all reminders"
  on reminders for all
  using (get_my_role() = 'admin');
