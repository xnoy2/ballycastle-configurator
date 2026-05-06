-- =====================================================================
-- Remove duplicate orders for the same client — keep the most recent
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- =====================================================================

-- Preview first (run this SELECT to confirm what will be deleted):
-- select id, order_number, created_at
-- from orders
-- where client_id = (select id from client_profiles where email = 'reyesjomelcena2@gmail.com')
-- order by created_at desc;

-- Delete all orders for this client EXCEPT the most recent one
delete from orders
where client_id = (select id from client_profiles where email = 'reyesjomelcena2@gmail.com')
  and id not in (
    select id from orders
    where client_id = (select id from client_profiles where email = 'reyesjomelcena2@gmail.com')
    order by created_at desc
    limit 1
  );
