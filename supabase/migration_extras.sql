-- =====================================================================
-- BCF EXTRAS TABLE
-- Run in: Supabase Dashboard → SQL Editor → New Query
--
-- Creates the `extras` table so BCF admin can manage add-on products
-- that appear in the client portal "Add Extras" tab.
-- =====================================================================


-- ── 1. TABLE ──────────────────────────────────────────────────────────
create table if not exists extras (
  id          uuid    primary key default gen_random_uuid(),
  name        text    not null,
  description text,
  price       integer not null default 0,
  icon        text    not null default '⭐',
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz default now()
);


-- ── 2. ROW LEVEL SECURITY ─────────────────────────────────────────────
alter table extras enable row level security;

-- Any authenticated user (clients, workers, admins) can read active extras
create policy "Authenticated users can read active extras"
  on extras for select
  using (auth.role() = 'authenticated' and is_active = true);

-- Admins can read all extras (including hidden ones)
create policy "Admin can read all extras"
  on extras for select
  using (get_my_role() = 'admin');

-- Only admins can insert / update / delete
create policy "Admin can manage extras"
  on extras for all
  using (get_my_role() = 'admin');


-- ── 3. SEED WITH EXISTING HARDCODED ITEMS ─────────────────────────────
insert into extras (name, description, price, icon, sort_order) values
  ('Nest Swing',         'Large 80cm nest swing, fits 2 kids',     89,  '🪹', 1),
  ('Wave Slide',         'Fun wavy plastic slide in bright red',   145, '🛝', 2),
  ('Rock Climbing Wall', 'Bolt-on rock holds, various colours',    120, '🧗', 3),
  ('Monkey Bars',        'Pressure-treated timber monkey bars',    199, '🐒', 4),
  ('Mud Kitchen',        'Wooden mud kitchen with sink & hob',     165, '🍳', 5),
  ('Safety Bark (1m³)',  'Play-grade certified safety bark',        55, '🌿', 6)
on conflict do nothing;
