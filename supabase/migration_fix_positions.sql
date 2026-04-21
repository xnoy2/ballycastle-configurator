-- =====================================================================
-- BCF CONFIGURATOR — FIX ACCESSORY GROUND POSITIONS
-- Run in: Supabase Dashboard → SQL Editor → New Query
--
-- Root cause: GlbPart.jsx already grounds every model by setting
--   clone.position.y = -scaledBox.min.y
-- so any positive offset_y in the DB double-lifts the model off the
-- ground. All four items below had incorrect positive Y offsets.
--
-- Rope bridge + monkey bar beam are also repositioned to the same
-- right-side zone so they appear as a connected side attachment.
-- =====================================================================

-- Single Swing Beam — was floating 1.8m above ground
UPDATE module_options
SET offset_y = 0
WHERE id = 'swing-beam-single-1.2m';

-- Triple Swing Beam — was floating 2m above ground
UPDATE module_options
SET offset_y = 0
WHERE id = 'swing-beam-triple-3.6m';

-- Rope Bridge — was floating 1.2m; nudge back slightly on Z so the
-- monkey bar beam can sit in front of it on the same right side
UPDATE module_options
SET offset_x   = 0,
    offset_y   = 0,
    offset_z   = -1.0
WHERE id = 'acc-rope-bridge';

-- Monkey Bar Beam — was floating 2m + placed at front_right corner;
-- now sits on the right side (same as rope bridge) shifted forward,
-- so together they form a connected right-side attachment
UPDATE module_options
SET snap_zone  = 'right',
    offset_x   = 1.0,
    offset_y   = 0,
    offset_z   = 1.5
WHERE id = 'acc-monkey-bar-beam';
