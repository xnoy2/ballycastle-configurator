import React, { useState, useCallback } from 'react'
import GlbPart, { SceneBoundsContext } from './GlbPart'

// ─── SNAP ZONE RESOLVER ───────────────────────────────────────────────────────
// 
// HOW THE ANCHOR SYSTEM WORKS:
//
// There is exactly ONE "primary" center piece — the first enabled center item.
// Its measured halfX / halfZ become the origin for all snap zones.
// ALL accessories snap to the faces of this primary piece.
//
// Additional center items (e.g. a second platform tower) are laid out
// beside the primary with no gap, so they read as a single combined structure.
// Accessories still snap to the OUTER edge of the combined center group.
//
// SNAP ZONES (in local space of the primary anchor):
//
//        [back]          (-Z)
//   [left]  [PRIMARY]  [right]   (X axis)
//        [front]         (+Z)
//   [front_left]  [front_right]
//
// Each accessory is placed so its near face touches the primary's far face —
// edge-to-edge with zero gap. Fine-tune with `offset` in products.js.
//
function resolveSnapPosition(zone, primaryHalfX, primaryHalfZ, accHalfX, accHalfZ, offset) {
  const ox = offset?.[0] ?? 0
  const oy = offset?.[1] ?? 0
  const oz = offset?.[2] ?? 0

  // Edge-to-edge: accessory face touches primary face, zero gap.
  const rx = primaryHalfX + accHalfX
  const rz = primaryHalfZ + accHalfZ

  const ZONES = {
    center:      [0,   0,  0 ],
    left:        [-rx, 0,  0 ],
    right:       [+rx, 0,  0 ],
    front:       [0,   0, +rz],
    back:        [0,   0, -rz],
    front_right: [+rx, 0, +rz],
    front_left:  [-rx, 0, +rz],
  }

  const base = ZONES[zone] ?? ZONES.center
  return [base[0] + ox, base[1] + oy, base[2] + oz]
}

// ─── DEFAULT HALF-EXTENTS ─────────────────────────────────────────────────────
// Used for snap math before a model has reported its own measured size.
// Values come from the real GLB geometry analysis (see anchor audit in repo).
const MODEL_HALF_EXTENTS = {
  // Main sets
  'platform-tower-single':    { hX: 0.879, hZ: 1.750 },
  'platform-tower-double':    { hX: 1.178, hZ: 1.750 },
  'aframe-single-swing':      { hX: 1.052, hZ: 1.500 },
  'gym-bar-standard':         { hX: 1.500, hZ: 0.577 },
  'ninja-standard':           { hX: 2.391, hZ: 3.000 },
  'monkey-bar-swing-beam':    { hX: 0.073, hZ: 2.000 },
  // Accessories
  'swing-beam-single-1.2m':   { hX: 1.096, hZ: 1.250 },
  'swing-beam-double-3m':     { hX: 1.750, hZ: 0.689 },
  'swing-beam-triple-3.6m':   { hX: 2.000, hZ: 0.788 },
  'swing-tyre':               { hX: 0.109, hZ: 0.400 },
  // Tube slides: hZ is the model half-depth BEFORE the Z offset is applied.
  // The offset in products.js slides the model forward so the top inlet
  // docks with the tower's front face. hZ here is the raw half-extent.
  'tube-slide-5ft':           { hX: 0.394, hZ: 0.921 },
  'tube-slide-7ft':           { hX: 0.322, hZ: 0.753 },
  'acc-cargo-net':            { hX: 0.318, hZ: 0.900 },
  'acc-net-tunnel':           { hX: 0.907, hZ: 1.250 },
  'acc-rock-wall':            { hX: 0.900, hZ: 0.621 },
  'acc-rope-bridge':          { hX: 1.000, hZ: 0.500 },
  'acc-climbing-net-wall':    { hX: 0.900, hZ: 0.801 },
  'acc-monkey-bar-beam':      { hX: 0.015, hZ: 1.250 },
  'acc-fireman-pole':         { hX: 0.100, hZ: 0.100 },
  'acc-single-beam':          { hX: 0.750, hZ: 0.100 },
  'acc-tyre-wall':            { hX: 0.426, hZ: 1.500 },
  'playhouse-rock-wall':      { hX: 0.900, hZ: 0.621 },
  'playhouse-tyre-wall':      { hX: 0.426, hZ: 1.500 },
}

