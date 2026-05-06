-- =====================================================================
-- Fix: set "Order Confirmed" (stage 1) back to in_progress for all
-- orders where it was auto-completed on creation but has no tasks done
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- =====================================================================

update build_stages
set status = 'in_progress', completed_at = null
where stage_number = 1
  and status = 'done'
  -- only reset if no tasks have been marked complete on it
  and not exists (
    select 1 from stage_tasks st
    where st.stage_id = build_stages.id and st.completed = true
  );
