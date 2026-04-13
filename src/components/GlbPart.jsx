import React, { useEffect, useRef, createContext, useContext } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// ─── SCENE BOUNDS CONTEXT ─────────────────────────────────────────
// The center piece measures its own bounding box after loading and
// publishes its half-extents here. Accessories use these to snap to
// the real edges — no hardcoded distances needed.
export const SceneBoundsContext = createContext({
  halfX: 2.5,   // half-width of center model (default until measured)
  halfZ: 2.5,   // half-depth of center model
  setBounds: () => {},
})

// ─── SNAP ZONE RESOLVER ───────────────────────────────────────────
// Returns a world [x, y, z] given:
//   zone     — zone name from products.js
//   bounds   — { halfX, halfZ } from SceneBoundsContext
//   accHalf  — half-extent of the accessory itself (so it kisses, not overlaps)
//   offset   — per-product fine-tune from products.js
export function resolveSnapPosition(zone, bounds, accHalfX, accHalfZ, offset = [0,0,0]) {
  const hx = (bounds?.halfX ?? 2.5) + accHalfX + 0.3   // 0.3m gap
  const hz = (bounds?.halfZ ?? 2.5) + accHalfZ + 0.3

  const POSITIONS = {
    center:      [0,    0,    0  ],
    left:        [-hx,  0,    0  ],
    right:       [ hx,  0,    0  ],
    front:       [0,    0,    hz ],
    back:        [0,    0,   -hz ],
    front_right: [ hx,  0,    hz ],
    front_left:  [-hx,  0,    hz ],
  }

  const base = POSITIONS[zone] ?? POSITIONS.center
  return [
    base[0] + (offset[0] ?? 0),
    base[1] + (offset[1] ?? 0),
    base[2] + (offset[2] ?? 0),
  ]
}

// ─── REAL-WORLD TARGET SIZES (metres, longest axis) ───────────────
// Prevents everything being forced to the same scale.
const CATEGORY_SIZES = {
  // Main sets — realistic playground equipment sizes
  'platform-tower':   3.5,
  'platform':         3.5,
  'treehouse':        3.5,
  'ninja':            3.5,   // FIX: was 6.0, reduced to match realistic proportions
  'aframe':           3.0,
  'monkey-bar-swing': 4.0,
  'playhouse':        3.0,
  'shelter':          4.0,
  'toddler-castle':   2.5,
  'gym-bar':          4.0,   // FIX: was 3.0, increased so it looks proportional
  // Accessories
  'swing-beam-triple':4.0,
  'swing-beam-double':3.5,
  'swing-beam':       2.5,
  'swing-tyre':       0.8,
  // tube-slide was 2.5 — corrected to 2.2 so it matches tower platform height (2.414m)
  'tube-slide':       2.2,
  'cargo':            1.8,
  'net-tunnel':       2.5,
  'rope-bridge':      2.0,
  'climbing-net':     1.8,
  'rock-wall':        1.8,
  'tyre-wall':        1.8,
  'fireman':          2.0,
  'single-beam':      1.5,
  'monkey-beam':      2.5,
  'default':          2.5,
}

function getTargetSize(value) {
  if (!value) return CATEGORY_SIZES.default
  for (const [key, size] of Object.entries(CATEGORY_SIZES)) {
    if (value.includes(key)) return size
  }
  return CATEGORY_SIZES.default
}

// ─── Placeholder shapes ───────────────────────────────────────────
const PLACEHOLDER_SHAPES = {
  platform:  { geo: 'box',    args: [2.0, 1.8, 2.0], color: '#c8b89a', y: 0.9  },
  treehouse: { geo: 'box',    args: [2.0, 2.0, 2.0], color: '#b8a880', y: 1.0  },
  toddler:   { geo: 'box',    args: [1.2, 1.5, 1.2], color: '#d4b896', y: 0.75 },
  shelter:   { geo: 'box',    args: [2.5, 0.1, 2.0], color: '#a0906e', y: 2.0  },
  swing:     { geo: 'box',    args: [0.1, 1.8, 2.5], color: '#5a7a50', y: 0.9  },
  slide:     { geo: 'box',    args: [0.5, 0.5, 2.0], color: '#2a9a3a', y: 0.25 },
  tube:      { geo: 'box',    args: [0.5, 0.5, 2.0], color: '#2a9a3a', y: 0.25 },
  gym:       { geo: 'box',    args: [2.0, 1.8, 0.6], color: '#6a8a60', y: 0.9  },
  ninja:     { geo: 'box',    args: [10.5, 1.2, 1.0], color: '#5a6a80', y: 0.6  },
  playhouse: { geo: 'box',    args: [2.0, 2.0, 2.0], color: '#c4a870', y: 1.0  },
  aframe:    { geo: 'box',    args: [2.5, 1.8, 1.0], color: '#b89860', y: 0.9  },
  monkey:    { geo: 'box',    args: [3.0, 1.5, 0.8], color: '#7a6a50', y: 0.75 },
  acc:       { geo: 'box',    args: [1.0, 1.2, 0.2], color: '#8a7060', y: 0.6  },
  extra:     { geo: 'sphere', args: [0.4, 12, 12],   color: '#c4622d', y: 0.4  },
}

