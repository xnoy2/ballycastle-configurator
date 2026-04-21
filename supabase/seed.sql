-- =====================================================================
-- BCF CONFIGURATOR — SEED DATA
-- Run AFTER schema.sql in: Supabase Dashboard → SQL Editor → New Query
-- =====================================================================

-- ─── MODULES ─────────────────────────────────────────────────────────
insert into modules (id, label, category, required, sort_order) values
  ('platform_tower',       'Platform Tower',               'Sets',        false, 1),
  ('treehouse',            'Treehouse',                    'Sets',        false, 2),
  ('ninja',                'Ninja Set',                    'Sets',        false, 3),
  ('aframe',               'A-Frame + Single Swing Beam',  'Sets',        false, 4),
  ('monkey_bar_swing',     'Monkey Bar Swing Beam Set',    'Sets',        false, 5),
  ('playhouse_platform',   'Playhouse Platform',           'Sets',        false, 6),
  ('shelter',              'Shelter',                      'Sets',        false, 7),
  ('toddler_castle',       'Toddler Castle',               'Sets',        false, 8),
  ('gym_bar',              'Gym Bar',                      'Sets',        false, 9),
  ('swing_beam',           'Swing Beam',                   'Accessories', false, 10),
  ('slide',                'Tube Slide',                   'Accessories', false, 11),
  ('climbing_accessories', 'Climbing & Obstacle Accessories', 'Accessories', false, 12)
on conflict (id) do nothing;

-- ─── MODULE SELECTS ───────────────────────────────────────────────────
insert into module_selects (id, module_id, select_id, placeholder, sort_order) values
  ('platform_tower__design',           'platform_tower',       'design',       'Select design…',                          1),
  ('treehouse__design',                'treehouse',            'design',       'Select design…',                          1),
  ('ninja__design',                    'ninja',                'design',       'Select design…',                          1),
  ('aframe__design',                   'aframe',               'design',       'Select design…',                          1),
  ('monkey_bar_swing__design',         'monkey_bar_swing',     'design',       'Select design…',                          1),
  ('playhouse_platform__size',         'playhouse_platform',   'size',         'Select size…',                            1),
  ('playhouse_platform__accessory',    'playhouse_platform',   'accessory',    'Add accessory (optional)…',               2),
  ('shelter__design',                  'shelter',              'design',       'Select design…',                          1),
  ('toddler_castle__design',           'toddler_castle',       'design',       'Select design…',                          1),
  ('gym_bar__design',                  'gym_bar',              'design',       'Select design…',                          1),
  ('gym_bar__rubber_color',            'gym_bar',              'rubber_color', 'Eco rubber chipping colour (optional)…',  2),
  ('swing_beam__type',                 'swing_beam',           'type',         'Select swing beam…',                      1),
  ('swing_beam__swing_type',           'swing_beam',           'swing_type',   'Add tyre swing (optional)…',              2),
  ('slide__size',                      'slide',                'size',         'Select slide size…',                      1),
  ('climbing_accessories__wall_type',  'climbing_accessories', 'wall_type',    'Select wall / net type…',                 1),
  ('climbing_accessories__bar_type',   'climbing_accessories', 'bar_type',     'Select bar / pole…',                      2)
on conflict (id) do nothing;

