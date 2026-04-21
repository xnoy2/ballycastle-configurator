import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  MODULES as STATIC_MODULES,
  GROUND_SURFACES as STATIC_GS,
  INSTALLATION_OPTIONS as STATIC_INSTALL,
} from '../data/products'

function normalizeGlb(path) {
  if (!path) return null
  // Allow full URLs (http/https) and absolute paths (/models/...)
  if (path.startsWith('http') || path.startsWith('/')) return path
  // Bare filename entered in admin — prepend /models/
  return `/models/${path}`
}

function buildModulesFromRows(modulesRows, selectsRows, optionsRows) {
  return modulesRows.map(mod => ({
    id: mod.id,
    label: mod.label,
    category: mod.category,
    required: mod.required,
    selects: selectsRows
      .filter(s => s.module_id === mod.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(s => ({
        id: s.select_id,
        placeholder: s.placeholder,
        options: optionsRows
          .filter(o => o.select_ref === s.id && o.is_active)
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(o => ({
            value: o.id,
            label: o.label,
            price: o.price,
            glb: normalizeGlb(o.glb),
            snapZone: o.snap_zone,
            offset: [o.offset_x ?? 0, o.offset_y ?? 0, o.offset_z ?? 0],
            rotation: [o.rotation_x ?? 0, o.rotation_y ?? 0, o.rotation_z ?? 0],
          })),
      })),
  }))
}

export function useProducts() {
  const [modules, setModules] = useState(STATIC_MODULES)
  const [groundSurfaces, setGroundSurfaces] = useState(STATIC_GS)
  const [installationOptions, setInstallationOptions] = useState(STATIC_INSTALL)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [modRes, selRes, optRes, gsRes, instRes] = await Promise.all([
        supabase.from('modules').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('module_selects').select('*').order('sort_order'),
        supabase.from('module_options').select('*').order('sort_order'),
        supabase.from('ground_surfaces').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('installation_options').select('*').eq('is_active', true).order('sort_order'),
      ])

      if (modRes.error) throw modRes.error
      if (selRes.error) throw selRes.error
      if (optRes.error) throw optRes.error
      if (gsRes.error) throw gsRes.error
      if (instRes.error) throw instRes.error

      setModules(buildModulesFromRows(modRes.data, selRes.data, optRes.data))
      setGroundSurfaces(gsRes.data.map(g => ({ value: g.value, label: g.label, price: g.price, glb: g.glb ?? null })))
      setInstallationOptions(instRes.data.map(i => ({ value: i.value, label: i.label, price: i.price })))
      setError(null)
    } catch (err) {
      console.warn('Supabase fetch failed — using static product data:', err.message)
      setError(err)
      setModules(STATIC_MODULES)
      setGroundSurfaces(STATIC_GS)
      setInstallationOptions(STATIC_INSTALL)
    } finally {
      setLoading(false)
    }
  }

  return { modules, groundSurfaces, installationOptions, loading, error, reload: load }
}
