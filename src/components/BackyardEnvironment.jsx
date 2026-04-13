/**
 * BackyardEnvironment.jsx
 *
 * Adds a playful outdoor backyard setting to the configurator scene.
 * Purely visual — no pointer events, no interaction with DragScene.
 *
 * Includes:
 *  - Sky gradient (background colour set on Canvas in ViewerPanel)
 *  - Soft green grass ground plane
 *  - Subtle lawn grid overlay (replaces grey grid)
 *  - Ring of stylised trees around the perimeter
 *  - Ambient fog for depth
 */
import React, { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ─── Single stylised tree ─────────────────────────────────────────────────────
// Trunk (cylinder) + foliage (two stacked cones) = low-poly cartoon tree.
function Tree({ x, z, scale = 1, rotation = 0 }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rotation, 0]} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.10, 0.14, 1.1, 7]} />
        <meshStandardMaterial color="#8B6340" roughness={0.95} />
      </mesh>
      {/* Lower foliage */}
      <mesh position={[0, 1.7, 0]} castShadow>
        <coneGeometry args={[0.78, 1.5, 8]} />
        <meshStandardMaterial color="#3a8c3a" roughness={0.8} />
      </mesh>
      {/* Upper foliage */}
      <mesh position={[0, 2.55, 0]} castShadow>
        <coneGeometry args={[0.52, 1.2, 8]} />
        <meshStandardMaterial color="#2d7a2d" roughness={0.8} />
      </mesh>
    </group>
  )
}

// ─── Tree ring ────────────────────────────────────────────────────────────────
// Places trees at randomised positions around a perimeter ring.
// Using deterministic pseudo-random offsets so the layout is stable on re-render.
function TreeRing() {
  const trees = useMemo(() => {
    // Outer perimeter — evenly spaced with slight variation
    const outer = []
    const count = 20
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      // Deterministic "random" using sine — no Math.random so no hydration issues
      const r = 11.5 + Math.sin(i * 17.3) * 1.2
      const sc = 0.75 + Math.abs(Math.sin(i * 5.7)) * 0.45
      outer.push({
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * r,
        scale: sc,
        rotation: angle + Math.PI,
      })
    }
    // Second ring — slightly inside, sparser
    const inner = []
    const count2 = 10
    for (let i = 0; i < count2; i++) {
      const angle = (i / count2) * Math.PI * 2 + 0.31
      const r = 9.8 + Math.cos(i * 11.1) * 0.8
      const sc = 0.55 + Math.abs(Math.cos(i * 7.3)) * 0.30
      inner.push({
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * r,
        scale: sc,
        rotation: angle,
      })
    }
    return [...outer, ...inner]
  }, [])

  return (
    <group>
      {trees.map((t, i) => (
        <Tree key={i} x={t.x} z={t.z} scale={t.scale} rotation={t.rotation} />
      ))}
    </group>
  )
}

// ─── Grass ground ─────────────────────────────────────────────────────────────
function GrassGround() {
  return (
    <>
      {/* Main grass plane — just below the grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial
          color="#7ab648"
          roughness={0.95}
          metalness={0}
        />
      </mesh>
      {/* Slightly darker border ring to give the lawn a "mowed" look */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.025, 0]} receiveShadow>
        <ringGeometry args={[8.5, 13, 64]} />
        <meshStandardMaterial color="#6da040" roughness={0.95} />
      </mesh>
    </>
  )
}

// ─── Fence posts around play area ─────────────────────────────────────────────
function FenceRing() {
  const posts = useMemo(() => {
    const count = 28
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2
      const r = 8.2
      return { x: Math.cos(angle) * r, z: Math.sin(angle) * r }
    })
  }, [])

  return (
    <group>
      {posts.map((p, i) => (
        <mesh key={i} position={[p.x, 0.45, p.z]} castShadow>
          <boxGeometry args={[0.08, 0.9, 0.08]} />
          <meshStandardMaterial color="#c49a6c" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function BackyardEnvironment() {
  return (
    <group>
      <GrassGround />
      <FenceRing />
      <TreeRing />
    </group>
  )
}
