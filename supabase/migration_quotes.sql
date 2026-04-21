-- =====================================================================
-- BCF CONFIGURATOR — QUOTES TABLE
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- =====================================================================

create table if not exists quotes (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  name         text        not null,
  email        text        not null,
  phone        text        not null,
  total_price  int         not null,
  line_items   jsonb       not null default '[]',
  status       text        not null default 'new'
                           check (status in ('new', 'contacted', 'ordered', 'declined')),
  notes        text        not null default ''
);

-- RLS
alter table quotes enable row level security;

-- Anyone (anon) can submit a quote
create policy "anon insert quotes" on quotes for insert with check (true);

-- Only authenticated admin can read and update quotes
create policy "admin read quotes"   on quotes for select using (auth.role() = 'authenticated');
create policy "admin update quotes" on quotes for update using (auth.role() = 'authenticated');
