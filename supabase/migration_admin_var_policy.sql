-- =====================================================================
-- Admin bypass policies for variation_requests
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- Required so admin can read all variation requests and raise them
-- on behalf of clients (insert with client_id ≠ auth.uid())
-- =====================================================================

-- Drop if exists (safe re-run)
drop policy if exists "Admin full access to variation requests" on variation_requests;

create policy "Admin full access to variation requests"
  on variation_requests for all
  using (
    exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );
