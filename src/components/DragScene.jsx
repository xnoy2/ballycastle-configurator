/**
 * DragScene.jsx
 *
 * Ghost-spawn system: when a new part is added while in arrange mode,
 * it floats with the cursor as a semi-transparent ghost until the user
 * clicks to place it. This prevents overlapping on spawn.
 *
 * pendingPart  — the part currently being placed (or null)
 * onConfirmPending(position) — called when user clicks to place it
 */

import React, {
  useRef, useState, useCallback, useMemo, useEffect, createContext, useContext,
} from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const SNAP_THRESHOLD = 0.45
const SNAP_PULL      = 0.14
const DRAG_LIFT      = 0.10
const ROTATE_STEP    = Math.PI / 4
const GROUND_Y       = 0
const MAX_DRAG       = 11

export const OrbitStateContext = createContext({ setIsDragging: () => {} })

export const MODEL_EXTENTS = {
  'platform-tower-single':  { hX: 0.879, hZ: 1.350 },
  'platform-tower-double':  { hX: 1.178, hZ: 1.750 },
  'aframe-single-swing':    { hX: 0.852, hZ: 1.400 },
  'gym-bar-standard':       { hX: 2.334, hZ: 1.039 },
  'ninja-standard':         { hX: 0.852, hZ: 1.600 },
  'monkey-bar-swing-beam':  { hX: 0.073, hZ: 2.000 },
  'swing-beam-single-1.2m': { hX: 1.096, hZ: 1.250 },
  'swing-beam-double-3m':   { hX: 1.750, hZ: 0.689 },
  'swing-beam-triple-3.6m': { hX: 2.000, hZ: 0.788 },
  'swing-tyre':             { hX: 0.852, hZ: 1.400 },
  'tube-slide-5ft':         { hX: 0.394, hZ: 0.921 },
  'tube-slide-7ft':         { hX: 0.322, hZ: 0.753 },
  'acc-cargo-net':          { hX: 0.318, hZ: 0.900 },
  'acc-net-tunnel':         { hX: 0.907, hZ: 1.250 },
  'acc-rock-wall':          { hX: 0.900, hZ: 0.621 },
  'acc-climbing-net-wall':  { hX: 0.900, hZ: 0.801 },
  'acc-monkey-bar-beam':    { hX: 0.015, hZ: 1.250 },
  'acc-tyre-wall':          { hX: 0.426, hZ: 1.500 },
  'acc-fireman-pole':       { hX: 0.100, hZ: 0.100 },
  'acc-single-beam':        { hX: 0.750, hZ: 0.100 },
  'shelter':                { hX: 1.750, hZ: 0.100 },
}
function getExtents(value) {
  if (!value) return { hX: 1.0, hZ: 1.0 }
  for (const [k, v] of Object.entries(MODEL_EXTENTS)) {
    if (value.includes(k)) return v
  }
  return { hX: 1.0, hZ: 1.0 }
}

function getSnapPoints(p) {
  const [px,py,pz] = p.position
  const { hX, hZ } = getExtents(p.value)
  // Use the piece's actual Y so floating items snap at the correct height
  return [
    { id:`${p.id}-R`, pos:[px+hX,py,pz],  face:'right' },
    { id:`${p.id}-L`, pos:[px-hX,py,pz],  face:'left'  },
    { id:`${p.id}-F`, pos:[px,py,pz+hZ],  face:'front' },
    { id:`${p.id}-B`, pos:[px,py,pz-hZ],  face:'back'  },
  ]
}
function faceToFace(sp, dhX, dhZ) {
  const [tx,ty,tz] = sp.pos
  // Preserve Y from the snap point (which now carries the piece's actual Y)
  switch (sp.face) {
    case 'right': return [tx+dhX,ty,tz]
    case 'left':  return [tx-dhX,ty,tz]
    case 'front': return [tx,ty,tz+dhZ]
    case 'back':  return [tx,ty,tz-dhZ]
    default:      return [tx,ty,tz]
  }
}

