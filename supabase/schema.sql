-- =====================================================================
-- BCF CONFIGURATOR — SUPABASE SCHEMA
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- =====================================================================

-- MODULES
create table if not exists modules (
  id          text primary key,
  label       text        not null,
  category    text        not null check (category in ('Sets', 'Accessories')),
  required    boolean     not null default false,
  sort_order  int         not null default 0,
  is_active   boolean     not null default true
);

-- MODULE SELECTS (dropdown groups within a module)
create table if not exists module_selects (
  id          text primary key,   -- format: {module_id}__{select_id}
  module_id   text        not null references modules(id) on delete cascade,
  select_id   text        not null,
  placeholder text        not null,
  sort_order  int         not null default 0
);

-- MODULE OPTIONS (individual choices within a select)
create table if not exists module_options (
  id          text primary key,   -- the option value, e.g. 'platform-tower-single'
  select_ref  text        not null references module_selects(id) on delete cascade,
  module_id   text        not null,
  label       text        not null,
  price       int         not null default 0,
  glb         text,
  snap_zone   text        not null default 'center',
  offset_x    float       not null default 0,
  offset_y    float       not null default 0,
  offset_z    float       not null default 0,
  rotation_x  float       not null default 0,
  rotation_y  float       not null default 0,
  rotation_z  float       not null default 0,
  sort_order  int         not null default 0,
  is_active   boolean     not null default true
);

-- GROUND SURFACES
create table if not exists ground_surfaces (
  id          serial primary key,
  value       text        unique not null,
  label       text        not null,
  price       int         not null default 0,
  glb         text,
  sort_order  int         not null default 0,
  is_active   boolean     not null default true
);

-- INSTALLATION OPTIONS
create table if not exists installation_options (
  id          serial primary key,
  value       text        unique not null,
  label       text        not null,
  price       int         not null default 0,
  sort_order  int         not null default 0,
  is_active   boolean     not null default true
);

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================

alter table modules              enable row level security;
alter table module_selects       enable row level security;
alter table module_options       enable row level security;
alter table ground_surfaces      enable row level security;
alter table installation_options enable row level security;

-- Public (anon) can read all active products
create policy "public read modules"              on modules              for select using (true);
create policy "public read module_selects"       on module_selects       for select using (true);
create policy "public read module_options"       on module_options       for select using (true);
create policy "public read ground_surfaces"      on ground_surfaces      for select using (true);
create policy "public read installation_options" on installation_options for select using (true);

-- Authenticated admin can do everything
create policy "admin all modules"              on modules              for all using (auth.role() = 'authenticated');
create policy "admin all module_selects"       on module_selects       for all using (auth.role() = 'authenticated');
create policy "admin all module_options"       on module_options       for all using (auth.role() = 'authenticated');
create policy "admin all ground_surfaces"      on ground_surfaces      for all using (auth.role() = 'authenticated');
create policy "admin all installation_options" on installation_options for all using (auth.role() = 'authenticated');
