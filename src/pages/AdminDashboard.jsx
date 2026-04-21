import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './AdminDashboard.css'

// ─── helpers ───────────────────────────────────────────────────────────────
const fmt = p => `£${p.toLocaleString()}`

// ─── top-level shell ───────────────────────────────────────────────────────
export default function AdminDashboard() {
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

  if (checking) return <div className="adm-loading">Loading…</div>
  if (!session)  return <AdminLogin />
  return <AdminPanel session={session} />
}

// ─── login ─────────────────────────────────────────────────────────────────
function AdminLogin() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [busy, setBusy]         = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setBusy(false)
  }

  return (
    <div className="adm-login-wrap">
      <div className="adm-login-card">
        <img src="/images/bcf.png" alt="BCF" className="adm-login-logo" />
        <h1>Admin Dashboard</h1>
        <p className="adm-login-sub">Ballycastle Climbing Frames</p>
        <form onSubmit={handleSubmit}>
          <label>Email
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
          </label>
          <label>Password
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </label>
          {error && <p className="adm-error">{error}</p>}
          <button type="submit" className="adm-btn-primary" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── main panel ────────────────────────────────────────────────────────────
function AdminPanel({ session }) {
  const [tab, setTab]                   = useState('products')
  const [modules, setModules]           = useState([])
  const [selects, setSelects]           = useState([])
  const [options, setOptions]           = useState([])
  const [surfaces, setSurfaces]         = useState([])
  const [installOpts, setInstallOpts]   = useState([])
  const [quotes, setQuotes]             = useState([])
  const [loading, setLoading]           = useState(true)
  const [saveMsg, setSaveMsg]           = useState('')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [mR, sR, oR, gsR, iR, qR] = await Promise.all([
      supabase.from('modules').select('*').order('sort_order'),
      supabase.from('module_selects').select('*').order('sort_order'),
      supabase.from('module_options').select('*').order('sort_order'),
      supabase.from('ground_surfaces').select('*').order('sort_order'),
      supabase.from('installation_options').select('*').order('sort_order'),
      supabase.from('quotes').select('*').order('created_at', { ascending: false }),
    ])
    setModules(mR.data   || [])
    setSelects(sR.data   || [])
    setOptions(oR.data   || [])
    setSurfaces(gsR.data || [])
    setInstallOpts(iR.data || [])
    setQuotes(qR.data    || [])
    setLoading(false)
  }

  function flash(msg) {
    setSaveMsg(msg)
    setTimeout(() => setSaveMsg(''), 2500)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <div className="adm-wrap">
      <header className="adm-header">
        <div className="adm-header-left">
          <img src="/images/bcf.png" alt="BCF" className="adm-header-logo" />
          <span className="adm-header-title">Admin Dashboard</span>
        </div>
        <div className="adm-header-right">
          <span className="adm-user">{session.user.email}</span>
          <button className="adm-btn-ghost" onClick={handleLogout}>Sign out</button>
        </div>
      </header>

      <nav className="adm-tabs">
        {['products', 'surfaces', 'installation', 'quotes'].map(t => (
          <button
            key={t}
            className={`adm-tab${tab === t ? ' active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'products' ? 'Products & Pricing'
              : t === 'surfaces' ? 'Ground Surfaces'
              : t === 'installation' ? 'Installation'
              : `Quotes${quotes.filter(q => q.status === 'new').length > 0 ? ` (${quotes.filter(q => q.status === 'new').length})` : ''}`}
          </button>
        ))}
      </nav>

      {saveMsg && <div className="adm-save-banner">{saveMsg}</div>}

      <main className="adm-main">
        {loading ? (
          <div className="adm-loading">Loading data…</div>
        ) : tab === 'products' ? (
          <ProductsTab
            modules={modules} selects={selects} options={options}
            setModules={setModules} setSelects={setSelects} setOptions={setOptions}
            reload={loadAll} flash={flash}
          />
        ) : tab === 'surfaces' ? (
          <SurfacesTab surfaces={surfaces} setSurfaces={setSurfaces} flash={flash} />
        ) : tab === 'installation' ? (
          <InstallTab installOpts={installOpts} setInstallOpts={setInstallOpts} flash={flash} />
        ) : (
          <QuotesTab quotes={quotes} setQuotes={setQuotes} flash={flash} />
        )}
      </main>
    </div>
  )
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
  async function saveField(surf, field, value) {
    const update = { [field]: field === 'price' ? parseInt(value, 10) : value }
    const { error } = await supabase.from('ground_surfaces').update(update).eq('id', surf.id)
    if (!error) { setSurfaces(p => p.map(s => s.id === surf.id ? { ...s, ...update } : s)); flash('Saved') }
  }

  async function toggleActive(surf) {
    const { error } = await supabase.from('ground_surfaces').update({ is_active: !surf.is_active }).eq('id', surf.id)
    if (!error) { setSurfaces(p => p.map(s => s.id === surf.id ? { ...s, is_active: !surf.is_active } : s)); flash('Saved') }
  }

  async function addSurface() {
    const value = prompt('Enter a unique key (e.g. wetpour-extra):')
    if (!value) return
    const label = prompt('Display label:')
    if (!label) return
    const price = parseInt(prompt('Price (number only):') || '0', 10)
    const { error } = await supabase.from('ground_surfaces').insert({
      value: value.trim().toLowerCase(), label: label.trim(), price, sort_order: surfaces.length + 1,
    })
    if (error) { alert(error.message); return }
    const { data } = await supabase.from('ground_surfaces').select('*').order('sort_order')
    setSurfaces(data || [])
    flash('Surface added')
  }

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2>Ground Surfaces</h2>
        <button className="adm-btn-primary" onClick={addSurface}>+ Add Surface</button>
      </div>
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
              <strong className="adm-quote-total">£{q.total_price.toLocaleString()}</strong>
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
                      <td><strong>£{q.total_price.toLocaleString()}</strong></td>
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
