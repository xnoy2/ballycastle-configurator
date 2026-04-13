/**
 * ViewerPanel.jsx — Unified configurator viewer
 *
 * Features combined in one component:
 *  1. Ghost preview  — new parts float green at cursor until clicked
 *  2. Click-to-place — click anywhere to drop at exact cursor position
 *  3. Drag to move   — drag any placed piece freely (clamped to grid)
 *  4. Rotate         — click piece to select, then −45°/+45° toolbar buttons
 *  5. Zoom           — always on; camera rotate disabled only while dragging
 */
import React, {
  Suspense, useRef, useState, useEffect, useCallback, useMemo,
} from 'react'
import { Canvas } from '@react-three/fiber'
import {
  OrbitControls, Grid, Center, Bounds, useBounds, Html, useProgress,
} from '@react-three/drei'
import {
  RotateCcw, ZoomIn, ZoomOut, Maximize2, Layers,
  RotateCcw as RotLeft, RotateCw,
} from 'lucide-react'
import DragScene, { OrbitStateContext } from './DragScene'
import { useDragPlacements } from '../hooks/useDragPlacements'
import { preloadGlbAssets } from './GlbPart'
import { MODULES } from '../data/products'
import './ViewerPanel.css'
import BackyardEnvironment from './BackyardEnvironment'

preloadGlbAssets(MODULES)

const ROTATE_STEP = Math.PI / 4   // 45°

// ─── Loaders ──────────────────────────────────────────────────────
function Loader() {
  const { progress, active } = useProgress()
  if (!active) return null
  return (
    <Html center>
      <div style={{
        background: 'rgba(255,255,255,0.92)', borderRadius: '10px',
        padding: '14px 22px', fontSize: '12px', fontFamily: 'DM Sans, sans-serif',
        color: '#1a1814', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: '8px', minWidth: '140px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
      }}>
        <div style={{ width: '100%', height: '3px', background: '#e4e1d8', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{ width:`${Math.round(progress)}%`, height:'100%', background:'#2e6b3e', borderRadius:'99px', transition:'width 0.2s ease' }} />
        </div>
        <span style={{ color:'#6b6860' }}>Loading model… {Math.round(progress)}%</span>
      </div>
    </Html>
  )
}

function EmptyScene() {
  // No placeholder box — the backyard environment is already visible
  // and provides the "empty" context. Just show the label.
  return (
    <Html center>
      <p style={{
        fontFamily: 'DM Sans, sans-serif',
        fontSize: '12px',
        color: 'rgba(255,255,255,0.75)',
        background: 'rgba(0,0,0,0.22)',
        padding: '6px 14px',
        borderRadius: '99px',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        backdropFilter: 'blur(4px)',
      }}>
        Select a module to begin
      </p>
    </Html>
  )
}

// ─── Camera controls ──────────────────────────────────────────────
// enableRotate is disabled only while a piece is being dragged,
// so camera orbit doesn't fight the drag. Zoom stays on always.
function SceneOrbitControls({ orbitRef, isDragging }) {
  return (
    <OrbitControls
      ref={orbitRef}
      minPolarAngle={0.15} maxPolarAngle={Math.PI / 2.1}
      minDistance={2}      maxDistance={16}
      enablePan={false}
      enableZoom={true}
      enableRotate={!isDragging}
      dampingFactor={0.08} enableDamping
    />
  )
}

function ResetButton({ orbitRef }) {
  const bounds = useBounds()
  return (
    <button className="vctrl-btn" title="Reset camera" onClick={() => {
      bounds?.refresh().fit(); orbitRef.current?.reset()
    }}>
      <RotateCcw size={14} />
    </button>
  )
}

function ViewerControls({ orbitRef }) {
  return (
    <div className="viewer-controls">
      <ResetButton orbitRef={orbitRef} />
      <div className="vctrl-divider" />
      <button className="vctrl-btn" title="Zoom in"><ZoomIn size={14} /></button>
      <button className="vctrl-btn" title="Zoom out"><ZoomOut size={14} /></button>
      <div className="vctrl-divider" />
      <button className="vctrl-btn" title="Fullscreen"
        onClick={() => document.querySelector('.viewer-canvas-wrap')?.requestFullscreen?.()}>
        <Maximize2 size={14} />
      </button>
    </div>
  )
}

// ─── Ghost hint banner — position:absolute so it never affects layout ──
function PlaceHint({ label }) {
  return (
    <div style={{
      position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)',
      zIndex: 20, pointerEvents: 'none', whiteSpace: 'nowrap',
      display: 'flex', alignItems: 'center', gap: '7px',
      background: 'rgba(20,83,45,0.88)',
      color: '#fff', fontSize: '12px', fontWeight: 500,
      fontFamily: 'DM Sans, sans-serif',
      padding: '7px 16px', borderRadius: '99px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
    }}>
      <span style={{ width:8, height:8, borderRadius:'50%', background:'#4ade80', display:'inline-block', flexShrink:0 }} />
      Click anywhere to place&nbsp;<strong>{label}</strong>
    </div>
  )
}

