-- =====================================================================
-- BCF PAYMENTS — CONTRACT AMOUNT + PAYMENT LEDGER
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- =====================================================================

-- Add contract amount to the orders table
alter table orders add column if not exists contract_amount numeric(10,2);

-- ── PAYMENT LEDGER ──────────────────────────────────────────────────
-- type = 'invoice'   : a payment milestone due from the client
-- type = 'amendment' : a contract variation (amount can be +/-)
-- type = 'received'  : an actual payment received from the client
create table if not exists order_payments (
  id            uuid          primary key default gen_random_uuid(),
  order_id      uuid          not null references orders(id) on delete cascade,
  type          text          not null default 'invoice'
                  check (type in ('invoice', 'amendment', 'received')),
  label         text          not null,
  amount        numeric(10,2) not null,

  -- Invoice fields
  due_date      date,
  paid_date     date,
  status        text          not null default 'upcoming'
                  check (status in ('paid','due','overdue','upcoming')),

  -- Payment-received fields
  received_date date,
  method        text,   -- 'bank', 'paypal', 'cash', 'other'

  notes         text,
  created_at    timestamptz   default now()
);

alter table order_payments enable row level security;

-- Clients can read their own order's payments
create policy "Client can view own order payments"
  on order_payments for select
  using (
    exists (
      select 1 from orders o
      where o.id = order_payments.order_id
        and o.client_id = auth.uid()
    )
  );

-- Admins can do everything
create policy "Admin can manage all payments"
  on order_payments for all
  using (get_my_role() = 'admin');
