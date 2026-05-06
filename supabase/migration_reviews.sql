-- =====================================================================
-- BCF REVIEWS TABLE
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- =====================================================================

create table if not exists reviews (
  id         uuid    primary key default gen_random_uuid(),
  order_id   uuid    not null references orders(id) on delete cascade,
  client_id  uuid    not null references client_profiles(id) on delete cascade,
  stars      integer not null check (stars between 1 and 5),
  body       text,
  created_at timestamptz default now(),
  unique (order_id)   -- one review per order
);

alter table reviews enable row level security;

-- Client can submit and read their own review
create policy "Client can manage own review"
  on reviews for all
  using (client_id = auth.uid())
  with check (client_id = auth.uid());

-- Admin can read all reviews
create policy "Admin can manage all reviews"
  on reviews for all
  using (get_my_role() = 'admin');
