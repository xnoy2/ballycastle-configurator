-- =====================================================================
-- CLEANUP: Remove order_photos records that belong to pending stages
-- These are orphaned photos from deleted tasks in stages not yet started.
--
-- STEP 1: Preview what will be deleted (run this first to confirm)
-- =====================================================================

SELECT
  op.id,
  op.storage_path,
  op.task_id,
  bs.label  AS stage_label,
  bs.status AS stage_status
FROM order_photos op
JOIN build_stages bs ON op.stage_id = bs.id
WHERE bs.status = 'pending'
ORDER BY bs.stage_number, op.created_at;


-- =====================================================================
-- STEP 2: Copy the storage_path values from the above result — you will
-- need to delete those files manually from:
--   Supabase Dashboard → Storage → order-photos bucket
-- =====================================================================


-- =====================================================================
-- STEP 3: Delete the DB records (run AFTER confirming Step 1 and
-- deleting the storage files)
-- =====================================================================

DELETE FROM order_photos
WHERE stage_id IN (
  SELECT id FROM build_stages WHERE status = 'pending'
);
