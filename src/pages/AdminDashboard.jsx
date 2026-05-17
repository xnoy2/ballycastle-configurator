import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import LoadingScreen from '../components/LoadingScreen'
import './AdminDashboard.css'

// ─── helpers ───────────────────────────────────────────────────────────────
const fmt = p => `£${p.toLocaleString()}`

function playPop() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(660, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.07)
    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.12)
    osc.onended = () => ctx.close()
  } catch {}
}

// ─── VarRequestActions — inline status + notes editor ──────────────────────
function VarRequestActions({ req, orderId, onUpdate }) {
  const [status, setStatus] = useState(req.status || 'pending')
  const [notes,  setNotes]  = useState(req.admin_notes || '')
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  async function save() {
    setSaving(true)
    await onUpdate(orderId, req.id, status, notes)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <select value={status} onChange={e => setStatus(e.target.value)}
          style={{ flex: 1, minWidth: 140, padding: '7px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff' }}>
          <option value="pending">Pending Review</option>
          <option value="reviewing">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Not Approved</option>
        </select>
        <button onClick={save} disabled={saving}
          style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: '#1E3070', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1, fontFamily: 'inherit' }}>
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Update'}
        </button>
      </div>
      <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Response / notes to client (optional)"
        style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
    </div>
  )
}

// ─── top-level shell ───────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate  = useNavigate()
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setChecking(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!checking && !session) navigate('/login', { replace: true })
  }, [checking, session, navigate])

  if (checking) return <LoadingScreen subtitle="Loading admin dashboard…" />
  if (!session)  return null
  return <AdminPanel session={session} />
}

