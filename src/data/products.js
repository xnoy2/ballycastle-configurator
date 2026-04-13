// ─── BCF CLIMBING FRAMES — PRODUCT DATA ──────────────────────────
//
// GLB SETUP: When you receive GLB files, fill in the `glb` field:
//   glb: null              → shows placeholder mesh
//   glb: '/models/xxx.glb' → loads real 3D model
//
// SNAP ZONES (defined in GlbPart.jsx):
//   center      → main set, always [0,0,0]
//   left        → swing beams  (left side)
//   right       → slides       (right side)
//   front       → net tunnel   (in front)
//   back        → single beam  (behind)
//   front_right → climbing net, rock wall, monkey bar beam
//   front_left  → cargo net, fireman pole
//
// OFFSET: fine-tune within a zone  e.g. offset: [0, 0, 1.0]
// PRICING: update to match your actual pricing
// ─────────────────────────────────────────────────────────────────

export const MODULES = [

  // ══════════════════════════════════════════════════════════════
  // SECTION 1 — MAIN SETS
  // ══════════════════════════════════════════════════════════════

  {
    id: 'platform_tower',
    label: 'Platform Tower',
    category: 'Sets',
    required: false,
    selects: [
      {
        id: 'design',
        placeholder: 'Select design…',
        options: [
          {
            value: 'platform-tower-single',
            label: 'Single Platform Tower',
            price: 1299,
            glb: '/models/2_Platform_Tower_Single.glb',
            snapZone: 'center',
            rotation: [0, 0, 0],
          },
          {
            value: 'platform-tower-double',
            label: 'Double Platform Tower',
            price: 1899,
            glb: '/models/3_Platform_Tower_double.glb',
            snapZone: 'center',
            rotation: [0, 0, 0],
          },
        ],
      },
    ],
  },

  {
    id: 'treehouse',
    label: 'Treehouse',
    category: 'Sets',
    required: false,
    selects: [
      {
        id: 'design',
        placeholder: 'Select design…',
        options: [
          {
            value: 'treehouse-standard',
            label: 'Treehouse Set',
            price: 1599,
            glb: null, // '/models/treehouse.glb'
            snapZone: 'center',
            rotation: [0, 0, 0],
          },
        ],
      },
    ],
  },

  {
    id: 'ninja',
    label: 'Ninja Set',
    category: 'Sets',
    required: false,
    selects: [
      {
        id: 'design',
        placeholder: 'Select design…',
        options: [
          {
            value: 'ninja-standard',
            label: 'Ninja Set',
            price: 1499,
            glb: '/models/14_ninja_frames.glb',
            snapZone: 'center',
            offset: [0, 0, 0],
            rotation: [0, 0, 0],
          },
        ],
      },
    ],
  },

  {
    id: 'aframe',
    label: 'A-Frame + Single Swing Beam',
    category: 'Sets',
    required: false,
    selects: [
      {
        id: 'design',
        placeholder: 'Select design…',
        options: [
          {
            value: 'aframe-single-swing',
            label: 'A-Frame + Single Swing Beam',
            price: 999,
            glb: '/models/4_A_Frame_Structure_singleswing.glb',
            snapZone: 'center',
            offset: [0, 0, 0],
            rotation: [0, 0, 0],
          },
        ],
      },
    ],
  },

  {
    id: 'monkey_bar_swing',
    label: 'Monkey Bar Swing Beam Set',
    category: 'Sets',
    required: false,
    selects: [
      {
        id: 'design',
        placeholder: 'Select design…',
        options: [
          {
            value: 'monkey-bar-swing-beam',
            label: 'Monkey Bar Swing Beam Set',
            price: 1199,
            glb: '/models/1_monkey_bar.glb',
            snapZone: 'left',
            offset: [0, 0, .8],
            rotation: [0, 0, 0],
          },
        ],
      },
    ],
  },

  {
    id: 'playhouse_platform',
    label: 'Playhouse Platform',
    category: 'Sets',
    required: false,
    selects: [
      {
        id: 'size',
        placeholder: 'Select size…',
        options: [
          {
            value: 'playhouse-small',
            label: 'Playhouse Platform — Small',
            price: 1099,
            glb: '/models/24_Playhouse_Small.glb',
            snapZone: 'center',
            rotation: [0, 0, 0],
          },
          {
            value: 'playhouse-medium',
            label: 'Playhouse Platform — Medium',
            price: 1499,
            glb: '/models/25_Playhouse_Medium.glb',
            snapZone: 'center',
            rotation: [0, 0, 0],
          },
          {
            value: 'playhouse-large',
            label: 'Playhouse Platform — Large',
            price: 1999,
            glb: '/models/26_Playhouse_Large.glb',
            snapZone: 'center',
            rotation: [0, 0, 0],
          },
        ],
      },
      {
        id: 'accessory',
        placeholder: 'Add accessory (optional)…',
        options: [
          {
            value: 'playhouse-rock-wall',
            label: 'Rock Wall Add-on',
            price: 199,
            glb: '/models/5_rock_wall.glb',
            snapZone: 'front_right',
            rotation: [0, 0, 0],
          },
          {
            value: 'playhouse-tyre-wall',
            label: 'Tyre Wall Add-on',
            price: 179,
            glb: '/models/15_tire_wall.glb',
            snapZone: 'front_left',
            rotation: [0, 0, 0],
          },
          {
            value: 'playhouse-cargo-net',
            label: 'Cargo Net Add-on',
            price: 149,
            glb: null, // '/models/accessory-cargo-net.glb'
            snapZone: 'front_left',
            offset: [0, 0, 2.0],    // behind the tyre wall
            rotation: [0, 0, 0],
          },
        ],
      },
    ],
  },

  {
    id: 'shelter',
    label: 'Shelter',
    category: 'Sets',
    required: false,
    selects: [
      {
        id: 'design',
        placeholder: 'Select design…',
        options: [
          {
            value: 'shelter-standard',
            label: 'Shelter Set',
            price: 1299,
            glb: '/models/27_shelter.glb',
            snapZone: 'center',
            rotation: [0, 0, 0],
          },
        ],
      },
    ],
  },

  {
    id: 'toddler_castle',
    label: 'Toddler Castle',
    category: 'Sets',
    required: false,
    selects: [
      {
        id: 'design',
        placeholder: 'Select design…',
        options: [
          {
            value: 'toddler-castle-single',
            label: 'Toddler Castle — Single Tower',
            price: 799,
            glb: '/models/22_castle_Single.glb',
            snapZone: 'center',
            rotation: [0, 0, 0],
          },
          {
            value: 'toddler-castle-double',
            label: 'Toddler Castle — Double Tower',
            price: 1099,
            glb: '/models/23_castle_double.glb',
            snapZone: 'center',
            rotation: [0, 0, 0],
          },
        ],
      },
    ],
  },

  {
    id: 'gym_bar',
    label: 'Gym Bar',
    category: 'Sets',
    required: false,
    selects: [
      {
        id: 'design',
        placeholder: 'Select design…',
        options: [
          {
            value: 'gym-bar-standard',
            label: 'Gym Bar Set',
            price: 899,
            glb: '/models/13_gym_Bar.glb',
            snapZone: 'center',
            rotation: [0, 0, 0],
          },
        ],
      },
      {
        id: 'rubber_color',
        placeholder: 'Eco rubber chipping colour (optional)…',
        options: [
          {
            value: 'gym-rubber-red',
            label: 'Eco Rubber Chipping — Red',
            price: 149,
            glb: null, // '/models/rubber-chipping-red.glb'
            snapZone: 'center',
            rotation: [0, 0, 0],
          },
          {
            value: 'gym-rubber-black',
            label: 'Eco Rubber Chipping — Black',
            price: 149,
            glb: null, // '/models/rubber-chipping-black.glb'
            snapZone: 'center',
            rotation: [0, 0, 0],
          },
          {
            value: 'gym-rubber-blue',
            label: 'Eco Rubber Chipping — Blue',
            price: 149,
            glb: null, // '/models/rubber-chipping-blue.glb'
            snapZone: 'center',
            rotation: [0, 0, 0],
          },
          {
            value: 'gym-rubber-green',
            label: 'Eco Rubber Chipping — Green',
            price: 149,
            glb: null, // '/models/rubber-chipping-green.glb'
            snapZone: 'center',
            rotation: [0, 0, 0],
          },
          {
            value: 'gym-rubber-brown',
            label: 'Eco Rubber Chipping — Brown',
            price: 149,
            glb: null, // '/models/rubber-chipping-brown.glb'
            snapZone: 'center',
            rotation: [0, 0, 0],
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // SECTION 2 — SWING BEAMS
  // ══════════════════════════════════════════════════════════════

  {
    id: 'swing_beam',
    label: 'Swing Beam',
    category: 'Accessories',
    required: false,
    selects: [
      {
        id: 'type',
        placeholder: 'Select swing beam…',
        options: [
          {
            value: 'swing-beam-single-1.2m',
            label: 'Single Swing Beam — 1.2m',
            price: 299,
            glb: '/models/6_Swing_Beam_Single1_2m.glb',
            snapZone: 'left',
            offset: [0, 1.8, 0],
            rotation: [0, 0, 0],
          },
          {
            value: 'swing-beam-double-3m',
            label: 'Double Swing Beam — 3m',
            price: 449,
            glb: '/models/8_Swing_Beam_Double3m.glb',
            snapZone: 'left',
            rotation: [0, 0, 0],
          },
          {
            value: 'swing-beam-triple-3.6m',
            label: 'Triple Swing Beam — 3.6m',
            price: 599,
            glb: '/models/7_Swing_Beam_Triple3_6m.glb',
            snapZone: 'left',
            offset: [0, 2, 0,],
            rotation: [0, 0, 0],
          },
        ],
      },
      {
        id: 'swing_type',
        placeholder: 'Add tyre swing (optional)…',
        options: [
          {
            value: 'swing-tyre',
            label: 'Tyre Swing',
            price: 89,
            glb: '/models/17_tire_swing.glb',
            snapZone: 'left',
            offset: [0, 0, 1.5],   // in front of the beam within the left zone
            rotation: [0, 0, 0],
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // SECTION 3 — SLIDES
  // ══════════════════════════════════════════════════════════════

  {
    id: 'slide',
    label: 'Tube Slide',
    category: 'Accessories',
    required: false,
    selects: [
      {
        id: 'size',
        placeholder: 'Select slide size…',
        options: [
          {
            value: 'tube-slide-5ft',
            label: 'Tube Slide — 5ft',
            price: 349,
            glb: '/models/19_5ft_tube_slide.glb',
            snapZone: 'right',
            // Z offset: slide top inlet is at z=+0.646 inside the model.
            // Tower front face is at z=+1.750. Shift = 1.750 - 0.646 = 1.10
            offset: [-1.14, 0, 2.030],
            rotation: [0, 4.7, 0],
          },
          {
            value: 'tube-slide-7ft',
            label: 'Tube Slide — 7ft',
            price: 449,
            glb: '/models/18_7ft tube_slide.glb',
            snapZone: 'right',
            // Z offset: slide top inlet is at z=+0.528 inside the model.
            // Tower front face is at z=+1.750. Shift = 1.750 - 0.528 = 1.22
            offset: [0, 0, 1.22],
            rotation: [0, 0, 0],
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // SECTION 4 — CLIMBING & OBSTACLE ACCESSORIES
  // ══════════════════════════════════════════════════════════════

  {
    id: 'climbing_accessories',
    label: 'Climbing & Obstacle Accessories',
    category: 'Accessories',
    required: false,
    selects: [
      {
        id: 'wall_type',
        placeholder: 'Select wall / net type…',
        options: [
          {
            value: 'acc-tyre-wall',
            label: 'Tyre Wall',
            price: 179,
            glb: null, // '/models/acc-tyre-wall.glb'
            snapZone: 'front_right',
            rotation: [0, 0, 0],
          },
          {
            value: 'acc-rock-wall',
            label: 'Rock Wall',
            price: 199,
            glb: null, // '/models/acc-rock-wall.glb'
            snapZone: 'front_right',
            offset: [0, 0, 1.5],
            rotation: [0, 0, 0],
          },
          {
            value: 'acc-cargo-net',
            label: 'Cargo Net',
            price: 149,
            glb: '/models/11_Cargo_net.glb',
            snapZone: 'front_left',
            rotation: [0, 0, 0],
          },
          {
            value: 'acc-net-tunnel',
            label: 'Net Tunnel',
            price: 219,
            glb: null, //'/models/20_net_tunnel.glb',
            snapZone: 'front',
            rotation: [0, 0, 0],
          },
          {
            value: 'acc-rope-bridge',
            label: 'Rope Bridge',
            price: 249,
            glb: '/models/28_rope_bridge.glb',
            snapZone: 'right',
            offset: [0, 1.2, 0],
            rotation: [0, 0, 0],
          },
          {
            value: 'acc-climbing-net-wall',
            label: 'Climbing Net on Wall',
            price: 189,
            glb: '/models/12_climbing_net_on_wall.glb',
            snapZone: 'front_right',
            offset: [0, 0, 1.5],
            rotation: [0, 0, 0],
          },
        ],
      },
      {
        id: 'bar_type',
        placeholder: 'Select bar / pole…',
        options: [
          {
            value: 'acc-fireman-pole',
            label: 'Fireman Pole',
            price: 129,
            glb:  '/models/21_firemans_pole.glb',
            snapZone: 'front_left',
            offset: [0, 0, 2.0],
            rotation: [0, 0, 0],
          },
          {
            value: 'acc-single-beam',
            label: 'Single Beam',
            price: 99,
            glb: null, // '/models/acc-single-beam.glb'
            snapZone: 'back',
            rotation: [0, 0, 0],
          },
          {
            value: 'acc-monkey-bar-beam',
            label: 'Monkey Bar Beam',
            price: 249,
            glb: '/models/16_monkey_beam.glb',
            snapZone: 'front_right',
            offset: [0, 2, 0],
            rotation: [0, 0, 0],
          },
        ],
      },
    ],
  },

]

// ══════════════════════════════════════════════════════════════════
// FINISHES / GROUND SURFACES
// ══════════════════════════════════════════════════════════════════

export const GROUND_SURFACES = [
  { value: 'grass-matt',       label: 'Grass Matt',                price: 0,   glb: null },
  { value: 'playbark',         label: 'Playbark Wood Chip',         price: 199, glb: null },
  { value: 'wetpour-standard', label: 'Wetpour Floor — Standard',   price: 499, glb: null },
  { value: 'wetpour-mid',      label: 'Wetpour Floor — Mid',        price: 699, glb: null },
  { value: 'wetpour-premium',  label: 'Wetpour Floor — Premium',    price: 999, glb: null },
  { value: 'eco-rubber-red',   label: 'Eco Rubber Chipping — Red',  price: 299, glb: null },
  { value: 'eco-rubber-black', label: 'Eco Rubber Chipping — Black',price: 299, glb: null },
  { value: 'eco-rubber-blue',  label: 'Eco Rubber Chipping — Blue', price: 299, glb: null },
  { value: 'eco-rubber-green', label: 'Eco Rubber Chipping — Green',price: 299, glb: null },
  { value: 'eco-rubber-brown', label: 'Eco Rubber Chipping — Brown',price: 299, glb: null },
]

// ══════════════════════════════════════════════════════════════════
// INSTALLATION OPTIONS
// ══════════════════════════════════════════════════════════════════

export const INSTALLATION_OPTIONS = [
  { value: 'self',     label: 'Self-Install (Free)',     price: 0   },
  { value: 'pro',      label: 'Professional Install',    price: 299 },
  { value: 'pro-plus', label: 'Pro Install + Site Prep', price: 499 },
]