-- ─── MODULE OPTIONS ───────────────────────────────────────────────────
insert into module_options (id, select_ref, module_id, label, price, glb, snap_zone, offset_x, offset_y, offset_z, rotation_x, rotation_y, rotation_z, sort_order) values

  -- Platform Tower
  ('platform-tower-single', 'platform_tower__design', 'platform_tower', 'Single Platform Tower', 1299, '/models/2_Platform_Tower_Single.glb',    'center', 0, 0, 0,    0, 0, 0, 1),
  ('platform-tower-double', 'platform_tower__design', 'platform_tower', 'Double Platform Tower', 1899, '/models/3_Platform_Tower_double.glb',    'center', 0, 0, 0,    0, 0, 0, 2),

  -- Treehouse
  ('treehouse-standard',    'treehouse__design',      'treehouse',      'Treehouse Set',         1599, null,                                     'center', 0, 0, 0,    0, 0, 0, 1),

  -- Ninja
  ('ninja-standard',        'ninja__design',          'ninja',          'Ninja Set',             1499, '/models/14_ninja_frames.glb',            'center', 0, 0, 0,    0, 0, 0, 1),

  -- A-Frame
  ('aframe-single-swing',   'aframe__design',         'aframe',         'A-Frame + Single Swing Beam', 999, '/models/4_A_Frame_Structure_singleswing.glb', 'center', 0, 0, 0, 0, 0, 0, 1),

  -- Monkey Bar Swing Beam Set
  ('monkey-bar-swing-beam', 'monkey_bar_swing__design', 'monkey_bar_swing', 'Monkey Bar Swing Beam Set', 1199, '/models/1_monkey_bar.glb',      'left',   0, 0, 0.8,  0, 0, 0, 1),

  -- Playhouse Platform — sizes
  ('playhouse-small',       'playhouse_platform__size', 'playhouse_platform', 'Playhouse Platform — Small',  1099, '/models/24_Playhouse_Small.glb',  'center', 0, 0, 0, 0, 0, 0, 1),
  ('playhouse-medium',      'playhouse_platform__size', 'playhouse_platform', 'Playhouse Platform — Medium', 1499, '/models/25_Playhouse_Medium.glb', 'center', 0, 0, 0, 0, 0, 0, 2),
  ('playhouse-large',       'playhouse_platform__size', 'playhouse_platform', 'Playhouse Platform — Large',  1999, '/models/26_Playhouse_Large.glb',  'center', 0, 0, 0, 0, 0, 0, 3),

  -- Playhouse Platform — accessories
  ('playhouse-rock-wall',   'playhouse_platform__accessory', 'playhouse_platform', 'Rock Wall Add-on', 199, '/models/5_rock_wall.glb',         'front_right', 0, 0, 0,   0, 0, 0, 1),
  ('playhouse-tyre-wall',   'playhouse_platform__accessory', 'playhouse_platform', 'Tyre Wall Add-on', 179, '/models/15_tire_wall.glb',        'front_left',  0, 0, 0,   0, 0, 0, 2),
  ('playhouse-cargo-net',   'playhouse_platform__accessory', 'playhouse_platform', 'Cargo Net Add-on', 149, null,                              'front_left',  0, 0, 2.0, 0, 0, 0, 3),

  -- Shelter
  ('shelter-standard',      'shelter__design',          'shelter',          'Shelter Set',         1299, '/models/27_shelter.glb',             'center', 0, 0, 0, 0, 0, 0, 1),

  -- Toddler Castle
  ('toddler-castle-single', 'toddler_castle__design',   'toddler_castle',   'Toddler Castle — Single Tower', 799,  '/models/22_castle_Single.glb', 'center', 0, 0, 0, 0, 0, 0, 1),
  ('toddler-castle-double', 'toddler_castle__design',   'toddler_castle',   'Toddler Castle — Double Tower', 1099, '/models/23_castle_double.glb', 'center', 0, 0, 0, 0, 0, 0, 2),

  -- Gym Bar
  ('gym-bar-standard',      'gym_bar__design',          'gym_bar',          'Gym Bar Set',          899, '/models/13_gym_Bar.glb',             'center', 0, 0, 0, 0, 0, 0, 1),

  -- Gym Bar — rubber colours
  ('gym-rubber-red',        'gym_bar__rubber_color',    'gym_bar',          'Eco Rubber Chipping — Red',   149, null, 'center', 0, 0, 0, 0, 0, 0, 1),
  ('gym-rubber-black',      'gym_bar__rubber_color',    'gym_bar',          'Eco Rubber Chipping — Black', 149, null, 'center', 0, 0, 0, 0, 0, 0, 2),
  ('gym-rubber-blue',       'gym_bar__rubber_color',    'gym_bar',          'Eco Rubber Chipping — Blue',  149, null, 'center', 0, 0, 0, 0, 0, 0, 3),
  ('gym-rubber-green',      'gym_bar__rubber_color',    'gym_bar',          'Eco Rubber Chipping — Green', 149, null, 'center', 0, 0, 0, 0, 0, 0, 4),
  ('gym-rubber-brown',      'gym_bar__rubber_color',    'gym_bar',          'Eco Rubber Chipping — Brown', 149, null, 'center', 0, 0, 0, 0, 0, 0, 5),

  -- Swing Beam
  ('swing-beam-single-1.2m',  'swing_beam__type',       'swing_beam',       'Single Swing Beam — 1.2m', 299, '/models/6_Swing_Beam_Single1_2m.glb', 'left', 0, 1.8, 0,   0, 0, 0, 1),
  ('swing-beam-double-3m',    'swing_beam__type',       'swing_beam',       'Double Swing Beam — 3m',   449, '/models/8_Swing_Beam_Double3m.glb',   'left', 0, 0,   0,   0, 0, 0, 2),
  ('swing-beam-triple-3.6m',  'swing_beam__type',       'swing_beam',       'Triple Swing Beam — 3.6m', 599, '/models/7_Swing_Beam_Triple3_6m.glb', 'left', 0, 2.0, 0,   0, 0, 0, 3),
  ('swing-tyre',              'swing_beam__swing_type', 'swing_beam',       'Tyre Swing',                89, '/models/17_tire_swing.glb',           'left', 0, 0,   1.5, 0, 0, 0, 1),

  -- Tube Slide
  ('tube-slide-5ft',  'slide__size', 'slide', 'Tube Slide — 5ft', 349, '/models/19_5ft_tube_slide.glb',  'right', -1.14, 0, 2.030, 0, 4.7, 0, 1),
  ('tube-slide-7ft',  'slide__size', 'slide', 'Tube Slide — 7ft', 449, '/models/18_7ft tube_slide.glb',  'right',  0,    0, 1.22,  0, 0,   0, 2),

  -- Climbing & Obstacle — wall/net
  ('acc-tyre-wall',         'climbing_accessories__wall_type', 'climbing_accessories', 'Tyre Wall',              179, null,                               'front_right', 0, 0, 0,   0, 0, 0, 1),
  ('acc-rock-wall',         'climbing_accessories__wall_type', 'climbing_accessories', 'Rock Wall',              199, null,                               'front_right', 0, 0, 1.5, 0, 0, 0, 2),
  ('acc-cargo-net',         'climbing_accessories__wall_type', 'climbing_accessories', 'Cargo Net',              149, '/models/11_Cargo_net.glb',         'front_left',  0, 0, 0,   0, 0, 0, 3),
  ('acc-net-tunnel',        'climbing_accessories__wall_type', 'climbing_accessories', 'Net Tunnel',             219, null,                               'front',       0, 0, 0,   0, 0, 0, 4),
  ('acc-rope-bridge',       'climbing_accessories__wall_type', 'climbing_accessories', 'Rope Bridge',            249, '/models/28_rope_bridge.glb',       'right',       0, 1.2, 0, 0, 0, 0, 5),
  ('acc-climbing-net-wall', 'climbing_accessories__wall_type', 'climbing_accessories', 'Climbing Net on Wall',   189, '/models/12_climbing_net_on_wall.glb', 'front_right', 0, 0, 1.5, 0, 0, 0, 6),

  -- Climbing & Obstacle — bar/pole
  ('acc-fireman-pole',   'climbing_accessories__bar_type', 'climbing_accessories', 'Fireman Pole',    129, '/models/21_firemans_pole.glb', 'front_left',  0, 0, 2.0, 0, 0, 0, 1),
  ('acc-single-beam',    'climbing_accessories__bar_type', 'climbing_accessories', 'Single Beam',      99, null,                          'back',        0, 0, 0,   0, 0, 0, 2),
  ('acc-monkey-bar-beam','climbing_accessories__bar_type', 'climbing_accessories', 'Monkey Bar Beam', 249, '/models/16_monkey_beam.glb',  'front_right', 0, 2.0, 0, 0, 0, 0, 3)