const _plane = new THREE.Plane(new THREE.Vector3(0,1,0),0)
const _rc    = new THREE.Raycaster()
const _hit   = new THREE.Vector3()
function toGround(e, camera, dom) {
  const r = dom.getBoundingClientRect()
  _rc.setFromCamera({
    x:  ((e.clientX - r.left) / r.width)  * 2 - 1,
    y: -((e.clientY - r.top)  / r.height) * 2 + 1,
  }, camera)
  _rc.ray.intersectPlane(_plane, _hit)
  return [_hit.x, GROUND_Y, _hit.z]
}
function clamp(v) { return Math.max(-MAX_DRAG, Math.min(MAX_DRAG, v)) }

const CAT = {
  'platform-tower':3.5,'platform':3.5,'treehouse':3.5,'ninja':3.2,'aframe':2.8,
  'monkey-bar-swing':3.2,'playhouse':3.0,'shelter':3.5,'toddler-castle':2.5,
  'gym-bar':5.0,'swing-beam-triple':4.0,'swing-beam-double':3.5,'swing-beam':2.5,
  'swing-tyre':2.8,'tube-slide':2.2,'cargo':1.8,'net-tunnel':2.5,'rope-bridge':2.0,
  'climbing-net':1.8,'rock-wall':1.7,'tyre-wall':1.8,'fireman':1.8,'single-beam':1.5,
  'monkey-beam':2.5,'default':2.5,
}
function tSize(v) {
  for (const [k,s] of Object.entries(CAT)) { if (v?.includes(k)) return s }
  return 2.5
}

// ─── Build a scaled+centred clone of a GLB scene ──────────────────────────────
function buildClone(scene, value) {
  const clone = scene.clone(true)
  const box = new THREE.Box3().setFromObject(clone)
  const sz  = new THREE.Vector3(); box.getSize(sz)
  const s   = tSize(value) / Math.max(sz.x, sz.y, sz.z)
  clone.scale.setScalar(s)
  const b2 = new THREE.Box3().setFromObject(clone)
  const c2 = new THREE.Vector3(); b2.getCenter(c2)
  clone.position.set(-c2.x, -b2.min.y, -c2.z)
  return clone
}

// ─── GHOST — follows cursor before placement ───────────────────────────────
function Ghost({ part, position }) {
  const { scene } = useGLTF(part.glb)
  const groupRef  = useRef()

  useEffect(() => {
    if (!groupRef.current) return
    const g = groupRef.current
    while (g.children.length) g.remove(g.children[0])
    const clone = buildClone(scene, part.value)
    clone.traverse(o => {
      if (o.isMesh) {
        o.material = new THREE.MeshStandardMaterial({
          color: 0xffffff,     // white — clean, neutral preview
          transparent: true,
          opacity: 0.60,
          roughness: 0.3,
          metalness: 0.0,
          depthWrite: false,
        })
        o.raycast = () => {}   // ghost must NOT intercept clicks
      }
    })
    g.add(clone)
  }, [scene, part.value])

  // Gentle bob animation
  useFrame(({ clock }) => {
    if (!groupRef.current) return
    groupRef.current.position.y = 0.08 + Math.sin(clock.elapsedTime * 3) * 0.04
  })

  return (
    <group position={position}>
      <group ref={groupRef} />
      {/* Ground shadow circle */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI/2,0,0]}>
        <circleGeometry args={[Math.max(getExtents(part.value).hX, getExtents(part.value).hZ)*0.9, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.12} />
      </mesh>
      {/* Dashed footprint ring */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI/2,0,0]}>
        <ringGeometry args={[
          Math.max(getExtents(part.value).hX, getExtents(part.value).hZ)*0.9,
          Math.max(getExtents(part.value).hX, getExtents(part.value).hZ)*0.96,
          48
        ]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// ─── SELECTION RING ────────────────────────────────────────────────────────────
function SelectionRing({ hX, hZ }) {
  const radius = Math.max(hX, hZ) + 0.30
  const geo    = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 64; i++) {
      const t = (i / 64) * Math.PI * 2
      pts.push(new THREE.Vector3(Math.cos(t)*radius, 0.03, Math.sin(t)*radius))
    }
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [radius])

  // Fixed opacity — no pulsing animation.
  // The teal emissive glow on the model already signals selection clearly.
  return (
    <line geometry={geo}>
      <lineBasicMaterial color="#00d4aa" transparent opacity={0.55} />
    </line>
  )
}