function getDefaultHalf(value, axis) {
  for (const [key, extents] of Object.entries(MODEL_HALF_EXTENTS)) {
    if (value?.includes(key)) return axis === 'X' ? extents.hX : extents.hZ
  }
  return axis === 'X' ? 1.0 : 1.0
}

// ─── GlbScene ─────────────────────────────────────────────────────────────────
export default function GlbScene({ activeGlbParts }) {
  // Measured half-extents for every part, keyed by part.id
  const [measures, setMeasures] = useState({})

  const handleMeasured = useCallback((id, m) => {
    setMeasures(prev => {
      if (prev[id]?.hX === m.halfX && prev[id]?.hZ === m.halfZ) return prev
      return { ...prev, [id]: { hX: m.halfX, hZ: m.halfZ } }
    })
  }, [])

  if (!activeGlbParts || activeGlbParts.length === 0) return null

  // ── Classify parts ────────────────────────────────────────────────────────
  const centerParts = activeGlbParts.filter(p =>
    (p.snapZone ?? 'center') === 'center'
  )
  const accessories = activeGlbParts.filter(p =>
    (p.snapZone ?? 'center') !== 'center'
  )

  // ── Layout center parts side-by-side with zero gap ────────────────────────
  // The first center part is the PRIMARY ANCHOR — accessories snap to its faces.
  const CENTER_GAP = 0.05  // tiny gap between adjacent center pieces

  const centerLayout = []
  {
    let cursor = 0
    // First: accumulate total width so we can centre the group
    const halfWidths = centerParts.map(p => {
      const m = measures[p.id]
      return m ? m.hX : getDefaultHalf(p.value, 'X')
    })
    const totalWidth = halfWidths.reduce((sum, h) => sum + h * 2, 0)
      + Math.max(0, centerParts.length - 1) * CENTER_GAP

    let x = -totalWidth / 2
    centerParts.forEach((p, i) => {
      const hX = halfWidths[i]
      centerLayout.push({ part: p, x: x + hX })
      x += hX * 2 + CENTER_GAP
    })
  }

  // ── Primary anchor half-extents (first center piece) ─────────────────────
  // Accessories snap to this piece's faces specifically.
  const primaryId   = centerParts[0]?.id
  const primaryMeas = primaryId ? measures[primaryId] : null
  const primaryHalfX = primaryMeas?.hX ?? getDefaultHalf(centerParts[0]?.value, 'X')
  const primaryHalfZ = primaryMeas?.hZ ?? getDefaultHalf(centerParts[0]?.value, 'Z')

  // Primary's world X offset (it may not be at x=0 if there are multiple center pieces)
  const primaryWorldX = centerLayout[0]?.x ?? 0

  // ── Context for consumers ────────────────────────────────────────────────
  const boundsCtx = { halfX: primaryHalfX, halfZ: primaryHalfZ }

  return (
    <SceneBoundsContext.Provider value={{ bounds: boundsCtx }}>
      <group>

        {/* ── Center / main set pieces ── */}
        {centerLayout.map(({ part, x }) => (
          <GlbPart
            key={part.id}
            glb={part.glb}
            position={[x, 0, 0]}
            rotation={part.rotation ?? [0, 0, 0]}
            value={part.value}
            onMeasured={(m) => handleMeasured(part.id, m)}
          />
        ))}

        {/* ── Accessories — snap to primary center piece faces ── */}
        {accessories.map((part) => {
          const zone = (part.snapZone ?? 'center').replace(/-/g, '_')
          const m = measures[part.id]
          const accHX = m?.hX ?? getDefaultHalf(part.value, 'X')
          const accHZ = m?.hZ ?? getDefaultHalf(part.value, 'Z')

          const [lx, ly, lz] = resolveSnapPosition(
            zone,
            primaryHalfX,
            primaryHalfZ,
            accHX,
            accHZ,
            part.offset,
          )

          // Accessories are positioned relative to the primary anchor's world position
          const worldPos = [primaryWorldX + lx, ly, lz]

          return (
            <GlbPart
              key={part.id}
              glb={part.glb}
              position={worldPos}
              rotation={part.rotation ?? [0, 0, 0]}
              value={part.value}
              onMeasured={(m) => handleMeasured(part.id, m)}
            />
          )
        })}

      </group>
    </SceneBoundsContext.Provider>
  )
}
