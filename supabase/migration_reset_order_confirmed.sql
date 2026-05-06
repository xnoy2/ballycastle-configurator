-- =====================================================================
-- Reset ALL "Order Confirmed" (stage 1) back to in_progress
-- Only affects stages that are 'done' with no completed tasks
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- =====================================================================

update build_stages
set    status = 'in_progress',
       completed_at = null
where  stage_number = 1
  and  status = 'done'
  and  not exists (
         select 1 from stage_tasks
         where  stage_id = build_stages.id
           and  completed = true
       );