function getPlaceholderKey(value) {
  const checks = [
    'platform','treehouse','toddler','shelter',
    'swing','tube','gym','ninja','playhouse','aframe','monkey','acc','slide',
  ]
  for (const key of checks) {
    if (value.includes(key)) return key
  }
  return 'extra'
}

function PlaceholderMesh({ value, position, rotation }) {
  const key = getPlaceholderKey(value)
  const s = PLACEHOLDER_SHAPES[key] || PLACEHOLDER_SHAPES.extra
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, s.y ?? 0, 0]} rotation={[0, s.rotY ?? 0, s.rotZ ?? 0]} castShadow receiveShadow>
        {s.geo === 'box'    && <boxGeometry args={s.args} />}
        {s.geo === 'cone'   && <coneGeometry args={s.args} />}
        {s.geo === 'sphere' && <sphereGeometry args={s.args} />}
        <meshStandardMaterial color={s.color} roughness={0.75} />
      </mesh>
    </group>
  )
}

// ─── GLB Model loader ─────────────────────────────────────────────
function GlbModel({ url, position, rotation, value, isCenter, onMeasured }) {
  const { scene } = useGLTF(url)
  const groupRef = useRef()

  useEffect(() => {
    if (!groupRef.current) return
    const group = groupRef.current
    while (group.children.length) group.remove(group.children[0])

    const clone = scene.clone(true)

    // Scale to realistic size
    const rawBox = new THREE.Box3().setFromObject(clone)
    const rawSize = new THREE.Vector3()
    rawBox.getSize(rawSize)
    const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z)
    const targetSize = getTargetSize(value)
    const scale = maxDim > 0 ? targetSize / maxDim : 1
    clone.scale.setScalar(scale)

    // Center XZ, sit on y=0
    const scaledBox = new THREE.Box3().setFromObject(clone)
    const scaledCenter = new THREE.Vector3()
    scaledBox.getCenter(scaledCenter)
    clone.position.set(-scaledCenter.x, -scaledBox.min.y, -scaledCenter.z)

    // Shadows
    clone.traverse(obj => {
      if (obj.isMesh) { obj.castShadow = true; obj.receiveShadow = true }
    })

    group.add(clone)

    // After adding to group, measure the group's world bounding box
    // and publish half-extents so accessories can snap to real edges
    if (isCenter && onMeasured) {
      const worldBox = new THREE.Box3().setFromObject(group)
      const worldSize = new THREE.Vector3()
      worldBox.getSize(worldSize)
      onMeasured({
        halfX: worldSize.x / 2,
        halfZ: worldSize.z / 2,
      })
    }
  }, [scene, url, value, isCenter, onMeasured])

  return <group ref={groupRef} position={position} rotation={rotation} />
}

// ─── Public component ─────────────────────────────────────────────
export default function GlbPart({ glb, position, rotation, value, isCenter, onMeasured }) {
  if (glb) {
    return (
      <GlbModel
        url={glb}
        position={position}
        rotation={rotation}
        value={value}
        isCenter={isCenter}
        onMeasured={onMeasured}
      />
    )
  }
  return <PlaceholderMesh value={value} position={position} rotation={rotation} />
}

// Pre-warm GLTF cache
export function preloadGlbAssets(modules) {
  modules.forEach(mod =>
    mod.selects.forEach(s =>
      s.options.forEach(opt => { if (opt.glb) useGLTF.preload(opt.glb) })
    )
  )
}
