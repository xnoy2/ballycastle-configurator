import { useState, useCallback, useMemo, useEffect } from 'react'
import { MODULES as STATIC_MODULES, GROUND_SURFACES as STATIC_GS, INSTALLATION_OPTIONS as STATIC_INSTALL } from '../data/products'
import { useProductsContext } from '../context/ProductsContext'

function buildInitialSelections(modules) {
  const sel = {}
  modules.forEach(mod => {
    sel[mod.id] = { enabled: mod.required }
    mod.selects.forEach(s => { sel[mod.id][s.id] = '' })
  })
  return sel
}

export function useConfigurator() {
  const ctx = useProductsContext()
  const MODULES = useMemo(
    () => ctx?.modules?.length > 0 ? ctx.modules : STATIC_MODULES,
    [ctx?.modules],
  )
  const GROUND_SURFACES = useMemo(
    () => ctx?.groundSurfaces?.length > 0 ? ctx.groundSurfaces : STATIC_GS,
    [ctx?.groundSurfaces],
  )
  const INSTALLATION_OPTIONS = useMemo(
    () => ctx?.installationOptions?.length > 0 ? ctx.installationOptions : STATIC_INSTALL,
    [ctx?.installationOptions],
  )

  const [selections, setSelections] = useState(() => buildInitialSelections(MODULES))
  const [groundSurface, setGroundSurface] = useState('')
  const [installation, setInstallation]   = useState('')

  useEffect(() => {
    if (!ctx?.loading && MODULES.length > 0) {
      setSelections(prev => {
        const updated = { ...prev }
        let changed = false
        MODULES.forEach(mod => {
          if (!updated[mod.id]) {
            updated[mod.id] = { enabled: mod.required }
            mod.selects.forEach(s => { updated[mod.id][s.id] = '' })
            changed = true
          }
        })
        return changed ? updated : prev
      })
    }
  }, [MODULES, ctx?.loading])

  const toggleModule = useCallback((moduleId) => {
    setSelections(prev => {
      const mod = MODULES.find(m => m.id === moduleId)
      if (mod?.required) return prev
      const wasEnabled = prev[moduleId]?.enabled ?? false
      const reset = {}
      mod?.selects.forEach(s => { reset[s.id] = '' })
      return { ...prev, [moduleId]: { ...prev[moduleId], ...reset, enabled: !wasEnabled } }
    })
  }, [MODULES])

  const setSelect = useCallback((moduleId, selectId, value) => {
    setSelections(prev => ({
      ...prev,
      [moduleId]: { ...prev[moduleId], [selectId]: value },
    }))
  }, [])

  const selectOption = useCallback((moduleId, selectId, value) => {
    setSelections(prev => {
      const mod = MODULES.find(m => m.id === moduleId)
      if (!mod) return prev
      const current = prev[moduleId] || {}
      if (value === '') {
        const updated = { ...current, [selectId]: '' }
        const anyFilled = mod.selects.some(s => s.id !== selectId && updated[s.id])
        return { ...prev, [moduleId]: { ...updated, enabled: anyFilled } }
      }
      return { ...prev, [moduleId]: { ...current, [selectId]: value, enabled: true } }
    })
  }, [MODULES])

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
  }, [selections, MODULES])

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
  }, [selections, groundSurface, installation, MODULES, GROUND_SURFACES, INSTALLATION_OPTIONS])

  const totalPrice = useMemo(() => lineItems.reduce((sum, i) => sum + i.price, 0), [lineItems])

  // ── Active GLB parts for the 3D viewer ─────────────────────────
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
          snapZone: opt.snapZone ?? 'center',
          offset:   opt.offset   ?? [0, 0, 0],
        })
      })
    })
    return parts
  }, [selections, MODULES])

  const hasAnyGlb = useMemo(() => activeGlbParts.some(p => p.glb !== null), [activeGlbParts])

  return {
    selections,
    toggleModule,
    setSelect,
    selectOption,
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
