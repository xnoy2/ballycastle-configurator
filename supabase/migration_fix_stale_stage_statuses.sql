-- =====================================================================
-- FIX: Reset stale in_progress stages that should be pending
--
-- Context: before sequential stage validation existed, multiple stages
-- could be marked in_progress. Now only one stage can be active at a
-- time. This resets any in_progress stage that is NOT the first
-- in_progress one (by stage_number) back to pending.
--
-- STEP 1: Preview — see which stages will be reset
-- =====================================================================

SELECT
  bs.id,
  bs.order_id,
  bs.stage_number,
  bs.label,
  bs.status,
  o.order_number
FROM build_stages bs
JOIN orders o ON bs.order_id = o.id
WHERE bs.status = 'in_progress'
  AND bs.stage_number > (
    SELECT MIN(bs2.stage_number)
    FROM build_stages bs2
    WHERE bs2.order_id = bs.order_id
      AND bs2.status = 'in_progress'
  )
ORDER BY o.order_number, bs.stage_number;


-- =====================================================================
-- STEP 2: Reset those stages to pending (run after confirming Step 1)
-- =====================================================================

UPDATE build_stages bs
SET status = 'pending', completed_at = NULL
WHERE bs.status = 'in_progress'
  AND bs.stage_number > (
    SELECT MIN(bs2.stage_number)
    FROM build_stages bs2
    WHERE bs2.order_id = bs.order_id
      AND bs2.status = 'in_progress'
  );


-- =====================================================================
-- STEP 3: Clean up orphaned order_photos for now-pending stages
-- (Run the cleanup migration separately if you haven't already)
-- supabase/migration_cleanup_pending_stage_photos.sql
-- =====================================================================
