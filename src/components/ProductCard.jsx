import React, { Suspense, useMemo, Component } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Center, Bounds } from '@react-three/drei'
import './ProductCard.css'

// ─── Coloured placeholder when glb is null or fails to load ────────────────
function PlaceholderThumb({ label }) {
  const hue = useMemo(
    () => label.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360,
    [label],
  )
  const initials = label
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <div className="prod-card__placeholder" style={{ background: `hsl(${hue},30%,68%)` }}>
      <span>{initials}</span>
    </div>
  )
}

// ─── Error boundary — prevents a bad GLB path from crashing the whole app ──
class GlbErrorBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) return <PlaceholderThumb label={this.props.label} />
    return this.props.children
  }
}

// ─── 3D scene rendered inside each card ────────────────────────────────────
function GLBScene({ glb }) {
  const { scene } = useGLTF(glb)
  const clone = useMemo(() => scene.clone(true), [scene])
  return (
    <Bounds fit clip observe margin={1.25}>
      <Center>
        <primitive object={clone} />
      </Center>
    </Bounds>
  )
}

// ─── Card ──────────────────────────────────────────────────────────────────
export default function ProductCard({ option, selected, onSelect }) {
  return (
    <div
      className={`prod-card${selected ? ' prod-card--selected' : ''}`}
      onClick={onSelect}
      title={option.label}
    >
      <div className="prod-card__thumb">
        {option.glb ? (
          <GlbErrorBoundary label={option.label}>
            <Canvas
              camera={{ position: [3, 2, 4], fov: 50 }}
              gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
              style={{ background: '#edecea' }}
            >
              <ambientLight intensity={1.1} />
              <directionalLight position={[3, 5, 3]} intensity={0.9} castShadow={false} />
              <Suspense fallback={null}>
                <GLBScene glb={option.glb} />
              </Suspense>
              <OrbitControls
                autoRotate
                autoRotateSpeed={1.8}
                enableZoom={false}
                enablePan={false}
                minPolarAngle={Math.PI / 5}
                maxPolarAngle={Math.PI / 2.2}
              />
            </Canvas>
          </GlbErrorBoundary>
        ) : (
          <PlaceholderThumb label={option.label} />
        )}
      </div>

      <div className="prod-card__info">
        <span className="prod-card__name">{option.label}</span>
        <span className="prod-card__price">£{option.price.toLocaleString()}</span>
      </div>

      {selected && <span className="prod-card__check">✓</span>}
    </div>
  )
}