on conflict (id) do nothing;

-- ─── GROUND SURFACES ─────────────────────────────────────────────────
insert into ground_surfaces (value, label, price, glb, sort_order) values
  ('grass-matt',       'Grass Matt',                   0,   null, 1),
  ('playbark',         'Playbark Wood Chip',          199,  null, 2),
  ('wetpour-standard', 'Wetpour Floor — Standard',    499,  null, 3),
  ('wetpour-mid',      'Wetpour Floor — Mid',         699,  null, 4),
  ('wetpour-premium',  'Wetpour Floor — Premium',     999,  null, 5),
  ('eco-rubber-red',   'Eco Rubber Chipping — Red',   299,  null, 6),
  ('eco-rubber-black', 'Eco Rubber Chipping — Black', 299,  null, 7),
  ('eco-rubber-blue',  'Eco Rubber Chipping — Blue',  299,  null, 8),
  ('eco-rubber-green', 'Eco Rubber Chipping — Green', 299,  null, 9),
  ('eco-rubber-brown', 'Eco Rubber Chipping — Brown', 299,  null, 10)
on conflict (value) do nothing;

-- ─── INSTALLATION OPTIONS ─────────────────────────────────────────────
insert into installation_options (value, label, price, sort_order) values
  ('self',     'Self-Install (Free)',      0,   1),
  ('pro',      'Professional Install',    299,  2),
  ('pro-plus', 'Pro Install + Site Prep', 499,  3)
on conflict (value) do nothing;
