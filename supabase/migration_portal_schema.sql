-- =====================================================================
-- BCF PORTAL SCHEMA
-- Run in: Supabase Dashboard → SQL Editor → New Query
--
-- Creates tables for:
--   user_roles       — admin / worker / client roles
--   client_profiles  — client details linked to auth.users
--   worker_profiles  — worker details linked to auth.users
--   orders           — one order per client
--   build_stages     — 7 progress stages per order
--   order_photos     — photos uploaded by workers per order
-- =====================================================================


-- ── 1. USER ROLES ─────────────────────────────────────────────────────
create table if not exists user_roles (
  user_id  uuid primary key references auth.users(id) on delete cascade,
  role     text not null check (role in ('admin','worker','client')),
  created_at timestamptz default now()
);


-- ── 2. CLIENT PROFILES ────────────────────────────────────────────────
create table if not exists client_profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null,
  email      text not null,
  phone      text,
  created_at timestamptz default now()
);


-- ── 3. WORKER PROFILES ────────────────────────────────────────────────
create table if not exists worker_profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null,
  email      text not null,
  phone      text,
  created_at timestamptz default now()
);


-- ── 4. ORDERS ─────────────────────────────────────────────────────────
create table if not exists orders (
  id                    uuid primary key default gen_random_uuid(),
  client_id             uuid not null references client_profiles(id) on delete cascade,
  worker_id             uuid references worker_profiles(id) on delete set null,
  order_number          text unique not null,         -- e.g. BCF-2026-0847
  address               text,
  installation_date     date,
  installation_window   text,                         -- e.g. "10:00am – 2:00pm"
  access_notes          text,
  ghl_opportunity_id    text,                         -- links back to GHL
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);


-- ── 5. BUILD STAGES ───────────────────────────────────────────────────
create table if not exists build_stages (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id) on delete cascade,
  stage_number  int  not null check (stage_number between 1 and 7),
  label         text not null,
  status        text not null default 'pending' check (status in ('pending','in_progress','done')),
  completed_at  timestamptz,
  notes         text,
  updated_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz default now(),
  unique (order_id, stage_number)
);


-- ── 6. ORDER PHOTOS ───────────────────────────────────────────────────
create table if not exists order_photos (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id) on delete cascade,
  storage_path  text not null,   -- Supabase Storage path
  caption       text,
  uploaded_by   uuid references auth.users(id) on delete set null,
  created_at    timestamptz default now()
);


-- ── 7. AUTO-UPDATE orders.updated_at ──────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger orders_updated_at
  before update on orders
  for each row execute function update_updated_at();


-- ── 8. ENABLE ROW LEVEL SECURITY ──────────────────────────────────────
alter table user_roles      enable row level security;
alter table client_profiles enable row level security;
alter table worker_profiles enable row level security;
alter table orders          enable row level security;
alter table build_stages    enable row level security;
alter table order_photos    enable row level security;


-- ── 9. HELPER: get current user's role ────────────────────────────────
create or replace function get_my_role()
returns text language sql security definer stable as $$
  select role from user_roles where user_id = auth.uid()
$$;


-- ── 10. RLS POLICIES — USER ROLES ─────────────────────────────────────
create policy "Users can read own role"
  on user_roles for select
  using (user_id = auth.uid());

create policy "Admin can manage roles"
  on user_roles for all
  using (get_my_role() = 'admin');


-- ── 11. RLS POLICIES — CLIENT PROFILES ────────────────────────────────
create policy "Client can read own profile"
  on client_profiles for select
  using (id = auth.uid());

create policy "Admin and worker can read all clients"
  on client_profiles for select
  using (get_my_role() in ('admin','worker'));

create policy "Admin can manage client profiles"
  on client_profiles for all
  using (get_my_role() = 'admin');


-- ── 12. RLS POLICIES — WORKER PROFILES ────────────────────────────────
create policy "Worker can read own profile"
  on worker_profiles for select
  using (id = auth.uid());

create policy "Admin can manage worker profiles"
  on worker_profiles for all
  using (get_my_role() = 'admin');

create policy "All authenticated can read workers"
  on worker_profiles for select
  using (auth.role() = 'authenticated');


-- ── 13. RLS POLICIES — ORDERS ─────────────────────────────────────────
create policy "Client can read own order"
  on orders for select
  using (client_id = auth.uid());

create policy "Worker can read assigned orders"
  on orders for select
  using (worker_id = auth.uid());

create policy "Admin can manage all orders"
  on orders for all
  using (get_my_role() = 'admin');

create policy "Worker can update assigned orders"
  on orders for update
  using (worker_id = auth.uid());


-- ── 14. RLS POLICIES — BUILD STAGES ───────────────────────────────────
create policy "Client can read own build stages"
  on build_stages for select
  using (
    exists (
      select 1 from orders
      where orders.id = build_stages.order_id
        and orders.client_id = auth.uid()
    )
  );

create policy "Worker can read and update assigned stages"
  on build_stages for all
  using (
    exists (
      select 1 from orders
      where orders.id = build_stages.order_id
        and orders.worker_id = auth.uid()
    )
  );

create policy "Admin can manage all build stages"
  on build_stages for all
  using (get_my_role() = 'admin');


-- ── 15. RLS POLICIES — ORDER PHOTOS ───────────────────────────────────
create policy "Client can read own order photos"
  on order_photos for select
  using (
    exists (
      select 1 from orders
      where orders.id = order_photos.order_id
        and orders.client_id = auth.uid()
    )
  );

create policy "Worker can manage photos for assigned orders"
  on order_photos for all
  using (
    exists (
      select 1 from orders
      where orders.id = order_photos.order_id
        and orders.worker_id = auth.uid()
    )
  );

create policy "Admin can manage all photos"
  on order_photos for all
  using (get_my_role() = 'admin');


-- ── 16. STORAGE BUCKET FOR ORDER PHOTOS ───────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'order-photos',
  'order-photos',
  false,
  10485760,   -- 10 MB per file
  '{image/jpeg,image/png,image/webp,image/heic}'
)
on conflict (id) do nothing;

-- Workers and admins can upload
create policy "Workers and admins can upload order photos"
  on storage.objects for insert
  with check (
    bucket_id = 'order-photos'
    and get_my_role() in ('admin','worker')
  );

-- Clients, workers and admins can view
create policy "Authenticated users can view order photos"
  on storage.objects for select
  using (
    bucket_id = 'order-photos'
    and auth.role() = 'authenticated'
  );
