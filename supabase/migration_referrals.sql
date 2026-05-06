-- =====================================================================
-- BCF REFERRALS TABLE
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- =====================================================================


-- ── 1. TABLE ──────────────────────────────────────────────────────────
create table if not exists referrals (
  id              uuid    primary key default gen_random_uuid(),
  referrer_id     uuid    not null references client_profiles(id) on delete cascade,
  referred_name   text,
  referred_email  text,
  referred_phone  text,
  status          text    not null default 'pending'
                    check (status in ('pending','converted','declined')),
  reward_amount   integer not null default 50,
  reward_paid     boolean not null default false,
  notes           text,
  created_at      timestamptz default now()
);


-- ── 2. ROW LEVEL SECURITY ─────────────────────────────────────────────
alter table referrals enable row level security;

-- Client can insert referrals they send
create policy "Client can submit referrals"
  on referrals for insert
  with check (referrer_id = auth.uid());

-- Client can read their own referrals
create policy "Client can read own referrals"
  on referrals for select
  using (referrer_id = auth.uid());

-- Admin can manage all
create policy "Admin can manage referrals"
  on referrals for all
  using (get_my_role() = 'admin');
