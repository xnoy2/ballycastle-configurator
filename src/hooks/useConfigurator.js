import { useState, useCallback, useMemo } from 'react'
import { MODULES, GROUND_SURFACES, INSTALLATION_OPTIONS } from '../data/products'

const buildInitialSelections = () => {
  const sel = {}
  MODULES.forEach(mod => {
    sel[mod.id] = { enabled: mod.required }
    mod.selects.forEach(s => { sel[mod.id][s.id] = '' })
  })
  return sel
}

export function useConfigurator() {
  const [selections, setSelections] = useState(buildInitialSelections)
  const [groundSurface, setGroundSurface] = useState('')
  const [installation, setInstallation] = useState('')

  const toggleModule = useCallback((moduleId) => {
    setSelections(prev => {
      const mod = MODULES.find(m => m.id === moduleId)
      if (mod?.required) return prev
      const wasEnabled = prev[moduleId].enabled
      const reset = {}
      mod.selects.forEach(s => { reset[s.id] = '' })
      return { ...prev, [moduleId]: { ...prev[moduleId], ...reset, enabled: !wasEnabled } }
    })
  }, [])

  const setSelect = useCallback((moduleId, selectId, value) => {
    setSelections(prev => ({
      ...prev,
      [moduleId]: { ...prev[moduleId], [selectId]: value },
    }))
  }, [])

  // ── Compatibility warnings ──────────────────────────────────────
  const warnings = useMemo(() => {
    const msgs = []
    const tower = selections.base?.tower

    MODULES.forEach(mod => {
      if (!selections[mod.id]?.enabled) return
      mod.selects.forEach(s => {
        const chosen = selections[mod.id][s.id]
        if (!chosen) return
        const opt = s.options?.find(o => o.value === chosen)
        if (opt?.compatibleWith && tower && !opt.compatibleWith.includes(tower)) {
          msgs.push(`"${opt.label}" requires ${opt.compatibleWith.map(t => t.replace('tower-', '') + 'm').join(' or ')} tower`)
        }
      })
    })
    return msgs
  }, [selections])

  // ── Line items for summary ──────────────────────────────────────
  const lineItems = useMemo(() => {
    const items = []
    MODULES.forEach(mod => {
      if (!selections[mod.id]?.enabled) return
      mod.selects.forEach(s => {
        const chosen = selections[mod.id][s.id]
        if (!chosen) return
        const opt = s.options?.find(o => o.value === chosen)
        if (opt) items.push({ label: opt.label, price: opt.price, category: mod.label })
      })
    })
    const gs = GROUND_SURFACES.find(g => g.value === groundSurface)
    if (gs && gs.price > 0) items.push({ label: gs.label, price: gs.price, category: 'Ground' })
    const inst = INSTALLATION_OPTIONS.find(i => i.value === installation)
    if (inst && inst.price > 0) items.push({ label: inst.label, price: inst.price, category: 'Installation' })
    return items
  }, [selections, groundSurface, installation])

  const totalPrice = useMemo(() => lineItems.reduce((sum, i) => sum + i.price, 0), [lineItems])

  // ── Active GLB parts for the 3D viewer ─────────────────────────
  // Returns an array of every selected option that has a glb path.
  // Shape: [{ id, glb, position, rotation, label, value }]
  // When glb is null the viewer falls back to a placeholder mesh.
  const activeGlbParts = useMemo(() => {
    const parts = []
    MODULES.forEach(mod => {
      if (!selections[mod.id]?.enabled) return
      mod.selects.forEach(s => {
        const chosen = selections[mod.id][s.id]
        if (!chosen) return
        const opt = s.options?.find(o => o.value === chosen)
        if (!opt) return
        parts.push({
          id:       `${mod.id}-${s.id}-${opt.value}`,
          glb:      opt.glb ?? null,
          position: opt.position ?? [0, 0, 0],
          rotation: opt.rotation ?? [0, 0, 0],
          label:    opt.label,
          value:    opt.value,
          // These two were previously missing — GlbScene couldn't see them,
          // so ALL offsets in products.js were silently ignored and every
          // accessory defaulted to snapZone='center'.
          snapZone: opt.snapZone ?? 'center',
          offset:   opt.offset   ?? [0, 0, 0],
        })
      })
    })
    return parts
  }, [selections])

  // True once at least one selected option has a real GLB path
  const hasAnyGlb = useMemo(() => activeGlbParts.some(p => p.glb !== null), [activeGlbParts])

  return {
    selections,
    toggleModule,
    setSelect,
    groundSurface,
    setGroundSurface,
    installation,
    setInstallation,
    lineItems,
    totalPrice,
    warnings,
    activeGlbParts,
    hasAnyGlb,
    MODULES,
    GROUND_SURFACES,
    INSTALLATION_OPTIONS,
  }
}