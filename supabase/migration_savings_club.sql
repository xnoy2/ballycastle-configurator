-- =====================================================================
-- Christmas Savings Club
-- Safe to re-run.
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- =====================================================================

-- 1. Savings plan metadata (target, monthly amount, dates)
create table if not exists savings_plans (
  id              uuid        primary key default gen_random_uuid(),
  order_id        uuid        not null references orders(id) on delete cascade,
  client_id       uuid        not null references client_profiles(id) on delete cascade,
  name            text        not null default 'Christmas Savings Club',
  target_amount   numeric     not null default 0,
  monthly_amount  numeric,
  start_date      date        default current_date,
  target_date     date,
  is_active       boolean     not null default true,
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table savings_plans enable row level security;

create policy "Admin can manage savings plans"
  on savings_plans for all
  using (get_my_role() = 'admin');

create policy "Client can read own savings plan"
  on savings_plans for select
  using (client_id = auth.uid());

-- 2. Allow 'savings' as a payment type on order_payments
--    (drop and re-create the check constraint if one exists)
alter table order_payments
  drop constraint if exists order_payments_type_check;

alter table order_payments
  add constraint order_payments_type_check
  check (type in ('invoice', 'amendment', 'received', 'savings'));
