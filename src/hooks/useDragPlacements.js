import { useState, useCallback, useMemo } from 'react'
import { getExtents } from '../components/DragScene'
import { resolveSnapPosition } from '../components/GlbScene'

export function useDragPlacements(activeGlbParts) {
  const [manualOverrides, setManualOverrides] = useState({})

  const autoLayout = useMemo(() => {
    if (!activeGlbParts?.length) return {}

    const centerParts = activeGlbParts.filter(p => (p.snapZone ?? 'center') === 'center')
    const accessories = activeGlbParts.filter(p => (p.snapZone ?? 'center') !== 'center')

    const primary    = centerParts[0]
    const primaryExt = primary ? getExtents(primary.value) : { hX: 1.0, hZ: 1.0 }

    const layout = {}

    const CENTER_GAP = 0.05
    const halfWidths = centerParts.map(p => getExtents(p.value).hX)
    const totalW = halfWidths.reduce((s, h) => s + h * 2, 0)
      + Math.max(0, centerParts.length - 1) * CENTER_GAP
    let x = -totalW / 2
    centerParts.forEach((p, i) => {
      const hX = halfWidths[i]
      const offsetY = p.offset?.[1] ?? 0
      layout[p.id] = [x + hX, offsetY, 0]
      x += hX * 2 + CENTER_GAP
    })

    accessories.forEach(p => {
      const zone = (p.snapZone ?? 'center').replace(/-/g, '_')
      const { hX, hZ } = getExtents(p.value)
      const pos = resolveSnapPosition(zone, primaryExt.hX, primaryExt.hZ, hX, hZ, p.offset)
      layout[p.id] = pos
    })

    return layout
  }, [activeGlbParts])

  const placements = useMemo(() => {
    if (!activeGlbParts?.length) return []
    return activeGlbParts
      .filter(p => p.glb)
      .map(p => ({
        id:       p.id,
        glb:      p.glb,
        value:    p.value,
        rotation: p.rotation ?? [0, 0, 0],
        position: manualOverrides[p.id]?.position ?? autoLayout[p.id] ?? [0, 0, 0],
        rotY:     manualOverrides[p.id]?.rotY ?? 0,
        snappedTo: null,
      }))
  }, [activeGlbParts, autoLayout, manualOverrides])

  const updatePlacements = useCallback((updater) => {
    const updated = typeof updater === 'function' ? updater(placements) : updater
    setManualOverrides(prev => {
      const next = { ...prev }
      updated.forEach(p => {
        next[p.id] = {
          position: p.position,
          rotY:     p.rotY ?? prev[p.id]?.rotY ?? 0,
        }
      })
      return next
    })
  }, [placements])

  const resetPosition = useCallback((id) => {
    setManualOverrides(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const resetAll = useCallback(() => setManualOverrides({}), [])

  return { placements, updatePlacements, resetPosition, resetAll }
}
