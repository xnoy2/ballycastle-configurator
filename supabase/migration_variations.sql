-- =====================================================================
-- Variation Requests — client can submit, admin can respond
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- =====================================================================

-- Client variation requests
create table if not exists variation_requests (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid references orders(id) on delete cascade not null,
  client_id    uuid references auth.users(id) on delete cascade not null,
  description  text not null,
  status       text default 'pending',   -- pending | reviewing | approved | rejected
  admin_notes  text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index if not exists idx_variation_requests_order_id  on variation_requests(order_id);
create index if not exists idx_variation_requests_client_id on variation_requests(client_id);

alter table variation_requests enable row level security;

create policy "Client can read own variation requests"
  on variation_requests for select
  using (client_id = auth.uid());

create policy "Client can insert own variation requests"
  on variation_requests for insert
  with check (client_id = auth.uid());

create policy "Service role full access to variation requests"
  on variation_requests for all
  using (true);

-- Add doc_type to order_documents so admin can tag variation agreements separately
alter table order_documents
  add column if not exists doc_type text default 'general';
-- doc_type values: 'general' | 'variation' | 'contract' | 'warranty'
