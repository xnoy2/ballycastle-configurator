-- =====================================================================
-- BCF EXTRA REQUESTS TABLE
-- Run in: Supabase Dashboard → SQL Editor → New Query
--
-- Stores requests submitted by clients from the "Add Extras" portal tab.
-- Admin can view and action these from the Orders tab.
-- =====================================================================


-- ── 1. TABLE ──────────────────────────────────────────────────────────
create table if not exists order_extra_requests (
  id         uuid    primary key default gen_random_uuid(),
  order_id   uuid    not null references orders(id) on delete cascade,
  client_id  uuid    not null references client_profiles(id) on delete cascade,
  items      jsonb   not null,      -- [{id, name, icon, price}]
  total      integer not null,
  status     text    not null default 'pending'
               check (status in ('pending','confirmed','declined')),
  admin_note text,
  created_at timestamptz default now()
);


-- ── 2. ROW LEVEL SECURITY ─────────────────────────────────────────────
alter table order_extra_requests enable row level security;

-- Client can insert their own requests
create policy "Client can submit extra requests"
  on order_extra_requests for insert
  with check (client_id = auth.uid());

-- Client can read their own requests
create policy "Client can read own extra requests"
  on order_extra_requests for select
  using (client_id = auth.uid());

-- Admin can manage all
create policy "Admin can manage extra requests"
  on order_extra_requests for all
  using (get_my_role() = 'admin');