// ─── PIECE ─────────────────────────────────────────────────────────────────────
// Highlight is applied directly to the real model's own materials via emissive.
// No second clone is rendered → no z-fighting → no "distorted/no-signal" flicker.
function Piece({ placement, isSelected, isHovered, isDragging, isAnyActive,
                 onPointerDown, onEnter, onLeave }) {
  const { scene }  = useGLTF(placement.glb)
  const modelGroup = useRef()
  const liftY      = useRef(GROUND_Y)
  const modelMats  = useRef([])      // cloned materials we animate each frame
  const emitInt    = useRef(0)       // current smoothed emissive intensity
  const { hX, hZ } = getExtents(placement.value)

  // Build model clone; clone every material so emissive mutations stay per-piece
  useEffect(() => {
    if (!modelGroup.current) return
    const g = modelGroup.current
    while (g.children.length) g.remove(g.children[0])

    const clone = buildClone(scene, placement.value)
    const mats = []
    clone.traverse(o => {
      if (!o.isMesh) return
      o.material = o.material.clone()          // own copy — safe to mutate
      o.material.emissive = new THREE.Color(0)
      o.material.emissiveIntensity = 0
      o.castShadow    = true
      o.receiveShadow = true
      o.onPointerDown  = (e) => { e.stopPropagation(); onPointerDown(placement.id, e) }
      o.onPointerEnter = (e) => { e.stopPropagation(); onEnter(placement.id) }
      o.onPointerLeave = (e) => { e.stopPropagation(); onLeave(placement.id) }
      mats.push(o.material)
    })
    modelMats.current = mats
    emitInt.current   = 0
    g.add(clone)
  }, [scene, placement.value, placement.id, onPointerDown, onEnter, onLeave])

  useFrame(() => {
    if (!modelGroup.current) return

    // Smooth lift while dragging
    const ty = isDragging ? DRAG_LIFT : GROUND_Y
    liftY.current += (ty - liftY.current) * 0.2
    modelGroup.current.position.y = liftY.current

    // Determine target emissive state
    // FIX: colours are warm/playful; applied on the real mesh → zero z-fighting
    let targetInt = 0
    const targetCol = new THREE.Color(0)

    if (!isDragging) {
      if (isSelected) {
        targetInt = 0.50
        targetCol.set(0x00d4aa)   // teal — selected
      } else if (isHovered) {
        targetInt = 0.40
        targetCol.set(0xffaa33)   // amber-orange — hover
      }
    }

    // Smooth toward target
    emitInt.current += (targetInt - emitInt.current) * 0.20
    modelMats.current.forEach(m => {
      m.emissive.lerp(targetCol, 0.20)
      m.emissiveIntensity = emitInt.current
    })
  })

  return (
    <group position={placement.position} rotation={[0, placement.rotY ?? 0, 0]}>
      <group ref={modelGroup} />

      {/* Transparent hit box — reliable pointer target regardless of model geometry */}
      <mesh position={[0,0.85,0]}
        onPointerDown={(e) => { e.stopPropagation(); onPointerDown(placement.id, e) }}
        onPointerEnter={(e) => { e.stopPropagation(); onEnter(placement.id) }}
        onPointerLeave={(e) => { e.stopPropagation(); onLeave(placement.id) }}
      >
        <boxGeometry args={[hX*2, 1.7, hZ*2]} />
        <meshBasicMaterial transparent opacity={0.001} depthWrite={false} />
      </mesh>

      {isSelected && !isDragging && <SelectionRing hX={hX} hZ={hZ} />}

      {!isSelected && isAnyActive && (
        <group>
          {[[hX,0,0],[-hX,0,0],[0,0,hZ],[0,0,-hZ]].map((pos, i) => (
            <mesh key={i} position={pos} rotation={[-Math.PI/2,0,0]}>
              <ringGeometry args={[0.09,0.155,20]} />
              <meshBasicMaterial color="#ffaa33" transparent opacity={0.4} side={THREE.DoubleSide} />
            </mesh>
          ))}
        </group>
      )}

      {isDragging && (
        <mesh position={[0,0.002,0]} rotation={[-Math.PI/2,0,0]}>
          <circleGeometry args={[Math.max(hX,hZ)*0.88,32]} />
          <meshBasicMaterial color="#000" transparent opacity={0.07} />
        </mesh>
      )}
    </group>
  )
}

