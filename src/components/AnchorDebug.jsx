import React from 'react'

// ─── AnchorDebug — Visual alignment helpers ─────────────────────────────────
//
// Drop this into your scene to visualise anchor points and bounding volumes.
// Enable with: <AnchorDebug enabled primaryHalfX={...} primaryHalfZ={...} parts={activeGlbParts} />
//
// USAGE IN ViewerPanel or GlbScene:
//   import AnchorDebug from './AnchorDebug'
//   <AnchorDebug enabled={import.meta.env.DEV} primaryHalfX={0.879} primaryHalfZ={1.750} />
//
// Shows:
//   🟥 Red wireframe box  = primary anchor bounding volume
//   🟩 Green sphere       = snap anchor points (right, left, front, back, front_right, front_left)
//   🟦 Blue wireframe box = per-part bounding volume (based on MODEL_HALF_EXTENTS)
//   🟨 Yellow line        = Y=0 ground plane grid

export default function AnchorDebug({ enabled, primaryHalfX = 0.879, primaryHalfZ = 1.750, primaryHeight = 2.414, parts = [] }) {
  if (!enabled) return null

  const GAP = 0.0
  const anchors = [
    { label: 'right',       pos: [primaryHalfX, primaryHeight / 2, 0],          color: '#ff4444' },
    { label: 'left',        pos: [-primaryHalfX, primaryHeight / 2, 0],         color: '#ff4444' },
    { label: 'front',       pos: [0, primaryHeight / 2, primaryHalfZ],          color: '#44ff44' },
    { label: 'back',        pos: [0, primaryHeight / 2, -primaryHalfZ],         color: '#44ff44' },
    { label: 'front_right', pos: [primaryHalfX, primaryHeight / 2, primaryHalfZ],  color: '#ffff44' },
    { label: 'front_left',  pos: [-primaryHalfX, primaryHeight / 2, primaryHalfZ], color: '#ffff44' },
    { label: 'origin',      pos: [0, 0, 0],                                     color: '#ffffff' },
  ]

  return (
    <group>
      {/* Primary bounding box wireframe */}
      <lineSegments>
        <edgesGeometry args={[new (require('three').BoxGeometry)(primaryHalfX * 2, primaryHeight, primaryHalfZ * 2)]} />
        <lineBasicMaterial color="#ff0000" linewidth={2} />
      </lineSegments>

      {/* Anchor point spheres */}
      {anchors.map(a => (
        <mesh key={a.label} position={a.pos}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial color={a.color} />
        </mesh>
      ))}

      {/* Snap zone face planes (semi-transparent) */}
      <mesh position={[primaryHalfX, primaryHeight / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[primaryHalfZ * 2, primaryHeight]} />
        <meshBasicMaterial color="#ff4444" transparent opacity={0.08} side={2} />
      </mesh>
      <mesh position={[0, primaryHeight / 2, primaryHalfZ]}>
        <planeGeometry args={[primaryHalfX * 2, primaryHeight]} />
        <meshBasicMaterial color="#44ff44" transparent opacity={0.08} side={2} />
      </mesh>
    </group>
  )
}
