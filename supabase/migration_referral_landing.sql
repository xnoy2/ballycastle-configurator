-- =====================================================================
-- BCF REFERRAL LANDING — Public RPC function
-- Run in: Supabase Dashboard → SQL Editor → New Query
--
-- Allows the /refer/:code landing page to look up the referrer's
-- first name without requiring the visitor to be logged in.
-- Only returns the first name — no sensitive data exposed.
-- =====================================================================

create or replace function get_referrer_name(referral_code text)
returns text language sql security definer stable as $$
  select split_part(cp.name, ' ', 1)
  from orders o
  join client_profiles cp on cp.id = o.client_id
  where o.order_number = referral_code
  limit 1
$$;

-- Allow anon (unauthenticated) visitors to call this function
grant execute on function get_referrer_name(text) to anon, authenticated;