// ─── main panel ────────────────────────────────────────────────────────────
function AdminPanel({ session }) {
  const [tab, setTab]                   = useState(() => localStorage.getItem('admin_tab') || 'dashboard')
  const [subTab, setSubTab]             = useState('products')
  const [modules, setModules]           = useState([])
  const [selects, setSelects]           = useState([])
  const [options, setOptions]           = useState([])
  const [surfaces, setSurfaces]         = useState([])
  const [installOpts, setInstallOpts]   = useState([])
  const [quotes, setQuotes]             = useState([])
  const [clients, setClients]           = useState([])
  const [workers, setWorkers]           = useState([])
  const [orders, setOrders]             = useState([])
  const [allStages, setAllStages]       = useState([])
  const [extras, setExtras]             = useState([])
  const [reviews, setReviews]           = useState([])
  const [referrals, setReferrals]       = useState([])
  const [admins, setAdmins]             = useState([])  // [{ user_id, role }]
  const [loading, setLoading]           = useState(true)
  const [saveMsg, setSaveMsg]           = useState('')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [mR, sR, oR, gsR, iR, qR, cR, wR, orR, exR, stR, rvR, rfR, adR] = await Promise.all([
      supabase.from('modules').select('*').order('sort_order'),
      supabase.from('module_selects').select('*').order('sort_order'),
      supabase.from('module_options').select('*').order('sort_order'),
      supabase.from('ground_surfaces').select('*').order('sort_order'),
      supabase.from('installation_options').select('*').order('sort_order'),
      supabase.from('quotes').select('*').order('created_at', { ascending: false }),
      supabase.from('client_profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('worker_profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('*, client:client_profiles(name,email), worker:worker_profiles(name,avatar_url), ghl_opportunity_id').order('created_at', { ascending: false }),
      supabase.from('extras').select('*').order('sort_order'),
      supabase.from('build_stages').select('*').order('stage_number'),
      supabase.from('reviews').select('*, client:client_profiles(name,email)').order('created_at', { ascending: false }),
      supabase.from('referrals').select('*, referrer:client_profiles(name,email)').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('user_id').eq('role', 'admin'),
    ])
    setModules(mR.data       || [])
    setSelects(sR.data       || [])
    setOptions(oR.data       || [])
    setSurfaces(gsR.data     || [])
    setInstallOpts(iR.data   || [])
    setQuotes(qR.data        || [])
    setClients(cR.data       || [])
    setWorkers(wR.data       || [])
    setOrders(orR.data       || [])
    setExtras(exR.data       || [])
    setAllStages(stR.data    || [])
    setReviews(rvR.data      || [])
    setReferrals(rfR.data    || [])
    setAdmins(adR.data || [])
    setLoading(false)
  }

  function flash(msg) {
    setSaveMsg(msg)
    setTimeout(() => setSaveMsg(''), 2500)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  const newQuoteCount     = quotes.filter(q => q.status === 'new').length
  const pendingReferrals  = referrals.filter(r => r.status === 'pending').length
  const totalUsers        = workers.length + clients.length + admins.length

  const ADMIN_TABS = [
    { id: 'dashboard',    icon: '📊',  label: 'Dashboard' },
    { id: 'configurator', icon: '⚙️',  label: 'Configurator' },
    { id: 'quotes',       icon: '📋',  label: 'Quotes',       badge: newQuoteCount },
    { id: 'users',        icon: '👥',  label: 'Users',        badge: totalUsers },
    { id: 'orders',       icon: '📦',  label: 'Orders',       badge: orders.length },
    { id: 'extras',       icon: '⭐',  label: 'Extras',       badge: extras.length },
    { id: 'reviews',      icon: '💬',  label: 'Reviews',      badge: reviews.length },
    { id: 'referrals',    icon: '🎁',  label: 'Referrals',    badge: pendingReferrals },
    { id: 'apikeys',      icon: '🔑',  label: 'API Keys' },
  ]

  return (
    <div className="adm-wrap">
      <div className="adm-topbar">
        {/* ── Header row ── */}
        <header className="adm-header">
          <div className="adm-header-left">
            <img src="/images/bcf.png" alt="BCF" className="adm-header-logo" />
            <div>
              <div className="adm-header-brand">Ballycastle Climbing Frames</div>
              <div className="adm-header-sub">Admin Dashboard</div>
            </div>
          </div>
          <div className="adm-header-right">
            <span className="adm-user">{session.user.email}</span>
            <button className="adm-btn-ghost" onClick={handleLogout}>Sign out</button>
          </div>
        </header>

        {/* ── Nav tabs ── */}
        <nav className="adm-tabs">
          {ADMIN_TABS.map(t => (
            <button key={t.id} className={`adm-tab${tab === t.id ? ' active' : ''}`} onClick={() => { playPop(); setTab(t.id); localStorage.setItem('admin_tab', t.id) }}>
              <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span>{t.icon}</span>
                <span className="adm-tab-label">{t.label}</span>
                {t.badge > 0 && (
                  <span style={{ background: tab === t.id ? '#1E3070' : '#ef4444', color: '#fff', borderRadius: 99, minWidth: 16, height: 16, padding: '0 4px', fontSize: 9, fontWeight: 900, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                    {t.badge}
                  </span>
                )}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {tab === 'configurator' && (
        <nav className="adm-subtabs">
          {[
            { id: 'products',     label: '🛠️ Products & Pricing' },
            { id: 'surfaces',     label: '🌿 Ground Surfaces' },
            { id: 'installation', label: '🔧 Installation' },
          ].map(s => (
            <button key={s.id} className={`adm-subtab${subTab === s.id ? ' active' : ''}`} onClick={() => setSubTab(s.id)}>
              {s.label}
            </button>
          ))}
        </nav>
      )}

      {saveMsg && <div className="adm-save-banner">{saveMsg}</div>}

      <main className="adm-main">
        {loading ? (
          <div className="adm-loading">Loading data…</div>
        ) : tab === 'dashboard' ? (
          <>
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 22, color: '#1E3070', marginBottom: 20 }}>
              Overview
            </div>
            <div className="adm-stat-grid">
              {[
                { icon: '📋', label: 'Total Quotes',      value: quotes.length,    accent: '#F9C800', iconBg: '#FEF3C7', dest: 'quotes'    },
                { icon: '📦', label: 'Total Orders',      value: orders.length,    accent: '#1E3070', iconBg: '#EDE9FE', dest: 'orders'    },
                { icon: '👥', label: 'Total Users',       value: totalUsers,       accent: '#E85555', iconBg: '#FFE4E6', dest: 'users'     },
                { icon: '🎁', label: 'Pending Referrals', value: pendingReferrals, accent: '#10b981', iconBg: '#D1FAE5', dest: 'referrals' },
              ].map(s => (
                <div key={s.dest}
                  onClick={() => { playPop(); setTab(s.dest); localStorage.setItem('admin_tab', s.dest) }}
                  className="adm-stat-card"
                  style={{ borderTop: `4px solid ${s.accent}` }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
                  <div style={{ width: 62, height: 62, borderRadius: '50%', background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 14px' }}>{s.icon}</div>
                  <div className="adm-stat-value" style={{ fontFamily: "'Fredoka One', cursive", fontSize: 34, color: '#1E3070', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, fontWeight: 700 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </>
        ) : tab === 'configurator' ? (
          subTab === 'products' ? (
            <ProductsTab
              modules={modules} selects={selects} options={options}
              setModules={setModules} setSelects={setSelects} setOptions={setOptions}
              reload={loadAll} flash={flash}
            />
          ) : subTab === 'surfaces' ? (
            <SurfacesTab surfaces={surfaces} setSurfaces={setSurfaces} flash={flash} />
          ) : (
            <InstallTab installOpts={installOpts} setInstallOpts={setInstallOpts} flash={flash} />
          )
        ) : tab === 'quotes' ? (
          <QuotesTab quotes={quotes} setQuotes={setQuotes} flash={flash} />
        ) : tab === 'users' ? (
          <UsersTab clients={clients} setClients={setClients} workers={workers} setWorkers={setWorkers} admins={admins} session={session} flash={flash} reload={loadAll} />
        ) : tab === 'orders' ? (
          <OrdersTab orders={orders} setOrders={setOrders} workers={workers} allStages={allStages} flash={flash} reload={loadAll} />
        ) : tab === 'extras' ? (
          <ExtrasTab extras={extras} setExtras={setExtras} flash={flash} />
        ) : tab === 'referrals' ? (
          <ReferralsTab referrals={referrals} setReferrals={setReferrals} flash={flash} />
        ) : tab === 'apikeys' ? (
          <ApiKeysTab session={session} flash={flash} />
        ) : (
          <ReviewsTab reviews={reviews} />
        )}
      </main>
    </div>
  )
}

// ─── Confirm modal hook ─────────────────────────────────────────────────────
function useConfirm() {
  const [state, setState] = useState(null) // { message, okLabel, resolve }

  function doConfirm(message, okLabel = 'Delete') {
    return new Promise(resolve => setState({ message, okLabel, resolve }))
  }

  function handleOk()     { state?.resolve(true);  setState(null) }
  function handleCancel() { state?.resolve(false); setState(null) }

  const confirmModal = state ? (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: '28px 24px', width: '100%', maxWidth: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <p style={{ fontSize: 15, color: '#1e293b', fontWeight: 600, marginBottom: 24, lineHeight: 1.5 }}>{state.message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="adm-btn-ghost sm" onClick={handleCancel}>Cancel</button>
          <button className="adm-btn-danger sm" onClick={handleOk}>{state.okLabel}</button>
        </div>
      </div>
    </div>
  ) : null

  return [doConfirm, confirmModal]
}

// ─── Products tab ──────────────────────────────────────────────────────────
function ProductsTab({ modules, selects, options, setModules, setSelects, setOptions, reload, flash }) {
  const [expanded, setExpanded]     = useState({})
  const [showAddModule, setShowAddModule] = useState(false)

  function toggle(id) { setExpanded(p => ({ ...p, [id]: !p[id] })) }

  async function toggleModuleActive(mod) {
    const { error } = await supabase.from('modules').update({ is_active: !mod.is_active }).eq('id', mod.id)
    if (!error) { setModules(p => p.map(m => m.id === mod.id ? { ...m, is_active: !m.is_active } : m)); flash('Saved') }
  }

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2>Modules</h2>
        <button className="adm-btn-primary" onClick={() => setShowAddModule(true)}>+ Add Module</button>
      </div>

      {modules.map(mod => {
        const modSelects = selects.filter(s => s.module_id === mod.id).sort((a, b) => a.sort_order - b.sort_order)
        return (
          <div key={mod.id} className={`adm-module-card${mod.is_active ? '' : ' inactive'}`}>
            <div className="adm-module-header" onClick={() => toggle(mod.id)}>
              <div className="adm-module-meta">
                <span className="adm-chevron">{expanded[mod.id] ? '▾' : '▸'}</span>
                <strong>{mod.label}</strong>
                <span className="adm-badge">{mod.category}</span>
                {!mod.is_active && <span className="adm-badge adm-badge-off">Hidden</span>}
              </div>
              <div className="adm-module-actions" onClick={e => e.stopPropagation()}>
                <button
                  className={`adm-toggle${mod.is_active ? ' on' : ' off'}`}
                  onClick={() => toggleModuleActive(mod)}
                  title={mod.is_active ? 'Hide from configurator' : 'Show in configurator'}
                >
                  {mod.is_active ? 'Visible' : 'Hidden'}
                </button>
              </div>
            </div>

            {expanded[mod.id] && (
              <div className="adm-module-body">
                {modSelects.map(sel => {
                  const selOptions = options.filter(o => o.select_ref === sel.id).sort((a, b) => a.sort_order - b.sort_order)
                  return (
                    <div key={sel.id} className="adm-select-group">
                      <div className="adm-select-label">{sel.placeholder}</div>
                      <OptionsTable
                        options={selOptions} selectRef={sel.id} moduleId={mod.id}
                        setOptions={setOptions} flash={flash}
                      />
                      <AddOptionRow selectRef={sel.id} moduleId={mod.id} currentCount={selOptions.length} setOptions={setOptions} flash={flash} />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {showAddModule && (
        <AddModuleModal
          onClose={() => setShowAddModule(false)}
          onAdded={() => { setShowAddModule(false); reload(); flash('Module added') }}
          existingCount={modules.length}
        />
      )}
    </div>
  )
}

const NUMERIC_OPTION_FIELDS = ['price', 'offset_y']

// ─── Options table (inside a module select group) ──────────────────────────
function OptionsTable({ options, setOptions, flash }) {
  async function saveField(opt, field, value) {
    const update = { [field]: NUMERIC_OPTION_FIELDS.includes(field) ? parseFloat(value) : value }
    const { error } = await supabase.from('module_options').update(update).eq('id', opt.id)
    if (!error) {
      setOptions(p => p.map(o => o.id === opt.id ? { ...o, ...update } : o))
      flash('Saved')
    }
  }

  async function toggleActive(opt) {
    const { error } = await supabase.from('module_options').update({ is_active: !opt.is_active }).eq('id', opt.id)
    if (!error) { setOptions(p => p.map(o => o.id === opt.id ? { ...o, is_active: !opt.is_active } : o)); flash('Saved') }
  }

  if (options.length === 0) return <p className="adm-empty">No options yet.</p>

  return (
    <div className="adm-table-wrap">
    <table className="adm-table">
      <thead>
        <tr>
          <th>Label</th>
          <th>Price (£)</th>
          <th>GLB path</th>
          <th>Snap zone</th>
          <th title="Float height in metres. 0 = sits on ground. Positive = floats above ground (e.g. 1.5 for rope bridge).">Float ht. (m)</th>
          <th>Visible</th>
        </tr>
      </thead>
      <tbody>
        {options.map(opt => (
          <tr key={opt.id} className={opt.is_active ? '' : 'adm-row-off'}>
            <td>
              <InlineEdit value={opt.label} onSave={v => saveField(opt, 'label', v)} />
            </td>
            <td>
              <InlineEdit value={opt.price} type="number" prefix="£" onSave={v => saveField(opt, 'price', v)} />
            </td>
            <td>
              <InlineEdit value={opt.glb || ''} placeholder="null" onSave={v => saveField(opt, 'glb', v || null)} />
            </td>
            <td>
              <InlineEdit value={opt.snap_zone} onSave={v => saveField(opt, 'snap_zone', v)} />
            </td>
            <td>
              <InlineEdit value={opt.offset_y ?? 0} type="number" onSave={v => saveField(opt, 'offset_y', v)} />
            </td>
            <td>
              <button className={`adm-toggle sm${opt.is_active ? ' on' : ' off'}`} onClick={() => toggleActive(opt)}>
                {opt.is_active ? '✓' : '✗'}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  )
}

// ─── Inline editable cell ──────────────────────────────────────────────────
function InlineEdit({ value, onSave, type = 'text', prefix = '', placeholder = '' }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(String(value ?? ''))

  function commit() {
    setEditing(false)
    if (String(draft) !== String(value ?? '')) onSave(draft)
  }

  if (!editing) return (
    <span
      className="adm-inline-view"
      onClick={() => { setDraft(String(value ?? '')); setEditing(true) }}
      title="Click to edit"
    >
      {value !== null && value !== '' && value !== undefined ? `${prefix}${value}` : <em className="adm-null">{placeholder || 'null'}</em>}
    </span>
  )

  return (
    <input
      className="adm-inline-input"
      type={type}
      value={draft}
      autoFocus
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
    />
  )
}

// ─── Time range picker ─────────────────────────────────────────────────────
function TimeRangePicker({ value, onSave }) {
  function parseTo24h(str) {
    if (!str) return ''
    const m = str.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i)
    if (!m) return ''
    let h = parseInt(m[1], 10)
    if (m[3].toLowerCase() === 'pm' && h !== 12) h += 12
    if (m[3].toLowerCase() === 'am' && h === 12) h = 0
    return `${String(h).padStart(2, '0')}:${m[2]}`
  }
  function fmt12(t) {
    if (!t) return ''
    const [h, m] = t.split(':').map(Number)
    return `${h % 12 || 12}:${String(m).padStart(2, '0')}${h >= 12 ? 'pm' : 'am'}`
  }

  const parts = (value || '').split('–')
  const [start, setStart] = useState(() => parseTo24h(parts[0]))
  const [end,   setEnd]   = useState(() => parseTo24h(parts[1]))

  useEffect(() => {
    const p = (value || '').split('–')
    setStart(parseTo24h(p[0]))
    setEnd(parseTo24h(p[1]))
  }, [value])

  function save(s, e) {
    if (s && e) onSave(`${fmt12(s)} – ${fmt12(e)}`)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <input type="time" className="adm-input" style={{ flex: 1, padding: '6px 8px', fontSize: 13 }}
        value={start}
        onChange={ev => setStart(ev.target.value)}
        onBlur={() => save(start, end)}
      />
      <span style={{ color: '#94a3b8', fontSize: 13, flexShrink: 0 }}>–</span>
      <input type="time" className="adm-input" style={{ flex: 1, padding: '6px 8px', fontSize: 13 }}
        value={end}
        onChange={ev => setEnd(ev.target.value)}
        onBlur={() => save(start, end)}
      />
    </div>
  )
}

// ─── Add option row form ───────────────────────────────────────────────────
function AddOptionRow({ selectRef, moduleId, currentCount, setOptions, flash }) {
  const [open, setOpen]       = useState(false)
  const [id, setId]           = useState('')
  const [label, setLabel]     = useState('')
  const [price, setPrice]     = useState('')
  const [snapZone, setSnapZone] = useState('center')
  const [busy, setBusy]       = useState(false)
  const [err, setErr]         = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!id || !label || price === '') return
    setBusy(true)
    setErr('')
    const { error } = await supabase.from('module_options').insert({
      id: id.trim().toLowerCase().replace(/\s+/g, '-'),
      select_ref: selectRef,
      module_id: moduleId,
      label: label.trim(),
      price: parseInt(price, 10),
      snap_zone: snapZone,
      sort_order: currentCount + 1,
    })
    if (error) { setErr(error.message); setBusy(false); return }
    const { data } = await supabase.from('module_options').select('*').eq('select_ref', selectRef).order('sort_order')
    setOptions(p => {
      const others = p.filter(o => o.select_ref !== selectRef)
      return [...others, ...(data || [])]
    })
    flash('Option added')
    setId(''); setLabel(''); setPrice(''); setSnapZone('center'); setOpen(false)
    setBusy(false)
  }

  if (!open) return (
    <button className="adm-btn-ghost sm" onClick={() => setOpen(true)}>+ Add option</button>
  )

  return (
    <form className="adm-add-option-form" onSubmit={submit}>
      <input placeholder="id (e.g. my-new-frame)" value={id} onChange={e => setId(e.target.value)} required />
      <input placeholder="Label" value={label} onChange={e => setLabel(e.target.value)} required />
      <input placeholder="Price £" type="number" value={price} onChange={e => setPrice(e.target.value)} required />
      <select value={snapZone} onChange={e => setSnapZone(e.target.value)}>
        {['center','left','right','front','back','front_left','front_right'].map(z => (
          <option key={z} value={z}>{z}</option>
        ))}
      </select>
      {err && <span className="adm-error">{err}</span>}
      <button type="submit" className="adm-btn-primary sm" disabled={busy}>Add</button>
      <button type="button" className="adm-btn-ghost sm" onClick={() => setOpen(false)}>Cancel</button>
    </form>
  )
}

// ─── Add module modal ──────────────────────────────────────────────────────
function AddModuleModal({ onClose, onAdded, existingCount }) {
  const [moduleId, setModuleId]     = useState('')
  const [label, setLabel]           = useState('')
  const [category, setCategory]     = useState('Sets')
  const [selectPlaceholder, setSelectPlaceholder] = useState('Select design…')
  const [optId, setOptId]           = useState('')
  const [optLabel, setOptLabel]     = useState('')
  const [optPrice, setOptPrice]     = useState('')
  const [snapZone, setSnapZone]     = useState('center')
  const [busy, setBusy]             = useState(false)
  const [err, setErr]               = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!moduleId || !label || !optId || !optLabel || optPrice === '') return
    setBusy(true)
    setErr('')

    const cleanModuleId  = moduleId.trim().toLowerCase().replace(/\s+/g, '_')
    const selectId       = 'design'
    const selectRef      = `${cleanModuleId}__${selectId}`
    const cleanOptId     = optId.trim().toLowerCase().replace(/\s+/g, '-')

    const { error: mErr } = await supabase.from('modules').insert({
      id: cleanModuleId, label: label.trim(), category, required: false, sort_order: existingCount + 1,
    })
    if (mErr) { setErr(mErr.message); setBusy(false); return }

    const { error: sErr } = await supabase.from('module_selects').insert({
      id: selectRef, module_id: cleanModuleId, select_id: selectId,
      placeholder: selectPlaceholder.trim(), sort_order: 1,
    })
    if (sErr) { setErr(sErr.message); setBusy(false); return }

    const { error: oErr } = await supabase.from('module_options').insert({
      id: cleanOptId, select_ref: selectRef, module_id: cleanModuleId,
      label: optLabel.trim(), price: parseInt(optPrice, 10), snap_zone: snapZone, sort_order: 1,
    })
    if (oErr) { setErr(oErr.message); setBusy(false); return }

    onAdded()
  }

  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className="adm-modal" onClick={e => e.stopPropagation()}>
        <h3>Add New Module</h3>
        <form onSubmit={submit} className="adm-modal-form">
          <label>Module ID <small>(no spaces, e.g. monkey_swing)</small>
            <input value={moduleId} onChange={e => setModuleId(e.target.value)} required placeholder="my_new_frame" />
          </label>
          <label>Display Label
            <input value={label} onChange={e => setLabel(e.target.value)} required placeholder="My New Frame" />
          </label>
          <label>Category
            <select value={category} onChange={e => setCategory(e.target.value)}>
              <option>Sets</option>
              <option>Accessories</option>
            </select>
          </label>

          <hr />
          <p className="adm-modal-sub">First option (you can add more after saving)</p>

          <label>Dropdown placeholder
            <input value={selectPlaceholder} onChange={e => setSelectPlaceholder(e.target.value)} required />
          </label>
          <label>Option ID <small>(e.g. my-new-frame-standard)</small>
            <input value={optId} onChange={e => setOptId(e.target.value)} required placeholder="my-new-frame-standard" />
          </label>
          <label>Option Label
            <input value={optLabel} onChange={e => setOptLabel(e.target.value)} required placeholder="My New Frame — Standard" />
          </label>
          <label>Price (£)
            <input type="number" value={optPrice} onChange={e => setOptPrice(e.target.value)} required placeholder="999" />
          </label>
          <label>Snap Zone
            <select value={snapZone} onChange={e => setSnapZone(e.target.value)}>
              {['center','left','right','front','back','front_left','front_right'].map(z => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </label>

          {err && <p className="adm-error">{err}</p>}
          <div className="adm-modal-actions">
            <button type="submit" className="adm-btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Add Module'}</button>
            <button type="button" className="adm-btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Ground Surfaces tab ───────────────────────────────────────────────────
function SurfacesTab({ surfaces, setSurfaces, flash }) {
  const [adding, setAdding] = useState(false)
  const [form, setForm]     = useState({ value: '', label: '', price: '' })
  const [err, setErr]       = useState('')

  async function saveField(surf, field, value) {
    const update = { [field]: field === 'price' ? parseInt(value, 10) : value }
    const { error } = await supabase.from('ground_surfaces').update(update).eq('id', surf.id)
    if (!error) { setSurfaces(p => p.map(s => s.id === surf.id ? { ...s, ...update } : s)); flash('Saved') }
  }

  async function toggleActive(surf) {
    const { error } = await supabase.from('ground_surfaces').update({ is_active: !surf.is_active }).eq('id', surf.id)
    if (!error) { setSurfaces(p => p.map(s => s.id === surf.id ? { ...s, is_active: !surf.is_active } : s)); flash('Saved') }
  }

  async function confirmAdd(e) {
    e.preventDefault()
    if (!form.value.trim()) { setErr('Key is required.'); return }
    if (!form.label.trim()) { setErr('Label is required.'); return }
    const { error } = await supabase.from('ground_surfaces').insert({
      value: form.value.trim().toLowerCase(),
      label: form.label.trim(),
      price: parseInt(form.price || '0', 10),
      sort_order: surfaces.length + 1,
    })
    if (error) { setErr(error.message); return }
    const { data } = await supabase.from('ground_surfaces').select('*').order('sort_order')
    setSurfaces(data || [])
    flash('Surface added')
    setAdding(false)
    setForm({ value: '', label: '', price: '' })
    setErr('')
  }

  return (
    <div className="adm-section">
      {adding && (
        <div className="adm-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setAdding(false) }}>
          <div className="adm-modal">
            <h3>Add Ground Surface</h3>
            <form className="adm-modal-form" onSubmit={confirmAdd}>
              <label>
                Unique Key <small>(e.g. wetpour-extra)</small>
                <input autoFocus value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} placeholder="wetpour-extra" />
              </label>
              <label>
                Display Label
                <input value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} placeholder="Wetpour Floor — Extra" />
              </label>
              <label>
                Price (£)
                <input type="number" min="0" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="0" />
              </label>
              {err && <p style={{ color: '#dc2626', fontSize: 12, margin: 0 }}>{err}</p>}
              <div className="adm-modal-actions">
                <button type="submit" className="adm-btn-primary">Add Surface</button>
                <button type="button" className="adm-btn-ghost" onClick={() => { setAdding(false); setErr('') }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="adm-section-header">
        <h2>Ground Surfaces</h2>
        <button className="adm-btn-primary" onClick={() => setAdding(true)}>+ Add Surface</button>
      </div>
      <div className="adm-table-wrap">
      <table className="adm-table">
        <thead>
          <tr><th>Key</th><th>Label</th><th>Price (£)</th><th>Visible</th></tr>
        </thead>
        <tbody>
          {surfaces.map(s => (
            <tr key={s.id} className={s.is_active ? '' : 'adm-row-off'}>
              <td><code>{s.value}</code></td>
              <td><InlineEdit value={s.label} onSave={v => saveField(s, 'label', v)} /></td>
              <td><InlineEdit value={s.price} type="number" prefix="£" onSave={v => saveField(s, 'price', v)} /></td>
              <td>
                <button className={`adm-toggle sm${s.is_active ? ' on' : ' off'}`} onClick={() => toggleActive(s)}>
                  {s.is_active ? '✓' : '✗'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}

// ─── Installation Options tab ──────────────────────────────────────────────
function InstallTab({ installOpts, setInstallOpts, flash }) {
  async function saveField(opt, field, value) {
    const update = { [field]: field === 'price' ? parseInt(value, 10) : value }
    const { error } = await supabase.from('installation_options').update(update).eq('id', opt.id)
    if (!error) { setInstallOpts(p => p.map(o => o.id === opt.id ? { ...o, ...update } : o)); flash('Saved') }
  }

  async function toggleActive(opt) {
    const { error } = await supabase.from('installation_options').update({ is_active: !opt.is_active }).eq('id', opt.id)
    if (!error) { setInstallOpts(p => p.map(o => o.id === opt.id ? { ...o, is_active: !opt.is_active } : o)); flash('Saved') }
  }

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2>Installation Options</h2>
      </div>
      <div className="adm-table-wrap">
      <table className="adm-table">
        <thead>
          <tr><th>Key</th><th>Label</th><th>Price (£)</th><th>Visible</th></tr>
        </thead>
        <tbody>
          {installOpts.map(o => (
            <tr key={o.id} className={o.is_active ? '' : 'adm-row-off'}>
              <td><code>{o.value}</code></td>
              <td><InlineEdit value={o.label} onSave={v => saveField(o, 'label', v)} /></td>
              <td><InlineEdit value={o.price} type="number" prefix="£" onSave={v => saveField(o, 'price', v)} /></td>
              <td>
                <button className={`adm-toggle sm${o.is_active ? ' on' : ' off'}`} onClick={() => toggleActive(o)}>
                  {o.is_active ? '✓' : '✗'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <p className="adm-hint">Prices update live in the configurator once saved.</p>
    </div>
  )
}

// ─── Quotes tab ────────────────────────────────────────────────────────────
const STATUS_LABELS = { new: 'New', contacted: 'Contacted', ordered: 'Ordered', declined: 'Declined' }
const STATUS_COLORS = { new: 'adm-status-new', contacted: 'adm-status-contacted', ordered: 'adm-status-ordered', declined: 'adm-status-declined' }

function QuotesTab({ quotes, setQuotes, flash }) {
  const [expanded, setExpanded] = useState({})

  async function updateStatus(quote, status) {
    const { error } = await supabase.from('quotes').update({ status }).eq('id', quote.id)
    if (!error) { setQuotes(p => p.map(q => q.id === quote.id ? { ...q, status } : q)); flash('Status updated') }
  }

  async function saveNotes(quote, notes) {
    const { error } = await supabase.from('quotes').update({ notes }).eq('id', quote.id)
    if (!error) { setQuotes(p => p.map(q => q.id === quote.id ? { ...q, notes } : q)); flash('Notes saved') }
  }

  const newCount = quotes.filter(q => q.status === 'new').length

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2>Customer Quotes {newCount > 0 && <span className="adm-badge adm-badge-new">{newCount} new</span>}</h2>
        <span className="adm-hint">{quotes.length} total</span>
      </div>

      {quotes.length === 0 && (
        <div className="adm-empty-state">
          <p>No quotes submitted yet. Once customers generate a quote it will appear here.</p>
        </div>
      )}

      {quotes.map(q => (
        <div key={q.id} className={`adm-quote-card${q.status === 'new' ? ' adm-quote-card--new' : ''}`}>
          <div className="adm-quote-header" onClick={() => setExpanded(p => ({ ...p, [q.id]: !p[q.id] }))}>
            <div className="adm-quote-meta">
              <span className="adm-chevron">{expanded[q.id] ? '▾' : '▸'}</span>
              <strong>{q.name}</strong>
              <span className="adm-quote-email">{q.email}</span>
              <span className="adm-quote-phone">{q.phone}</span>
            </div>
            <div className="adm-quote-right">
              <strong className="adm-quote-total">£{(q.total_price ?? 0).toLocaleString()}</strong>
              <span className="adm-quote-date">
                {new Date(q.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <select
                className={`adm-status-select ${STATUS_COLORS[q.status]}`}
                value={q.status}
                onChange={e => { e.stopPropagation(); updateStatus(q, e.target.value) }}
                onClick={e => e.stopPropagation()}
              >
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          {expanded[q.id] && (
            <div className="adm-quote-body">
              <div className="adm-quote-items">
                <h4>Configuration</h4>
                <table className="adm-table">
                  <tbody>
                    {(q.line_items || []).map((item, i) => (
                      <tr key={i}>
                        <td>{item.label}</td>
                        <td className="adm-quote-item-price">£{item.price.toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="adm-quote-total-row">
                      <td><strong>Total</strong></td>
                      <td><strong>£{(q.total_price ?? 0).toLocaleString()}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="adm-quote-notes">
                <h4>Admin Notes</h4>
                <InlineEdit
                  value={q.notes || ''}
                  placeholder="Add a note…"
                  onSave={v => saveNotes(q, v)}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Users Tab (unified: clients + workers + admins) ──────────────────────
function UsersTab({ clients, setClients, workers, setWorkers, admins, session, flash, reload }) {
  // ── shared search / filter / pagination state ──
  const [search,      setSearch]      = useState('')
  const [roleFilter,  setRoleFilter]  = useState('all')
  const [page,        setPage]        = useState(1)
  const PAGE_SIZE = 10

  // ── add user (unified) state ──
  const [addingUser,    setAddingUser]    = useState(false)
  const [userForm,      setUserForm]      = useState({ name: '', email: '', phone: '', role: 'client' })
  const [userErr,       setUserErr]       = useState('')
  const [userBusy,      setUserBusy]      = useState(false)

  // ── client state ──
  const [linkResult,    setLinkResult]    = useState(null)   // { email, link }
  const [generatingFor, setGeneratingFor] = useState(null)   // email string
  const [tempPwdResult, setTempPwdResult] = useState(null)   // { email, password }
  const [sendingPwdFor, setSendingPwdFor] = useState(null)   // email string
  const [deleteTarget,  setDeleteTarget]  = useState(null)   // client object to delete
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting,      setDeleting]      = useState(false)

  // ── worker state ──
  const [doConfirm, confirmModal]              = useConfirm()
  const [pwdWorker,            setPwdWorker]            = useState(null)
  const [customPwd,            setCustomPwd]            = useState('')
  const [generatedPwd,         setGeneratedPwd]         = useState('')
  const [pwdBusy,              setPwdBusy]              = useState(false)
  const [pwdErr,               setPwdErr]               = useState('')
  const [copied,               setCopied]               = useState(false)
  const [workerLinkResult,     setWorkerLinkResult]     = useState(null)
  const [generatingWorkerLink, setGeneratingWorkerLink] = useState(null)

  // ── edit state ──
  const [editTarget, setEditTarget] = useState(null)
  const [editForm,   setEditForm]   = useState({ name: '', email: '', phone: '' })
  const [editBusy,   setEditBusy]   = useState(false)
  const [editErr,    setEditErr]    = useState('')

  // ── GHL sync state ──
  const [syncBusy,   setSyncBusy]   = useState(false)
  const [syncResult, setSyncResult] = useState(null)

  // ── unified add-user action ──
  async function createUser(e) {
    e.preventDefault()
    const { name, email, phone, role } = userForm
    if (!name.trim() || !email.trim()) { setUserErr('Name and email are required.'); return }
    setUserBusy(true); setUserErr('')
    const body = {
      first_name:  name.trim().split(' ')[0],
      last_name:   name.trim().split(' ').slice(1).join(' '),
      email:       email.trim(),
      phone:       phone.trim(),
      role,
      send_email:  false,
      redirect_to: role === 'worker' ? `${window.location.origin}/worker` : `${window.location.origin}/portal`,
      ...(role === 'client' ? { sync_to_ghl: true } : {}),
    }
    const { data, error } = await supabase.functions.invoke('create-client', { body })
    setUserBusy(false)
    if (error) { setUserErr(error.message); return }
    setAddingUser(false)
    setUserForm({ name: '', email: '', phone: '', role: 'client' })
    reload()
    if (role === 'client') {
      if (data?.magicLink) setLinkResult({ email: email.trim(), link: data.magicLink })
      else flash('Client account created')
      if (data?.ghl_warning) flash(`GHL note: ${data.ghl_warning}`)
    } else {
      flash('Worker added — use "Temp Password" to send their credentials.')
    }
  }

  async function getLoginLink(email) {
    setGeneratingFor(email)
    const { data, error } = await supabase.functions.invoke('get-magic-link', {
      body: { email, redirect_to: `${window.location.origin}/portal` },
    })
    setGeneratingFor(null)
    if (error || !data?.magicLink) { flash('Failed to generate link'); return }
    setLinkResult({ email, link: data.magicLink })
  }

  async function sendTempPassword(client) {
    setSendingPwdFor(client.email)
    const { data, error } = await supabase.functions.invoke('send-temp-password', {
      body: {
        userId:    client.id,
        email:     client.email,
        name:      client.name || client.email,
        portalUrl: `${window.location.origin}/portal`,
      },
    })
    setSendingPwdFor(null)
    if (error || !data?.tempPassword) { flash('Failed to send password — check function logs'); return }
    setTempPwdResult({ email: client.email, password: data.tempPassword })
  }

  async function deleteClient() {
    if (!deleteTarget) return
    setDeleting(true)
    // Delete DB record first (FK cascades to orders, payments, etc.)
    const { error: dbErr } = await supabase
      .from('client_profiles')
      .delete()
      .eq('id', deleteTarget.id)
    if (dbErr) { setDeleting(false); flash('Delete failed — could not remove client data'); return }
    // Remove auth account
    await supabase.functions.invoke('delete-user', { body: { user_id: deleteTarget.id } })
    setDeleting(false)
    const name = deleteTarget.name || deleteTarget.email
    setDeleteTarget(null)
    setDeleteConfirm('')
    reload()
    flash(`✅ ${name} and all their data have been deleted.`)
  }

  // ── worker actions ──
  async function getWorkerLoginLink(email) {
    setGeneratingWorkerLink(email)
    const { data, error } = await supabase.functions.invoke('get-magic-link', {
      body: { email, redirect_to: `${window.location.origin}/worker` },
    })
    setGeneratingWorkerLink(null)
    if (error || !data?.magicLink) { flash('Failed to generate link'); return }
    setWorkerLinkResult({ email, link: data.magicLink })
  }

  function generateRandom() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    let p = ''
    for (let i = 0; i < 12; i++) p += chars[Math.floor(Math.random() * chars.length)]
    setCustomPwd(p)
    setGeneratedPwd(p)
  }

  function openPwdModal(worker) {
    setPwdWorker(worker)
    setCustomPwd('')
    setGeneratedPwd('')
    setPwdErr('')
    setCopied(false)
  }

  async function applyPassword(sendEmail = false) {
    if (!customPwd.trim()) { setPwdErr('Enter or generate a password first.'); return }
    if (customPwd.length < 8) { setPwdErr('Password must be at least 8 characters.'); return }
    setPwdBusy(true); setPwdErr('')
    const { data, error } = await supabase.functions.invoke('reset-worker-password', {
      body: {
        worker_id:       pwdWorker.id,
        worker_name:     pwdWorker.name,
        worker_email:    pwdWorker.email,
        worker_url:      `${window.location.origin}/worker`,
        custom_password: customPwd,
        send_email:      sendEmail,
      },
    })
    setPwdBusy(false)
    if (error || data?.error) { setPwdErr(error?.message || data?.error || 'Failed'); return }
    if (sendEmail) {
      flash(`✅ Password set and emailed to ${pwdWorker.name}`)
      setPwdWorker(null)
    } else {
      flash(`✅ Password set for ${pwdWorker.name}`)
    }
  }

  function copyPassword() {
    navigator.clipboard.writeText(customPwd)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function deleteWorker(worker) {
    if (!await doConfirm(`Remove ${worker.name} as a worker?`, 'Remove')) return
    await supabase.from('worker_profiles').delete().eq('id', worker.id)
    await supabase.from('user_roles').delete().eq('user_id', worker.id)
    // Delete the auth user so the worker can no longer log in
    await supabase.functions.invoke('delete-user', { body: { user_id: worker.id } }).catch(() => {})
    setWorkers(p => p.filter(w => w.id !== worker.id))
    flash('Worker removed')
  }

  async function saveEdit(e) {
    e.preventDefault()
    if (!editForm.name.trim()) { setEditErr('Name is required.'); return }
    setEditBusy(true); setEditErr('')
    const table = editTarget._type === 'client' ? 'client_profiles' : 'worker_profiles'
    const { error } = await supabase.from(table).update({
      name:  editForm.name.trim(),
      email: editForm.email.trim(),
      phone: editForm.phone.trim() || null,
    }).eq('id', editTarget._raw.id)
    if (error) { setEditErr(error.message); setEditBusy(false); return }
    if (editTarget._type === 'client') {
      setClients(p => p.map(c => c.id === editTarget._raw.id ? { ...c, name: editForm.name.trim(), email: editForm.email.trim(), phone: editForm.phone.trim() || null } : c))
    } else {
      setWorkers(p => p.map(w => w.id === editTarget._raw.id ? { ...w, name: editForm.name.trim(), email: editForm.email.trim(), phone: editForm.phone.trim() || null } : w))
    }
    flash('Profile updated')
    setEditTarget(null)
    setEditBusy(false)
  }

  // ── GHL sync ──
  async function syncFromGHL() {
    setSyncBusy(true)
    setSyncResult(null)
    const { data, error } = await supabase.functions.invoke('sync-ghl', {})
    setSyncBusy(false)
    if (error) { setSyncResult({ error: error.message }); return }
    setSyncResult(data)
    if (data?.created > 0) reload()
  }

  // ── build unified list ──
  const adminEntries = (admins || []).map(a => ({
    _type:   'admin',
    id:      a.user_id,
    name:    a.user_id === session?.user?.id ? (session.user.email?.split('@')[0] || 'Admin') : 'Admin',
    email:   a.user_id === session?.user?.id ? (session.user.email || '—') : '—',
    created: null,
  }))

  const allUsers = [
    ...clients.map(c => ({ _type: 'client', id: c.id, name: c.name, email: c.email, phone: c.phone, created: c.created_at, _raw: c })),
    ...workers.map(w => ({ _type: 'worker', id: w.id, name: w.name, email: w.email, phone: w.phone, created: w.created_at, _raw: w })),
    ...adminEntries,
  ]

  const q = search.toLowerCase()
  const visible = allUsers.filter(u => {
    if (roleFilter !== 'all' && u._type !== roleFilter) return false
    if (q && !(u.name || '').toLowerCase().includes(q) && !(u.email || '').toLowerCase().includes(q)) return false
    return true
  })

  const totalPages  = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const safePage    = Math.min(page, totalPages)
  const paginated   = visible.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function resetPage() { setPage(1) }

  const BADGE = {
    client: { background: '#dbeafe', color: '#1e40af', borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 700 },
    worker: { background: '#fef3c7', color: '#92400e', borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 700 },
    admin:  { background: '#fee2e2', color: '#991b1b', borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 700 },
  }

  return (
    <div className="adm-section">
      {confirmModal}

      {/* ── Edit profile modal ── */}
      {editTarget && (
        <div className="adm-modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setEditTarget(null); setEditErr('') } }}>
          <div className="adm-modal">
            <h3>✏️ Edit {editTarget._type === 'client' ? 'Client' : 'Worker'} Profile</h3>
            <form className="adm-modal-form" onSubmit={saveEdit}>
              <label>
                Full Name
                <input autoFocus value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} placeholder="Full name" required />
              </label>
              <label>
                Email
                <input type="email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} placeholder="email@example.com" required />
              </label>
              <label>
                Phone
                <input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} placeholder="+44 7700 000000" />
              </label>
              {editErr && <p style={{ color: '#dc2626', fontSize: 12, margin: 0 }}>{editErr}</p>}
              <div className="adm-modal-actions">
                <button type="submit" className="adm-btn-primary" disabled={editBusy}>{editBusy ? 'Saving…' : 'Save Changes'}</button>
                <button type="button" className="adm-btn-ghost" onClick={() => { setEditTarget(null); setEditErr('') }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Client login link modal ── */}
      {linkResult && (
        <div className="adm-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setLinkResult(null) }}>
          <div className="adm-modal" style={{ maxWidth: 520 }}>
            <h3>🔗 Client Login Link</h3>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>
              Share this link with <strong>{linkResult.email}</strong> — it logs them straight into the portal. Valid for 24 hours.
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#f1f5f9', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
              <input readOnly value={linkResult.link} style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 12, color: '#334155', outline: 'none' }} />
              <button className="adm-btn-primary" style={{ fontSize: 12, padding: '6px 14px', flexShrink: 0 }}
                onClick={() => { navigator.clipboard.writeText(linkResult.link); flash('Copied!') }}>
                Copy
              </button>
            </div>
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>After 24 hours, generate a new link from this screen.</p>
            <div className="adm-modal-actions">
              <button className="adm-btn-ghost" onClick={() => setLinkResult(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Temp password result modal ── */}
      {tempPwdResult && (
        <div className="adm-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setTempPwdResult(null) }}>
          <div className="adm-modal" style={{ maxWidth: 480 }}>
            <h3>🔑 Temporary Password Generated</h3>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
              A new temporary password has been set for <strong>{tempPwdResult.email}</strong>. No email has been sent — share this password with the client directly.
            </p>
            <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Temporary Password</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <code style={{ flex: 1, fontSize: 20, fontWeight: 800, color: '#1E3070', letterSpacing: '0.1em' }}>{tempPwdResult.password}</code>
                <button className="adm-btn-primary" style={{ fontSize: 12, padding: '6px 14px', flexShrink: 0 }}
                  onClick={() => { navigator.clipboard.writeText(tempPwdResult.password); flash('Copied!') }}>
                  Copy
                </button>
              </div>
            </div>
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>
              Ask the client to log in and change this password from their portal settings.
            </p>
            <div className="adm-modal-actions">
              <button className="adm-btn-ghost" onClick={() => setTempPwdResult(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete client confirmation modal ── */}
      {deleteTarget && (
        <div className="adm-modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setDeleteTarget(null); setDeleteConfirm('') } }}>
          <div className="adm-modal" style={{ maxWidth: 480, borderTop: '4px solid #dc2626' }}>
            <h3 style={{ color: '#dc2626' }}>⚠️ Delete Client & All Data</h3>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 8, lineHeight: 1.6 }}>
              This will permanently delete <strong>{deleteTarget.name}</strong> and everything associated with their build:
            </p>
            <ul style={{ fontSize: 12, color: '#475569', marginBottom: 16, paddingLeft: 18, lineHeight: 2 }}>
              <li>All build stages and tasks</li>
              <li>All photos and files (storage + records)</li>
              <li>All payments and documents</li>
              <li>All reminders, reviews and notifications</li>
              <li>All referrals and extra requests</li>
              <li>Their portal login account</li>
            </ul>
            <p style={{ fontSize: 13, color: '#dc2626', fontWeight: 700, marginBottom: 10 }}>
              This cannot be undone. Type <strong>{deleteTarget.name}</strong> to confirm.
            </p>
            <input
              autoFocus
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder={deleteTarget.name}
              style={{ width: '100%', padding: '10px 12px', border: '2px solid #fca5a5', borderRadius: 8, fontSize: 13, marginBottom: 16, outline: 'none', fontFamily: 'inherit' }}
              onFocus={e => { e.target.style.borderColor = '#dc2626' }}
              onBlur={e => { e.target.style.borderColor = '#fca5a5' }}
            />
            <div className="adm-modal-actions">
              <button
                className="adm-btn-primary"
                style={{ background: '#dc2626' }}
                disabled={deleteConfirm.trim() !== deleteTarget.name.trim() || deleting}
                onClick={deleteClient}>
                {deleting ? 'Deleting…' : '🗑️ Delete Everything'}
              </button>
              <button className="adm-btn-ghost" onClick={() => { setDeleteTarget(null); setDeleteConfirm('') }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add User modal (unified) ── */}
      {addingUser && (
        <div className="adm-modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setAddingUser(false); setUserErr('') } }}>
          <div className="adm-modal">
            <h3>Add User</h3>
            <form className="adm-modal-form" onSubmit={createUser}>
              <label>
                Role
                <select value={userForm.role} onChange={e => setUserForm(p => ({ ...p, role: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff' }}>
                  <option value="client">Client</option>
                  <option value="worker">Worker</option>
                </select>
              </label>
              <label>
                Full Name
                <input autoFocus value={userForm.name} onChange={e => setUserForm(p => ({ ...p, name: e.target.value }))}
                  placeholder={userForm.role === 'client' ? 'Sarah & David Henderson' : 'Jamie Robinson'} required />
              </label>
              <label>
                Email
                <input type="email" value={userForm.email} onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))}
                  placeholder={userForm.role === 'client' ? 'sarah@example.com' : 'jamie@bcf.co.uk'} required />
              </label>
              <label>
                Phone
                <input value={userForm.phone} onChange={e => setUserForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="07911 123456" />
              </label>
              {userForm.role === 'client' && (
                <p style={{ fontSize: 12, color: '#64748b', margin: 0, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6, padding: '6px 10px' }}>
                  Client will also be added to GHL "Order Confirmed" stage automatically.
                </p>
              )}
              {userErr && <p style={{ color: '#dc2626', fontSize: 12, margin: 0 }}>{userErr}</p>}
              <div className="adm-modal-actions">
                <button type="submit" className="adm-btn-primary" disabled={userBusy}>
                  {userBusy ? 'Creating…' : userForm.role === 'client' ? 'Create Client & Get Login Link' : 'Add Worker'}
                </button>
                <button type="button" className="adm-btn-ghost" onClick={() => { setAddingUser(false); setUserErr('') }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Set Worker Password modal ── */}
      {pwdWorker && (
        <div className="adm-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setPwdWorker(null) }}>
          <div className="adm-modal">
            <h3>Set Password — {pwdWorker.name}</h3>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
              Set a temporary password, then share it with the worker directly (phone, WhatsApp, etc).
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input
                className="adm-inline-input"
                style={{ flex: 1, padding: '9px 12px', fontSize: 15, fontFamily: 'monospace', letterSpacing: 1 }}
                type="text"
                placeholder="Type a password or generate one"
                value={customPwd}
                onChange={e => setCustomPwd(e.target.value)}
              />
              <button className="adm-btn-ghost" onClick={generateRandom} style={{ whiteSpace: 'nowrap' }}>
                ⚡ Generate
              </button>
            </div>
            {customPwd && (
              <div style={{ background: '#FFFDE7', border: '1px solid #FFF1AA', borderRadius: 10, padding: '12px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 17, fontWeight: 800, letterSpacing: 2, color: '#1E3070' }}>{customPwd}</span>
                <button className="adm-btn-ghost sm" onClick={copyPassword}>
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
            )}
            {pwdErr && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 10 }}>{pwdErr}</p>}
            <div className="adm-modal-actions">
              <button className="adm-btn-primary" onClick={() => applyPassword(false)} disabled={pwdBusy}>
                {pwdBusy ? 'Setting…' : '✅ Set Password'}
              </button>
              <button className="adm-btn-ghost" onClick={() => applyPassword(true)} disabled={pwdBusy}>
                {pwdBusy ? '…' : '📧 Set & Email Worker'}
              </button>
              <button className="adm-btn-ghost" onClick={() => setPwdWorker(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Worker login link result banner ── */}
      {workerLinkResult && (
        <div style={{ background: '#FFFDE7', border: '1.5px solid #FFD740', borderRadius: 12, padding: '14px 18px', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1E3070', marginBottom: 8 }}>
            🔗 Login link for <strong>{workerLinkResult.email}</strong> — valid for 24 hours
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input readOnly value={workerLinkResult.link}
              style={{ flex: 1, border: '1px solid #FFF1AA', background: '#fff', borderRadius: 8, padding: '7px 12px', fontSize: 12, color: '#334155', outline: 'none' }} />
            <button className="adm-btn-primary sm"
              onClick={() => { navigator.clipboard.writeText(workerLinkResult.link); flash('Copied!') }}>
              📋 Copy
            </button>
            <button className="adm-btn-ghost sm" onClick={() => setWorkerLinkResult(null)}>✕</button>
          </div>
        </div>
      )}

      {/* ── GHL sync result banner ── */}
      {syncResult && (
        <div style={{
          background: syncResult.error ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${syncResult.error ? '#fca5a5' : '#86efac'}`,
          borderRadius: 10, padding: '10px 16px', marginBottom: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 13, color: syncResult.error ? '#dc2626' : '#166534' }}>
            {syncResult.error
              ? `Sync failed: ${syncResult.error}`
              : syncResult.created === 0
                ? `All ${syncResult.total} GHL opportunities already in BCF — nothing new to sync.`
                : `Synced ${syncResult.created} new client${syncResult.created !== 1 ? 's' : ''} from GHL (${syncResult.skipped} already existed).`
            }
            {syncResult.errors?.length > 0 && (
              <span style={{ display: 'block', color: '#b45309', marginTop: 4 }}>
                {syncResult.errors.length} error(s): {syncResult.errors.map(e => e.email).join(', ')}
              </span>
            )}
          </span>
          <button className="adm-btn-ghost sm" onClick={() => setSyncResult(null)}>✕</button>
        </div>
      )}

      {/* ── Header: title + add buttons ── */}
      <div className="adm-section-header" style={{ flexWrap: 'wrap', gap: 8 }}>
        <h2>Users ({allUsers.length})</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="adm-btn-primary" onClick={() => { setAddingUser(true); setUserForm({ name: '', email: '', phone: '', role: 'client' }); setUserErr('') }}>+ Add User</button>
          <button className="adm-btn-ghost" onClick={syncFromGHL} disabled={syncBusy}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {syncBusy
              ? <><span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid #1E3070', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Syncing…</>
              : '↻ Sync GHL'}
          </button>
        </div>
      </div>

      {/* ── Search + role filter pills ── */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
        <input
          className="adm-input"
          style={{ flex: '1 1 180px', maxWidth: 280, padding: '7px 12px', fontSize: 13 }}
          placeholder="Search name or email…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all', 'client', 'worker', 'admin'].map(r => (
            <button
              key={r}
              className={roleFilter === r ? 'adm-subtab active' : 'adm-subtab'}
              onClick={() => { setRoleFilter(r); setPage(1) }}
              style={{ textTransform: 'capitalize' }}>
              {r === 'all' ? `All (${allUsers.length})` : r === 'client' ? `Client (${clients.length})` : r === 'worker' ? `Worker (${workers.length})` : `Admin (${(admins || []).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Unified table ── */}
      {visible.length === 0 ? (
        <p style={{ color: '#94a3b8', fontSize: 13 }}>No users match your filter.</p>
      ) : (
        <>
        <div className="adm-table-wrap adm-users-table">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email / Phone</th>
                <th>Role</th>
                <th className="adm-col-created">Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(u => (
                <tr key={`${u._type}-${u.id}`}>
                  <td style={{ fontWeight: 600 }}>{u.name || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>{u.email?.split('@')[0] || '—'}</span>}</td>
                  <td>
                    <div style={{ fontSize: 13 }}>{u.email || '—'}</div>
                    {u.phone && <div style={{ fontSize: 11, color: '#94a3b8' }}>{u.phone}</div>}
                  </td>
                  <td><span style={BADGE[u._type]}>{u._type}</span></td>
                  <td className="adm-col-created" style={{ color: '#94a3b8', fontSize: 12 }}>
                    {u.created ? new Date(u.created).toLocaleDateString('en-GB') : '—'}
                  </td>
                  <td>
                    {u._type === 'client' && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button className="adm-btn-ghost sm" style={{ fontSize: 12, whiteSpace: 'nowrap' }}
                          onClick={() => { setEditTarget(u); setEditForm({ name: u.name || '', email: u.email || '', phone: u.phone || '' }); setEditErr('') }}>
                          ✏️ Edit
                        </button>
                        <button className="adm-btn-ghost sm" style={{ fontSize: 12, whiteSpace: 'nowrap' }}
                          disabled={generatingFor === u.email}
                          onClick={() => getLoginLink(u.email)}>
                          {generatingFor === u.email ? '…' : '🔗 Login Link'}
                        </button>
                        <button className="adm-btn-ghost sm" style={{ fontSize: 12, whiteSpace: 'nowrap' }}
                          disabled={sendingPwdFor === u.email}
                          onClick={() => sendTempPassword(u._raw)}>
                          {sendingPwdFor === u.email ? '…' : '🔑 Temp Password'}
                        </button>
                        <button className="adm-btn-ghost sm" style={{ fontSize: 12, whiteSpace: 'nowrap', color: '#dc2626', borderColor: '#fca5a5' }}
                          onClick={() => { setDeleteTarget(u._raw); setDeleteConfirm('') }}>
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                    {u._type === 'worker' && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button className="adm-btn-ghost sm" style={{ fontSize: 12, whiteSpace: 'nowrap' }}
                          onClick={() => { setEditTarget(u); setEditForm({ name: u.name || '', email: u.email || '', phone: u.phone || '' }); setEditErr('') }}>
                          ✏️ Edit
                        </button>
                        <button className="adm-btn-ghost sm" style={{ fontSize: 12, whiteSpace: 'nowrap' }}
                          disabled={generatingWorkerLink === u.email}
                          onClick={() => getWorkerLoginLink(u.email)}>
                          {generatingWorkerLink === u.email ? 'Generating…' : '🔗 Login Link'}
                        </button>
                        <button className="adm-btn-ghost sm" style={{ fontSize: 12, whiteSpace: 'nowrap' }}
                          onClick={() => openPwdModal(u._raw)}>
                          🔑 Temp Password
                        </button>
                        <button className="adm-btn-ghost sm" style={{ fontSize: 12, whiteSpace: 'nowrap', color: '#dc2626', borderColor: '#fca5a5' }}
                          onClick={() => deleteWorker(u._raw)}>
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                    {u._type === 'admin' && (
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>View only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, padding: '14px 0 2px', borderTop: '1px solid #f1f5f9', marginTop: 8 }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>
            Showing {visible.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, visible.length)} of {visible.length} user{visible.length !== 1 ? 's' : ''}
          </span>
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                className="adm-btn-ghost sm"
                disabled={safePage === 1}
                onClick={() => setPage(p => p - 1)}
                style={{ padding: '5px 12px' }}>
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => {
                if (totalPages > 7) {
                  if (n !== 1 && n !== totalPages && Math.abs(n - safePage) > 2) {
                    if (n === safePage - 3 || n === safePage + 3) return <span key={n} style={{ color: '#94a3b8', padding: '0 4px', fontSize: 13 }}>…</span>
                    return null
                  }
                }
                return (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={n === safePage ? 'adm-btn-primary sm' : 'adm-btn-ghost sm'}
                    style={{ padding: '5px 10px', minWidth: 34, fontWeight: n === safePage ? 800 : 600 }}>
                    {n}
                  </button>
                )
              })}
              <button
                className="adm-btn-ghost sm"
                disabled={safePage === totalPages}
                onClick={() => setPage(p => p + 1)}
                style={{ padding: '5px 12px' }}>
                Next →
              </button>
            </div>
          )}
        </div>
        </>
      )}
    </div>
  )
}

// ─── Build Stages Panel (per-stage task toggles) ──────────────────────────
function BuildStagesPanel({ order, orderStages, onStageUpdate, flash }) {
  const [expanded,       setExpanded]       = useState({})   // { stageId: bool }
  const [tasks,          setTasks]          = useState({})   // { stageId: task[] | undefined }
  const [pendingTasks,   setPendingTasks]   = useState({})   // { stageId: {uid,value}[] }
  const taskSavedRef = React.useRef(new Set())
  const [completing,     setCompleting]     = useState(null)
  const [compUploading,  setCompUploading]  = useState(false)
  const [stagePhotos,    setStagePhotos]    = useState({})   // { stageId: photo[] }
  const [stagePhotoUrls, setStagePhotoUrls] = useState({})   // { photoId: url }
  const [completingTask,      setCompletingTask]      = useState(null) // { stage, task, isEdit }
  const [taskNotes,           setTaskNotes]           = useState('')
  const [taskFiles,           setTaskFiles]           = useState([])
  const [taskExistingPhotos,  setTaskExistingPhotos]  = useState([]) // [{id, storage_path, url}]
  const [taskUploading,       setTaskUploading]       = useState(false)
  const [taskDragOver,        setTaskDragOver]        = useState(false)

  // Load tasks for every stage on mount — needed for the Complete button gate
  useEffect(() => { orderStages.forEach(s => loadTasks(s.id)) }, [])

  async function loadTasks(stageId) {
    setTasks(p => {
      if (p[stageId] !== undefined) return p  // already loaded
      supabase.from('stage_tasks').select('*').eq('stage_id', stageId).order('created_at')
        .then(({ data }) => setTasks(q => ({ ...q, [stageId]: data || [] })))
      return p
    })
  }

  function toggleExpand(stageId) {
    setExpanded(p => ({ ...p, [stageId]: !p[stageId] }))
  }

  async function loadPhotos(stage) {
    if (stagePhotos[stage.id] !== undefined) return
    const { data } = await supabase.from('order_photos').select('*')
      .eq('order_id', order.id).eq('stage_id', stage.id).order('created_at', { ascending: false })
    const list = data || []
    const urls = {}
    await Promise.all(list.map(async ph => {
      const { data: u } = await supabase.storage.from('order-photos').createSignedUrl(ph.storage_path, 3600)
      if (u?.signedUrl) urls[ph.id] = u.signedUrl
    }))
    setStagePhotos(p => ({ ...p, [stage.id]: list }))
    setStagePhotoUrls(p => ({ ...p, ...urls }))
  }

  function addPendingTask(stageId) {
    const uid = Math.random().toString(36).slice(2)
    setPendingTasks(p => ({ ...p, [stageId]: [...(p[stageId] || []), { uid, value: '' }] }))
    setExpanded(p => ({ ...p, [stageId]: true }))
  }

  function updatePendingTask(stageId, uid, value) {
    setPendingTasks(p => ({
      ...p,
      [stageId]: (p[stageId] || []).map(t => t.uid === uid ? { ...t, value } : t),
    }))
  }

  function removePendingTask(stageId, uid) {
    setPendingTasks(p => ({ ...p, [stageId]: (p[stageId] || []).filter(t => t.uid !== uid) }))
  }

  async function savePendingTask(stage, uid) {
    const key = `${stage.id}:${uid}`
    if (taskSavedRef.current.has(key)) return
    taskSavedRef.current.add(key)
    const entry = (pendingTasks[stage.id] || []).find(t => t.uid === uid)
    const label = entry?.value.trim() || ''
    removePendingTask(stage.id, uid)
    if (label) {
      const { data } = await supabase.from('stage_tasks').insert({ stage_id: stage.id, label }).select().single()
      if (data) {
        setTasks(p => ({ ...p, [stage.id]: [...(p[stage.id] || []), data] }))
        if (stage.status === 'pending') onStageUpdate(order.id, stage, 'in_progress')
        flash('Task added')
      }
    }
    taskSavedRef.current.delete(key)
  }

  async function toggleTask(stage, task) {
    const completed = !task.completed
    await supabase.from('stage_tasks').update({ completed }).eq('id', task.id)
    setTasks(p => ({ ...p, [stage.id]: p[stage.id].map(t => t.id === task.id ? { ...t, completed } : t) }))
  }

  async function deleteTask(stageId, taskId) {
    // Query by task_id (new uploads) + both path patterns (legacy uploads without task_id)
    const adminPrefix  = `${order.id}/${stageId}/task_${taskId}/`
    const workerPrefix = `${order.id}/${stageId}/tasks/${taskId}/`

    const [{ data: byTaskId }, { data: byAdminPath }, { data: byWorkerPath }] = await Promise.all([
      supabase.from('order_photos').select('id, storage_path').eq('task_id', taskId),
      supabase.from('order_photos').select('id, storage_path').eq('order_id', order.id).like('storage_path', `${adminPrefix}%`),
      supabase.from('order_photos').select('id, storage_path').eq('order_id', order.id).like('storage_path', `${workerPrefix}%`),
    ])

    // Deduplicate by id in case any records match multiple criteria
    const seen = new Set()
    const allPhotos = [...(byTaskId || []), ...(byAdminPath || []), ...(byWorkerPath || [])].filter(p => {
      if (seen.has(p.id)) return false
      seen.add(p.id)
      return true
    })

    if (allPhotos.length) {
      await supabase.storage.from('order-photos').remove(allPhotos.map(p => p.storage_path))
      await supabase.from('order_photos').delete().in('id', allPhotos.map(p => p.id))
    }

    // Delete the task — the FK (on delete set null) will null out task_id on any remaining photos
    await supabase.from('stage_tasks').delete().eq('id', taskId)

    // Sweep: catch any photos in this stage whose task_id is now null (old uploads that
    // had no task_id set and weren't caught by the path-pattern queries above)
    const { data: orphaned } = await supabase.from('order_photos')
      .select('id, storage_path')
      .eq('order_id', order.id)
      .eq('stage_id', stageId)
      .is('task_id', null)
    if (orphaned?.length) {
      // Only delete ones that don't belong to surviving tasks (verify no other tasks in stage claim them)
      const { data: remainingTasks } = await supabase.from('stage_tasks').select('id').eq('stage_id', stageId)
      // If no tasks remain in stage, all null-task_id photos are orphaned — safe to remove
      if (!remainingTasks?.length) {
        await supabase.storage.from('order-photos').remove(orphaned.map(p => p.storage_path))
        await supabase.from('order_photos').delete().in('id', orphaned.map(p => p.id))
      }
    }

    setTasks(p => ({ ...p, [stageId]: p[stageId].filter(t => t.id !== taskId) }))
  }

  function openCompleteTask(stage, task) {
    setCompletingTask({ stage, task, isEdit: false })
    setTaskNotes('')
    setTaskFiles([])
    setTaskExistingPhotos([])
    setTaskUploading(false)
    setTaskDragOver(false)
  }

  async function openEditTask(stage, task) {
    setCompletingTask({ stage, task, isEdit: true })
    setTaskNotes(task.notes || '')
    setTaskFiles([])
    setTaskExistingPhotos([])
    setTaskUploading(false)
    setTaskDragOver(false)
    const adminPrefix  = `${order.id}/${stage.id}/task_${task.id}/`
    const workerPrefix = `${order.id}/${stage.id}/tasks/${task.id}/`
    const [{ data: byTaskId }, { data: byAdminPath }, { data: byWorkerPath }] = await Promise.all([
      supabase.from('order_photos').select('*').eq('task_id', task.id).order('created_at'),
      supabase.from('order_photos').select('*').eq('order_id', order.id).like('storage_path', `${adminPrefix}%`).order('created_at'),
      supabase.from('order_photos').select('*').eq('order_id', order.id).like('storage_path', `${workerPrefix}%`).order('created_at'),
    ])
    const seen = new Set()
    const data = [...(byTaskId || []), ...(byAdminPath || []), ...(byWorkerPath || [])].filter(p => {
      if (seen.has(p.id)) return false; seen.add(p.id); return true
    })
    if (data.length) {
      const withUrls = await Promise.all(data.map(async ph => {
        const { data: u } = await supabase.storage.from('order-photos').createSignedUrl(ph.storage_path, 3600)
        const fileName = ph.storage_path.split('/').pop().replace(/^\d+_[a-z0-9]+_/, '')
        return { ...ph, url: u?.signedUrl || null, fileName }
      }))
      setTaskExistingPhotos(withUrls)
    }
  }

  async function removeExistingTaskPhoto(photo) {
    await supabase.storage.from('order-photos').remove([photo.storage_path])
    await supabase.from('order_photos').delete().eq('id', photo.id)
    setTaskExistingPhotos(p => p.filter(ph => ph.id !== photo.id))
  }

  async function confirmCompleteTask() {
    if (!completingTask) return
    const notes = taskNotes.trim()
    if (!notes) return
    setTaskUploading(true)
    const { stage, task } = completingTask
    await supabase.from('stage_tasks').update({ completed: true, notes }).eq('id', task.id)
    if (taskFiles.length) {
      let uploadFailed = false
      await Promise.all(taskFiles.map(async file => {
        const path = `${order.id}/${stage.id}/task_${task.id}/${Date.now()}_${Math.random().toString(36).slice(2)}_${file.name}`
        const { error } = await supabase.storage.from('order-photos').upload(path, file)
        if (error) { console.error('Upload failed:', file.name, error); uploadFailed = true }
        else await supabase.from('order_photos').insert({ order_id: order.id, stage_id: stage.id, task_id: task.id, storage_path: path })
      }))
      if (uploadFailed) flash('Some files failed to upload — check console for details')
      setStagePhotos(p => ({ ...p, [stage.id]: undefined }))
    }
    setTasks(p => ({
      ...p,
      [stage.id]: p[stage.id].map(t => t.id === task.id ? { ...t, completed: true, notes } : t),
    }))
    if (!completingTask.isEdit && stage.status === 'pending') onStageUpdate(order.id, stage, 'in_progress')
    const wasEdit = completingTask.isEdit
    setCompletingTask(null)
    setTaskUploading(false)
    flash(wasEdit ? 'Task updated' : 'Task marked complete')
  }

  function openComplete(stage) {
    setCompleting(stage)
    setCompUploading(false)
  }

  async function confirmComplete() {
    setCompUploading(true)
    const stage = completing
    const now = new Date().toISOString()
    await supabase.from('build_stages').update({ status: 'done', completed_at: now }).eq('id', stage.id)
    setCompleting(null)
    setCompUploading(false)
    onStageUpdate(order.id, stage, 'done')
    flash('Stage marked complete')
  }

  const STATUS_COLOR  = { done: '#EA580C', in_progress: '#d97706', pending: '#94a3b8' }
  const STATUS_BG     = { done: '#FFFDE7', in_progress: '#FFFBE6', pending: '#f8fafc' }
  const STATUS_BORDER = { done: '#FFF1AA', in_progress: '#fde68a', pending: '#e2e8f0' }
  const STATUS_ICON   = { done: '✅', in_progress: '🔄', pending: '⏳' }
  const STATUS_LABEL  = { done: 'Complete', in_progress: 'In Progress', pending: 'Pending' }

  const doneCount  = orderStages.filter(s => s.status === 'done').length
  const totalCount = orderStages.length
  const pct        = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  return (
    <div>
      {/* Progress summary */}
      <div className="ord-section" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>Build Progress</span>
          <span style={{ fontWeight: 800, fontSize: 14, color: pct === 100 ? '#EA580C' : '#2563eb' }}>{pct}%</span>
        </div>
        <div style={{ height: 8, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#EA580C' : '#2563eb', borderRadius: 99, transition: 'width 0.4s' }} />
        </div>
        <div style={{ marginTop: 6, fontSize: 12, color: '#64748b' }}>{doneCount} of {totalCount} stages complete</div>
      </div>

      {/* Stage list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {orderStages.map((stage, idx) => {
          const stageTasks      = tasks[stage.id] || []
          const tasksDone       = stageTasks.filter(t => t.completed).length
          const tasksLoaded     = tasks[stage.id] !== undefined
          const allTasksDone    = tasksLoaded && (stageTasks.length === 0 || stageTasks.every(t => t.completed))
          const hasNote         = !!stage.notes
          const photoCount      = (stagePhotos[stage.id] || []).length
          const isOpen          = !!expanded[stage.id]

          const prevStage       = idx > 0 ? orderStages[idx - 1] : null
          const isLocked        = prevStage !== null && prevStage.status !== 'done'
          const anyLaterDone    = orderStages.slice(idx + 1).some(s => s.status === 'done')
          const canUndo         = !anyLaterDone

          const effectiveStatus = stage.status === 'done'
            ? 'done'
            : isLocked
              ? 'pending'
              : (stageTasks.length > 0 && !allTasksDone)
                ? 'in_progress'
                : stage.status

          const canComplete     = !isLocked && stage.status !== 'done' && allTasksDone
          const completeBlocked = !isLocked && stage.status !== 'done' && tasksLoaded && !allTasksDone

          return (
            <div key={stage.id} style={{
              border: `1.5px solid ${STATUS_BORDER[effectiveStatus]}`,
              borderRadius: 12, overflow: 'hidden', background: '#fff',
              opacity: isLocked ? 0.55 : 1,
            }}>
              {/* ── Stage header row ─────────────────────────────────── */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: STATUS_BG[effectiveStatus] }}>

                {/* Status icon circle */}
                <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0, background: '#fff', border: `2px solid ${STATUS_BORDER[effectiveStatus]}` }}>
                  {STATUS_ICON[effectiveStatus]}
                </div>

                {/* Label + sub-text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: STATUS_COLOR[effectiveStatus] }}>{stage.label}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                    {stage.status === 'done' && stage.completed_at
                      ? `Completed ${new Date(stage.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                      : isLocked
                        ? 'Complete the previous stage first'
                        : tasksLoaded && stageTasks.length > 0
                          ? `${tasksDone} / ${stageTasks.length} tasks done`
                          : null}
                  </div>
                </div>

                {/* Indicators — hidden for locked stages to avoid confusion */}
                {!isLocked && hasNote     && <span style={{ fontSize: 13, flexShrink: 0 }} title="Has client note">📝</span>}
                {!isLocked && photoCount > 0 && <span style={{ fontSize: 11, color: '#64748b', flexShrink: 0 }}>📸 {photoCount}</span>}

                {/* Status badge */}
                <span style={{ fontSize: 11, fontWeight: 700, background: '#fff', border: `1px solid ${STATUS_BORDER[effectiveStatus]}`, color: STATUS_COLOR[effectiveStatus], borderRadius: 99, padding: '3px 10px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {STATUS_LABEL[effectiveStatus]}
                </span>

                {/* Per-stage tasks toggle */}
                <button
                  onClick={() => toggleExpand(stage.id)}
                  title={isOpen ? 'Hide tasks' : 'Show tasks'}
                  style={{ background: isOpen ? '#eff6ff' : 'none', border: `1px solid ${isOpen ? '#bfdbfe' : '#e2e8f0'}`, borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: isOpen ? '#2563eb' : '#64748b', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                  Tasks {isOpen ? '▲' : '▼'}
                </button>

                {/* Action buttons — unlocked, not done */}
                {!isLocked && stage.status !== 'done' && (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      className="adm-btn-ghost sm"
                      style={{ fontSize: 12 }}
                      onClick={() => addPendingTask(stage.id)}>
                      + Task
                    </button>
                    <button
                      className="adm-btn-primary sm"
                      disabled={!canComplete}
                      title={completeBlocked ? 'Complete all tasks first' : ''}
                      style={{ background: canComplete ? '#EA580C' : '#94a3b8', fontSize: 12, cursor: canComplete ? 'pointer' : 'not-allowed', opacity: completeBlocked ? 0.6 : 1 }}
                      onClick={() => canComplete && openComplete(stage)}>
                      ✓ Complete
                    </button>
                  </div>
                )}
                {stage.status === 'done' && (
                  <button
                    className="adm-btn-ghost sm"
                    disabled={!canUndo}
                    title={!canUndo ? 'Undo later stages first' : ''}
                    style={{ fontSize: 11, color: canUndo ? '#dc2626' : '#94a3b8', borderColor: canUndo ? '#fca5a5' : '#e2e8f0', flexShrink: 0, opacity: canUndo ? 1 : 0.5, cursor: canUndo ? 'pointer' : 'not-allowed' }}
                    onClick={() => { if (canUndo) onStageUpdate(order.id, stage, 'in_progress') }}>
                    Undo
                  </button>
                )}
              </div>

              {/* ── Tasks section — shown when this stage's toggle is ON ── */}
              {isOpen && (
                <div style={{ borderTop: `1px solid ${STATUS_BORDER[effectiveStatus]}`, padding: '10px 16px 12px', background: '#fafafa' }}>
                  {!tasksLoaded ? (
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Loading…</div>
                  ) : stageTasks.length === 0 ? (
                    <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', marginBottom: (!isLocked && stage.status !== 'done') ? 8 : 0 }}>
                      No tasks yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 8 }}>
                      {stageTasks.map(task => (
                        <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => {
                              if (isLocked || stage.status === 'done') return
                              if (!task.completed) openCompleteTask(stage, task)
                              else toggleTask(stage, task)
                            }}
                            disabled={isLocked || stage.status === 'done'}
                            style={{ width: 15, height: 15, flexShrink: 0, accentColor: '#2563eb', cursor: (isLocked || stage.status === 'done') ? 'default' : 'pointer' }}
                          />
                          <span style={{ flex: 1, fontSize: 13, color: task.completed ? '#94a3b8' : '#1e293b', textDecoration: task.completed ? 'line-through' : 'none' }}>
                            {task.label}
                          </span>
                          {!isLocked && stage.status !== 'done' && task.completed && (
                            <button onClick={() => openEditTask(stage, task)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 11, fontWeight: 600, padding: '0 4px', lineHeight: 1 }}>Edit</button>
                          )}
                          {!isLocked && stage.status !== 'done' && (
                            <button onClick={() => deleteTask(stage.id, task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', fontSize: 13, padding: 0, lineHeight: 1 }}>✕</button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}


                  {/* Inline new-task inputs */}
                  {(pendingTasks[stage.id] || []).map(({ uid, value }) => (
                    <div key={uid} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 10px', background: '#fff', border: '1px dashed #93c5fd', borderRadius: 8, marginTop: 4 }}>
                      <input type="checkbox" disabled style={{ width: 15, height: 15, flexShrink: 0, opacity: 0.3 }} />
                      <input
                        autoFocus
                        type="text"
                        placeholder="Describe the task… (Enter to save, Esc to cancel)"
                        value={value}
                        onChange={e => updatePendingTask(stage.id, uid, e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') savePendingTask(stage, uid)
                          if (e.key === 'Escape') removePendingTask(stage.id, uid)
                        }}
                        onBlur={() => savePendingTask(stage, uid)}
                        style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, background: 'transparent', color: '#1e293b' }}
                      />
                      <button onClick={() => removePendingTask(stage.id, uid)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', fontSize: 13, padding: 0, lineHeight: 1 }}>✕</button>
                    </div>
                  ))}

                  {/* Done: client note */}
                  {stage.status === 'done' && stage.notes && (
                    <div style={{ background: '#FFFDE7', border: '1px solid #FFF1AA', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#1E3070' }}>
                      <strong>Client note:</strong> {stage.notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Task Completion Modal ────────────────────────────────────────── */}
      {completingTask && (
        <div className="adm-modal-overlay" onClick={e => { if (e.target === e.currentTarget && !taskUploading) setCompletingTask(null) }}>
          <div className="adm-modal" style={{ maxWidth: 500 }}>
            <h3 style={{ marginBottom: 4 }}>{completingTask.isEdit ? '✏ Edit Task' : '✓ Mark Task Complete'}</h3>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}><strong>{completingTask.task.label}</strong></p>

            <div style={{ marginBottom: 16 }}>
              <label className="adm-label">What was done?
                <span style={{ fontWeight: 400, color: '#dc2626', textTransform: 'none', letterSpacing: 0 }}> *</span>
              </label>
              <textarea
                className="adm-input"
                autoFocus
                placeholder="Brief description of what was completed…"
                value={taskNotes}
                onChange={e => setTaskNotes(e.target.value)}
                rows={3}
                style={{ resize: 'vertical', lineHeight: 1.5, width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            {/* Existing uploaded files (edit mode) */}
            {completingTask.isEdit && taskExistingPhotos.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <label className="adm-label">Uploaded Files</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {taskExistingPhotos.map(ph => {
                    const isImg = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(ph.storage_path)
                    return (
                      <div key={ph.id} style={{ position: 'relative' }}>
                        {isImg && ph.url ? (
                          <img src={ph.url} alt={ph.fileName} style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0', display: 'block' }} />
                        ) : (
                          <div style={{ width: 70, height: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 10, color: '#64748b', textAlign: 'center', padding: 4, overflow: 'hidden' }}>
                            <div style={{ fontSize: 22 }}>📄</div>
                            <div style={{ marginTop: 2, wordBreak: 'break-all', lineHeight: 1.2 }}>{ph.fileName?.slice(0, 16)}</div>
                          </div>
                        )}
                        <button
                          onClick={() => removeExistingTaskPhoto(ph)}
                          style={{ position: 'absolute', top: -5, right: -5, width: 18, height: 18, borderRadius: '50%', background: '#dc2626', border: 'none', color: '#fff', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: 0 }}>
                          ✕
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label className="adm-label">Photos / Files
                <span style={{ fontWeight: 400, color: '#94a3b8', textTransform: 'none', letterSpacing: 0 }}> — optional</span>
              </label>
              <div
                onDragOver={e => { e.preventDefault(); setTaskDragOver(true) }}
                onDragLeave={() => setTaskDragOver(false)}
                onDrop={e => { e.preventDefault(); setTaskDragOver(false); const f = Array.from(e.dataTransfer.files || []); if (f.length) setTaskFiles(p => [...p, ...f]) }}
                style={{ border: `2px dashed ${taskDragOver ? '#2563eb' : '#cbd5e1'}`, borderRadius: 10, padding: '16px 20px', background: taskDragOver ? '#eff6ff' : '#f8fafc', textAlign: 'center', cursor: 'pointer' }}
                onClick={() => document.getElementById('task-file-input').click()}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>📎</div>
                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                  {taskDragOver ? 'Drop here' : 'Drag & drop or click to upload'}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Images, PDFs, or any file</div>
                <input id="task-file-input" type="file" multiple style={{ display: 'none' }}
                  onChange={e => setTaskFiles(p => [...p, ...Array.from(e.target.files || [])])} />
              </div>
              {taskFiles.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                  {taskFiles.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '3px 6px 3px 10px', color: '#1d4ed8' }}>
                      {f.name}
                      <button onClick={() => setTaskFiles(p => p.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#93c5fd', fontSize: 13, padding: 0, lineHeight: 1 }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="adm-modal-actions">
              <button className="adm-btn-primary" onClick={confirmCompleteTask} disabled={taskUploading || !taskNotes.trim()} style={{ background: (!taskUploading && taskNotes.trim()) ? '#EA580C' : '#94a3b8' }}>
                {taskUploading ? 'Saving…' : completingTask.isEdit ? '✏ Save Changes' : '✓ Mark Complete'}
              </button>
              <button className="adm-btn-ghost" onClick={() => setCompletingTask(null)} disabled={taskUploading}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Stage Completion Confirmation ────────────────────────────────── */}
      {completing && (
        <div className="adm-modal-overlay" onClick={e => { if (e.target === e.currentTarget && !compUploading) setCompleting(null) }}>
          <div className="adm-modal" style={{ maxWidth: 400 }}>
            <h3 style={{ marginBottom: 8 }}>✓ Mark Stage Complete</h3>
            <p style={{ fontSize: 14, color: '#1e293b', marginBottom: 6 }}>
              All tasks for <strong>{completing.label}</strong> have been completed.
            </p>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
              Are you sure you want to mark this stage as complete?
            </p>
            <div className="adm-modal-actions">
              <button
                className="adm-btn-primary"
                onClick={confirmComplete}
                disabled={compUploading}
                style={{ background: '#EA580C' }}>
                {compUploading ? 'Saving…' : 'Yes, Mark Complete'}
              </button>
              <button className="adm-btn-ghost" onClick={() => setCompleting(null)} disabled={compUploading}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Orders Tab ────────────────────────────────────────────────────────────
function OrdersTab({ orders, setOrders, workers, allStages, flash, reload }) {
  const [doConfirm, confirmModal] = useConfirm()
  const [search,         setSearch]         = useState('')
  const [openOrder,      setOpenOrder]      = useState(null)
  const [modalTab,       setModalTab]       = useState('details')
  const [extraRequests,  setExtraRequests]  = useState({})
  const [orderPayments,  setOrderPayments]  = useState({})
  const [addingPayment,  setAddingPayment]  = useState(null)   // 'invoice' | 'amendment' | 'received' | null
  const [payForm,        setPayForm]        = useState({ type: 'invoice', label: '', percentage: '', amount: '', due_date: '', reference: '', received_date: '', method: 'bank', notes: '' })
  const [editingPayment, setEditingPayment] = useState(null)
  const [editForm,       setEditForm]       = useState({})
  const [orderDocuments,  setOrderDocuments]  = useState({})
  const [varRequests,     setVarRequests]     = useState({})
  const [docUpload,       setDocUpload]       = useState({ label: '', files: [], uploading: false, doc_type: 'general' })
  const [docDragOver,    setDocDragOver]    = useState(false)
  const docFileRef = useRef(null)
  const [editingVarDoc,  setEditingVarDoc]  = useState(null)
  const [editVarLabel,   setEditVarLabel]   = useState('')
  const [editVarFile,    setEditVarFile]    = useState(null)
  const [editVarSaving,  setEditVarSaving]  = useState(false)
  const [varUploadOk,    setVarUploadOk]    = useState(false)
  const [docUploadOk,    setDocUploadOk]    = useState(false)
  const [accessPhotos,   setAccessPhotos]   = useState({}) // { [orderId]: [{path, url}] }
  const [apLightbox,     setApLightbox]     = useState(null)
  const editVarFileRef = useRef(null)
  const [varSubTab,       setVarSubTab]       = useState('requests')
  const [adminVarDesc,    setAdminVarDesc]    = useState('')
  const [adminVarSubmitting, setAdminVarSubmitting] = useState(false)
  const [savingsPlans,    setSavingsPlans]    = useState({})   // keyed by order_id
  const [savingsForm,     setSavingsForm]     = useState({ name: 'Christmas Savings Club', target_amount: '', monthly_amount: '', start_date: '', target_date: '', notes: '' })
  const [savingsPlanSaving, setSavingsPlanSaving] = useState(false)
  const [addingSavingsDep,  setAddingSavingsDep]  = useState(false)
  const [savingsDepForm,    setSavingsDepForm]    = useState({ amount: '', received_date: '', notes: '' })
  const [editingDepId,      setEditingDepId]      = useState(null)
  const [editDepForm,       setEditDepForm]       = useState({ amount: '', received_date: '', notes: '' })
  const [page,              setPage]              = useState(1)

  const [stages, setStages] = useState(() => {
    const map = {}
    for (const s of allStages) {
      if (!map[s.order_id]) map[s.order_id] = []
      map[s.order_id].push(s)
    }
    return map
  })
  const [linkResult,    setLinkResult]    = useState(null)  // { email, link }
  const [generatingLink,setGeneratingLink]= useState(false)

  function clientIdForOrder(orderId) {
    return orders.find(o => o.id === orderId)?.client_id ?? null
  }

  async function notifyClient(clientId, title, body = null) {
    if (!clientId) { console.warn('[Notify] skipped — no clientId'); return }
    const { error } = await supabase.from('client_notifications').insert({ client_id: clientId, title, body })
    if (error) console.error('[Notify] insert failed:', error.message, { clientId, title })
    else console.log('[Notify] sent:', title, '→', clientId)
  }

  async function notifyWorker(workerId, title, body = null) {
    if (!workerId) return
    const { error } = await supabase.from('worker_notifications').insert({ worker_id: workerId, title, body })
    if (error) console.error('[NotifyWorker] insert failed:', error.message)
  }

  function workerIdForOrder(orderId) {
    return orders.find(o => o.id === orderId)?.worker_id ?? null
  }

  const filtered = orders.filter(o => {
    const q = search.toLowerCase()
    return !q || o.client?.name?.toLowerCase().includes(q) || o.client?.email?.toLowerCase().includes(q) || o.order_number?.toLowerCase().includes(q)
  })
  const ORDERS_PAGE_SIZE = 10
  const totalPages = Math.max(1, Math.ceil(filtered.length / ORDERS_PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * ORDERS_PAGE_SIZE, safePage * ORDERS_PAGE_SIZE)

  async function loadAccessPhotos(orderId) {
    const { data: files } = await supabase.storage
      .from('order-photos')
      .list(`${orderId}/access`, { limit: 50 })
    if (!files?.length) { setAccessPhotos(p => ({ ...p, [orderId]: [] })); return }
    const signed = await Promise.all(
      files.map(async f => {
        const path = `${orderId}/access/${f.name}`
        const { data } = await supabase.storage.from('order-photos').createSignedUrl(path, 3600)
        return data?.signedUrl ? { path, url: data.signedUrl } : null
      })
    )
    setAccessPhotos(p => ({ ...p, [orderId]: signed.filter(Boolean) }))
  }

  async function openOrderModal(order) {
    setOpenOrder(order)
    setModalTab('details')
    setAddingPayment(null)
    setEditingPayment(null)
    loadStages(order.id)
    loadAccessPhotos(order.id)
    if (!extraRequests[order.id]) loadExtraRequests(order.id)
    if (!orderPayments[order.id]) loadPayments(order.id)
    if (!orderDocuments[order.id]) loadDocuments(order.id)
    loadSavingsPlan(order.id)
    // Refresh to pick up client-side changes (e.g. access_notes)
    const { data } = await supabase
      .from('orders')
      .select('*, client:client_profiles(name,email), worker:worker_profiles(name,avatar_url), ghl_opportunity_id')
      .eq('id', order.id)
      .single()
    if (data) {
      setOpenOrder(data)
      setOrders(prev => prev.map(o => o.id === data.id ? data : o))
    }
  }

  async function loadPayments(orderId) {
    const { data } = await supabase.from('order_payments').select('*').eq('order_id', orderId).order('due_date', { ascending: true })
    setOrderPayments(p => ({ ...p, [orderId]: data || [] }))
  }

  async function addPayment(orderId, contractTotal) {
    let amount, label

    if (payForm.type === 'invoice') {
      label = payForm.label.trim()
      if (!label) return
      const pct = parseFloat(payForm.percentage)
      if (!isNaN(pct) && pct > 0) {
        amount = Number((pct / 100 * (contractTotal || 0)).toFixed(2))
      } else {
        amount = parseFloat(payForm.amount)
        if (isNaN(amount) || amount <= 0) return
      }
    } else if (payForm.type === 'amendment') {
      amount = parseFloat(payForm.amount)
      label  = payForm.label.trim()
      if (!label || isNaN(amount)) return
    } else {
      amount = parseFloat(payForm.amount)
      label  = payForm.reference === 'other' ? payForm.label.trim() : payForm.reference
      if (!label || isNaN(amount) || amount <= 0) return
    }

    const row = {
      order_id: orderId,
      type:     payForm.type,
      label,
      amount,
      notes:    payForm.notes.trim() || null,
      status:   payForm.type === 'invoice' ? payForm.status : 'upcoming',
    }
    if (payForm.type === 'invoice' || payForm.type === 'amendment') {
      row.due_date = payForm.due_date || null
    }
    if (payForm.type === 'received') {
      row.received_date = payForm.received_date || null
      row.method        = payForm.method || null
    }

    const { data, error } = await supabase.from('order_payments').insert(row).select().single()
    if (!error && data) {
      setOrderPayments(p => ({ ...p, [orderId]: [...(p[orderId] || []), data].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) }))
      flash(payForm.type === 'invoice' ? 'Invoice added' : payForm.type === 'amendment' ? 'Amendment recorded' : 'Payment recorded')
      const typeLabel = payForm.type === 'invoice' ? 'Invoice' : payForm.type === 'received' ? 'Payment Received' : 'Payment Update'
      notifyClient(clientIdForOrder(orderId), `💰 ${typeLabel}`, `${label} — £${amount.toFixed(2)}`)
      if (payForm.type === 'amendment') syncContractToGHL(orderId)
    }
    setAddingPayment(null)
    setPayForm({ type: 'invoice', label: '', percentage: '', amount: '', due_date: '', status: 'upcoming', reference: '', received_date: '', method: 'bank', notes: '' })
  }

  async function markPaymentPaid(orderId, payment) {
    const update = { status: 'paid', paid_date: new Date().toISOString().slice(0, 10) }
    const { error } = await supabase.from('order_payments').update(update).eq('id', payment.id)
    if (!error) {
      setOrderPayments(p => ({ ...p, [orderId]: p[orderId].map(x => x.id === payment.id ? { ...x, ...update } : x) }))
      flash('Marked as paid')
      notifyClient(clientIdForOrder(orderId), '✅ Payment Confirmed', `${payment.label} has been marked as paid.`)
    }
  }

  async function deletePayment(orderId, paymentId) {
    if (!await doConfirm('Delete this payment record?')) return
    const isAmendment = orderPayments[orderId]?.find(p => p.id === paymentId)?.type === 'amendment'
    const { error } = await supabase.from('order_payments').delete().eq('id', paymentId)
    if (!error) {
      setOrderPayments(p => ({ ...p, [orderId]: p[orderId].filter(x => x.id !== paymentId) }))
      flash('Deleted')
      if (isAmendment) syncContractToGHL(orderId)
    }
  }

  async function updatePayment(orderId, paymentId) {
    const amount = parseFloat(editForm.amount)
    if (!editForm.label?.trim() || isNaN(amount)) return
    const isAmendment = orderPayments[orderId]?.find(p => p.id === paymentId)?.type === 'amendment'
    const update = {
      label:         editForm.label.trim(),
      amount,
      notes:         editForm.notes?.trim() || null,
      due_date:      editForm.due_date      || null,
      received_date: editForm.received_date || null,
      method:        editForm.method        || null,
    }
    const { error } = await supabase.from('order_payments').update(update).eq('id', paymentId)
    if (!error) {
      setOrderPayments(p => ({ ...p, [orderId]: p[orderId].map(x => x.id === paymentId ? { ...x, ...update } : x) }))
      flash('Updated')
      if (isAmendment) syncContractToGHL(orderId)
    }
    setEditingPayment(null)
    setEditForm({})
  }

  async function loadStages(orderId) {
    const { data } = await supabase.from('build_stages').select('*').eq('order_id', orderId).order('stage_number')
    setStages(p => ({ ...p, [orderId]: data || [] }))
  }

  async function loadExtraRequests(orderId) {
    const { data } = await supabase
      .from('order_extra_requests')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
    setExtraRequests(p => ({ ...p, [orderId]: data || [] }))
  }

  async function updateRequestStatus(orderId, requestId, status) {
    const { error } = await supabase.from('order_extra_requests').update({ status }).eq('id', requestId)
    if (!error) {
      setExtraRequests(p => ({
        ...p,
        [orderId]: p[orderId].map(r => r.id === requestId ? { ...r, status } : r),
      }))
      flash(status === 'confirmed' ? 'Request confirmed' : 'Request declined')
      if (status === 'confirmed') {
        notifyClient(clientIdForOrder(orderId), '⭐ Extra Request Confirmed', 'Your add-on extra request has been confirmed!')
      } else if (status === 'declined') {
        notifyClient(clientIdForOrder(orderId), '❌ Extra Request Declined', 'Unfortunately your add-on extra request has been declined.')
      }
    }
  }

  function syncContractToGHL(orderId) {
    supabase.functions.invoke('update-ghl-value', { body: { order_id: orderId } })
      .catch(err => console.warn('GHL contract sync skipped:', err))
  }

  async function updateOrderField(orderId, field, value) {
    const { error } = await supabase.from('orders').update({ [field]: value }).eq('id', orderId)
    if (!error) {
      setOrders(p => p.map(o => o.id === orderId ? { ...o, [field]: value } : o))
      setOpenOrder(o => o ? { ...o, [field]: value } : o)
      flash('Saved')
      const cid = clientIdForOrder(orderId)
      const wid = workerIdForOrder(orderId)
      if (field === 'installation_date' && value) {
        const fmt = new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        notifyClient(cid, '📅 Installation Date Set', `Your installation is scheduled for ${fmt}.`)
        notifyWorker(wid, '📅 Installation Date Set', `Job scheduled for ${fmt}.`)
      } else if (field === 'build_date' && value) {
        const fmt = new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        notifyWorker(wid, '🏗️ Build Date Set', `Build date for this job: ${fmt}.`)
      } else if (field === 'installation_window' && value) {
        notifyClient(cid, '🕐 Installation Time Updated', `Your installation window has been updated to: ${value}`)
        notifyWorker(wid, '🕐 Time Window Updated', `Installation window: ${value}`)
      } else if (field === 'is_birthday_booking' && value === true) {
        notifyClient(cid, '🎂 Birthday Booking Confirmed!', `We've noted this is a birthday booking — we'll make your installation day extra special! 🎉`)
        notifyWorker(wid, '🎂 Birthday Booking!', 'This job is a birthday booking — remember to bring freebies for the installation!')
      } else if (field === 'product_order' && value) {
        notifyWorker(wid, '📦 Product Order Updated', `Product: ${value}`)
      } else if (field === 'notes' && value) {
        notifyWorker(wid, '📝 Job Notes Updated', value)
      } else if (field === 'contract_amount') {
        syncContractToGHL(orderId)
      }
    }
  }

  async function assignWorker(orderId, workerId) {
    const { error } = await supabase.from('orders').update({ worker_id: workerId || null }).eq('id', orderId)
    if (!error) {
      const worker = workers.find(w => w.id === workerId)
      const order  = orders.find(o => o.id === orderId)
      setOrders(p => p.map(o => o.id === orderId ? { ...o, worker_id: workerId, worker: worker || null } : o))
      setOpenOrder(o => o ? { ...o, worker_id: workerId, worker: worker || null } : o)
      flash('Worker assigned')
      if (workerId) {
        notifyWorker(workerId, '🔨 New Job Assigned', `You have been assigned to: ${order?.client?.name || 'a new order'} (${order?.order_number || ''})`)
      }
    }
  }

  async function updateStage(orderId, stage, newStatus) {
    const update = { status: newStatus, completed_at: newStatus === 'done' ? new Date().toISOString() : null }
    const { error } = await supabase.from('build_stages').update(update).eq('id', stage.id)
    if (!error) {
      setStages(p => ({ ...p, [orderId]: p[orderId].map(s => s.id === stage.id ? { ...s, ...update } : s) }))
      flash('Stage updated')
      const cid = clientIdForOrder(orderId)
      if (newStatus === 'in_progress') {
        notifyClient(cid, `🔨 Build Update: ${stage.label}`, `Stage ${stage.stage_number} — ${stage.label} is now in progress.`)
      } else if (newStatus === 'done') {
        notifyClient(cid, `✅ Stage Complete: ${stage.label}`, `Stage ${stage.stage_number} — ${stage.label} has been completed!`)
        const order = orders.find(o => o.id === orderId)
        supabase.functions.invoke('advance-ghl-stage', {
          body: { order_id: orderId, opportunity_id: order?.ghl_opportunity_id ?? null, stage_number: stage.stage_number },
        }).catch(err => console.warn('GHL advance skipped:', err))
      }
    }
  }

  async function generateClientLink(email) {
    setGeneratingLink(true)
    const { data, error } = await supabase.functions.invoke('get-magic-link', {
      body: { email, redirect_to: `${window.location.origin}/portal` },
    })
    setGeneratingLink(false)
    if (error || !data?.magicLink) { flash('Failed to generate link'); return }
    setLinkResult({ email, link: data.magicLink })
  }

  // ── savings club helpers ──────────────────────────────────────────────────
  async function loadSavingsPlan(orderId) {
    const { data } = await supabase.from('savings_plans').select('*').eq('order_id', orderId).maybeSingle()
    setSavingsPlans(p => ({ ...p, [orderId]: data || null }))
    if (data) setSavingsForm({ name: data.name, target_amount: data.target_amount || '', monthly_amount: data.monthly_amount || '', start_date: data.start_date || '', target_date: data.target_date || '', notes: data.notes || '' })
  }

  async function saveSavingsPlan(orderId, clientId) {
    const plan = savingsPlans[orderId]
    setSavingsPlanSaving(true)
    const payload = {
      order_id:       orderId,
      client_id:      clientId,
      name:           savingsForm.name.trim() || 'Christmas Savings Club',
      target_amount:  parseFloat(savingsForm.target_amount) || 0,
      monthly_amount: savingsForm.monthly_amount ? parseFloat(savingsForm.monthly_amount) : null,
      start_date:     savingsForm.start_date || null,
      target_date:    savingsForm.target_date || null,
      notes:          savingsForm.notes.trim() || null,
      updated_at:     new Date().toISOString(),
    }
    let result
    if (plan?.id) {
      result = await supabase.from('savings_plans').update(payload).eq('id', plan.id).select().single()
    } else {
      result = await supabase.from('savings_plans').insert({ ...payload, is_active: true }).select().single()
    }
    setSavingsPlanSaving(false)
    if (!result.error) {
      setSavingsPlans(p => ({ ...p, [orderId]: result.data }))
      flash('Savings plan saved')
    }
  }

  async function addSavingsDeposit(orderId) {
    const amount = parseFloat(savingsDepForm.amount)
    if (!amount || amount <= 0) return
    const { data, error } = await supabase.from('order_payments').insert({
      order_id:      orderId,
      type:          'savings',
      label:         savingsDepForm.notes?.trim() || 'Savings deposit',
      amount,
      received_date: savingsDepForm.received_date || new Date().toISOString().slice(0, 10),
      status:        'paid',
    }).select().single()
    if (!error && data) {
      setOrderPayments(p => ({ ...p, [orderId]: [...(p[orderId] || []), data] }))
      setSavingsDepForm({ amount: '', received_date: '', notes: '' })
      setAddingSavingsDep(false)
      flash('Deposit recorded')
    }
  }

  async function updateSavingsDeposit(orderId) {
    const amount = parseFloat(editDepForm.amount)
    if (!amount || amount <= 0) return
    const { data, error } = await supabase.from('order_payments').update({
      amount,
      label:         editDepForm.notes?.trim() || 'Savings deposit',
      received_date: editDepForm.received_date || new Date().toISOString().slice(0, 10),
    }).eq('id', editingDepId).select().single()
    if (!error && data) {
      setOrderPayments(p => ({ ...p, [orderId]: (p[orderId] || []).map(x => x.id === data.id ? data : x) }))
      setEditingDepId(null)
      flash('Deposit updated')
    }
  }

  async function deleteSavingsDeposit(orderId, depId) {
    if (!await doConfirm('Delete this deposit?')) return
    const { error } = await supabase.from('order_payments').delete().eq('id', depId)
    if (!error) {
      setOrderPayments(p => ({ ...p, [orderId]: (p[orderId] || []).filter(x => x.id !== depId) }))
      flash('Deposit deleted')
    }
  }

  // ── document helpers ──────────────────────────────────────────────────────
  async function loadDocuments(orderId) {
    const { data } = await supabase.from('order_documents').select('*').eq('order_id', orderId).order('uploaded_at', { ascending: false })
    setOrderDocuments(p => ({ ...p, [orderId]: data || [] }))
  }

  async function loadVarRequests(orderId) {
    const { data } = await supabase.from('variation_requests').select('*').eq('order_id', orderId).order('created_at', { ascending: false })
    setVarRequests(p => ({ ...p, [orderId]: data || [] }))
  }

  async function updateVarRequest(orderId, reqId, status, admin_notes) {
    const { error } = await supabase.from('variation_requests').update({ status, admin_notes, updated_at: new Date().toISOString() }).eq('id', reqId)
    if (!error) {
      setVarRequests(p => ({ ...p, [orderId]: (p[orderId] || []).map(r => r.id === reqId ? { ...r, status, admin_notes } : r) }))
      flash('Variation request updated')
      const statusLabel = { pending: 'Received', reviewing: 'Under Review', approved: 'Approved', rejected: 'Declined' }[status] || status
      const body = admin_notes ? `Response: ${admin_notes}` : `Your variation request is now: ${statusLabel}`
      notifyClient(clientIdForOrder(orderId), `📝 Variation Request ${statusLabel}`, body)
    }
  }

  async function raiseAdminVariation(orderId, clientId) {
    const desc = adminVarDesc.trim()
    if (!desc) return
    setAdminVarSubmitting(true)
    const { data, error } = await supabase.from('variation_requests')
      .insert({ order_id: orderId, client_id: clientId, description: `[Admin] ${desc}`, status: 'reviewing' })
      .select().single()
    if (!error && data) {
      setVarRequests(p => ({ ...p, [orderId]: [data, ...(p[orderId] || [])] }))
      setAdminVarDesc('')
      flash('Variation request raised on client\'s behalf')
      notifyClient(clientId, '📝 New Variation Request', `A variation request has been raised on your behalf: ${desc}`)
    } else {
      flash(error?.message || 'Failed to raise variation request')
    }
    setAdminVarSubmitting(false)
  }

  async function uploadDocument(orderId, forceDocType = null) {
    const { label, files, doc_type } = docUpload
    if (!files.length) return
    setDocUpload(d => ({ ...d, uploading: true }))
    const resolvedDocType = forceDocType ?? doc_type ?? 'general'
    const uploaded = []
    try {
      for (const file of files) {
        const fileLabel = label.trim() || file.name.replace(/\.[^.]+$/, '')
        const path = `${orderId}/${Date.now()}_${file.name}`
        const { error: upErr } = await supabase.storage.from('order-documents').upload(path, file)
        if (upErr) { flash(`Failed: ${file.name}`); continue }
        const { data, error } = await supabase.from('order_documents')
          .insert({ order_id: orderId, label: fileLabel, file_name: file.name, file_path: path, doc_type: resolvedDocType })
          .select().single()
        if (!error && data) uploaded.push(data)
      }
      if (uploaded.length) {
        setOrderDocuments(p => ({ ...p, [orderId]: [...uploaded, ...(p[orderId] || [])] }))
        const cid = clientIdForOrder(orderId)
        if (resolvedDocType === 'variation') {
          setVarUploadOk(true)
          setTimeout(() => setVarUploadOk(false), 3500)
        } else {
          setDocUploadOk(true)
          setTimeout(() => setDocUploadOk(false), 3500)
        }
        notifyClient(cid,
          resolvedDocType === 'variation' ? '📋 Variation Agreement Ready' : '📄 New Document Available',
          resolvedDocType === 'variation'
            ? `A variation agreement has been uploaded for your review: ${uploaded[0].label}`
            : `A new document has been added to your order: ${uploaded[0].label}`
        )
      }
    } finally {
      setDocUpload({ label: '', files: [], uploading: false, doc_type: 'general' })
      setDocDragOver(false)
      if (docFileRef.current) docFileRef.current.value = ''
    }
  }

  async function deleteDocument(orderId, docId, filePath) {
    if (!await doConfirm('Delete this document?')) return
    await supabase.storage.from('order-documents').remove([filePath])
    const { error } = await supabase.from('order_documents').delete().eq('id', docId)
    if (!error) {
      setOrderDocuments(p => ({ ...p, [orderId]: p[orderId].filter(d => d.id !== docId) }))
      flash('Deleted')
    }
  }

  async function updateVarDoc(orderId, doc) {
    setEditVarSaving(true)
    const updates = {}
    const newLabel = editVarLabel.trim()
    if (newLabel && newLabel !== doc.label) updates.label = newLabel
    if (editVarFile) {
      const newPath = `${orderId}/${Date.now()}_${editVarFile.name}`
      const { error: upErr } = await supabase.storage.from('order-documents').upload(newPath, editVarFile)
      if (!upErr) {
        await supabase.storage.from('order-documents').remove([doc.file_path])
        updates.file_path = newPath
        updates.file_name = editVarFile.name
      } else {
        flash('File upload failed')
      }
    }
    if (Object.keys(updates).length > 0) {
      const { data: updated, error } = await supabase
        .from('order_documents').update(updates).eq('id', doc.id).select().single()
      if (!error && updated) {
        setOrderDocuments(p => ({
          ...p,
          [orderId]: p[orderId].map(d => d.id === doc.id ? updated : d),
        }))
        flash('Variation agreement updated')
      }
    }
    setEditVarSaving(false)
    setEditingVarDoc(null)
    setEditVarLabel('')
    setEditVarFile(null)
    if (editVarFileRef.current) editVarFileRef.current.value = ''
  }

  async function downloadDocument(filePath, fileName) {
    const { data } = await supabase.storage.from('order-documents').createSignedUrl(filePath, 3600)
    if (data?.signedUrl) {
      const a = document.createElement('a')
      a.href = data.signedUrl
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  // ── payment helpers ────────────────────────────────────────────────────────
  function openAdd(type) {
    setAddingPayment(type)
    setEditingPayment(null)
    setPayForm({ type, label: '', percentage: '', amount: '', due_date: '', reference: '', received_date: '', method: 'bank', notes: '' })
  }

  // PayRow removed — payment rows inlined in modal

  function _PayRow_placeholder({ pmt, orderId, bg, border, icon, labelColor, amountDisplay, extra }) {
    if (editingPayment === pmt.id) {
      return (
        <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: '10px 12px', marginBottom: 6 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
            <input className="adm-input" placeholder="Label" value={editForm.label || ''} onChange={e => setEditForm(p => ({ ...p, label: e.target.value }))} autoFocus />
            <input className="adm-input" type="number" step="0.01" placeholder="Amount £" value={editForm.amount || ''} onChange={e => setEditForm(p => ({ ...p, amount: e.target.value }))} />
            {pmt.type === 'received'
              ? <input className="adm-input" type="date" value={editForm.received_date || ''} onChange={e => setEditForm(p => ({ ...p, received_date: e.target.value }))} />
              : <input className="adm-input" type="date" value={editForm.due_date || ''} onChange={e => setEditForm(p => ({ ...p, due_date: e.target.value }))} />
            }
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: pmt.type === 'received' ? '1fr 1fr' : '1fr', gap: 8, marginBottom: 8 }}>
            {pmt.type === 'received' && (
              <select className="adm-input" value={editForm.method || 'bank'} onChange={e => setEditForm(p => ({ ...p, method: e.target.value }))}>
                <option value="bank">Bank Transfer</option><option value="paypal">PayPal</option><option value="cash">Cash</option><option value="other">Other</option>
              </select>
            )}
            <input className="adm-input" placeholder="Notes (optional)" value={editForm.notes || ''} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="adm-btn-primary sm" onClick={() => updatePayment(orderId, pmt.id)}>Save</button>
            <button className="adm-btn-ghost sm" onClick={() => { setEditingPayment(null); setEditForm({}) }}>Cancel</button>
          </div>
        </div>
      )
    }
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: bg, borderRadius: 8, padding: '9px 12px', border: `1px solid ${border}`, marginBottom: 6 }}>
        <span style={{ fontSize: 15 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: labelColor }}>{pmt.label}</span>
          {pmt.notes && <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>· {pmt.notes}</span>}
          {extra}
        </div>
        <span style={{ fontWeight: 800, fontSize: 14, color: labelColor }}>{amountDisplay}</span>
        <button className="adm-btn-ghost sm" style={{ fontSize: 12, padding: '3px 7px' }} title="Edit" onClick={() => {
          setEditingPayment(pmt.id)
          setAddingPayment(null)
          setEditForm({ label: pmt.label, amount: String(pmt.amount), due_date: pmt.due_date || '', received_date: pmt.received_date || '', method: pmt.method || 'bank', notes: pmt.notes || '' })
        }}>✏️</button>
        <button className="adm-btn-ghost sm" style={{ fontSize: 12, padding: '3px 7px', color: '#dc2626' }} onClick={() => deletePayment(orderId, pmt.id)}>✕</button>
      </div>
    )
  }
  return (
    <div className="adm-section" style={{ padding: 0 }}>
      {confirmModal}
      {/* Magic link result modal */}
      {linkResult && (
        <div className="adm-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setLinkResult(null) }}>
          <div className="adm-modal" style={{ maxWidth: 520 }}>
            <h3>🔗 Client Login Link</h3>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>
              Share this link with <strong>{linkResult.email}</strong> — it logs them straight into the portal. Valid for 24 hours.
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#f1f5f9', borderRadius: 8, padding: '10px 12px', marginBottom: 16 }}>
              <input readOnly value={linkResult.link} style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 12, color: '#334155', outline: 'none' }} />
              <button className="adm-btn-primary" style={{ fontSize: 12, padding: '6px 14px', flexShrink: 0 }}
                onClick={() => { navigator.clipboard.writeText(linkResult.link); flash('Copied!') }}>
                Copy
              </button>
            </div>
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>After 24 hours, generate a new link from this screen.</p>
            <div className="adm-modal-actions">
              <button className="adm-btn-ghost" onClick={() => setLinkResult(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
      {!openOrder ? (
        /* ─── ORDER LIST ───────────────────────────────────────────── */
        <div style={{ padding: '0 0 24px' }}>
          <div className="adm-section-header" style={{ padding: '0 0 16px' }}>
            <h2>Orders ({orders.length})</h2>
            <input className="adm-search" placeholder="Search by name, email or order #…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          {filtered.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: 13 }}>{orders.length === 0 ? 'No orders yet.' : 'No orders match your search.'}</p>
          ) : (<>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {paginated.map(order => {
                const orderStages   = stages[order.id]        || []
                const orderRequests = extraRequests[order.id] || []
                const pendingCount  = orderRequests.filter(r => r.status === 'pending').length
                const doneCount     = orderStages.filter(s => s.status === 'done').length
                const pct           = orderStages.length > 0 ? Math.round((doneCount / orderStages.length) * 100) : 0
                return (
                  <div key={order.id} className="ord-list-row" onClick={() => openOrderModal(order)}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>{order.client?.name || '—'}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>#{order.order_number} · {order.client?.email}</div>
                    </div>
                    <div className="ord-list-meta">
                      <span className="ord-worker-badge">
                        {order.worker?.avatar_url
                          ? <img src={order.worker.avatar_url} style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" />
                          : <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#1e40af', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, flexShrink: 0 }}>
                              {(order.worker?.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                            </span>}
                        {order.worker?.name || 'Unassigned'}
                      </span>
                      <div className="ord-mini-progress">
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 3 }}>
                          <span>Build</span>
                          <span style={{ fontWeight: 700, color: pct === 100 ? '#EA580C' : '#2563eb' }}>{pct}%</span>
                        </div>
                        <div style={{ height: 4, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden', width: 80 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#EA580C' : '#2563eb', borderRadius: 99 }} />
                        </div>
                      </div>
                      {pendingCount > 0 && (
                        <span className="ord-extras-badge">{pendingCount} extra{pendingCount > 1 ? 's' : ''}</span>
                      )}
                    </div>
                    <span style={{ fontSize: 18, color: '#cbd5e1', marginLeft: 4 }}>›</span>
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, padding: '14px 0 2px', borderTop: '1px solid #f1f5f9', marginTop: 8 }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                Showing {(safePage - 1) * ORDERS_PAGE_SIZE + 1}–{Math.min(safePage * ORDERS_PAGE_SIZE, filtered.length)} of {filtered.length} order{filtered.length !== 1 ? 's' : ''}
              </span>
              {totalPages > 1 && (
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button className="adm-btn-ghost sm" disabled={safePage === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '5px 12px' }}>← Prev</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => {
                    if (totalPages > 7) {
                      if (n !== 1 && n !== totalPages && Math.abs(n - safePage) > 2) {
                        if (n === safePage - 3 || n === safePage + 3) return <span key={n} style={{ color: '#94a3b8', padding: '0 4px', fontSize: 13 }}>…</span>
                        return null
                      }
                    }
                    return (
                      <button key={n} onClick={() => setPage(n)}
                        className={n === safePage ? 'adm-btn-primary sm' : 'adm-btn-ghost sm'}
                        style={{ padding: '5px 10px', minWidth: 34, fontWeight: n === safePage ? 800 : 600 }}>
                        {n}
                      </button>
                    )
                  })}
                  <button className="adm-btn-ghost sm" disabled={safePage === totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '5px 12px' }}>Next →</button>
                </div>
              )}
            </div>
          </>)}
        </div>
      ) : (
        /* ─── ORDER DETAIL ─────────────────────────────────────────── */
        (() => {
          const order         = openOrder
          const orderStages   = stages[order.id]        || []
          const orderRequests = extraRequests[order.id] || []
          const pmts          = orderPayments[order.id]  || []
          const invoices      = pmts.filter(p => p.type === 'invoice' || !p.type)
          const amendments    = pmts.filter(p => p.type === 'amendment')
          const received      = pmts.filter(p => p.type === 'received')
          const base          = Number(order.contract_amount || 0)
          const amendTotal    = amendments.reduce((s, a) => s + Number(a.amount), 0)
          const contractTotal = base + amendTotal
          const totalReceived = received.reduce((s, r) => s + Number(r.amount), 0)
          const balance       = contractTotal - totalReceived
          const payPct        = contractTotal > 0 ? Math.min(100, Math.round((totalReceived / contractTotal) * 100)) : 0
          const pendingCount  = orderRequests.filter(r => r.status === 'pending').length
          const doneCount     = orderStages.filter(s => s.status === 'done').length
          const buildPct      = orderStages.length > 0 ? Math.round((doneCount / orderStages.length) * 100) : 0

          return (
            <>
              {/* Back button */}
              <button className="ord-back-btn" onClick={() => { setOpenOrder(null); setAddingPayment(null); setEditingPayment(null) }}>
                ← Back to Orders
              </button>

              {/* Header card */}
              <div className="ord-header-card">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ord-header-name">{order.client?.name}</div>
                  <div className="ord-header-meta">#{order.order_number} · {order.client?.email}</div>
                </div>
                <div className="ord-header-right">
                  <span className="ord-worker-badge" style={{ fontSize: 13, padding: '5px 12px 5px 5px' }}>
                    {order.worker?.avatar_url
                      ? <img src={order.worker.avatar_url} style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" />
                      : <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#1e40af', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>
                          {(order.worker?.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </span>}
                    {order.worker?.name || 'Unassigned'}
                  </span>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, textAlign: 'right' }}>
                      Build progress <strong style={{ color: buildPct === 100 ? '#EA580C' : '#2563eb' }}>{buildPct}%</strong>
                    </div>
                    <div style={{ height: 5, width: 110, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${buildPct}%`, background: buildPct === 100 ? '#EA580C' : '#2563eb', borderRadius: 99 }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-tabs */}
              <div className="ord-tabs">
                {[
                  { id: 'details',   label: 'Order Details' },
                  { id: 'progress',  label: 'Build Progress' },
                  { id: 'payments',  label: 'Payments' },
                  { id: 'extras',    label: pendingCount > 0 ? `Extras (${pendingCount})` : 'Extras' },
                  { id: 'documents',  label: `Documents${(orderDocuments[order.id] || []).length > 0 ? ` (${(orderDocuments[order.id] || []).length})` : ''}` },
                  { id: 'variations', label: `Variations${(varRequests[order.id] || []).length > 0 ? ` (${(varRequests[order.id] || []).length})` : ''}` },
                  { id: 'savings',    label: `🎄 Savings Club${savingsPlans[order.id] ? ' ' : ''}` },
                ].map(t => (
                  <button key={t.id} onClick={() => { setModalTab(t.id); setAddingPayment(null); setEditingPayment(null); setDocUpload({ label: '', files: [], uploading: false, doc_type: 'general' }); setDocDragOver(false); setDocUploadOk(false); setVarUploadOk(false); setVarSubTab('requests'); setAdminVarDesc(''); if (t.id === 'variations') { if (!varRequests[order.id]) loadVarRequests(order.id); if (!orderDocuments[order.id]) loadDocuments(order.id) } }}
                    className={`ord-tab${modalTab === t.id ? ' active' : ''}`}>
                    {t.label}
                  </button>

                ))}
              </div>

              {/* ── DETAILS TAB ──────────────────────────────────────── */}
              {modalTab === 'details' && (
                <div className="ord-section">
                  {/* Client login link */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, padding: '12px 16px', background: '#FFFDE7', border: '1.5px solid #FFF1AA', borderRadius: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#1E3070' }}>Client Portal Access</div>
                      <div style={{ fontSize: 12, color: '#4ade80', marginTop: 2 }}>{order.client?.email}</div>
                    </div>
                    <button className="adm-btn-primary" style={{ fontSize: 12, padding: '7px 14px' }}
                      disabled={generatingLink}
                      onClick={() => generateClientLink(order.client?.email)}>
                      {generatingLink ? 'Generating…' : '🔗 Get Login Link'}
                    </button>
                  </div>
                  <div className="ord-section-title">Installation Details</div>
                  <div className="ord-field-grid">
                    <div>
                      <label className="adm-label">Address</label>
                      <InlineEdit value={order.address || ''} placeholder="Enter address" onSave={v => updateOrderField(order.id, 'address', v)} />
                    </div>
                    <div>
                      <label className="adm-label">Assign Worker</label>
                      <select className="adm-input" value={order.worker_id || ''} onChange={e => assignWorker(order.id, e.target.value)}>
                        <option value="">— Unassigned —</option>
                        {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <label className="adm-label">Installation Date</label>
                          <input type="date" className="adm-input" defaultValue={order.installation_date || ''} onBlur={e => updateOrderField(order.id, 'installation_date', e.target.value)} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label className="adm-label">Build Date</label>
                          <input type="date" className="adm-input" defaultValue={order.build_date || ''} onBlur={e => updateOrderField(order.id, 'build_date', e.target.value)} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="adm-label">Time Window</label>
                      <TimeRangePicker value={order.installation_window || ''} onSave={v => updateOrderField(order.id, 'installation_window', v)} />
                    </div>
                  </div>
                  {/* Product / Notes / Birthday */}
                  <div style={{ marginTop: 24, borderTop: '1px solid #f1f5f9', paddingTop: 20 }}>
                    <div className="ord-section-title" style={{ marginBottom: 16 }}>Order Info</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {/* Product Order */}
                      <div>
                        <label className="adm-label">Product Order</label>
                        <input
                          className="adm-input"
                          type="text"
                          defaultValue={order.product_order || ''}
                          placeholder="e.g. Rathlin Climbing Frame"
                          onBlur={e => { if (e.target.value !== (order.product_order || '')) updateOrderField(order.id, 'product_order', e.target.value) }}
                          style={{ fontSize: 14 }}
                        />
                      </div>
                      {/* Notes */}
                      <div>
                        <label className="adm-label">Notes</label>
                        <textarea
                          className="adm-input"
                          rows={3}
                          defaultValue={order.notes || ''}
                          placeholder="Internal notes about this order…"
                          onBlur={e => { if (e.target.value !== (order.notes || '')) updateOrderField(order.id, 'notes', e.target.value) }}
                          style={{ resize: 'vertical', minHeight: 76, lineHeight: 1.5 }}
                        />
                      </div>
                      {/* Birthday Booking toggle card */}
                      <div
                        onClick={() => updateOrderField(order.id, 'is_birthday_booking', !order.is_birthday_booking)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '14px 16px',
                          background: order.is_birthday_booking ? '#FFFDE7' : '#f8fafc',
                          border: `2px solid ${order.is_birthday_booking ? '#F9C800' : '#e2e8f0'}`,
                          borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                          userSelect: 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 0', minWidth: 0 }}>
                          <span style={{ fontSize: 22, flexShrink: 0 }}>🎂</span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: order.is_birthday_booking ? '#7a5800' : '#1e293b' }}>Birthday Booking</div>
                            <div style={{ fontSize: 12, color: order.is_birthday_booking ? '#a16207' : '#94a3b8', marginTop: 2 }}>
                              {order.is_birthday_booking ? 'Remember to prepare freebies for this installation!' : 'Toggle on if this is a birthday booking'}
                            </div>
                          </div>
                        </div>
                        {/* Toggle pill */}
                        <div style={{
                          width: 42, height: 24, borderRadius: 12, flexShrink: 0, marginLeft: 8,
                          background: order.is_birthday_booking ? '#F9C800' : '#cbd5e1',
                          position: 'relative', transition: 'background 0.2s',
                        }}>
                          <div style={{
                            position: 'absolute', top: 3, left: order.is_birthday_booking ? 21 : 3,
                            width: 18, height: 18, borderRadius: '50%', background: '#fff',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s',
                          }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {(order.access_notes || accessPhotos[order.id]?.length > 0) && (
                    <div style={{ marginTop: 16, background: '#FFFBE6', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 14px' }}>
                      {order.access_notes && (
                        <div style={{ fontSize: 13, color: '#78350f', marginBottom: accessPhotos[order.id]?.length ? 10 : 0 }}>
                          <strong>Access Notes:</strong> {order.access_notes}
                        </div>
                      )}
                      {accessPhotos[order.id]?.length > 0 && (
                        <>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                            📸 Garden & Access Photos ({accessPhotos[order.id].length})
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
                            {accessPhotos[order.id].map(p => (
                              <img
                                key={p.path}
                                src={p.url}
                                alt="Access"
                                onClick={() => setApLightbox(p.url)}
                                style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8, cursor: 'zoom-in', display: 'block', border: '1px solid #fde68a' }}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  {/* Access photo lightbox */}
                  {apLightbox && (
                    <div onClick={() => setApLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
                      <img src={apLightbox} alt="Access" style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: 12, objectFit: 'contain' }} />
                    </div>
                  )}
                </div>
              )}

              {/* ── BUILD PROGRESS TAB ───────────────────────────────── */}
              {modalTab === 'progress' && (
                <BuildStagesPanel order={order} orderStages={orderStages} onStageUpdate={updateStage} flash={flash} />
              )}

              {/* ── PAYMENTS TAB ─────────────────────────────────────── */}
              {modalTab === 'payments' && (
                <>
                  {/* Contract summary */}
                  <div className="ord-section">
                    <div className="ord-section-title">Contract Summary</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
                      <label className="adm-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Base Contract:</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: 14 }}>£</span>
                        <input className="adm-input" type="number" step="0.01" min="0" placeholder="0.00"
                          defaultValue={order.contract_amount || ''}
                          onBlur={e => { const val = parseFloat(e.target.value); updateOrderField(order.id, 'contract_amount', isNaN(val) ? null : val) }}
                          style={{ width: 130, marginBottom: 0 }} />
                      </div>
                      {amendTotal !== 0 && (
                        <span style={{ fontSize: 13, color: '#64748b' }}>
                          + £{Math.abs(amendTotal).toLocaleString()} amendments = <strong>£{contractTotal.toLocaleString()}</strong>
                        </span>
                      )}
                    </div>
                    <div className="ord-summary-grid">
                      <div className="ord-stat">
                        <div className="ord-stat-label">Contract Total</div>
                        <div className="ord-stat-value">{contractTotal > 0 ? `£${contractTotal.toLocaleString()}` : '—'}</div>
                      </div>
                      <div className="ord-stat" style={{ borderColor: '#FFF1AA', background: '#FFFDE7' }}>
                        <div className="ord-stat-label" style={{ color: '#1E3070' }}>Total Received</div>
                        <div className="ord-stat-value" style={{ color: '#1E3070' }}>£{totalReceived.toLocaleString()}</div>
                      </div>
                      <div className="ord-stat" style={{ borderColor: balance > 0 ? '#fca5a5' : '#FFF1AA', background: balance > 0 ? '#fef2f2' : '#FFFDE7' }}>
                        <div className="ord-stat-label" style={{ color: balance > 0 ? '#991b1b' : '#1E3070' }}>Balance Due</div>
                        <div className="ord-stat-value" style={{ color: balance > 0 ? '#dc2626' : '#EA580C' }}>£{balance.toLocaleString()}</div>
                      </div>
                    </div>
                    {contractTotal > 0 && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 6 }}>
                          <span>Payment progress</span>
                          <span style={{ fontWeight: 700, color: payPct === 100 ? '#EA580C' : '#2563eb' }}>{payPct}%</span>
                        </div>
                        <div style={{ height: 8, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${payPct}%`, background: payPct === 100 ? '#EA580C' : '#2563eb', borderRadius: 99, transition: 'width 0.3s' }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payment Schedule (invoices) */}
                  <div className="ord-section">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: addingPayment === 'invoice' ? 14 : (invoices.length > 0 ? 4 : 14) }}>
                      <span className="ord-section-title" style={{ margin: 0 }}>Payment Schedule</span>
                      {addingPayment !== 'invoice' && (
                        <button className="adm-btn-ghost sm" style={{ fontSize: 12 }} onClick={() => openAdd('invoice')}>+ Add Milestone</button>
                      )}
                    </div>
                    {addingPayment === 'invoice' && (
                      <div className="ord-add-form">
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                          <input className="adm-input" autoFocus placeholder="Label — e.g. 50% Deposit" value={payForm.label} onChange={e => setPayForm(p => ({ ...p, label: e.target.value }))} />
                          <input className="adm-input" type="number" min="0" max="100" step="0.5" placeholder="% of contract (optional)"
                            value={payForm.percentage} onChange={e => setPayForm(p => ({ ...p, percentage: e.target.value, amount: '' }))} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: 14, flexShrink: 0 }}>£</span>
                            {payForm.percentage && contractTotal > 0 ? (
                              <input className="adm-input" type="number" readOnly
                                value={Number((parseFloat(payForm.percentage) / 100 * contractTotal).toFixed(2))}
                                style={{ width: '100%', background: '#f1f5f9', color: '#1e293b', fontWeight: 700 }} />
                            ) : (
                              <input className="adm-input" type="number" min="0" step="0.01" placeholder="Amount"
                                value={payForm.amount} onChange={e => setPayForm(p => ({ ...p, amount: e.target.value, percentage: '' }))}
                                style={{ width: '100%' }} />
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                          <input className="adm-input" type="date" title="Due date (optional)" value={payForm.due_date} onChange={e => setPayForm(p => ({ ...p, due_date: e.target.value }))} />
                          <input className="adm-input" placeholder="Note (optional)" value={payForm.notes} onChange={e => setPayForm(p => ({ ...p, notes: e.target.value }))} />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="adm-btn-primary sm" onClick={() => addPayment(order.id, contractTotal)}>Save</button>
                          <button className="adm-btn-ghost sm" onClick={() => setAddingPayment(null)}>Cancel</button>
                        </div>
                      </div>
                    )}
                    {invoices.length === 0 && addingPayment !== 'invoice' ? (
                      <p style={{ fontSize: 13, color: '#94a3b8', paddingTop: 4 }}>No invoices yet. Add payment milestones to track what the client owes.</p>
                    ) : (
                      <div>
                        {invoices.map(pmt => editingPayment === pmt.id ? (
                          <div key={pmt.id} className="ord-edit-form">
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                              <input className="adm-input" autoFocus placeholder="Label" value={editForm.label || ''} onChange={e => setEditForm(p => ({ ...p, label: e.target.value }))} />
                              <input className="adm-input" type="number" step="0.01" placeholder="Amount £" value={editForm.amount || ''} onChange={e => setEditForm(p => ({ ...p, amount: e.target.value }))} />
                              <input className="adm-input" type="date" value={editForm.due_date || ''} onChange={e => setEditForm(p => ({ ...p, due_date: e.target.value }))} />
                            </div>
                            <input className="adm-input" style={{ width: '100%', marginBottom: 10 }} placeholder="Note (optional)" value={editForm.notes || ''} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} />
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button className="adm-btn-primary sm" onClick={() => updatePayment(order.id, pmt.id)}>Save</button>
                              <button className="adm-btn-ghost sm" onClick={() => { setEditingPayment(null); setEditForm({}) }}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div key={pmt.id} className="ord-pmt-row">
                            <div style={{ flex: 1 }}>
                              <div className="ord-pmt-label">{pmt.label}</div>
                              <div className="ord-pmt-sub">
                                {pmt.due_date ? `Due ${new Date(pmt.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Date TBC'}
                                {pmt.notes && ` · ${pmt.notes}`}
                              </div>
                            </div>
                            <span className="ord-pmt-amount">£{Number(pmt.amount).toLocaleString()}</span>
                            <div className="ord-pmt-actions">
                              <button className="adm-btn-ghost sm" title="Edit" onClick={() => { setEditingPayment(pmt.id); setAddingPayment(null); setEditForm({ label: pmt.label, amount: String(pmt.amount), due_date: pmt.due_date || '', notes: pmt.notes || '' }) }}>✏️</button>
                              <button className="adm-btn-ghost sm" style={{ color: '#dc2626' }} onClick={() => deletePayment(order.id, pmt.id)}>✕</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Contract Amendments */}
                  <div className="ord-section">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: addingPayment === 'amendment' ? 14 : (amendments.length > 0 ? 4 : 14) }}>
                      <span className="ord-section-title" style={{ margin: 0 }}>Contract Amendments</span>
                      {addingPayment !== 'amendment' && (
                        <button className="adm-btn-ghost sm" style={{ fontSize: 12 }} onClick={() => openAdd('amendment')}>+ Add Amendment</button>
                      )}
                    </div>
                    {addingPayment === 'amendment' && (
                      <div className="ord-add-form" style={{ background: '#FFFBE6', borderColor: '#fde68a' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                          <input className="adm-input" autoFocus placeholder="Description — e.g. Extra rope ladder" value={payForm.label} onChange={e => setPayForm(p => ({ ...p, label: e.target.value }))} />
                          <input className="adm-input" type="number" step="0.01" placeholder="Amount (use − for reduction)" value={payForm.amount} onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))} />
                          <input className="adm-input" type="date" title="Date approved (optional)" value={payForm.due_date} onChange={e => setPayForm(p => ({ ...p, due_date: e.target.value }))} />
                        </div>
                        <input className="adm-input" placeholder="Notes (optional)" value={payForm.notes} onChange={e => setPayForm(p => ({ ...p, notes: e.target.value }))} style={{ width: '100%', marginBottom: 10 }} />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="adm-btn-primary sm" onClick={() => addPayment(order.id, contractTotal)}>Save</button>
                          <button className="adm-btn-ghost sm" onClick={() => setAddingPayment(null)}>Cancel</button>
                        </div>
                      </div>
                    )}
                    {amendments.length === 0 && addingPayment !== 'amendment' ? (
                      <p style={{ fontSize: 13, color: '#94a3b8', paddingTop: 4 }}>No contract amendments.</p>
                    ) : (
                      <div>
                        {amendments.map(pmt => editingPayment === pmt.id ? (
                          <div key={pmt.id} className="ord-edit-form" style={{ borderColor: '#fde68a' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                              <input className="adm-input" autoFocus placeholder="Description" value={editForm.label || ''} onChange={e => setEditForm(p => ({ ...p, label: e.target.value }))} />
                              <input className="adm-input" type="number" step="0.01" placeholder="Amount (use − for reduction)" value={editForm.amount || ''} onChange={e => setEditForm(p => ({ ...p, amount: e.target.value }))} />
                              <input className="adm-input" type="date" value={editForm.due_date || ''} onChange={e => setEditForm(p => ({ ...p, due_date: e.target.value }))} />
                            </div>
                            <input className="adm-input" style={{ width: '100%', marginBottom: 10 }} placeholder="Notes (optional)" value={editForm.notes || ''} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} />
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button className="adm-btn-primary sm" onClick={() => updatePayment(order.id, pmt.id)}>Save</button>
                              <button className="adm-btn-ghost sm" onClick={() => { setEditingPayment(null); setEditForm({}) }}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div key={pmt.id} className="ord-pmt-row">
                            <div style={{ flex: 1 }}>
                              <div className="ord-pmt-label" style={{ color: '#78350f' }}>{pmt.label}</div>
                              <div className="ord-pmt-sub">
                                {pmt.due_date && `Approved ${new Date(pmt.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                                {pmt.notes && (pmt.due_date ? ` · ${pmt.notes}` : pmt.notes)}
                              </div>
                            </div>
                            <span className="ord-pmt-amount" style={{ color: Number(pmt.amount) >= 0 ? '#EA580C' : '#dc2626' }}>
                              {Number(pmt.amount) >= 0 ? '+' : ''}£{Number(pmt.amount).toLocaleString()}
                            </span>
                            <div className="ord-pmt-actions">
                              <button className="adm-btn-ghost sm" title="Edit" onClick={() => { setEditingPayment(pmt.id); setAddingPayment(null); setEditForm({ label: pmt.label, amount: String(pmt.amount), due_date: pmt.due_date || '', notes: pmt.notes || '' }) }}>✏️</button>
                              <button className="adm-btn-ghost sm" style={{ color: '#dc2626' }} onClick={() => deletePayment(order.id, pmt.id)}>✕</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Received Payments */}
                  <div className="ord-section">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: addingPayment === 'received' ? 14 : (received.length > 0 ? 4 : 14) }}>
                      <span className="ord-section-title" style={{ margin: 0 }}>Received Payments</span>
                      {addingPayment !== 'received' && (
                        <button className="adm-btn-primary sm" style={{ fontSize: 12 }} onClick={() => openAdd('received')}>+ Record Payment</button>
                      )}
                    </div>
                    {addingPayment === 'received' && (
                      <div className="ord-add-form" style={{ background: '#FFFDE7', borderColor: '#FFF1AA' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: payForm.reference === 'other' ? '1fr 1fr' : '1fr', gap: 8, marginBottom: 8 }}>
                          <select className="adm-input" autoFocus value={payForm.reference}
                            onChange={e => {
                              const val = e.target.value
                              const matched = invoices.find(inv => inv.label === val)
                              setPayForm(p => ({ ...p, reference: val, label: '', amount: matched ? String(matched.amount) : '' }))
                            }}>
                            <option value="">Select payment milestone</option>
                            {invoices.map(inv => <option key={inv.id} value={inv.label}>{inv.label} (£{Number(inv.amount).toLocaleString()})</option>)}
                            <option value="other">Other / Custom</option>
                          </select>
                          {payForm.reference === 'other' && (
                            <input className="adm-input" placeholder="Custom label" value={payForm.label} onChange={e => setPayForm(p => ({ ...p, label: e.target.value }))} />
                          )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                          <input className="adm-input" type="number" min="0" step="0.01" placeholder="Amount received £" value={payForm.amount} onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))} />
                          <input className="adm-input" type="date" title="Date received" value={payForm.received_date} onChange={e => setPayForm(p => ({ ...p, received_date: e.target.value }))} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                          <select className="adm-input" value={payForm.method} onChange={e => setPayForm(p => ({ ...p, method: e.target.value }))}>
                            <option value="bank">Bank Transfer</option>
                            <option value="paypal">PayPal</option>
                            <option value="cash">Cash</option>
                            <option value="other">Other</option>
                          </select>
                          <input className="adm-input" placeholder="Bank ref / note (optional)" value={payForm.notes} onChange={e => setPayForm(p => ({ ...p, notes: e.target.value }))} />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="adm-btn-primary sm" onClick={() => addPayment(order.id, contractTotal)}>Save</button>
                          <button className="adm-btn-ghost sm" onClick={() => setAddingPayment(null)}>Cancel</button>
                        </div>
                      </div>
                    )}
                    {received.length === 0 && addingPayment !== 'received' ? (
                      <p style={{ fontSize: 13, color: '#94a3b8', paddingTop: 4 }}>No payments recorded yet.</p>
                    ) : (
                      <div>
                        {received.map(pmt => editingPayment === pmt.id ? (
                          <div key={pmt.id} className="ord-edit-form" style={{ borderColor: '#FFF1AA' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                              <input className="adm-input" autoFocus placeholder="Label" value={editForm.label || ''} onChange={e => setEditForm(p => ({ ...p, label: e.target.value }))} />
                              <input className="adm-input" type="number" step="0.01" placeholder="Amount £" value={editForm.amount || ''} onChange={e => setEditForm(p => ({ ...p, amount: e.target.value }))} />
                              <input className="adm-input" type="date" value={editForm.received_date || ''} onChange={e => setEditForm(p => ({ ...p, received_date: e.target.value }))} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                              <select className="adm-input" value={editForm.method || 'bank'} onChange={e => setEditForm(p => ({ ...p, method: e.target.value }))}>
                                <option value="bank">Bank Transfer</option><option value="paypal">PayPal</option><option value="cash">Cash</option><option value="other">Other</option>
                              </select>
                              <input className="adm-input" placeholder="Notes (optional)" value={editForm.notes || ''} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} />
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button className="adm-btn-primary sm" onClick={() => updatePayment(order.id, pmt.id)}>Save</button>
                              <button className="adm-btn-ghost sm" onClick={() => { setEditingPayment(null); setEditForm({}) }}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div key={pmt.id} className="ord-pmt-row">
                            <div style={{ flex: 1 }}>
                              <div className="ord-pmt-label" style={{ color: '#1E3070' }}>{pmt.label}</div>
                              <div className="ord-pmt-sub">
                                {pmt.received_date ? new Date(pmt.received_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date not set'}
                                {pmt.method && ` · ${pmt.method.charAt(0).toUpperCase() + pmt.method.slice(1)}`}
                                {pmt.notes && ` · ${pmt.notes}`}
                              </div>
                            </div>
                            <span className="ord-pmt-amount" style={{ color: '#EA580C' }}>+£{Number(pmt.amount).toLocaleString()}</span>
                            <div className="ord-pmt-actions">
                              <button className="adm-btn-ghost sm" title="Edit" onClick={() => { setEditingPayment(pmt.id); setAddingPayment(null); setEditForm({ label: pmt.label, amount: String(pmt.amount), received_date: pmt.received_date || '', method: pmt.method || 'bank', notes: pmt.notes || '' }) }}>✏️</button>
                              <button className="adm-btn-ghost sm" style={{ color: '#dc2626' }} onClick={() => deletePayment(order.id, pmt.id)}>✕</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── DOCUMENTS TAB ────────────────────────────────────── */}
              {modalTab === 'documents' && (
                <>
                  {/* Upload form */}
                  <div className="ord-section">
                    <div className="ord-section-title">Upload Document</div>
                    <input className="adm-input" placeholder="Label — e.g. Signed Contract, Quote, Warranty"
                      value={docUpload.label} onChange={e => setDocUpload(d => ({ ...d, label: e.target.value }))}
                      style={{ marginBottom: 10 }} />
                    <select className="adm-input" value={docUpload.doc_type}
                      onChange={e => setDocUpload(d => ({ ...d, doc_type: e.target.value }))}
                      style={{ marginBottom: 10 }}>
                      <option value="general">General Document</option>
                      <option value="variation">Variation Agreement</option>
                      <option value="contract">Contract</option>
                      <option value="warranty">Warranty</option>
                    </select>
                    {/* Hidden multi-file input */}
                    <input ref={docFileRef} type="file" multiple style={{ display: 'none' }}
                      onChange={e => setDocUpload(d => ({ ...d, files: Array.from(e.target.files) }))} />
                    {/* Drop zone */}
                    <div
                      className={`ord-drop-zone${docDragOver ? ' dragover' : ''}`}
                      onClick={() => docFileRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setDocDragOver(true) }}
                      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDocDragOver(false) }}
                      onDrop={e => {
                        e.preventDefault()
                        setDocDragOver(false)
                        const files = Array.from(e.dataTransfer.files)
                        if (files.length) setDocUpload(d => ({ ...d, files }))
                      }}
                    >
                      {docUpload.files.length > 0 ? (
                        <>
                          <div style={{ fontSize: 28, marginBottom: 6 }}>📄</div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>
                            {docUpload.files.length === 1
                              ? docUpload.files[0].name
                              : `${docUpload.files.length} files selected`}
                          </div>
                          {docUpload.files.length > 1 && (
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, maxWidth: 400 }}>
                              {docUpload.files.map(f => f.name).join(', ')}
                            </div>
                          )}
                          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>click to change</div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: 32, marginBottom: 8 }}>☁️</div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#475569' }}>
                            {docDragOver ? 'Drop files here' : 'Drag & drop files, or click to browse'}
                          </div>
                          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>PDF, DOCX, XLSX, images, etc. · multiple files supported</div>
                        </>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginTop: 10 }}>
                      {docUploadOk && (
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#EA580C', background: '#FFFBE6', border: '1px solid #FFF1AA', borderRadius: 8, padding: '4px 12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          ✓ Document uploaded successfully
                        </span>
                      )}
                      <button className="adm-btn-primary sm"
                        disabled={docUpload.uploading || !docUpload.files.length}
                        onClick={() => uploadDocument(order.id)}>
                        {docUpload.uploading ? 'Uploading…' : `↑ Upload${docUpload.files.length > 1 ? ` (${docUpload.files.length})` : ''}`}
                      </button>
                    </div>
                  </div>

                  {/* Document list */}
                  <div className="ord-section">
                    <div className="ord-section-title">Uploaded Documents</div>
                    {(orderDocuments[order.id] || []).length === 0 ? (
                      <p style={{ fontSize: 13, color: '#94a3b8' }}>No documents uploaded yet.</p>
                    ) : (
                      <div>
                        {(orderDocuments[order.id] || []).map(doc => (
                          <div key={doc.id} className="ord-pmt-row">
                            <span style={{ fontSize: 24, flexShrink: 0 }}>📄</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="ord-pmt-label">{doc.label}</div>
                              <div className="ord-pmt-sub">
                                {doc.file_name} · {new Date(doc.uploaded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </div>
                              {doc.acknowledged_at && (
                                <div style={{ fontSize: 11, color: '#EA580C', marginTop: 2 }}>
                                  ✓ Acknowledged {new Date(doc.acknowledged_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                              )}
                            </div>
                            <div className="ord-pmt-actions">
                              <button className="adm-btn-ghost sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => downloadDocument(doc.file_path, doc.file_name)}>
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M6 8.5L1.5 4H4V1h4v3h2.5L6 8.5z"/><rect x="1" y="10" width="10" height="1.5" rx="0.75"/></svg>
                                Download
                              </button>
                              <button className="adm-btn-ghost sm" style={{ color: '#dc2626' }} onClick={() => deleteDocument(order.id, doc.id, doc.file_path)}>✕</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── VARIATIONS TAB ───────────────────────────────────── */}
              {modalTab === 'variations' && (
                <div>
                  {/* Sub-tab pills */}
                  <div style={{ display: 'flex', gap: 6, padding: '0 0 16px', borderBottom: '1px solid #e2e8f0', marginBottom: 20 }}>
                    {[
                      { id: 'requests',   label: `Requests${(varRequests[order.id] || []).length > 0 ? ` (${(varRequests[order.id] || []).length})` : ''}` },
                      { id: 'agreements', label: `Agreements${((orderDocuments[order.id] || []).filter(d => d.doc_type === 'variation').length > 0 ? ` (${(orderDocuments[order.id] || []).filter(d => d.doc_type === 'variation').length})` : '')}` },
                    ].map(s => (
                      <button key={s.id} onClick={() => setVarSubTab(s.id)}
                        style={{ padding: '6px 18px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                          background: varSubTab === s.id ? '#1e3a5f' : '#f1f5f9',
                          color:      varSubTab === s.id ? '#fff'    : '#64748b' }}>
                        {s.label}
                      </button>
                    ))}
                  </div>

                  {/* ── REQUESTS sub-tab ─────────────────────────────── */}
                  {varSubTab === 'requests' && (
                    <div className="ord-section">
                      <div className="ord-section-title">Client Variation Requests</div>
                      {!(varRequests[order.id]) ? (
                        <p style={{ fontSize: 13, color: '#94a3b8' }}>Loading…</p>
                      ) : (varRequests[order.id] || []).length === 0 ? (
                        <p style={{ fontSize: 13, color: '#94a3b8' }}>No variation requests yet.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          {(varRequests[order.id] || []).map(req => {
                            const STATUS_COLOR = { pending: '#fef3c7', reviewing: '#dbeafe', approved: '#FFFBE6', rejected: '#fee2e2' }
                            const STATUS_TEXT  = { pending: '#92400e', reviewing: '#1e40af', approved: '#1E3070', rejected: '#991b1b' }
                            const isAdminRaised = req.description?.startsWith('[Admin]')
                            return (
                              <div key={req.id} style={{ border: `1px solid ${isAdminRaised ? '#bfdbfe' : '#e2e8f0'}`, borderRadius: 12, padding: '14px 16px', background: isAdminRaised ? '#eff6ff' : '#fafafa' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 12, color: '#64748b' }}>{new Date(req.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    {isAdminRaised && <span style={{ fontSize: 11, fontWeight: 700, background: '#bfdbfe', color: '#1e40af', borderRadius: 99, padding: '2px 8px' }}>Admin raised</span>}
                                  </div>
                                  <span style={{ fontSize: 12, fontWeight: 700, borderRadius: 99, padding: '3px 12px', background: STATUS_COLOR[req.status] || STATUS_COLOR.pending, color: STATUS_TEXT[req.status] || STATUS_TEXT.pending }}>
                                    {req.status?.charAt(0).toUpperCase() + req.status?.slice(1)}
                                  </span>
                                </div>
                                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, margin: '0 0 12px' }}>
                                  {isAdminRaised ? req.description.replace(/^\[Admin\]\s*/, '') : req.description}
                                </p>
                                {req.admin_notes && (
                                  <div style={{ background: '#FFFDE7', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#1E3070', marginBottom: 12, borderLeft: '3px solid #F9C800' }}>
                                    <strong>Response:</strong> {req.admin_notes}
                                  </div>
                                )}
                                <VarRequestActions req={req} orderId={order.id} onUpdate={updateVarRequest} />
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Admin raise on behalf */}
                      <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px dashed #cbd5e1' }}>
                        <div className="ord-section-title">Raise Variation on Client's Behalf</div>
                        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>This will be added as a variation request attributed to the client and marked as admin-raised.</p>
                        <textarea className="adm-input" rows={3}
                          placeholder="Describe the variation (e.g. Change fence colour to black, add extra swing bay…)"
                          value={adminVarDesc}
                          onChange={e => setAdminVarDesc(e.target.value)}
                          style={{ resize: 'vertical', marginBottom: 10 }} />
                        <button className="adm-btn-primary sm"
                          disabled={adminVarSubmitting || !adminVarDesc.trim()}
                          onClick={() => raiseAdminVariation(order.id, order.client_id)}>
                          {adminVarSubmitting ? 'Submitting…' : '+ Raise Variation Request'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── AGREEMENTS sub-tab ───────────────────────────── */}
                  {varSubTab === 'agreements' && (
                    <div className="ord-section">
                      <div className="ord-section-title">Upload Variation Agreement</div>
                      <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>The uploaded file will appear here and in the client's portal under Variation Agreements. It also remains accessible under Documents.</p>
                      <input className="adm-input" placeholder="Label — e.g. Variation Agreement #1"
                        value={docUpload.label} onChange={e => setDocUpload(d => ({ ...d, label: e.target.value }))}
                        style={{ marginBottom: 10 }} />
                      <input ref={docFileRef} type="file" multiple style={{ display: 'none' }}
                        onChange={e => setDocUpload(d => ({ ...d, files: Array.from(e.target.files) }))} />
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <button className="adm-btn-ghost sm" onClick={() => docFileRef.current?.click()}>
                          {docUpload.files.length ? `${docUpload.files.length} file(s) selected` : '📎 Choose File'}
                        </button>
                        <button className="adm-btn-primary sm"
                          disabled={docUpload.uploading || !docUpload.files.length}
                          onClick={() => uploadDocument(order.id, 'variation')}>
                          {docUpload.uploading ? 'Uploading…' : '↑ Upload Agreement'}
                        </button>
                        {varUploadOk && (
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#EA580C', background: '#FFFBE6', border: '1px solid #FFF1AA', borderRadius: 8, padding: '4px 12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            ✓ Agreement uploaded successfully
                          </span>
                        )}
                      </div>

                      {/* Uploaded variation agreements list */}
                      {(() => {
                        const varDocs = (orderDocuments[order.id] || []).filter(d => d.doc_type === 'variation')
                        return varDocs.length > 0 ? (
                          <div style={{ marginTop: 24 }}>
                            <div className="ord-section-title">Uploaded Agreements</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                              {varDocs.map(doc => (
                                <div key={doc.id} style={{ background: '#FFFDE7', border: '1px solid #FFF1AA', borderRadius: 10, overflow: 'hidden' }}>
                                  <div className="ord-pmt-row" style={{ borderRadius: 0 }}>
                                    <span style={{ fontSize: 22, flexShrink: 0 }}>📋</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div className="ord-pmt-label">{doc.label}</div>
                                      <div className="ord-pmt-sub">
                                        {doc.file_name} · {new Date(doc.uploaded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                      </div>
                                      {doc.acknowledged_at && (
                                        <div style={{ fontSize: 11, color: '#EA580C', marginTop: 2 }}>
                                          ✓ Client acknowledged {new Date(doc.acknowledged_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                      )}
                                    </div>
                                    <div className="ord-pmt-actions">
                                      <button className="adm-btn-ghost sm" onClick={() => { setEditingVarDoc(editingVarDoc === doc.id ? null : doc.id); setEditVarLabel(doc.label); setEditVarFile(null); if (editVarFileRef.current) editVarFileRef.current.value = '' }}>✏ Edit</button>
                                      <button className="adm-btn-ghost sm" onClick={() => downloadDocument(doc.file_path, doc.file_name)}>⬇ Download</button>
                                      <button className="adm-btn-ghost sm" style={{ color: '#dc2626' }} onClick={() => deleteDocument(order.id, doc.id, doc.file_path)}>✕</button>
                                    </div>
                                  </div>
                                  {editingVarDoc === doc.id && (
                                    <div style={{ padding: '12px 16px', borderTop: '1px solid #FFF1AA', background: '#f7fffe', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                      <input className="adm-input" placeholder="Update label…" value={editVarLabel}
                                        onChange={e => setEditVarLabel(e.target.value)} />
                                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <input ref={editVarFileRef} type="file" style={{ display: 'none' }}
                                          onChange={e => setEditVarFile(e.target.files[0] || null)} />
                                        <button className="adm-btn-ghost sm" onClick={() => editVarFileRef.current?.click()}>
                                          {editVarFile ? editVarFile.name : '📎 Replace file (optional)'}
                                        </button>
                                        <button className="adm-btn-primary sm" disabled={editVarSaving}
                                          onClick={() => updateVarDoc(order.id, doc)}>
                                          {editVarSaving ? 'Saving…' : 'Save'}
                                        </button>
                                        <button className="adm-btn-ghost sm" onClick={() => { setEditingVarDoc(null); setEditVarLabel(''); setEditVarFile(null) }}>Cancel</button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 20 }}>No variation agreements uploaded yet.</p>
                        )
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* ── EXTRAS TAB ───────────────────────────────────────── */}
              {modalTab === 'extras' && (
                orderRequests.length === 0 ? (
                  <div className="ord-section">
                    <p style={{ color: '#94a3b8', fontSize: 13 }}>No add-on extra requests for this order.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {orderRequests.map(req => (
                      <div key={req.id} className="ord-section" style={{ borderColor: req.status === 'pending' ? '#fde68a' : req.status === 'confirmed' ? '#FFF1AA' : '#fecaca' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <span style={{ fontSize: 12, color: '#64748b' }}>{new Date(req.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, borderRadius: 99, padding: '3px 12px', background: req.status === 'pending' ? '#fef3c7' : req.status === 'confirmed' ? '#FFFBE6' : '#fee2e2', color: req.status === 'pending' ? '#92400e' : req.status === 'confirmed' ? '#1E3070' : '#991b1b' }}>
                            {req.status === 'pending' ? 'Pending' : req.status === 'confirmed' ? 'Confirmed' : 'Declined'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                          {(req.items || []).map((item, i) => (
                            <span key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '5px 12px', fontSize: 13, fontWeight: 600 }}>
                              {item.icon} {item.name} — £{item.price}
                            </span>
                          ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 800, fontSize: 16 }}>Total: £{req.total}</span>
                          {req.status === 'pending' && (
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button className="adm-btn-primary sm" onClick={() => updateRequestStatus(order.id, req.id, 'confirmed')}>Confirm</button>
                              <button className="adm-btn-ghost sm" style={{ color: '#dc2626' }} onClick={() => updateRequestStatus(order.id, req.id, 'declined')}>Decline</button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
              {/* ── SAVINGS CLUB TAB ─────────────────────────────────── */}
              {modalTab === 'savings' && (() => {
                const plan    = savingsPlans[order.id]
                const savings = (orderPayments[order.id] || []).filter(p => p.type === 'savings')
                const totalSaved = savings.reduce((s, p) => s + Number(p.amount), 0)
                const target     = Number(plan?.target_amount || 0)
                const pct        = target > 0 ? Math.min(100, Math.round((totalSaved / target) * 100)) : 0
                const clientId   = order.client_id

                return (
                  <div>
                    {/* Plan setup card */}
                    <div className="ord-section">
                      <div className="ord-section-title">🎄 Christmas Savings Club Setup</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                        <div>
                          <label className="adm-label">Plan Name</label>
                          <input className="adm-input" value={savingsForm.name} onChange={e => setSavingsForm(p => ({ ...p, name: e.target.value }))} placeholder="Christmas Savings Club" />
                        </div>
                        <div>
                          <label className="adm-label">Target Amount (£)</label>
                          <input className="adm-input" type="number" min="0" step="0.01" value={savingsForm.target_amount} onChange={e => setSavingsForm(p => ({ ...p, target_amount: e.target.value }))} placeholder="e.g. 2500" />
                        </div>
                        <div>
                          <label className="adm-label">Suggested Monthly (£)</label>
                          <input className="adm-input" type="number" min="0" step="0.01" value={savingsForm.monthly_amount} onChange={e => setSavingsForm(p => ({ ...p, monthly_amount: e.target.value }))} placeholder="e.g. 200" />
                        </div>
                        <div>
                          <label className="adm-label">Start Date</label>
                          <input className="adm-input" type="date" value={savingsForm.start_date} onChange={e => setSavingsForm(p => ({ ...p, start_date: e.target.value }))} />
                        </div>
                        <div>
                          <label className="adm-label">Target Date (e.g. Christmas)</label>
                          <input className="adm-input" type="date" value={savingsForm.target_date} onChange={e => setSavingsForm(p => ({ ...p, target_date: e.target.value }))} />
                        </div>
                        <div>
                          <label className="adm-label">Notes (optional)</label>
                          <input className="adm-input" value={savingsForm.notes} onChange={e => setSavingsForm(p => ({ ...p, notes: e.target.value }))} placeholder="Internal notes…" />
                        </div>
                      </div>
                      <button className="adm-btn-primary" disabled={savingsPlanSaving} onClick={() => saveSavingsPlan(order.id, clientId)}>
                        {savingsPlanSaving ? 'Saving…' : plan ? '💾 Update Plan' : '🎄 Create Savings Plan'}
                      </button>
                    </div>

                    {/* Progress summary (only if plan exists) */}
                    {plan && (
                      <div className="ord-section">
                        <div className="ord-section-title">Progress</div>
                        <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
                          {[
                            ['Target',      target > 0 ? `£${target.toLocaleString()}` : '—',               '#1e293b'],
                            ['Saved',        `£${totalSaved.toLocaleString()}`,                              '#C2410C'],
                            ['Remaining',    target > 0 ? `£${Math.max(0, target - totalSaved).toLocaleString()}` : '—', '#D4A800'],
                          ].map(([l, v, c]) => (
                            <div key={l} style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 16px', minWidth: 100 }}>
                              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>{l}</div>
                              <div style={{ fontSize: 18, fontWeight: 800, color: c, fontFamily: 'inherit' }}>{v}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ background: '#e2e8f0', borderRadius: 99, height: 10, marginBottom: 4 }}>
                          <div style={{ background: '#C2410C', height: 10, borderRadius: 99, width: `${pct}%`, transition: 'width 0.4s' }} />
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{pct}% saved{plan.target_date ? ` · Target: ${new Date(plan.target_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}</div>
                      </div>
                    )}

                    {/* Deposit log */}
                    {plan && (
                      <div className="ord-section">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <div className="ord-section-title" style={{ margin: 0 }}>Savings Deposits ({savings.length})</div>
                          {!addingSavingsDep && (
                            <button className="adm-btn-ghost sm" onClick={() => setAddingSavingsDep(true)}>+ Record Deposit</button>
                          )}
                        </div>

                        {addingSavingsDep && (
                          <div className="ord-add-form" style={{ background: '#FFFDE7', borderColor: '#FFF1AA', marginBottom: 12 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                              <div>
                                <label className="adm-label">Amount (£)</label>
                                <input className="adm-input" type="number" min="0" step="0.01" autoFocus value={savingsDepForm.amount} onChange={e => setSavingsDepForm(p => ({ ...p, amount: e.target.value }))} placeholder="e.g. 200" />
                              </div>
                              <div>
                                <label className="adm-label">Date Received</label>
                                <input className="adm-input" type="date" value={savingsDepForm.received_date} onChange={e => setSavingsDepForm(p => ({ ...p, received_date: e.target.value }))} />
                              </div>
                            </div>
                            <input className="adm-input" value={savingsDepForm.notes} onChange={e => setSavingsDepForm(p => ({ ...p, notes: e.target.value }))} placeholder="Note (e.g. January instalment)" style={{ marginBottom: 8 }} />
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button className="adm-btn-primary sm" onClick={() => addSavingsDeposit(order.id)}>Save Deposit</button>
                              <button className="adm-btn-ghost sm" onClick={() => { setAddingSavingsDep(false); setSavingsDepForm({ amount: '', received_date: '', notes: '' }) }}>Cancel</button>
                            </div>
                          </div>
                        )}

                        {savings.length === 0 ? (
                          <p style={{ fontSize: 13, color: '#94a3b8' }}>No deposits recorded yet.</p>
                        ) : (
                          savings.sort((a, b) => new Date(b.received_date || b.created_at) - new Date(a.received_date || a.created_at)).map(dep => (
                            <div key={dep.id} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: 14 }}>
                              {editingDepId === dep.id ? (
                                <div className="ord-add-form" style={{ background: '#FFFDE7', borderColor: '#FFF1AA', marginBottom: 4 }}>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                                    <div>
                                      <label className="adm-label">Amount (£)</label>
                                      <input className="adm-input" type="number" min="0" step="0.01" autoFocus value={editDepForm.amount} onChange={e => setEditDepForm(p => ({ ...p, amount: e.target.value }))} />
                                    </div>
                                    <div>
                                      <label className="adm-label">Date Received</label>
                                      <input className="adm-input" type="date" value={editDepForm.received_date} onChange={e => setEditDepForm(p => ({ ...p, received_date: e.target.value }))} />
                                    </div>
                                  </div>
                                  <input className="adm-input" value={editDepForm.notes} onChange={e => setEditDepForm(p => ({ ...p, notes: e.target.value }))} placeholder="Note (e.g. January instalment)" style={{ marginBottom: 8 }} />
                                  <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="adm-btn-primary sm" onClick={() => updateSavingsDeposit(order.id)}>Save</button>
                                    <button className="adm-btn-ghost sm" onClick={() => setEditingDepId(null)}>Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <div>
                                    <div style={{ fontWeight: 700 }}>{dep.label}</div>
                                    <div style={{ fontSize: 12, color: '#64748b' }}>
                                      {dep.received_date ? new Date(dep.received_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ fontWeight: 800, color: '#C2410C', fontSize: 16 }}>£{Number(dep.amount).toLocaleString()}</div>
                                    <button className="adm-btn-ghost sm" style={{ padding: '2px 8px', fontSize: 12 }}
                                      onClick={() => { setEditingDepId(dep.id); setEditDepForm({ amount: String(dep.amount), received_date: dep.received_date || '', notes: dep.label || '' }) }}>
                                      ✏️
                                    </button>
                                    <button className="adm-btn-ghost sm" style={{ padding: '2px 8px', fontSize: 12, color: '#dc2626', borderColor: '#fca5a5' }}
                                      onClick={() => deleteSavingsDeposit(order.id, dep.id)}>
                                      🗑️
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )
              })()}

            </>
          )
        })()
      )}
    </div>
  )
}

// ─── Add-on Extras tab ─────────────────────────────────────────────────────
const EXTRAS_PAGE_SIZE = 6

function ExtrasTab({ extras, setExtras, flash }) {
  const [doConfirm, confirmModal] = useConfirm()
  const [adding, setAdding] = useState(false)
  const [form,   setForm]   = useState({ name: '', description: '', price: '', icon: '⭐', image_url: '' })
  const [err,    setErr]    = useState('')
  const [search,     setSearch]     = useState('')
  const [visibility, setVisibility] = useState('all') // 'all' | 'visible' | 'hidden'
  const [page,       setPage]       = useState(1)

  async function saveField(extra, field, value) {
    const update = { [field]: field === 'price' ? parseFloat(value) : value }
    const { error } = await supabase.from('extras').update(update).eq('id', extra.id)
    if (!error) { setExtras(p => p.map(e => e.id === extra.id ? { ...e, ...update } : e)); flash('Saved') }
  }

  async function toggleActive(extra) {
    const { error } = await supabase.from('extras').update({ is_active: !extra.is_active }).eq('id', extra.id)
    if (!error) { setExtras(p => p.map(e => e.id === extra.id ? { ...e, is_active: !extra.is_active } : e)); flash('Saved') }
  }

  async function deleteExtra(extra) {
    if (!await doConfirm(`Delete "${extra.name}"? This cannot be undone.`)) return
    const { error } = await supabase.from('extras').delete().eq('id', extra.id)
    if (!error) { setExtras(p => p.filter(e => e.id !== extra.id)); flash('Deleted') }
  }

  async function confirmAdd(e) {
    e.preventDefault()
    if (!form.name.trim()) { setErr('Name is required.'); return }
    if (form.price === '')  { setErr('Price is required.'); return }
    const { error } = await supabase.from('extras').insert({
      name:        form.name.trim(),
      description: form.description.trim() || null,
      price:       parseFloat(form.price),
      icon:        form.icon.trim() || '⭐',
      image_url:   form.image_url.trim() || null,
      sort_order:  extras.length + 1,
    })
    if (error) { setErr(error.message); return }
    const { data } = await supabase.from('extras').select('*').order('sort_order')
    setExtras(data || [])
    flash('Extra added')
    setAdding(false)
    setForm({ name: '', description: '', price: '', icon: '⭐', image_url: '' })
    setErr('')
  }

  return (
    <div className="adm-section">
      {confirmModal}
      {adding && (
        <div className="adm-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setAdding(false) }}>
          <div className="adm-modal">
            <h3>Add Extra Product</h3>
            <form className="adm-modal-form" onSubmit={confirmAdd}>
              <label>
                Name
                <input autoFocus value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Nest Swing" required />
              </label>
              <label>
                Description
                <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Large 80cm nest swing, fits 2 kids" />
              </label>
              <label>
                Price (£)
                <input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="00.00" required />
              </label>
              <label>
                Product Image URL
                <input value={form.image_url} onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))} placeholder="https://example.com/image.jpg" />
              </label>
              {form.image_url && (
                <img src={form.image_url} alt="preview" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 10, border: '1px solid #e2e8f0' }}
                  onError={e => { e.currentTarget.style.display = 'none' }} />
              )}
              {err && <p style={{ color: '#dc2626', fontSize: 12, margin: 0 }}>{err}</p>}
              <div className="adm-modal-actions">
                <button type="submit" className="adm-btn-primary">Add Extra</button>
                <button type="button" className="adm-btn-ghost" onClick={() => { setAdding(false); setErr('') }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="adm-section-header">
        <div>
          <h2 style={{ margin: 0 }}>Add-on Extras</h2>
          <p className="adm-hint" style={{ margin: '4px 0 0' }}>Shown in the client portal. Click any field to edit inline.</p>
        </div>
        <button className="adm-btn-primary" onClick={() => setAdding(true)}>+ Add Extra</button>
      </div>

      {/* ── Search + visibility filter ── */}
      {extras.length > 0 && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            className="adm-input"
            style={{ flex: '1 1 200px', maxWidth: 320, padding: '7px 12px', fontSize: 13 }}
            placeholder="Search by name or description…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[['all', `All (${extras.length})`], ['visible', `Visible (${extras.filter(e => e.is_active).length})`], ['hidden', `Hidden (${extras.filter(e => !e.is_active).length})`]].map(([val, label]) => (
              <button key={val}
                className={visibility === val ? 'adm-subtab active' : 'adm-subtab'}
                onClick={() => { setVisibility(val); setPage(1) }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {(() => {
        const q = search.toLowerCase()
        const filtered = extras.filter(ex => {
          const matchSearch = !q || ex.name.toLowerCase().includes(q) || (ex.description || '').toLowerCase().includes(q)
          const matchVis = visibility === 'all' || (visibility === 'visible' ? ex.is_active : !ex.is_active)
          return matchSearch && matchVis
        })
        const totalPages = Math.ceil(filtered.length / EXTRAS_PAGE_SIZE)
        const safePage   = Math.min(page, Math.max(1, totalPages))
        const paginated  = filtered.slice((safePage - 1) * EXTRAS_PAGE_SIZE, safePage * EXTRAS_PAGE_SIZE)

        if (extras.length === 0) return (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: '#94a3b8', background: '#fff', borderRadius: 14, border: '2px dashed #e2e8f0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>No extras yet</div>
            <div style={{ fontSize: 13 }}>Click "+ Add Extra" to create your first product.</div>
          </div>
        )

        if (filtered.length === 0) return (
          <p style={{ color: '#94a3b8', fontSize: 13 }}>No extras match your search.</p>
        )

        return (
          <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {paginated.map(ex => (
            <div key={ex.id} className="adm-extra-card" style={{
              display: 'grid',
              gridTemplateColumns: '72px 1fr 1fr auto auto auto',
              alignItems: 'center',
              gap: 16,
              background: '#fff',
              borderRadius: 14,
              padding: '12px 16px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              border: `1.5px solid ${ex.is_active ? '#e2e8f0' : '#f1f5f9'}`,
              opacity: ex.is_active ? 1 : 0.55,
              transition: 'opacity 0.2s',
            }}>
              {/* Image — click pencil overlay to edit URL */}
              <div style={{ position: 'relative', width: 72, height: 72, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer' }}
                title="Click to edit image URL"
                onClick={() => {
                  const url = window.prompt('Image URL:', ex.image_url || '')
                  if (url !== null) saveField(ex, 'image_url', url)
                }}>
                {ex.image_url
                  ? <img src={ex.image_url} alt={ex.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📷</div>}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.opacity = 1}
                  onMouseOut={e => e.currentTarget.style.opacity = 0}>
                  <span style={{ color: '#fff', fontSize: 18 }}>✏️</span>
                </div>
              </div>

              {/* Name + description stacked */}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b', marginBottom: 4 }}>
                  <InlineEdit value={ex.name} onSave={v => saveField(ex, 'name', v)} />
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  <InlineEdit value={ex.description || ''} placeholder="Add description…" onSave={v => saveField(ex, 'description', v)} />
                </div>
              </div>

              {/* Price */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 800, fontSize: 16, color: '#1E3070' }}>
                <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>£</span>
                <InlineEdit value={ex.price} type="number" onSave={v => saveField(ex, 'price', v)} />
              </div>

              {/* Visible toggle */}
              <button onClick={() => toggleActive(ex)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 99, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap', transition: 'all 0.15s',
                  background: ex.is_active ? '#FFFBE6' : '#f1f5f9',
                  color: ex.is_active ? '#EA580C' : '#94a3b8' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: ex.is_active ? '#EA580C' : '#cbd5e1', flexShrink: 0 }} />
                {ex.is_active ? 'Visible' : 'Hidden'}
              </button>

              {/* Delete */}
              <button onClick={() => deleteExtra(ex)}
                style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #fca5a5', background: '#fff5f5', color: '#dc2626', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                🗑️ Delete
              </button>
            </div>
          ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              <button className="adm-btn-ghost" disabled={safePage <= 1} onClick={() => setPage(p => p - 1)}
                style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13 }}>← Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)}
                  className={safePage === n ? 'adm-btn-primary' : 'adm-btn-ghost'}
                  style={{ padding: '6px 12px', borderRadius: 8, fontSize: 13, minWidth: 36 }}>{n}</button>
              ))}
              <button className="adm-btn-ghost" disabled={safePage >= totalPages} onClick={() => setPage(p => p + 1)}
                style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13 }}>Next →</button>
            </div>
          )}
          </>
        )
      })()}
    </div>
  )
}

// ─── Referrals Tab ─────────────────────────────────────────────────────────
function ReferralsTab({ referrals, setReferrals, flash }) {
  const [noteId,    setNoteId]    = useState(null)
  const [noteText,  setNoteText]  = useState('')
  const [page,      setPage]      = useState(1)

  async function updateReferral(id, update) {
    const { error } = await supabase.from('referrals').update(update).eq('id', id)
    if (!error) {
      setReferrals(p => p.map(r => r.id === id ? { ...r, ...update } : r))
      flash('Updated')
    }
  }

  async function saveNote(id) {
    await updateReferral(id, { notes: noteText.trim() || null })
    setNoteId(null)
    setNoteText('')
  }

  const pending   = referrals.filter(r => r.status === 'pending').length
  const converted = referrals.filter(r => r.status === 'converted').length
  const paidOut   = referrals.filter(r => r.reward_paid).reduce((s, r) => s + (r.reward_amount || 0), 0)
  const pending_reward = referrals.filter(r => r.status === 'converted' && !r.reward_paid).reduce((s, r) => s + (r.reward_amount || 0), 0)

  const STATUS = {
    pending:   { label: 'Pending',   bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
    converted: { label: 'Converted', bg: '#FFFBE6', color: '#1E3070', border: '#FFF1AA' },
    declined:  { label: 'Declined',  bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
  }
  const REFERRALS_PAGE_SIZE = 10
  const totalPages = Math.max(1, Math.ceil(referrals.length / REFERRALS_PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = referrals.slice((safePage - 1) * REFERRALS_PAGE_SIZE, safePage * REFERRALS_PAGE_SIZE)

  return (
    <div style={{ padding: '0 0 48px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Stats bar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {[
          { label: 'Pending',        value: pending,                          icon: '⏳', color: '#92400e', bg: '#FFFBE6', border: '#fde68a' },
          { label: 'Converted',      value: converted,                        icon: '✅', color: '#1E3070', bg: '#FFFDE7', border: '#FFF1AA' },
          { label: 'Paid Out',       value: `£${paidOut}`,                    icon: '💰', color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' },
          ...(pending_reward > 0 ? [{ label: 'Reward Due', value: `£${pending_reward}`, icon: '🎯', color: '#9a3412', bg: '#fff7ed', border: '#fed7aa' }] : []),
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 26 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color, fontFamily: "'Fredoka One', cursive" }}>{s.value}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: s.color, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── List ── */}
      {referrals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8', background: '#fff', borderRadius: 16, border: '2px dashed #e2e8f0' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎁</div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>No referrals yet</div>
          <div style={{ fontSize: 13 }}>They'll appear here when clients share their referral link.</div>
        </div>
      ) : (<>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {paginated.map(r => {
            const s = STATUS[r.status] || STATUS.pending
            const initials = (r.referrer?.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
            return (
              <div key={r.id} style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1.5px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Top row: referrer → friend + status badge + date */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>

                  {/* Referrer avatar + name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 180 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#1E3070,#253080)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F9C800', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                      {initials}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b' }}>{r.referrer?.name || '—'}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.referrer?.email}</div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div style={{ fontSize: 18, color: '#cbd5e1', alignSelf: 'center' }}>→</div>

                  {/* Friend details */}
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{r.referred_name || '—'}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{r.referred_email}</div>
                    {r.referred_phone && <div style={{ fontSize: 12, color: '#64748b' }}>{r.referred_phone}</div>}
                    {r.contacted_at && (
                      <div style={{ fontSize: 11, color: '#EA580C', fontWeight: 700, marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EA580C', display: 'inline-block' }} />
                        Visited link · {new Date(r.contacted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </div>
                    )}
                  </div>

                  {/* Status badge */}
                  <span style={{ fontSize: 12, fontWeight: 800, borderRadius: 99, padding: '4px 12px', background: s.bg, color: s.color, border: `1.5px solid ${s.border}`, alignSelf: 'flex-start', whiteSpace: 'nowrap' }}>
                    {s.label}
                  </span>

                  {/* Date */}
                  <div style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap', alignSelf: 'flex-start', paddingTop: 4 }}>
                    {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>

                {/* Note if present */}
                {r.notes && noteId !== r.id && (
                  <div style={{ background: '#f8f5ff', border: '1px solid #e9d5ff', borderRadius: 8, padding: '7px 12px', fontSize: 12, color: '#6d28d9', fontStyle: 'italic' }}>
                    📝 {r.notes}
                  </div>
                )}

                {/* Note editor */}
                {noteId === r.id && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input autoFocus value={noteText} onChange={e => setNoteText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveNote(r.id); if (e.key === 'Escape') { setNoteId(null); setNoteText('') } }}
                      placeholder="Add a note…"
                      style={{ flex: 1, padding: '7px 12px', border: '1.5px solid #c4b5fd', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                    <button className="adm-btn-primary sm" onClick={() => saveNote(r.id)}>Save</button>
                    <button className="adm-btn-ghost sm" onClick={() => { setNoteId(null); setNoteText('') }}>✕</button>
                  </div>
                )}

                {/* Bottom row: reward + actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
                  {/* Reward status */}
                  <div style={{ flex: 1, fontSize: 13 }}>
                    {r.status === 'converted' && (
                      r.reward_paid
                        ? <span style={{ color: '#EA580C', fontWeight: 700 }}>✅ £{r.reward_amount} reward paid</span>
                        : <span style={{ color: '#D4A800', fontWeight: 700 }}>🎯 £{r.reward_amount} reward pending</span>
                    )}
                  </div>

                  {/* Action buttons */}
                  {r.status === 'pending' && (
                    <>
                      <button className="adm-btn-primary sm" onClick={() => updateReferral(r.id, { status: 'converted' })}>✓ Convert</button>
                      <button className="adm-btn-danger sm" onClick={() => updateReferral(r.id, { status: 'declined' })}>✗ Decline</button>
                    </>
                  )}
                  {r.status === 'converted' && !r.reward_paid && (
                    <button className="adm-btn-primary sm" style={{ background: '#C2410C' }}
                      onClick={() => updateReferral(r.id, { reward_paid: true })}>
                      💰 Mark Reward Paid
                    </button>
                  )}
                  {r.status !== 'pending' && (
                    <button className="adm-btn-ghost sm" onClick={() => updateReferral(r.id, { status: 'pending', reward_paid: false })}>↩ Reset</button>
                  )}
                  <button className="adm-btn-ghost sm" onClick={() => { setNoteId(noteId === r.id ? null : r.id); setNoteText(r.notes || '') }}>
                    📝 {r.notes ? 'Edit Note' : 'Add Note'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, padding: '14px 0 2px', borderTop: '1px solid #f1f5f9', marginTop: 8 }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>
            Showing {(safePage - 1) * REFERRALS_PAGE_SIZE + 1}–{Math.min(safePage * REFERRALS_PAGE_SIZE, referrals.length)} of {referrals.length} referral{referrals.length !== 1 ? 's' : ''}
          </span>
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="adm-btn-ghost sm" disabled={safePage === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '5px 12px' }}>← Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => {
                if (totalPages > 7) {
                  if (n !== 1 && n !== totalPages && Math.abs(n - safePage) > 2) {
                    if (n === safePage - 3 || n === safePage + 3) return <span key={n} style={{ color: '#94a3b8', padding: '0 4px', fontSize: 13 }}>…</span>
                    return null
                  }
                }
                return (
                  <button key={n} onClick={() => setPage(n)}
                    className={n === safePage ? 'adm-btn-primary sm' : 'adm-btn-ghost sm'}
                    style={{ padding: '5px 10px', minWidth: 34, fontWeight: n === safePage ? 800 : 600 }}>
                    {n}
                  </button>
                )
              })}
              <button className="adm-btn-ghost sm" disabled={safePage === totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '5px 12px' }}>Next →</button>
            </div>
          )}
        </div>
      </>)}
    </div>
  )
}

// ─── Reviews Tab ───────────────────────────────────────────────────────────
function ReviewsTab({ reviews }) {
  const [page, setPage] = useState(1)
  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.stars, 0) / reviews.length).toFixed(1)
    : null
  const REVIEWS_PAGE_SIZE = 10
  const totalPages = Math.max(1, Math.ceil(reviews.length / REVIEWS_PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = reviews.slice((safePage - 1) * REVIEWS_PAGE_SIZE, safePage * REVIEWS_PAGE_SIZE)

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2>Client Reviews ({reviews.length})</h2>
        {avg && (
          <span style={{ fontSize: 14, fontWeight: 700, color: '#92400e', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 99, padding: '4px 14px' }}>
            ★ {avg} average
          </span>
        )}
      </div>

      {reviews.length === 0 ? (
        <p style={{ color: '#94a3b8', fontSize: 13 }}>No reviews submitted yet.</p>
      ) : (<>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {paginated.map(r => (
            <div key={r.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{r.client?.name || '—'}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    {r.client?.email} · {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#F9C800', fontSize: 20, letterSpacing: 2 }}>
                    {'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}
                  </span>
                  <span style={{
                    fontSize: 12, fontWeight: 700, borderRadius: 99, padding: '2px 10px',
                    background: r.stars >= 4 ? '#FFFBE6' : r.stars === 3 ? '#fef3c7' : '#fee2e2',
                    color:      r.stars >= 4 ? '#1E3070' : r.stars === 3 ? '#92400e' : '#991b1b',
                  }}>
                    {r.stars}/5
                  </span>
                </div>
              </div>
              {r.body && (
                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, margin: 0, fontStyle: 'italic', borderLeft: '3px solid #e2e8f0', paddingLeft: 12 }}>
                  "{r.body}"
                </p>
              )}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, padding: '14px 0 2px', borderTop: '1px solid #f1f5f9', marginTop: 8 }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>
            Showing {(safePage - 1) * REVIEWS_PAGE_SIZE + 1}–{Math.min(safePage * REVIEWS_PAGE_SIZE, reviews.length)} of {reviews.length} review{reviews.length !== 1 ? 's' : ''}
          </span>
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="adm-btn-ghost sm" disabled={safePage === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '5px 12px' }}>← Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => {
                if (totalPages > 7) {
                  if (n !== 1 && n !== totalPages && Math.abs(n - safePage) > 2) {
                    if (n === safePage - 3 || n === safePage + 3) return <span key={n} style={{ color: '#94a3b8', padding: '0 4px', fontSize: 13 }}>…</span>
                    return null
                  }
                }
                return (
                  <button key={n} onClick={() => setPage(n)}
                    className={n === safePage ? 'adm-btn-primary sm' : 'adm-btn-ghost sm'}
                    style={{ padding: '5px 10px', minWidth: 34, fontWeight: n === safePage ? 800 : 600 }}>
                    {n}
                  </button>
                )
              })}
              <button className="adm-btn-ghost sm" disabled={safePage === totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '5px 12px' }}>Next →</button>
            </div>
          )}
        </div>
      </>)}
    </div>
  )
}

// ─── API Keys Tab ────────────────────────────────────────────────────────────
function ApiKeysTab({ session, flash }) {
  const [keys,       setKeys]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [genModal,   setGenModal]   = useState(false)
  const [keyName,    setKeyName]    = useState('')
  const [generating, setGenerating] = useState(false)
  const [revealKey,  setRevealKey]  = useState(null)
  const [copied,     setCopied]     = useState(false)

  useEffect(() => { loadKeys() }, [])

  async function loadKeys() {
    setLoading(true)
    const { data } = await supabase.from('api_keys').select('*').order('created_at', { ascending: false })
    setKeys(data || [])
    setLoading(false)
  }

  async function generateKey(e) {
    e.preventDefault()
    if (!keyName.trim()) return
    setGenerating(true)
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    const hex     = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
    const fullKey = `bcf_${hex}`
    const prefix  = fullKey.slice(0, 12)
    const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fullKey))
    const keyHash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('')
    const { error } = await supabase.from('api_keys').insert({
      name: keyName.trim(), key_hash: keyHash, key_prefix: prefix, created_by: session.user.id,
    })
    setGenerating(false)
    if (error) { flash('❌ Failed to generate key'); return }
    setRevealKey(fullKey)
    setKeyName('')
    setGenModal(false)
    loadKeys()
  }

  async function revokeKey(id, name) {
    if (!window.confirm(`Revoke "${name}"? Apps using this key will lose access immediately.`)) return
    const { error } = await supabase.from('api_keys').update({ is_active: false }).eq('id', id)
    if (error) { flash('❌ Failed to revoke'); return }
    flash('✅ Key revoked')
    loadKeys()
  }

  async function deleteKey(id, name) {
    if (!window.confirm(`Permanently delete "${name}"?`)) return
    const { error } = await supabase.from('api_keys').delete().eq('id', id)
    if (error) { flash('❌ Failed to delete'); return }
    flash('✅ Key deleted')
    loadKeys()
  }

  function copyKey() {
    navigator.clipboard.writeText(revealKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="adm-apikeys-wrap">

      {/* ── One-time key reveal ────────────────────────────────────── */}
      {revealKey && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 10 }}>🔑</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#1e293b', textAlign: 'center' }}>Your New API Key</h3>
            <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center', margin: '0 0 20px', lineHeight: 1.5 }}>
              Copy this key now — <strong>it will never be shown again.</strong><br />Store it securely in your application.
            </p>
            <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all', color: '#1E3070', marginBottom: 20, userSelect: 'all' }}>
              {revealKey}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={copyKey} style={{ flex: 1, padding: 12, background: '#1E3070', color: '#F9C800', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
                {copied ? '✅ Copied!' : '📋 Copy Key'}
              </button>
              <button onClick={() => { setRevealKey(null); setCopied(false) }} style={{ padding: '12px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Generate key modal ─────────────────────────────────────── */}
      {genModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setGenModal(false) }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: '#1e293b' }}>🔑 Generate New API Key</h3>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 20px' }}>Give this key a name so you know which app uses it.</p>
            <form onSubmit={generateKey} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Key Name</label>
                <input autoFocus type="text" value={keyName} onChange={e => setKeyName(e.target.value)}
                  placeholder="e.g. Field App Integration"
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  required />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={generating || !keyName.trim()}
                  style={{ flex: 1, padding: 12, background: '#1E3070', color: '#F9C800', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer', opacity: generating || !keyName.trim() ? 0.6 : 1 }}>
                  {generating ? 'Generating…' : '🔑 Generate Key'}
                </button>
                <button type="button" onClick={() => setGenModal(false)}
                  style={{ padding: '12px 18px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Page header ───────────────────────────────────────────── */}
      <div className="adm-apikeys-header">
        <div>
          <h2 className="adm-apikeys-title">🔑 API Keys</h2>
          <p className="adm-apikeys-sub">Generate keys to let external apps read and update worker job data.</p>
        </div>
        <button className="adm-apikeys-gen-btn" onClick={() => setGenModal(true)}>+ Generate New Key</button>
      </div>

      {/* ── API reference card ────────────────────────────────────── */}
      <div className="adm-apikeys-ref">
        <div className="adm-apikeys-ref-title">📡 Available Endpoints</div>
        <div className="adm-apikeys-endpoints">
          <div className="adm-endpoint">
            <span className="adm-ep-method get">GET</span>
            <code>/worker-api/orders</code>
            <span>List all orders with worker &amp; client info</span>
          </div>
          <div className="adm-endpoint">
            <span className="adm-ep-method get">GET</span>
            <code>/worker-api/orders/:id</code>
            <span>Single order with all stages and tasks</span>
          </div>
          <div className="adm-endpoint">
            <span className="adm-ep-method patch">PATCH</span>
            <code>/worker-api/stages/:id</code>
            <span>Update stage status — body: <code style={{ background: 'none', border: 'none', fontSize: 12, padding: 0 }}>{`{"status":"pending|in_progress|done"}`}</code></span>
          </div>
          <div className="adm-endpoint">
            <span className="adm-ep-method patch">PATCH</span>
            <code>/worker-api/tasks/:id</code>
            <span>Complete a task — body: <code style={{ background: 'none', border: 'none', fontSize: 12, padding: 0 }}>{`{"completed":true,"notes":"..."}`}</code></span>
          </div>
        </div>
        <div className="adm-apikeys-ref-note">
          Send your key in every request header: <code>x-api-key: bcf_your_key_here</code>
        </div>
      </div>

      {/* ── Keys list ─────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8', fontSize: 14 }}>Loading…</div>
      ) : keys.length === 0 ? (
        <div className="adm-apikeys-empty">
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔑</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#475569' }}>No API keys yet</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Click "Generate New Key" to get started.</div>
        </div>
      ) : (
        <div className="adm-apikeys-list">
          {keys.map(k => (
            <div key={k.id} className={`adm-apikey-row${k.is_active ? '' : ' revoked'}`}>
              <div className="adm-apikey-info">
                <div className="adm-apikey-name">{k.name}</div>
                <div className="adm-apikey-meta">
                  <code className="adm-apikey-prefix">{k.key_prefix}…</code>
                  <span>Created {new Date(k.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  {k.last_used_at
                    ? <span>Last used {new Date(k.last_used_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    : <span style={{ color: '#94a3b8' }}>Never used</span>}
                </div>
              </div>
              <div className="adm-apikey-actions">
                <span className={`adm-apikey-status ${k.is_active ? 'active' : 'revoked'}`}>
                  {k.is_active ? '● Active' : '✕ Revoked'}
                </span>
                {k.is_active && (
                  <button className="adm-apikey-btn revoke" onClick={() => revokeKey(k.id, k.name)}>Revoke</button>
                )}
                <button className="adm-apikey-btn delete" onClick={() => deleteKey(k.id, k.name)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
