-- =====================================================================
-- Referral system — admin management support
-- Safe to re-run.
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- =====================================================================

-- 1. Add contacted_at so we know when a friend clicked the shared link
alter table referrals
  add column if not exists contacted_at timestamptz;

-- 2. RPC called by the referral landing page (public, no auth required)
--    Looks up the referrer from the order number, then upserts a referral
--    record so the admin can see who visited via which link.
create or replace function track_referral_visit(
  p_referral_code text,
  p_friend_name   text,
  p_friend_email  text,
  p_friend_phone  text default null
)
returns void language plpgsql security definer as $$
declare
  v_referrer_id uuid;
  v_existing_id uuid;
begin
  -- Resolve referrer from the order number used as the referral code
  select o.client_id into v_referrer_id
  from orders o
  where o.order_number = p_referral_code
  limit 1;

  if v_referrer_id is null then return; end if;

  -- Check if this friend was already manually submitted by the client
  select id into v_existing_id
  from referrals
  where referrer_id = v_referrer_id
    and lower(referred_email) = lower(p_friend_email)
  limit 1;

  if v_existing_id is not null then
    -- Friend already registered — just record that they visited
    update referrals
    set contacted_at  = now(),
        referred_name  = coalesce(referred_name, p_friend_name),
        referred_phone = coalesce(referred_phone, p_friend_phone)
    where id = v_existing_id;
  else
    -- New referral via link (client never submitted this person's details)
    insert into referrals (referrer_id, referred_name, referred_email, referred_phone, contacted_at)
    values (v_referrer_id, p_friend_name, p_friend_email, p_friend_phone, now());
  end if;
end;
$$;

-- Allow unauthenticated landing-page visitors to call this
grant execute on function track_referral_visit(text, text, text, text) to anon, authenticated;
