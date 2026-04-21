-- =====================================================================
-- BCF CONFIGURATOR — RESTORE FLOAT HEIGHTS FOR ELEVATED ACCESSORIES
-- Run in: Supabase Dashboard → SQL Editor → New Query
--
-- These items attach to or extend an elevated platform tower. They need
-- a positive offset_y so they render at the correct height above ground.
-- GlbPart.jsx grounds every model (bottom at y=0) first, then the
-- offset_y lifts the model to the target elevation.
-- =====================================================================

-- Single Swing Beam — crossbar sits at ~1.8m (arm height above ground)
UPDATE module_options
SET offset_y = 1.8
WHERE id = 'swing-beam-single-1.2m';

-- Triple Swing Beam — same crossbar height as single
UPDATE module_options
SET offset_y = 1.8
WHERE id = 'swing-beam-triple-3.6m';

-- Rope Bridge — bridge deck connects at ~1.5m platform height
-- Z offset (-1.0) retained from previous migration so it flanks the tower
UPDATE module_options
SET offset_y = 1.5
WHERE id = 'acc-rope-bridge';

-- Monkey Bar Beam — bar height at ~1.5m, flanks rope bridge on right side
-- X/Z offsets retained from previous migration
UPDATE module_options
SET offset_y = 1.5
WHERE id = 'acc-monkey-bar-beam';