function SnapRing({ position }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    ref.current.scale.setScalar(1 + Math.sin(t*7)*0.05)
    ref.current.material.opacity = 0.5 + Math.sin(t*7)*0.22
  })
  return (
    <mesh ref={ref} position={[position[0],0.01,position[2]]} rotation={[-Math.PI/2,0,0]}>
      <ringGeometry args={[0.18,0.28,28]} />
      <meshBasicMaterial color="#10b981" transparent opacity={0.6} side={THREE.DoubleSide} />
    </mesh>
  )
}

// ─── DRAG SCENE ────────────────────────────────────────────────────────────────
export default function DragScene({
  placements, onPlacementsChange,
  selectedId, onSelectId,
  pendingPart, onConfirmPending,   // ghost spawn props
}) {
  const { camera, gl } = useThree()
  const { setIsDragging } = useContext(OrbitStateContext)

  const [hoveredId,  setHoveredId]  = useState(null)
  const [draggingId, setDraggingId] = useState(null)
  const [dragPos,    setDragPos]    = useState(null)
  const [nearSnap,   setNearSnap]   = useState(null)
  const [ghostPos,   setGhostPos]   = useState([0, GROUND_Y, 0])

  const grabOffset = useRef([0,0])
  const dragMoved  = useRef(false)

  // ── Cursor — 'copy' when placing, 'grabbing' when dragging ───────────────
  useEffect(() => {
    gl.domElement.style.cursor =
      pendingPart ? 'copy' :
      draggingId  ? 'grabbing' :
      hoveredId   ? 'grab' : 'default'
  }, [pendingPart, draggingId, hoveredId, gl])

  // ── Keyboard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { onSelectId(null); return }
      if ((e.key==='r'||e.key==='R') && selectedId && !pendingPart) {
        const d = e.shiftKey ? -ROTATE_STEP : ROTATE_STEP
        onPlacementsChange(prev =>
          prev.map(p => p.id===selectedId ? {...p, rotY:(p.rotY??0)+d} : p)
        )
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId, pendingPart, onSelectId, onPlacementsChange])

  // ── Ghost tracking — pointermove on the canvas while pendingPart exists ──
  useEffect(() => {
    if (!pendingPart) return
    const onMove = (e) => {
      const [wx,,wz] = toGround(e, camera, gl.domElement)
      setGhostPos([clamp(wx), GROUND_Y, clamp(wz)])
    }
    gl.domElement.addEventListener('pointermove', onMove)
    window.addEventListener('pointermove', onMove)
    return () => {
      gl.domElement.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointermove', onMove)
    }
  }, [pendingPart, camera, gl])

  // ── Click to place ghost ──────────────────────────────────────────────────
  // Rendered on an invisible full-ground-plane mesh so any click on the floor
  // confirms placement — clicks on existing pieces are stopped by their handlers
  const handleGroundClick = useCallback((e) => {
    if (!pendingPart) return
    e.stopPropagation?.()
    const [wx,,wz] = toGround(e.nativeEvent ?? e, camera, gl.domElement)
    onConfirmPending([clamp(wx), GROUND_Y, clamp(wz)])
  }, [pendingPart, camera, gl, onConfirmPending])

  // ── Snap helpers ─────────────────────────────────────────────────────────
  const snapPts = useMemo(() => {
    if (!draggingId) return []
    return placements.filter(p => p.id!==draggingId).flatMap(getSnapPoints)
  }, [placements, draggingId])

  const findSnap = useCallback((px, pz, value) => {
    if (!SNAP_THRESHOLD) return null
    const {hX,hZ} = getExtents(value)
    let best=null, bd=Infinity
    for (const sp of snapPts) {
      const t = faceToFace(sp,hX,hZ)
      const d = Math.hypot(px-t[0], pz-t[2])
      if (d<SNAP_THRESHOLD && d<bd) { bd=d; best={sp,target:t,pull:1-d/SNAP_THRESHOLD} }
    }
    return best
  }, [snapPts])

  const handleEnter = useCallback((id) => {
    if (pendingPart) return   // don't highlight while placing
    setHoveredId(id)
  }, [pendingPart])
  const handleLeave = useCallback((id) => setHoveredId(prev => prev===id ? null : prev), [])

  // ── Drag start — blocked while pendingPart is active ─────────────────────
  const handlePointerDown = useCallback((id, e) => {
    if (pendingPart) return   // click places the ghost, not drags existing piece
    e.stopPropagation?.()
    const p = placements.find(x => x.id===id)
    if (!p) return
    const [wx,,wz] = toGround(e.nativeEvent??e, camera, gl.domElement)
    grabOffset.current = [wx-p.position[0], wz-p.position[2]]
    dragMoved.current  = false
    setDraggingId(id)
    setIsDragging(true)
  }, [pendingPart, placements, camera, gl, setIsDragging])

  // ── Drag move + up ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!draggingId) return
    const p = placements.find(x => x.id===draggingId)
    if (!p) return

    const onMove = (e) => {
      dragMoved.current = true
      const [wx,,wz] = toGround(e, camera, gl.domElement)
      let px = clamp(wx - grabOffset.current[0])
      let pz = clamp(wz - grabOffset.current[1])
      const snap = findSnap(px,pz,p.value)
      if (snap && SNAP_PULL>0) {
        px += (snap.target[0]-px)*snap.pull*SNAP_PULL
        pz += (snap.target[2]-pz)*snap.pull*SNAP_PULL
      }
      // Keep the piece's Y — only X and Z change during drag
      setDragPos([px, p.position[1], pz])
      setNearSnap(snap)
    }

    const onUp = (e) => {
      const [wx,,wz] = toGround(e, camera, gl.domElement)
      let px = clamp(wx-grabOffset.current[0])
      let pz = clamp(wz-grabOffset.current[1])
      const snap = findSnap(px,pz,p.value)
      // Preserve Y so floating items stay elevated after drop
      const preservedY = p.position[1] ?? GROUND_Y
      const finalPos = snap ? snap.target : [px, preservedY, pz]
      onPlacementsChange(prev =>
        prev.map(x => x.id===draggingId ? {...x,position:finalPos} : x)
      )
      if (!dragMoved.current) onSelectId(draggingId)
      setDraggingId(null); setDragPos(null); setNearSnap(null)
      setIsDragging(false)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup',   onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup',   onUp)
    }
  }, [draggingId, placements, camera, gl, findSnap, onPlacementsChange, onSelectId, setIsDragging])

  const display = useMemo(() => {
    if (!draggingId || !dragPos) return placements
    return placements.map(p => p.id===draggingId ? {...p,position:dragPos} : p)
  }, [placements, draggingId, dragPos])

  return (
    <group>
      {/* Ground plane — ALWAYS rendered.
          pendingPart  → click places the ghost at cursor
          no pending   → click clears the selection
          Without this, clicking empty canvas fires no R3F event at all. */}
      <mesh
        rotation={[-Math.PI/2, 0, 0]}
        position={[0, -0.005, 0]}
        onPointerDown={(e) => {
          if (pendingPart) {
            handleGroundClick(e)
          } else {
            onSelectId(null)
          }
        }}
      >
        <planeGeometry args={[MAX_DRAG*2, MAX_DRAG*2]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Ghost — floats at cursor */}
      {pendingPart && <Ghost part={pendingPart} position={ghostPos} />}

      {/* Placed pieces */}
      <group>
        {display.map(p => p.glb ? (
          <Piece key={p.id} placement={p}
            isSelected={!pendingPart && p.id===selectedId}
            isHovered={!pendingPart && p.id===hoveredId && p.id!==selectedId}
            isDragging={p.id===draggingId}
            isAnyActive={!!draggingId && !pendingPart}
            onPointerDown={handlePointerDown}
            onEnter={handleEnter} onLeave={handleLeave}
          />
        ) : null)}
      </group>

      {nearSnap && <SnapRing position={nearSnap.sp.pos} />}
    </group>
  )
}