// ─── Rotation toolbar ─────────────────────────────────────────────
function RotationToolbar({ label, onLeft, onRight, onDeselect }) {
  return (
    <div className="rotation-toolbar">
      <span className="rotation-toolbar__label">{label}</span>
      <div className="rotation-toolbar__sep" />
      <button className="rotation-toolbar__btn" title="Rotate −45° (Shift+R)" onClick={onLeft}>
        <RotLeft size={15} /><span>−45°</span>
      </button>
      <button className="rotation-toolbar__btn" title="Rotate +45° (R)" onClick={onRight}>
        <RotateCw size={15} /><span>+45°</span>
      </button>
      <div className="rotation-toolbar__sep" />
      <button className="rotation-toolbar__btn rotation-toolbar__btn--deselect"
        title="Deselect (Esc)" onClick={onDeselect}>✕
      </button>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────
export default function ViewerPanel({ totalPrice, warnings, activeGlbParts, hasAnyGlb }) {
  const orbitRef = useRef()

  // ── Zoom fix: suppress camera orbit while dragging a piece ───────
  const [isDragging, setIsDragging] = useState(false)
  const orbitCtx = useMemo(() => ({ setIsDragging }), [setIsDragging])

  // ── Selection: lifted here so RotationToolbar can access it ──────
  const [selectedId, setSelectedId] = useState(null)

  // ── Pending queue: parts waiting for click-to-place ──────────────
  // knownIds tracks which part ids have already been processed so
  // we only ghost NEW additions (not existing parts on re-render).
  const [pendingQueue, setPendingQueue] = useState([])   // array of part objects
  const knownIds = useRef(new Set())

  // Detect newly added parts → push to pending queue
  useEffect(() => {
    if (!activeGlbParts?.length) return
    const newParts = activeGlbParts.filter(p => p.glb && !knownIds.current.has(p.id))
    if (!newParts.length) return
    newParts.forEach(p => knownIds.current.add(p.id))
    setPendingQueue(prev => {
      const existing = new Set(prev.map(p => p.id))
      return [...prev, ...newParts.filter(p => !existing.has(p.id))]
    })
  }, [activeGlbParts])

  // If a module is unticked while pending → remove from queue
  useEffect(() => {
    const activeIds = new Set(activeGlbParts?.filter(p => p.glb).map(p => p.id) ?? [])
    setPendingQueue(prev => prev.filter(p => activeIds.has(p.id)))
    // Also forget from knownIds so re-ticking shows ghost again
    knownIds.current.forEach(id => { if (!activeIds.has(id)) knownIds.current.delete(id) })
  }, [activeGlbParts])

  // Parts that have been confirmed (not pending) go to useDragPlacements
  const pendingIds = useMemo(() => new Set(pendingQueue.map(p => p.id)), [pendingQueue])
  const placedGlbParts = useMemo(
    () => activeGlbParts?.filter(p => p.glb && !pendingIds.has(p.id)) ?? [],
    [activeGlbParts, pendingIds]
  )

  // ── Drag/rotate state for placed pieces ──────────────────────────
  const { placements, updatePlacements, resetAll } = useDragPlacements(placedGlbParts)

  // ── Ghost confirmed → becomes a placed piece at that position ────
  const handleConfirmPending = useCallback((position) => {
    if (!pendingQueue.length) return
    const part = pendingQueue[0]

    // FIX: Use the product's offset Y, not the ground-click Y (which is always 0).
    // Clicking on the ground gives position=[x,0,z]. We override Y with offset[1]
    // so floating items (rope bridge, monkey bar beam etc.) appear at correct height.
    const productY = part.offset?.[1] ?? 0
    const finalPosition = [position[0], productY, position[2]]

    updatePlacements(prev => [
      ...prev,
      {
        id:       part.id,
        glb:      part.glb,
        value:    part.value,
        rotation: part.rotation ?? [0, 0, 0],
        position: finalPosition,
        rotY:     0,
        snappedTo: null,
      },
    ])

    setPendingQueue(prev => prev.slice(1))
  }, [pendingQueue, updatePlacements])

  // ── Rotation toolbar actions ──────────────────────────────────────
  const handleRotateLeft = useCallback(() => {
    if (!selectedId) return
    updatePlacements(prev =>
      prev.map(p => p.id===selectedId ? {...p, rotY:(p.rotY??0)-ROTATE_STEP} : p)
    )
  }, [selectedId, updatePlacements])

  const handleRotateRight = useCallback(() => {
    if (!selectedId) return
    updatePlacements(prev =>
      prev.map(p => p.id===selectedId ? {...p, rotY:(p.rotY??0)+ROTATE_STEP} : p)
    )
  }, [selectedId, updatePlacements])

  const selectedLabel = useMemo(
    () => activeGlbParts?.find(p => p.id===selectedId)?.label ?? 'Selected',
    [activeGlbParts, selectedId]
  )

  const activePending = pendingQueue[0] ?? null
  const hasSelections = activeGlbParts?.length > 0
  const liveCount     = hasAnyGlb ? activeGlbParts.filter(p => p.glb).length : 0

  return (
    <div className="viewer-panel">
      <div className="viewer-canvas-wrap">

        {/* Status badge */}
        <div className={`viewer-badge ${hasAnyGlb ? 'viewer-badge--live' : ''}`}>
          <Layers size={11} />
          <span>
            {hasAnyGlb
              ? `${liveCount} GLB model${liveCount!==1?'s':''} loaded`
              : 'Placeholder mode'}
            {pendingQueue.length > 0 ? ` · ${pendingQueue.length} to place` : ''}
          </span>
        </div>

        {/* Ghost hint — absolutely positioned, never affects layout */}
        {activePending && (
          <PlaceHint label={activePending.label ?? activePending.value} />
        )}

        {/* Rotation toolbar — shown when a placed piece is selected */}
        {selectedId && !activePending && (
          <RotationToolbar
            label={selectedLabel}
            onLeft={handleRotateLeft}
            onRight={handleRotateRight}
            onDeselect={() => setSelectedId(null)}
          />
        )}

        <Canvas
          camera={{ position:[4,3,5], fov:45 }}
          shadows
          gl={{ antialias: true, preserveDrawingBuffer: true }}
          style={{ background:'#c9e8f5' }}
        >
          <Suspense fallback={<Loader />}>
            <ambientLight intensity={0.70} />
            <directionalLight position={[6,8,4]} intensity={1.2} castShadow
              shadow-mapSize={[2048,2048]}
              shadow-camera-near={0.1} shadow-camera-far={30}
              shadow-camera-left={-8}  shadow-camera-right={8}
              shadow-camera-top={8}    shadow-camera-bottom={-8}
            />
            <directionalLight position={[-4,3,-2]} intensity={0.3} />
            <hemisphereLight skyColor="#ddeeff" groundColor="#c8b89a" intensity={0.25} />

            <Bounds fit clip observe margin={1.2}>
              {!hasSelections ? (
                <Center><EmptyScene /></Center>
              ) : (
                /* OrbitStateContext lets DragScene suppress camera orbit
                   while a piece drag is active, without ever touching zoom. */
                <OrbitStateContext.Provider value={orbitCtx}>
                  <DragScene
                    placements={placements}
                    onPlacementsChange={updatePlacements}
                    selectedId={selectedId}
                    onSelectId={setSelectedId}
                    pendingPart={activePending}
                    onConfirmPending={handleConfirmPending}
                  />
                </OrbitStateContext.Provider>
              )}
            </Bounds>

            {/* Backyard environment — grass, trees, fence.
                Purely visual, no pointer events. */}
            <BackyardEnvironment />

            {/* Subtle grid overlay on the play area for alignment */}
            <Grid args={[16,16]} position={[0,-0.01,0]}
              cellSize={0.5} cellThickness={0.3} cellColor="#5a9e30"
              sectionSize={2} sectionThickness={0.6} sectionColor="#4a8820"
              fadeDistance={10} fadeStrength={2}
            />

            {/* Shadow receiver */}
            <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.015,0]} receiveShadow>
              <planeGeometry args={[40,40]} />
              <shadowMaterial opacity={0.18} />
            </mesh>

            {/* Atmospheric fog — depth cue for the scene */}
            <fog attach="fog" args={["#c9e8f5", 14, 32]} />

            <SceneOrbitControls orbitRef={orbitRef} isDragging={isDragging} />
          </Suspense>
        </Canvas>

        <ViewerControls orbitRef={orbitRef} />
      </div>

      {/* Price bar */}
      <div className="viewer-price-bar">
        <span className="price-label">Total estimate</span>
        <span className="price-value">
          {totalPrice > 0 ? `£${totalPrice.toLocaleString()}` : 'Select options to start'}
        </span>
        <span className="price-sub">inc. VAT · updates live</span>
      </div>

      {warnings.length > 0 && (
        <div className="viewer-warnings">
          {warnings.map((w,i) => (
            <div key={i} className="warning-pill">⚠ {w}</div>
          ))}
        </div>
      )}
    </div>
  )
}
