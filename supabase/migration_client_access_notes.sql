-- =====================================================================
-- Allow clients to update access_notes on their own orders
-- Safe to re-run
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- =====================================================================

drop policy if exists "Client can update own order access notes" on orders;

create policy "Client can update own order access notes"
  on orders for update
  using  (client_id = auth.uid())
  with check (client_id = auth.uid());
