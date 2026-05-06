-- =====================================================================
-- Remove test client accounts: Geraldine N + Jomel Reyes (client)
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- =====================================================================

do $$
declare
  v_geraldine uuid;
  v_jomel_client uuid;
begin
  -- Find user IDs by email
  select id into v_geraldine     from auth.users where email = 'nabasanogeraldine@gmail.com';
  select id into v_jomel_client  from auth.users where email = 'reyesjomelcena2@gmail.com';

  -- Delete orders + cascaded data (build_stages, order_photos, order_payments, order_documents)
  if v_geraldine is not null then
    delete from orders where client_id = v_geraldine;
    delete from client_profiles where id = v_geraldine;
    delete from user_roles where user_id = v_geraldine;
    delete from auth.users where id = v_geraldine;
  end if;

  if v_jomel_client is not null then
    delete from orders where client_id = v_jomel_client;
    delete from client_profiles where id = v_jomel_client;
    delete from user_roles where user_id = v_jomel_client;
    delete from auth.users where id = v_jomel_client;
  end if;
end $$;
