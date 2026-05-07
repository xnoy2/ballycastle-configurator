import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ViewerPanel from '../components/ViewerPanel'

const TABS = [
  { id: 'dashboard',    icon: '🏠', label: 'Dashboard'      },
  { id: 'configurator', icon: '🛝', label: 'Configurator'   },
  { id: 'progress',     icon: '🔨', label: 'Build Progress' },
  { id: 'photos',       icon: '📸', label: 'Site Photos'    },
  { id: 'delivery',     icon: '🚚', label: 'Delivery'       },
  { id: 'extras',       icon: '⭐', label: 'Extras & Variations' },
  { id: 'refer',        icon: '🎁', label: 'Refer a Friend' },
  { id: 'reminders',    icon: '🔔', label: 'Reminders'      },
  { id: 'payments',     icon: '💳', label: 'Payments'       },
  { id: 'documents',    icon: '📄', label: 'Documents'      },
]


const ACCESSORIES = ['🪢 Rope Ladder', '🎯 Target Wall', '🛝 Slide', '🪹 Nest Swing', '🌿 Bark Border', '⛺ Den Kit']

const SHARED_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap');
  .bcfp * { box-sizing: border-box; margin: 0; padding: 0; }
  .bcfp ::-webkit-scrollbar { width: 6px; }
  .bcfp ::-webkit-scrollbar-thumb { background: #8B5E3C55; border-radius: 3px; }
  .bcfp .tab-btn { background: none; border: none; cursor: pointer; padding: 8px 14px; border-radius: 10px; font-family: inherit; font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.8); transition: all 0.18s; display: flex; align-items: center; gap: 6px; white-space: nowrap; border-bottom: 3px solid transparent; }
  .bcfp .tab-btn:hover { background: rgba(255,255,255,0.15); color: #fff; }
  .bcfp .tab-btn.active { background: #F9C800; color: #1E3070; border-radius: 10px 10px 0 0; border-bottom: 3px solid #F9C800; font-weight: 800; }
  .bcfp .card { background: #fff; border-radius: 16px; padding: 20px; box-shadow: 0 2px 8px rgba(30,48,112,0.08), 0 1px 3px rgba(0,0,0,0.05); border: 1px solid rgba(30,48,112,0.07); transition: box-shadow 0.2s, transform 0.2s; }
  .bcfp .card:hover { box-shadow: 0 6px 24px rgba(30,48,112,0.13), 0 2px 6px rgba(0,0,0,0.07); }
  .bcfp .btn-green { background: #1E3070; color: #fff; border: none; border-radius: 10px; padding: 10px 20px; font-family: inherit; font-weight: 800; cursor: pointer; font-size: 15px; transition: background 0.15s; }
  .bcfp .btn-green:hover { background: #253080; }
  .bcfp .btn-yellow { background: #F9C800; color: #1E3070; border: none; border-radius: 10px; padding: 10px 20px; font-family: inherit; font-weight: 800; cursor: pointer; font-size: 15px; }
  .bcfp .btn-yellow:hover { background: #D4A800; }
  .bcfp .progress-bar { height: 14px; background: #e0e0e0; border-radius: 99px; overflow: hidden; }
  @keyframes bcf-dig     { 0%,100% { transform: rotate(-25deg) translateY(0); } 50% { transform: rotate(20deg) translateY(2px); } }
  @keyframes bcf-hammer  { 0%,60%  { transform: rotate(0deg); } 30% { transform: rotate(-45deg) translateY(-3px); } 55% { transform: rotate(8deg); } }
  @keyframes bcf-bob     { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
  @keyframes bcf-scan    { 0%,100% { transform: translateX(0); } 50% { transform: translateX(6px); } }
  @keyframes bcf-shake   { 0%,100% { transform: rotate(0deg); } 25% { transform: rotate(-15deg); } 75% { transform: rotate(15deg); } }
  @keyframes bcf-walk    { 0%,100% { transform: translateX(0) scaleX(1); } 48% { transform: translateX(5px) scaleX(1); } 50% { transform: translateX(5px) scaleX(-1); } 98% { transform: translateX(0) scaleX(-1); } }
  .bcf-anim-dig    { display:inline-block; animation: bcf-dig    0.7s ease-in-out infinite; transform-origin: bottom right; }
  .bcf-anim-hammer { display:inline-block; animation: bcf-hammer 0.6s ease-in-out infinite; transform-origin: bottom right; }
  .bcf-anim-bob    { display:inline-block; animation: bcf-bob    1.1s ease-in-out infinite; }
  .bcf-anim-scan   { display:inline-block; animation: bcf-scan   1.2s ease-in-out infinite; }
  .bcf-anim-shake  { display:inline-block; animation: bcf-shake  0.8s ease-in-out infinite; }
  .bcf-anim-walk   { display:inline-block; animation: bcf-walk   2s linear infinite; }
  @keyframes bcf-pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.3); opacity: 0.7; } }
  @keyframes bcf-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
  @keyframes bcf-slide-in { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }
  .bcf-anim-ring { display:inline-block; animation: bcf-pulse 1.2s ease-in-out infinite; }
  .bcf-anim-float  { display:inline-block; animation: bcf-float 2s ease-in-out infinite; }
  .bcf-contact-link { transition: color 0.2s, transform 0.2s, letter-spacing 0.2s !important; }
  .bcf-contact-link:hover { transform: translateX(-2px) scale(1.04) !important; letter-spacing: 0.3px; }
  .bcf-contact-slide { animation: bcf-slide-in 0.5s ease both; }
  .bcf-contact-slide:nth-child(2) { animation-delay: 0.12s; }
  @keyframes bcf-bar-shimmer { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }
  .bcfp .progress-fill { height: 100%; background: linear-gradient(90deg, #D4A800 0%, #F9C800 40%, #FFE566 60%, #D4A800 100%); background-size: 300% 100%; border-radius: 99px; transition: width 1.6s cubic-bezier(0.25, 1, 0.5, 1); animation: bcf-bar-shimmer 2.5s linear infinite; }
  .bcfp .stage-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f0ede8; }
  .bcfp .star-btn { background: none; border: none; font-size: 28px; cursor: pointer; transition: transform 0.1s; }
  .bcfp .star-btn:hover { transform: scale(1.2); }
  .bcfp .acc-chip { background: #FFFBE6; border: 2px dashed #F9C800; border-radius: 10px; padding: 8px 14px; cursor: grab; font-size: 13px; font-weight: 700; color: #A07800; user-select: none; }
  .bcfp .acc-chip:active { cursor: grabbing; opacity: 0.7; }
  .bcfp .placed-item { position: absolute; background: #ffffffdd; border: 2px solid; border-radius: 8px; padding: 4px 8px; font-size: 12px; font-weight: 700; cursor: move; white-space: nowrap; }
  .bcfp .extra-card { border: 2px solid #e53935; border-radius: 14px; padding: 16px; background: #fff; transition: border-color 0.15s, box-shadow 0.15s; }
  .bcfp .extra-card:hover { border-color: #c62828; box-shadow: 0 4px 16px rgba(229,57,53,0.18); }
  .bcfp .tag { display: inline-block; background: #FFFBE6; color: #A07800; border-radius: 99px; padding: 3px 10px; font-size: 12px; font-weight: 700; margin: 2px; }
  .bcfp .mobile-only { display: none !important; }
  .bcfp-menu-dropdown { display: none; position: absolute; top: 100%; right: 0; width: 290px; background: #1E3070; border-radius: 0 0 16px 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.35); z-index: 200; overflow: hidden; }
  .bcfp-menu-dropdown.open { display: block; }
  .bcfp-menu-item { display: flex; align-items: center; gap: 12px; padding: 14px 20px; color: #fff; font-size: 14px; font-weight: 700; text-decoration: none; border: none; background: none; width: 100%; text-align: left; cursor: pointer; font-family: inherit; transition: background 0.15s; }
  .bcfp-menu-item:hover { background: rgba(255,255,255,0.1); }
  .bcfp-menu-divider { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 0; }
  @media (max-width: 700px) {
    .bcfp .grid-2 { grid-template-columns: 1fr !important; }
    .bcfp .grid-3 { grid-template-columns: 1fr 1fr !important; }
    .bcfp .grid-span-2 { grid-column: span 1 !important; }
    .bcfp .refer-form-grid { grid-template-columns: 1fr !important; }
    .bcfp .mobile-hide { display: none !important; }
    .bcfp .mobile-only { display: flex !important; align-items: center; }
    .bcfp .card { padding: 14px !important; }
    .bcfp .tab-btn { padding: 7px 10px !important; font-size: 20px !important; gap: 0 !important; min-width: 40px; justify-content: center; }
    .bcfp .tab-label { display: none !important; }
    .bcfp-nav-scroll { gap: 0 !important; }
    .bcfp .btn-green, .bcfp .btn-yellow { min-height: 44px; }
    .bcfp .star-btn { min-width: 44px; min-height: 44px; }
    .bcfp .sign-out-btn { min-height: 44px; padding: 8px 14px !important; }
    .bcfp-content { padding: 16px 12px !important; }
    .bcfp-header { padding-top: env(safe-area-inset-top, 0px) !important; }
  }
  @media (max-width: 380px) {
    .bcfp .tab-btn { font-size: 17px !important; padding: 6px 8px !important; min-width: 36px; }
    .bcfp .grid-3 { grid-template-columns: 1fr !important; }
  }
  .bcfp-nav-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
  .bcfp-nav-scroll::-webkit-scrollbar { display: none; }
  .bcf-contact-icon { position: relative; }
  .bcf-contact-tooltip { display: none; position: absolute; top: calc(100% + 8px); right: 0; background: #fff; color: #1E3070; font-size: 12px; font-weight: 700; padding: 7px 12px; border-radius: 8px; white-space: nowrap; z-index: 50; pointer-events: none; box-shadow: 0 4px 16px rgba(0,0,0,0.18); border: 1px solid #e2e8f0; }
  .bcf-contact-icon:hover .bcf-contact-tooltip { display: block; }
  .bcf-avatar-dropdown { display: none; position: absolute; top: calc(100% + 10px); right: 0; width: 220px; background: #fff; border-radius: 14px; box-shadow: 0 8px 32px rgba(0,0,0,0.2); z-index: 300; overflow: hidden; border: 1px solid #e2e8f0; }
  .bcf-avatar-dropdown.open { display: block; }
  .bcf-notif-dropdown { display: none; position: absolute; top: calc(100% + 10px); right: 0; width: min(300px, calc(100vw - 24px)); background: #fff; border-radius: 14px; box-shadow: 0 8px 32px rgba(0,0,0,0.2); z-index: 300; overflow: hidden; border: 1px solid #e0ede0; }
  .bcf-notif-dropdown.open { display: block; }
  .bcf-notif-item:hover { background: #FFFDE7 !important; }
`

// ── Soft UI sound — Web Audio API, no files needed ──────────────────────────
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

// ── Login Page ──────────────────────────────────────────────────────────────
function PortalLogin() {
  const [email,   setEmail]   = useState('')
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function sendMagicLink(e) {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) { setError('Please enter a valid email.'); return }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href },
    })
    if (err) { setError(err.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="bcfp" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1E3070 0%, #253080 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <style>{SHARED_STYLES}</style>
      <div style={{ background: '#fff', borderRadius: 20, padding: 40, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src="/images/bcf.png" alt="BCF" style={{ height: 60, marginBottom: 12 }} />
          <h1 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 24, color: '#1E3070', margin: '0 0 4px' }}>Client Portal</h1>
          <p style={{ fontSize: 13, color: '#888' }}>Ballycastle Climbing Frames</p>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📧</div>
            <h2 style={{ fontFamily: "'Fredoka One'", color: '#1E3070', marginBottom: 8 }}>Check Your Email!</h2>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6 }}>
              We've sent a login link to <strong>{email}</strong>.<br />
              Click the link in the email to access your portal.
            </p>
            <p style={{ fontSize: 12, color: '#aaa', marginTop: 12 }}>Didn't receive it? Check your spam folder.</p>
          </div>
        ) : (
          <form onSubmit={sendMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 6 }}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoFocus
                style={{ width: '100%', padding: '12px 14px', border: '2px solid #e0e0e0', borderRadius: 10, fontFamily: 'inherit', fontSize: 14, outline: 'none', transition: 'border-color 0.15s' }}
                onFocus={e => e.target.style.borderColor = '#F9C800'}
                onBlur={e => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>
            {error && <p style={{ color: '#dc2626', fontSize: 12, margin: 0 }}>{error}</p>}
            <button className="btn-green" type="submit" disabled={loading} style={{ opacity: loading ? 0.6 : 1, fontSize: 15, padding: '13px' }}>
              {loading ? 'Sending…' : '✉️ Send Login Link'}
            </button>
            <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center', lineHeight: 1.5 }}>
              We'll email you a secure link — no password needed.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Loading Screen ──────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="bcfp" style={{ minHeight: '100vh', background: '#F8F9FC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{SHARED_STYLES}</style>
      <div style={{ textAlign: 'center' }}>
        <img
          src="https://media1.tenor.com/m/r4Is6XT2oYsAAAAd/playing-swing-playground.gif"
          alt="Kid swinging"
          style={{ width: 280, borderRadius: 20, marginBottom: 16 }}
        />
        <p style={{ fontFamily: "'Fredoka One', cursive", fontSize: 20, color: '#1E3070', margin: '0 0 4px' }}>
          Loading your portal…
        </p>
        <p style={{ fontSize: 13, color: '#64748b' }}>Almost ready to play! 🌳</p>
      </div>
    </div>
  )
}

// ── In-progress stage icon — matches label keywords to an animated emoji ───
function InProgressIcon({ label = '' }) {
  const l = label.toLowerCase()
  if (l.includes('ground') || l.includes('dig') || l.includes('foundation'))
    return <span className="bcf-anim-dig">⛏️</span>
  if (l.includes('frame') || l.includes('construction') || l.includes('build'))
    return <span className="bcf-anim-hammer">🔨</span>
  if (l.includes('material') || l.includes('order') || l.includes('deliver') || l.includes('supply'))
    return <span className="bcf-anim-bob">📦</span>
  if (l.includes('access') || l.includes('install') || l.includes('fit'))
    return <span className="bcf-anim-shake">🪛</span>
  if (l.includes('inspect') || l.includes('check') || l.includes('survey'))
    return <span className="bcf-anim-scan">🔍</span>
  if (l.includes('handover') || l.includes('complete') || l.includes('finish') || l.includes('hand'))
    return <span className="bcf-anim-walk">🧑‍🌾</span>
  if (l.includes('paint') || l.includes('treat') || l.includes('stain'))
    return <span className="bcf-anim-shake">🖌️</span>
  return <span className="bcf-anim-hammer">🏗️</span>
}

// ── Stage Accordion ────────────────────────────────────────────────────────
function StageAccordion({ stage, prevDone }) {
  const [open,    setOpen]    = useState(false)
  const [tasks,   setTasks]   = useState(null) // null = not loaded yet
  const [loading, setLoading] = useState(false)

  // Apply sequential locking — same logic as admin panel
  const effectiveStatus = stage.status === 'done'
    ? 'done'
    : !prevDone
      ? 'pending'
      : stage.status

  const canExpand = effectiveStatus !== 'pending'

  const statusColor = effectiveStatus === 'done' ? '#1E3070' : effectiveStatus === 'in_progress' ? '#1E3070' : '#9e9e9e'
  const bgColor     = effectiveStatus === 'done' ? '#FFFBE6' : effectiveStatus === 'in_progress' ? '#FFF1AA' : '#f5f5f5'
  const borderColor = effectiveStatus === 'done' ? '#F9C800' : effectiveStatus === 'in_progress' ? '#F9C800' : '#e0e0e0'

  async function handleToggle() {
    if (!canExpand) return
    if (!open && tasks === null) {
      setLoading(true)
      const { data } = await supabase
        .from('stage_tasks')
        .select('id, label, completed, notes')
        .eq('stage_id', stage.id)
        .order('created_at')
      setTasks(data || [])
      setLoading(false)
    }
    setOpen(o => !o)
  }

  const doneCount  = (tasks || []).filter(t => t.completed).length
  const totalCount = (tasks || []).length

  return (
    <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: open ? '2px solid #FFF1AA' : '2px solid transparent', transition: 'border-color 0.2s', opacity: !prevDone ? 0.6 : 1 }}>

      {/* Header row */}
      <div
        onClick={handleToggle}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: canExpand ? 'pointer' : 'default', background: open ? '#f8f9ff' : '#fff', transition: 'background 0.15s' }}
      >
        <div style={{ width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, background: bgColor, border: `2px solid ${borderColor}` }}>
          {effectiveStatus === 'done' ? '✅' : effectiveStatus === 'in_progress' ? <InProgressIcon label={stage.label} /> : '⏳'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: statusColor }}>{stage.label}</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
            {effectiveStatus === 'done' && stage.completed_at
              ? `Completed ${new Date(stage.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
              : effectiveStatus === 'in_progress' ? 'Currently in progress…' : 'Upcoming'}
          </div>
        </div>
        {effectiveStatus === 'in_progress' && <span style={{ background: '#FFF1AA', color: '#1E3070', borderRadius: 99, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>⚡ In Progress</span>}
        {effectiveStatus === 'done'        && <span style={{ background: '#FFFBE6', color: '#A07800', borderRadius: 99, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>Done ✓</span>}
        {canExpand && (
          <span style={{ color: '#94a3b8', fontSize: 13, marginLeft: 4 }}>{open ? '▲' : '▼'}</span>
        )}
      </div>

      {/* Expanded: tasks list */}
      {open && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid #f0f4f0' }}>
          {loading ? (
            <p style={{ marginTop: 14, fontSize: 13, color: '#aaa' }}>Loading…</p>
          ) : tasks && tasks.length > 0 ? (
            <>
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginTop: 14, marginBottom: 8 }}>
                {doneCount} of {totalCount} tasks complete
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tasks.map(task => (
                  <div key={task.id} style={{ borderRadius: 10, border: `1px solid ${task.completed ? '#FFF1AA' : '#e2e8f0'}`, background: task.completed ? '#FFFDE7' : '#fafafa', padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${task.completed ? '#EA580C' : '#cbd5e1'}`, background: task.completed ? '#EA580C' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {task.completed && <span style={{ color: '#fff', fontSize: 11, lineHeight: 1 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: task.completed ? '#1E3070' : '#64748b', textDecoration: task.completed ? 'none' : 'none' }}>
                        {task.label}
                      </span>
                    </div>
                    {task.completed && task.notes && (
                      <p style={{ margin: '8px 0 0 30px', fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{task.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p style={{ marginTop: 14, fontSize: 13, color: '#aaa', fontStyle: 'italic' }}>No tasks added for this stage yet.</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Portal ─────────────────────────────────────────────────────────────
export default function BCFPortal() {
  const navigate = useNavigate()
  const [session,         setSession]         = useState(null)
  const [authLoading,     setAuthLoading]     = useState(true)
  const [profile,         setProfile]         = useState(null)
  const [order,           setOrder]           = useState(null)
  const [stages,          setStages]          = useState([])
  const [tab,             setTab]             = useState('dashboard')
  const [extras,          setExtras]          = useState([])
  const [cart,            setCart]            = useState([])
  const [sendingRequest,  setSendingRequest]  = useState(false)
  const [requestSent,     setRequestSent]     = useState(false)
  const [extrasSubTab,    setExtrasSubTab]    = useState('extras')
  const [varRequests,     setVarRequests]     = useState([])
  const [varAgreements,     setVarAgreements]     = useState([])
  const [varAgreementsLoading, setVarAgreementsLoading] = useState(false)
  const [varDesc,         setVarDesc]         = useState('')
  const [varSubmitting,   setVarSubmitting]   = useState(false)
  const [varSubmitted,    setVarSubmitted]    = useState(false)
  const [varErr,          setVarErr]          = useState('')
  const [referCopied,     setReferCopied]     = useState(false)
  const [referrals,       setReferrals]       = useState([])
  const [referForm,       setReferForm]       = useState({ name: '', email: '', phone: '' })
  const [referSending,    setReferSending]    = useState(false)
  const [referSent,       setReferSent]       = useState(false)
  const [referErr,        setReferErr]        = useState('')
  const [reminderMonth,   setReminderMonth]   = useState('January')
  const [reminderNotify,  setReminderNotify]  = useState('Email')
  const [reminderSaving,  setReminderSaving]  = useState(false)
  const [reminderSaved,   setReminderSaved]   = useState(false)
  const [reminderExists,  setReminderExists]  = useState(false)
  const [accessNotes,     setAccessNotes]     = useState('')
  const [savingNotes,     setSavingNotes]     = useState(false)
  const [notesSaved,      setNotesSaved]      = useState(false)
  const [reviewStars,     setReviewStars]     = useState(0)
  const [reviewText,      setReviewText]      = useState('')
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [reviewSubmitting,setReviewSubmitting]= useState(false)
  const [reviewErr,       setReviewErr]       = useState('')
  const [existingReview,  setExistingReview]  = useState(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [payments,         setPayments]         = useState([])
  const [loadingPayments,  setLoadingPayments]  = useState(false)
  const [paymentsLoaded,   setPaymentsLoaded]   = useState(false)
  const [savingsPlan,      setSavingsPlan]      = useState(null)
  const [orderDocs,        setOrderDocs]        = useState([])
  const [loadingDocs,      setLoadingDocs]      = useState(false)
  const [docsLoaded,       setDocsLoaded]       = useState(false)
  const [allPhotos,        setAllPhotos]        = useState([])
  const [allPhotoUrls,     setAllPhotoUrls]     = useState({})
  const [loadingAllPhotos, setLoadingAllPhotos] = useState(false)
  const [selectedPhotoStage, setSelectedPhotoStage] = useState(null)
  const [lightbox,         setLightbox]         = useState(null) // { url, caption }
  const [menuOpen,         setMenuOpen]         = useState(false)
  const [profileForm,      setProfileForm]      = useState({ name: '', phone: '' })
  const [profileSaving,    setProfileSaving]    = useState(false)
  const [profileSaved,     setProfileSaved]     = useState(false)
  const [avatarUploading,  setAvatarUploading]  = useState(false)
  const [avatarOpen,       setAvatarOpen]       = useState(false)
  const [changePwdOpen,    setChangePwdOpen]    = useState(false)
  const [changePwdForm,    setChangePwdForm]    = useState({ current: '', next: '', confirm: '' })
  const [changePwdBusy,    setChangePwdBusy]    = useState(false)
  const [changePwdMsg,     setChangePwdMsg]     = useState('')  // '' | 'success' | error string
  const [notifOpen,        setNotifOpen]        = useState(false)
  const [notifications,    setNotifications]    = useState([])
  const avatarInputRef = useRef(null)
  const [displayPct,      setDisplayPct]      = useState(0)
  const [dragging,        setDragging]        = useState(null)
  const [placed,          setPlaced]          = useState([
    { id: 'frame', label: '🏗️ Your Frame', x: 110, y: 80, color: '#8B5E3C' },
  ])
  const canvasRef = useRef(null)
  const fileRef   = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchData(session.user.id)
      else { setAuthLoading(false); navigate('/login', { replace: true }) }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setSession(null)
        setProfile(null)
        setOrder(null)
        setStages([])
        setAuthLoading(false)
        navigate('/login', { replace: true })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Show review modal when the final stage (Handover Complete) is done and no review yet
  useEffect(() => {
    if (!stages.length || existingReview || reviewSubmitted) return
    const lastStage = stages[stages.length - 1]
    if (lastStage?.status === 'done') {
      const t = setTimeout(() => setShowReviewModal(true), 1200)
      return () => clearTimeout(t)
    }
  }, [stages, existingReview, reviewSubmitted])

  // Realtime: push new notifications as they arrive from the admin
  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) return
    const channel = supabase
      .channel(`notif:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'client_notifications',
        filter: `client_id=eq.${userId}`,
      }, ({ new: notif }) => {
        setNotifications(ns => [notif, ...ns])
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [session?.user?.id])

  async function fetchData(userId) {
    setAuthLoading(true)

    // If this user is a worker, redirect them to the worker panel
    const { data: roleRow } = await supabase
      .from('user_roles').select('role').eq('user_id', userId).single()
    if (roleRow?.role === 'worker' || roleRow?.role === 'admin') {
      await supabase.auth.signOut()
      window.location.href = roleRow.role === 'worker' ? '/worker' : '/admin'
      return
    }

    const [{ data: profileData }, { data: orderData }, { data: extrasData }, { data: referralsData }, { data: reminderData }, { data: reviewData }, { data: notifData }, { data: varReqData }] = await Promise.all([
      supabase.from('client_profiles').select('*').eq('id', userId).single(),
      supabase.from('orders').select('*, worker:worker_profiles(*)').eq('client_id', userId).single(),
      supabase.from('extras').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('referrals').select('*').eq('referrer_id', userId).order('created_at', { ascending: false }),
      supabase.from('reminders').select('*').eq('client_id', userId).maybeSingle(),
      supabase.from('reviews').select('*').eq('client_id', userId).maybeSingle(),
      supabase.from('client_notifications').select('*').eq('client_id', userId).order('created_at', { ascending: false }).limit(30),
      supabase.from('variation_requests').select('*').eq('client_id', userId).order('created_at', { ascending: false }),
    ])
    setNotifications(notifData || [])
    setVarRequests(varReqData || [])
    setExtras(extrasData       || [])
    setReferrals(referralsData || [])
    if (reminderData) {
      setReminderMonth(reminderData.reminder_month)
      setReminderNotify(reminderData.notify_via)
      setReminderExists(true)
    }
    if (reviewData) {
      setExistingReview(reviewData)
      setReviewSubmitted(true)
    }

    if (orderData?.id) {
      const [{ data: stagesData }, { data: pmtsData }, { data: docsData }, { data: savingsPlanData }, { data: varAgreeData }] = await Promise.all([
        supabase.from('build_stages').select('*').eq('order_id', orderData.id).order('stage_number'),
        supabase.from('order_payments').select('*').eq('order_id', orderData.id).order('due_date', { ascending: true }),
        supabase.from('order_documents').select('*').eq('order_id', orderData.id).order('uploaded_at', { ascending: false }),
        supabase.from('savings_plans').select('*').eq('order_id', orderData.id).eq('is_active', true).maybeSingle(),
        supabase.from('order_documents').select('*').eq('order_id', orderData.id).eq('doc_type', 'variation').order('uploaded_at', { ascending: false }),
      ])
      setStages(stagesData || [])
      setPayments(pmtsData || [])
      setOrderDocs(docsData || [])
      setSavingsPlan(savingsPlanData || null)
      setVarAgreements(varAgreeData || [])
      setPaymentsLoaded(true)
      setDocsLoaded(true)
    }

    setProfile(profileData)
    setProfileForm({ name: profileData?.name || '', phone: profileData?.phone || '' })
    setOrder(orderData)
    setAccessNotes(orderData?.access_notes || '')
    setAuthLoading(false)
  }

  async function saveAccessNotes() {
    if (!order?.id) return
    setSavingNotes(true)
    const { error } = await supabase.from('orders').update({ access_notes: accessNotes }).eq('id', order.id)
    setSavingNotes(false)
    if (error) {
      console.error('[AccessNotes] save failed:', error.message)
      alert('Could not save notes — please try again.')
      return
    }
    // Notify worker by email (non-blocking)
    supabase.functions.invoke('notify-worker', {
      body: { order_id: order.id, type: 'access_notes', notes: accessNotes },
    }).catch(console.warn)
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 2500)
  }

  async function submitReview() {
    if (reviewStars === 0) { setReviewErr('Please select a star rating.'); return }
    if (!reviewText.trim()) { setReviewErr('Please write a short review.'); return }
    if (!order?.id) return
    setReviewSubmitting(true)
    setReviewErr('')
    const { data, error } = await supabase.from('reviews').insert({
      order_id:  order.id,
      client_id: session.user.id,
      stars:     reviewStars,
      body:      reviewText.trim(),
    }).select().single()
    setReviewSubmitting(false)
    if (error) { setReviewErr('Something went wrong — please try again.'); return }
    setExistingReview(data)
    setReviewSubmitted(true)
    setTimeout(() => setShowReviewModal(false), 3500)
  }

  async function saveReminder() {
    if (!order?.id) return
    setReminderSaving(true)
    await supabase.from('reminders').upsert({
      order_id:       order.id,
      client_id:      session.user.id,
      reminder_month: reminderMonth,
      notify_via:     reminderNotify,
      is_active:      true,
      updated_at:     new Date().toISOString(),
    }, { onConflict: 'order_id' })
    setReminderSaving(false)
    setReminderExists(true)
    setReminderSaved(true)
    setTimeout(() => setReminderSaved(false), 3000)
  }

  const addToCart = item => {
    if (!cart.find(c => c.id === item.id)) setCart([...cart, item])
  }

  async function sendExtrasRequest() {
    if (!cart.length || !order?.id) return
    setSendingRequest(true)
    const { error } = await supabase.from('order_extra_requests').insert({
      order_id:  order.id,
      client_id: session.user.id,
      items:     cart.map(c => ({ id: c.id, name: c.name, icon: c.icon, price: c.price })),
      total:     cart.reduce((s, c) => s + c.price, 0),
    })
    setSendingRequest(false)
    if (!error) {
      setCart([])
      setRequestSent(true)
      setTimeout(() => setRequestSent(false), 4000)
    }
  }

  async function sendReferral(e) {
    e.preventDefault()
    if (!referForm.name.trim() || !referForm.email.trim()) { setReferErr('Name and email are required.'); return }
    setReferSending(true)
    setReferErr('')
    const { data, error } = await supabase.from('referrals').insert({
      referrer_id:    session.user.id,
      referred_name:  referForm.name.trim(),
      referred_email: referForm.email.trim(),
      referred_phone: referForm.phone.trim() || null,
    }).select().single()
    setReferSending(false)
    if (error) { setReferErr(error.message); return }
    setReferrals(p => [data, ...p])
    setReferForm({ name: '', email: '', phone: '' })
    setReferSent(true)
    setTimeout(() => setReferSent(false), 4000)

    // Send email to the referred friend (non-blocking)
    supabase.functions.invoke('notify-referral', {
      body: {
        referrer_name:  profile?.name?.split(' ')[0] || 'A friend',
        referred_name:  data.referred_name,
        referred_email: data.referred_email,
        referral_link:  `${window.location.origin}/refer/${order?.order_number}`,
      },
    }).catch(console.warn)
  }

  async function loadPayments() {
    if (!order?.id || loadingPayments || paymentsLoaded) return
    setLoadingPayments(true)
    const { data } = await supabase
      .from('order_payments')
      .select('*')
      .eq('order_id', order.id)
      .order('due_date', { ascending: true })
    setPayments(data || [])
    setLoadingPayments(false)
    setPaymentsLoaded(true)
  }

  async function loadDocuments() {
    if (!order?.id || loadingDocs || docsLoaded) return
    setLoadingDocs(true)
    const { data } = await supabase
      .from('order_documents')
      .select('*')
      .eq('order_id', order.id)
      .order('uploaded_at', { ascending: false })
    setOrderDocs(data || [])
    setLoadingDocs(false)
    setDocsLoaded(true)
  }

  async function acknowledgeDocument(docId) {
    const now = new Date().toISOString()
    const { error } = await supabase
      .from('order_documents')
      .update({ acknowledged_at: now, acknowledged_by: session?.user?.id })
      .eq('id', docId)
    if (!error) {
      setOrderDocs(ds => ds.map(d => d.id === docId ? { ...d, acknowledged_at: now } : d))
    }
  }

  async function downloadPortalDocument(filePath) {
    const { data } = await supabase.storage.from('order-documents').createSignedUrl(filePath, 3600)
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
    }
  }

  async function saveProfile() {
    const name  = profileForm.name.trim()
    const phone = profileForm.phone.trim()
    if (!name) return
    setProfileSaving(true)
    await supabase.from('client_profiles').update({ name, phone: phone || null }).eq('id', session.user.id)
    setProfile(p => ({ ...p, name, phone }))
    setProfileSaving(false)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2500)
  }

  async function uploadAvatar(file) {
    if (!file) return
    setAvatarUploading(true)
    const ext  = file.name.split('.').pop()
    const path = `${session.user.id}/avatar.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!error) {
      const publicUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
      // bust cache with timestamp
      const avatarUrl = `${publicUrl}?t=${Date.now()}`
      await supabase.from('client_profiles').update({ avatar_url: avatarUrl }).eq('id', session.user.id)
      setProfile(p => ({ ...p, avatar_url: avatarUrl }))
    }
    setAvatarUploading(false)
  }

  async function markNotifRead(notifId) {
    await supabase.from('client_notifications').update({ read: true }).eq('id', notifId)
    setNotifications(ns => ns.map(n => n.id === notifId ? { ...n, read: true } : n))
  }

  async function markAllNotifsRead() {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    if (!unreadIds.length) return
    await supabase.from('client_notifications').update({ read: true }).in('id', unreadIds)
    setNotifications(ns => ns.map(n => ({ ...n, read: true })))
  }

  function notifRoute(title = '') {
    if (title.startsWith('💰') || title.startsWith('✅ Payment'))
      return { tab: 'payments' }
    if (title.startsWith('🔨') || title.startsWith('✅ Stage'))
      return { tab: 'progress' }
    if (title.startsWith('📄'))
      return { tab: 'documents' }
    if (title.startsWith('📋'))
      return { tab: 'extras', subTab: 'agreements' }
    if (title.startsWith('📝'))
      return { tab: 'extras', subTab: 'variation' }
    if (title.startsWith('⭐') || title.startsWith('❌'))
      return { tab: 'extras', subTab: 'extras' }
    if (title.startsWith('📅') || title.startsWith('🕐'))
      return { tab: 'delivery' }
    return null
  }

  function handleNotifClick(n) {
    if (!n.read) markNotifRead(n.id)
    setNotifOpen(false)
    const route = notifRoute(n.title)
    if (!route) return
    setTab(route.tab)
    if (route.tab === 'extras' && route.subTab) setExtrasSubTab(route.subTab)
  }

  async function submitVariation() {
    if (!varDesc.trim()) { setVarErr('Please describe your variation request.'); return }
    if (!order?.id) return
    setVarSubmitting(true)
    setVarErr('')
    const { data, error } = await supabase.from('variation_requests').insert({
      order_id:    order.id,
      client_id:   session.user.id,
      description: varDesc.trim(),
    }).select().single()
    setVarSubmitting(false)
    if (error) { setVarErr('Something went wrong — please try again.'); return }
    setVarRequests(p => [data, ...p])
    setVarDesc('')
    setVarSubmitted(true)
    setTimeout(() => setVarSubmitted(false), 4000)
  }

  async function loadVarAgreements() {
    if (!order?.id || varAgreementsLoading) return
    setVarAgreementsLoading(true)
    const { data } = await supabase
      .from('order_documents')
      .select('*')
      .eq('order_id', order.id)
      .eq('doc_type', 'variation')
      .order('uploaded_at', { ascending: false })
    setVarAgreements(data || [])
    setVarAgreementsLoading(false)
  }

  async function loadAllPhotos() {
    if (!order?.id || loadingAllPhotos) return
    setLoadingAllPhotos(true)
    const { data } = await supabase
      .from('order_photos')
      .select('*, stage:build_stages(label), task:stage_tasks(label, notes)')
      .eq('order_id', order.id)
      .order('created_at', { ascending: true })
    const list = data || []
    setAllPhotos(list)
    const urls = {}
    await Promise.all(list.map(async p => {
      const { data: u } = await supabase.storage
        .from('order-photos')
        .createSignedUrl(p.storage_path, 3600)
      if (u?.signedUrl) urls[p.id] = u.signedUrl
    }))
    setAllPhotoUrls(urls)
    setLoadingAllPhotos(false)
  }

  const handleDrop = e => {
    e.preventDefault()
    if (!dragging || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    setPlaced([...placed, { id: Date.now(), label: dragging, x: e.clientX - rect.left - 30, y: e.clientY - rect.top - 20, color: '#F9C800' }])
    setDragging(null)
  }

  useEffect(() => {
    if (!stages.length) return
    const pct = Math.round((stages.filter(s => s.status === 'done').length / stages.length) * 100)
    if (pct === 0) return
    const t = setTimeout(() => setDisplayPct(pct), 200)
    return () => clearTimeout(t)
  }, [stages])

  if (authLoading) return <LoadingScreen />
  if (!session)    return null

  // ── Derived values from real data ────────────────────────────────────────
  const rawName       = profile?.name || session.user.email
  const clientName    = rawName.includes('@')
    ? rawName.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : rawName
  const firstName     = clientName.split(' ')[0]
  const avatarUrl     = profile?.avatar_url || null
  const initials      = clientName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const orderNumber   = order?.order_number || '—'
  const doneCount     = stages.filter(s => s.status === 'done').length
  const progressPct   = stages.length > 0 ? Math.round((doneCount / stages.length) * 100) : 0
  const activeStage   = stages.find(s => s.status === 'in_progress') || stages.find(s => s.status === 'pending')
  const installDate   = order?.installation_date
    ? new Date(order.installation_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'TBC'
  const installWindow = order?.installation_window || 'TBC'
  const address       = order?.address || '—'
  const workerName    = order?.worker?.name  || 'BCF Team'
  const workerPhone   = order?.worker?.phone || '028 2044 0670'
  const unreadCount   = notifications.filter(n => !n.read).length

  // Build completion — all stages must be 'done' (including final Handover)
  const buildComplete = stages.length > 0 && stages.every(s => s.status === 'done')

  // Payment / document alert helpers
  const _today = new Date(); _today.setHours(0, 0, 0, 0)
  const getPayStatus = (p) => {
    if (p.status === 'paid') return 'paid'
    if (!p.due_date) return 'upcoming'
    const d = new Date(p.due_date); d.setHours(0, 0, 0, 0)
    if (d < _today) return 'overdue'
    if ((d - _today) / 86400000 <= 7) return 'due'
    return 'upcoming'
  }
  const payAlerts = payments.filter(p =>
    (p.type === 'invoice' || p.type === 'amendment' || !p.type) && ['overdue', 'due'].includes(getPayStatus(p))
  )
  const paymentAlertType = payAlerts.some(p => getPayStatus(p) === 'overdue') ? 'overdue' : payAlerts.length > 0 ? 'due' : null
  const docAlertCount = orderDocs.filter(d => !d.acknowledged_at).length
  const varAlertCount = varAgreements.filter(d => !d.acknowledged_at).length

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: '#F8F9FC', minHeight: '100vh' }}>
      <style>{SHARED_STYLES}</style>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="bcfp bcfp-header" style={{ background: '#1E3070', padding: '0 20px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,0,0,0.25)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, paddingBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/images/bcf.png" alt="BCF" style={{ height: 36, width: 'auto' }} />
            <div>
              <div className="mobile-hide" style={{ fontFamily: "'Fredoka One', cursive", fontSize: 18, color: '#fff', letterSpacing: 1 }}>Ballycastle Climbing Frames</div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: 700 }}>Client Portal</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Desktop: WA + Email — compact icon buttons */}
            <div className="mobile-hide" style={{ display: 'flex', gap: 5, alignItems: 'center' }}>

              {/* WhatsApp */}
              <div className="bcf-contact-icon">
                <a href="https://wa.me/447851388660" target="_blank" rel="noopener noreferrer"
                  style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 1px 4px rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0, transition: 'box-shadow 0.15s, transform 0.15s' }}
                  onMouseOver={e => { e.currentTarget.style.boxShadow='0 3px 10px rgba(30,48,112,0.28)'; e.currentTarget.style.transform='translateY(-1px)' }}
                  onMouseOut={e => { e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.18)'; e.currentTarget.style.transform='' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.119 1.529 5.845L.057 23.428a.5.5 0 0 0 .609.61l5.703-1.49A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 0 1-5.031-1.388l-.36-.214-3.733.975.999-3.64-.235-.374A9.785 9.785 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                  </svg>
                </a>
                <div className="bcf-contact-tooltip">07851 388660</div>
              </div>

              {/* Email */}
              <div className="bcf-contact-icon">
                <a href="mailto:Info@ballycastleclimbingframes.co.uk"
                  style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 1px 4px rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0, transition: 'box-shadow 0.15s, transform 0.15s' }}
                  onMouseOver={e => { e.currentTarget.style.boxShadow='0 3px 10px rgba(30,48,112,0.28)'; e.currentTarget.style.transform='translateY(-1px)' }}
                  onMouseOut={e => { e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.18)'; e.currentTarget.style.transform='' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1E3070" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="3"/>
                    <path d="M2 7l10 7 10-7"/>
                  </svg>
                </a>
                <div className="bcf-contact-tooltip">Info@ballycastleclimbingframes.co.uk</div>
              </div>
            </div>

            {/* Notification bell — visible on both desktop and mobile */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => { setNotifOpen(o => !o); setAvatarOpen(false); setMenuOpen(false) }}
                style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 1px 4px rgba(0,0,0,0.18)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', fontFamily: 'inherit', flexShrink: 0, transition: 'box-shadow 0.15s, transform 0.15s' }}
                onMouseOver={e => { e.currentTarget.style.boxShadow='0 3px 10px rgba(30,48,112,0.28)'; e.currentTarget.style.transform='translateY(-1px)' }}
                onMouseOut={e => { e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.18)'; e.currentTarget.style.transform='' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1E3070" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: -2, right: -2, minWidth: 14, height: 14, background: '#ef4444', borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff', border: '1.5px solid #1E3070', padding: '0 3px', lineHeight: 1 }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {/* Notification dropdown */}
              <div className={`bcf-notif-dropdown${notifOpen ? ' open' : ''}`}>
                <div style={{ padding: '13px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: 15, color: '#1E3070' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={e => { e.stopPropagation(); markAllNotifsRead() }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#1E3070', fontFamily: 'inherit', padding: '2px 6px', borderRadius: 6, transition: 'background 0.15s' }}
                      onMouseOver={e => e.currentTarget.style.background = '#FFFBE6'}
                      onMouseOut={e => e.currentTarget.style.background = 'none'}>
                      ✓ Mark all read
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: '#aaa', fontSize: 13 }}>No notifications yet</div>
                ) : (
                  <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                    {notifications.map(n => {
                      const hasRoute = !!notifRoute(n.title)
                      return (
                        <div key={n.id} className="bcf-notif-item" onClick={() => handleNotifClick(n)}
                          style={{ padding: '11px 16px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer', background: n.read ? '#fff' : '#FFFDE7', display: 'flex', gap: 10, alignItems: 'flex-start', transition: 'background 0.15s' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: n.read ? 600 : 800, fontSize: 13, color: '#1E3070', marginBottom: 2 }}>{n.title}</div>
                            {n.body && <div style={{ fontSize: 12, color: '#666', lineHeight: 1.4 }}>{n.body}</div>}
                            <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
                              {new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, marginTop: 2 }}>
                            {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F9C800' }} />}
                            {hasRoute && <span style={{ fontSize: 10, color: '#94a3b8' }}>›</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              {notifOpen && <div onClick={() => setNotifOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 299 }} />}
            </div>

            {/* Divider — desktop only */}
            <div className="mobile-hide" style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.2)', margin: '0 2px' }} />

            {/* Desktop: first name + avatar with dropdown */}
            <div className="mobile-hide" style={{ position: 'relative' }}>
              <div onClick={() => { setAvatarOpen(o => !o); setNotifOpen(false) }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 8px', borderRadius: 99, background: avatarOpen ? 'rgba(255,255,255,0.15)' : 'transparent', transition: 'background 0.15s' }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>{firstName}</span>
                <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${avatarOpen ? '#F9C800' : 'rgba(255,255,255,0.5)'}`, flexShrink: 0, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.15s' }}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt={firstName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>{initials}</span>}
                </div>
              </div>
              <div className={`bcf-avatar-dropdown${avatarOpen ? ' open' : ''}`}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#F9C800', fontSize: 11, fontWeight: 700, marginBottom: 3 }}>Welcome</div>
                  <div style={{ color: '#1E3070', fontWeight: 800, fontSize: 15 }}>{clientName}</div>
                  <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>Order #{orderNumber}</div>
                </div>
                <button className="bcfp-menu-item" style={{ fontSize: 13, color: '#1E3070' }} onClick={() => { setAvatarOpen(false); setTab('profile') }}>
                  <span style={{ fontSize: 16 }}>👤</span> My Profile
                </button>
                <button className="bcfp-menu-item" style={{ fontSize: 13, color: '#1E3070' }} onClick={() => { setAvatarOpen(false); setChangePwdOpen(true); setChangePwdMsg(''); setChangePwdForm({ current: '', next: '', confirm: '' }) }}>
                  <span style={{ fontSize: 16 }}>🔑</span> Change Password
                </button>
                <hr className="bcfp-menu-divider" style={{ borderColor: '#e2e8f0' }} />
                <button className="bcfp-menu-item" style={{ fontSize: 13, color: '#dc2626' }} onClick={() => { setAvatarOpen(false); supabase.auth.signOut() }}>
                  <span style={{ fontSize: 16 }}>🚪</span> Sign Out
                </button>
              </div>
              {avatarOpen && <div onClick={() => setAvatarOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 299 }} />}
            </div>
            {/* Mobile: hamburger menu */}
            <div className="mobile-only" style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(o => !o)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, color: '#fff', width: 42, height: 42, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, padding: 0 }}>
                <span style={{ display: 'block', width: 20, height: 2, background: '#fff', borderRadius: 2, transition: 'all 0.2s', transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
                <span style={{ display: 'block', width: 20, height: 2, background: '#fff', borderRadius: 2, transition: 'all 0.2s', opacity: menuOpen ? 0 : 1 }} />
                <span style={{ display: 'block', width: 20, height: 2, background: '#fff', borderRadius: 2, transition: 'all 0.2s', transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
              </button>
              {/* Dropdown */}
              <div className={`bcfp-menu-dropdown${menuOpen ? ' open' : ''}`}>
                {/* Profile */}
                <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div onClick={() => { setTab('profile'); setMenuOpen(false) }}
                    style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', border: '2px solid #FFD740', cursor: 'pointer', flexShrink: 0, background: '#253080', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {avatarUrl
                      ? <img src={avatarUrl} alt={firstName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>{initials}</span>}
                  </div>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>👋 {firstName}</div>
                    <div style={{ color: '#FFD740', fontSize: 12, marginTop: 2 }}>Order #{orderNumber}</div>
                  </div>
                </div>
                {/* Contact */}
                <div style={{ padding: '8px 0 4px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ padding: '4px 20px 8px', color: '#FFD740', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Contact Us</div>
                  <a href="https://wa.me/447851388660" target="_blank" rel="noopener noreferrer" className="bcfp-menu-item"
                    onClick={() => setMenuOpen(false)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.119 1.529 5.845L.057 23.428a.5.5 0 0 0 .609.61l5.703-1.49A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 0 1-5.031-1.388l-.36-.214-3.733.975.999-3.64-.235-.374A9.785 9.785 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                    </svg>
                    07851 388660
                  </a>
                  <a href="mailto:Info@ballycastleclimbingframes.co.uk" className="bcfp-menu-item"
                    onClick={() => setMenuOpen(false)}
                    style={{ alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>✉️</span>
                    <span style={{ wordBreak: 'break-all', fontSize: 13 }}>Info@ballycastleclimbingframes.co.uk</span>
                  </a>
                </div>
                {/* Profile link */}
                <div style={{ padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <button className="bcfp-menu-item" onClick={() => { setMenuOpen(false); setTab('profile') }}>
                    <span style={{ fontSize: 18 }}>👤</span>
                    My Profile
                  </button>
                </div>
                {/* Sign out */}
                <div style={{ padding: '8px 0' }}>
                  <button className="bcfp-menu-item" onClick={() => { setMenuOpen(false); supabase.auth.signOut() }}
                    style={{ color: '#ff8a80' }}>
                    <span style={{ fontSize: 18 }}>🚪</span>
                    Sign Out
                  </button>
                </div>
              </div>
              {/* Backdrop to close menu */}
              {menuOpen && (
                <div onClick={() => setMenuOpen(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
              )}
            </div>
          </div>
        </div>

        {/* NAV TABS */}
        <div className="bcfp bcfp-nav-scroll" style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', gap: 2, flexWrap: 'nowrap', paddingBottom: 8, borderTop: '1px solid rgba(30,48,112,0.15)', paddingTop: 8 }}>
          {TABS.map(t => {
            const badge = t.id === 'payments' ? payAlerts.length : t.id === 'documents' ? docAlertCount : t.id === 'extras' ? varAlertCount : 0
            const badgeColor = t.id === 'documents' ? '#1565c0' : t.id === 'extras' ? '#1565c0' : paymentAlertType === 'overdue' ? '#c62828' : '#D4A800'
            return (
              <button key={t.id} className={`bcfp tab-btn${tab === t.id ? ' active' : ''}`}
                onClick={() => { playPop(); setTab(t.id) }}>
                <span style={{ position: 'relative', display: 'inline-block', lineHeight: 1 }}>
                  {t.icon}
                  {badge > 0 && (
                    <span style={{
                      position: 'absolute', top: -5, right: -9,
                      background: badgeColor, color: '#fff',
                      borderRadius: 99, minWidth: 15, height: 15, padding: '0 3px',
                      fontSize: 9, fontWeight: 900,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.35)', lineHeight: 1,
                    }}>{badge}</span>
                  )}
                </span>
                <span className="tab-label">{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── CONTENT ────────────────────────────────────────────────── */}
      <div className="bcfp bcfp-content" style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 20px' }}>

        {/* DASHBOARD */}
        {tab === 'dashboard' && (
          <div>
            {paymentAlertType && (
              <div style={{
                background: paymentAlertType === 'overdue' ? '#ffebee' : '#fffde7',
                border: `2px solid ${paymentAlertType === 'overdue' ? '#ef9a9a' : '#F9C800'}`,
                borderRadius: 12, padding: '14px 18px', marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
              }} onClick={() => setTab('payments')}>
                <span style={{ fontSize: 26, flexShrink: 0 }}>{paymentAlertType === 'overdue' ? '🔴' : '⚠️'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: paymentAlertType === 'overdue' ? '#c62828' : '#D4A800' }}>
                    {paymentAlertType === 'overdue'
                      ? `${payAlerts.filter(p => getPayStatus(p) === 'overdue').length} Payment${payAlerts.filter(p => getPayStatus(p) === 'overdue').length > 1 ? 's' : ''} Overdue`
                      : `Payment${payAlerts.length > 1 ? 's' : ''} Due Soon`}
                  </div>
                  <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>
                    {paymentAlertType === 'overdue'
                      ? 'Please settle your outstanding balance to avoid delays to your build.'
                      : 'You have a payment due within 7 days — tap to view details.'}
                  </div>
                </div>
                <span style={{ color: '#bbb', fontSize: 22, fontWeight: 300 }}>›</span>
              </div>
            )}
            {docAlertCount > 0 && (
              <div style={{
                background: '#e3f2fd', border: '2px solid #90caf9',
                borderRadius: 12, padding: '14px 18px', marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
              }} onClick={() => setTab('documents')}>
                <span style={{ fontSize: 26, flexShrink: 0 }}>📄</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#1565c0' }}>
                    {docAlertCount} Document{docAlertCount > 1 ? 's' : ''} Need{docAlertCount === 1 ? 's' : ''} Your Review
                  </div>
                  <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>
                    BCF has uploaded new documents — please review and acknowledge.
                  </div>
                </div>
                <span style={{ color: '#bbb', fontSize: 22, fontWeight: 300 }}>›</span>
              </div>
            )}
            <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div className="card" style={{ background: '#fff', borderTop: '4px solid #1E3070', borderRadius: '0 0 16px 16px' }}>
                <div style={{ fontFamily: "'Fredoka One'", fontSize: 20, color: '#1E3070', marginBottom: 8 }}>🏗️ Your Build</div>
                <div style={{ marginBottom: 8, fontWeight: 700, fontSize: 14, color: '#334155' }}>
                  {activeStage?.label || 'Complete'} — {progressPct}% Complete
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${displayPct}%` }} /></div>
                <div style={{ marginTop: 10, color: '#64748b', fontWeight: 600, fontSize: 13 }}>
                  📅 {doneCount} of {stages.length} stages complete
                </div>
                <button className="btn-green" style={{ marginTop: 14, fontSize: 13 }} onClick={() => setTab('progress')}>View Progress →</button>
              </div>

              <div className="card" style={{ background: '#fff', borderTop: '4px solid #F9C800', borderRadius: '0 0 16px 16px' }}>
                <div style={{ fontFamily: "'Fredoka One'", fontSize: 20, color: '#1E3070', marginBottom: 8 }}>📅 Installation Date</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: '#1E3070', fontFamily: "'Fredoka One'" }}>{installDate}</div>
                <div style={{ color: '#475569', fontSize: 13, fontWeight: 600, marginTop: 4 }}>{installWindow}</div>
                {address !== '—' && <div style={{ color: '#64748b', fontSize: 12, marginTop: 6 }}>📍 {address}</div>}
                <button className="btn-green" style={{ marginTop: 14, fontSize: 13, background: '#F9C800', color: '#1E3070' }} onClick={() => setTab('delivery')}>Delivery Details →</button>
              </div>
            </div>

            <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
              {[
                { icon: '💳', title: 'Payments',      desc: 'Track your balance',     id: 'payments',     accent: '#1E3070', iconBg: '#EDE9FE' },
                { icon: '⭐', title: 'Add Extras',    desc: 'Upgrade your frame',     id: 'extras',       accent: '#F9C800', iconBg: '#FEF3C7' },
                { icon: '🎁', title: 'Refer a Friend', desc: 'Earn £50 reward',       id: 'refer',        accent: '#E85555', iconBg: '#FFE4E6' },
              ].map(c => (
                <div key={c.id} className="card" style={{ background: '#fff', borderTop: `4px solid ${c.accent}`, borderRadius: '0 0 16px 16px', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
                  onClick={() => { playPop(); setTab(c.id) }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 28px rgba(0,0,0,0.1)` }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
                  <div style={{ width: 62, height: 62, borderRadius: '50%', background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, marginBottom: 14 }}>{c.icon}</div>
                  <div style={{ fontFamily: "'Fredoka One'", fontSize: 17, color: '#1E3070', marginTop: 2 }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{c.desc}</div>
                </div>
              ))}
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20, opacity: buildComplete ? 1 : 0.6 }}>
              <div>
                <div style={{ fontFamily: "'Fredoka One'", fontSize: 17, color: '#1E3070' }}>
                  {buildComplete ? '🔔' : '🔒'} Annual Maintenance Reminder
                </div>
                <div style={{ fontSize: 13, color: '#666' }}>
                  {buildComplete
                    ? 'Get a free yearly reminder to keep your frame in top condition'
                    : 'Available once your build is handed over and complete'}
                </div>
              </div>
              <button
                className="btn-green"
                onClick={() => setTab('reminders')}
                disabled={!buildComplete}
                style={{
                  background: buildComplete ? undefined : '#e2e8f0',
                  color:      buildComplete ? undefined : '#94a3b8',
                  cursor:     buildComplete ? 'pointer' : 'not-allowed',
                }}
              >
                {buildComplete ? 'Set Up Free Reminder' : '🔒 Locked'}
              </button>
            </div>

            <div style={{ background: '#1E3070', borderRadius: 16, padding: '16px 24px', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 12 }}>
              {[['🏗️', '500+', 'Builds Completed'], ['⭐', '5-Star', 'Client Reviews'], ['🌳', '15+', 'Years Experience']].map(([icon, num, label]) => (
                <div key={label} style={{ textAlign: 'center', color: '#fff' }}>
                  <div style={{ fontSize: 20 }}>{icon}</div>
                  <div style={{ fontFamily: "'Fredoka One'", fontSize: 22, color: '#F9C800' }}>{num}</div>
                  <div style={{ fontSize: 11, color: '#FFE082' }}>{label}</div>
                </div>
              ))}
              <div style={{ textAlign: 'center', color: '#fff' }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>👷 {workerName}</div>
                <div style={{ fontSize: 13, color: '#FFD740' }}>{workerPhone}</div>
              </div>
            </div>
          </div>
        )}

        {/* CONFIGURATOR — real app blurred behind coming soon card */}
        {tab === 'configurator' && (
          <div style={{ margin: '-24px -20px', position: 'relative', height: 'calc(100dvh - 108px)', overflow: 'hidden' }}>
            {/* 3D viewer only — blurred + dimmed. inert freezes ALL events including Three.js canvas listeners */}
            <div
              inert=""
              style={{ position: 'absolute', inset: 0, filter: 'blur(5px) brightness(0.6)', pointerEvents: 'none', userSelect: 'none', transform: 'scale(1.04)', transformOrigin: 'center', overflow: 'hidden' }}
            >
              <ViewerPanel totalPrice={0} lineItems={[]} warnings={[]} activeGlbParts={[]} hasAnyGlb={false} />
            </div>
            {/* Transparent blocker — catches any scroll/wheel/touch that slips past inert */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}
              onWheel={e => e.stopPropagation()}
              onTouchMove={e => e.stopPropagation()}
              onMouseDown={e => e.stopPropagation()}
            />
            {/* Coming soon overlay */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <div style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 24, padding: '40px 48px', textAlign: 'center', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🛝</div>
                <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 32, color: '#F9C800', marginBottom: 8, letterSpacing: 0.5 }}>Coming Soon!</div>
                <div style={{ fontSize: 16, color: '#fff', fontWeight: 700, marginBottom: 10 }}>3D Frame Configurator</div>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: 24 }}>
                  We're putting the finishing touches on your personalised frame designer. You'll be able to customise every detail of your climbing frame right here.
                </p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.4)', borderRadius: 99, padding: '8px 18px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F9C800', display: 'inline-block', animation: 'bcf-pulse 1.4s ease-in-out infinite' }} />
                  <span style={{ color: '#F9C800', fontWeight: 800, fontSize: 13 }}>In Development</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BUILD PROGRESS */}
        {tab === 'progress' && (
          <div>
            <h2 style={{ fontFamily: "'Fredoka One'", fontSize: 26, color: '#1E3070', marginBottom: 16 }}>🔨 Build Progress</h2>
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 800 }}>Overall Progress</span>
                <span style={{ fontFamily: "'Fredoka One'", color: '#F9C800', fontSize: 18 }}>{progressPct}%</span>
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${displayPct}%` }} /></div>
            </div>
            {stages.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>Build stages are being set up…</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {stages.map((s, i) => <StageAccordion key={s.id} stage={s} prevDone={i === 0 || stages[i - 1].status === 'done'} />)}
              </div>
            )}
          </div>
        )}

        {/* SITE PHOTOS */}
        {tab === 'photos' && (() => {
          if (allPhotos.length === 0 && !loadingAllPhotos) loadAllPhotos()

          // A stage is accessible only if done, OR in_progress AND every prior stage is done
          const accessibleStageIds = new Set(
            stages.filter((s, idx) => {
              if (s.status === 'done') return true
              if (s.status === 'pending') return false
              return stages.slice(0, idx).every(prev => prev.status === 'done')
            }).map(s => s.id)
          )
          const photosByStageId = {}
          allPhotos.forEach(p => {
            if (!p.stage_id || !accessibleStageIds.has(p.stage_id)) return
            if (!photosByStageId[p.stage_id]) photosByStageId[p.stage_id] = []
            photosByStageId[p.stage_id].push(p)
          })

          // Active stage — default to first stage
          const activeStage = stages.find(s => s.id === selectedPhotoStage) || stages[0] || null
          const visiblePhotos = activeStage ? (photosByStageId[activeStage.id] || []) : []

          const STATUS_CONFIG = {
            done:        { icon: '✅', color: '#1E3070', bg: '#FFFBE6', border: '#F9C800'  },
            in_progress: { icon: '🔨', color: '#1E3070', bg: '#FFF1AA', border: '#F9C800'  },
            pending:     { icon: '⏳', color: '#9e9e9e', bg: '#f5f5f5', border: '#e0e0e0' },
          }

          return (
            <div>
              <h2 style={{ fontFamily: "'Fredoka One'", fontSize: 26, color: '#1E3070', marginBottom: 20 }}>📸 Site Photos</h2>

              {stages.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 60 }}>
                  <div style={{ fontSize: 56, marginBottom: 14 }}>🏗️</div>
                  <p style={{ fontFamily: "'Fredoka One'", fontSize: 20, color: '#1E3070', marginBottom: 8 }}>Build stages are being set up…</p>
                </div>
              ) : (
                <>
                  {/* ── Stage pills — all stages, status-coloured ── */}
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 24, flexWrap: 'wrap' }}>
                    {stages.map(stage => {
                      const isActive  = stage.id === activeStage?.id
                      const cfg       = STATUS_CONFIG[stage.status] || STATUS_CONFIG.pending
                      const photoCount = (photosByStageId[stage.id] || []).length
                      return (
                        <button
                          key={stage.id}
                          disabled={!accessibleStageIds.has(stage.id)}
                          onClick={() => accessibleStageIds.has(stage.id) && setSelectedPhotoStage(stage.id)}
                          style={{
                            padding: '9px 16px', border: `2px solid ${isActive ? cfg.border : '#e0e0e0'}`,
                            borderRadius: 99, cursor: !accessibleStageIds.has(stage.id) ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit', fontWeight: 700,
                            fontSize: 13, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6,
                            background: isActive ? cfg.bg : '#fff',
                            color:      isActive ? cfg.color : '#666',
                            boxShadow:  isActive ? `0 3px 12px rgba(0,0,0,.12)` : '0 1px 4px rgba(0,0,0,.06)',
                            transition: 'all 0.18s',
                            opacity: !accessibleStageIds.has(stage.id) ? 0.4 : 1,
                          }}>
                          <span style={{ fontSize: 14 }}>
                            {isActive ? <InProgressIcon label={stage.label} /> : cfg.icon}
                          </span>
                          {stage.label}
                          {photoCount > 0 && (
                            <span style={{
                              fontSize: 10, fontWeight: 800, borderRadius: 99, padding: '1px 7px',
                              background: isActive ? cfg.color : '#e0e0e0',
                              color: isActive ? '#fff' : '#555',
                            }}>
                              {photoCount}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* ── Selected stage info bar ── */}
                  {activeStage && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, padding: '10px 16px', background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,.07)' }}>
                      <span style={{ fontSize: 22 }}>
                        {STATUS_CONFIG[activeStage.status]?.icon}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: '#1E3070' }}>{activeStage.label}</div>
                        <div style={{ fontSize: 12, color: '#888', marginTop: 1 }}>
                          {activeStage.status === 'done' && activeStage.completed_at
                            ? `Completed ${new Date(activeStage.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                            : activeStage.status === 'in_progress' ? 'Currently in progress'
                            : 'Upcoming'}
                        </div>
                      </div>
                      <span className="tag" style={{
                        background: STATUS_CONFIG[activeStage.status]?.bg,
                        color: STATUS_CONFIG[activeStage.status]?.color,
                      }}>
                        {activeStage.status === 'done' ? 'Complete' : activeStage.status === 'in_progress' ? 'In Progress' : 'Upcoming'}
                      </span>
                    </div>
                  )}

                  {/* ── Photo / file grid ── */}
                  {loadingAllPhotos ? (
                    <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                      <p style={{ color: '#888', fontWeight: 700 }}>Loading photos…</p>
                    </div>
                  ) : visiblePhotos.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: 44 }}>
                      <div style={{ fontSize: 40, marginBottom: 10 }}>
                        {!accessibleStageIds.has(activeStage?.id) ? '⏳' : '📷'}
                      </div>
                      <p style={{ fontWeight: 700, color: '#aaa', fontSize: 14 }}>
                        {!accessibleStageIds.has(activeStage?.id)
                          ? 'This stage hasn\'t started yet — photos will appear here once work begins.'
                          : 'No photos uploaded for this stage yet.'}
                      </p>
                    </div>
                  ) : (() => {
                    // Group by task; null task_id = stage-level upload
                    const groups = []
                    const seenKeys = new Set()
                    visiblePhotos.forEach(p => {
                      const key = p.task_id || '__stage__'
                      if (!seenKeys.has(key)) {
                        seenKeys.add(key)
                        groups.push({ key, taskLabel: p.task?.label || null, items: [] })
                      }
                      groups.find(g => g.key === key).items.push(p)
                    })

                    const isImage = path => /\.(jpe?g|png|webp|heic|gif|bmp|svg)$/i.test(path)
                    const fileIcon = path => {
                      if (/\.pdf$/i.test(path)) return '📄'
                      if (/\.(docx?|odt|rtf)$/i.test(path)) return '📝'
                      if (/\.(xlsx?|csv)$/i.test(path)) return '📊'
                      if (/\.(zip|rar|7z|tar|gz)$/i.test(path)) return '🗜️'
                      return '📎'
                    }

                    return (
                      <div>
                        {groups.map(group => (
                          <div key={group.key} style={{ marginBottom: 28 }}>
                            {group.taskLabel && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                <div style={{ width: 4, height: 18, background: '#1E3070', borderRadius: 2, flexShrink: 0 }} />
                                <span style={{ fontWeight: 700, fontSize: 14, color: '#1E3070' }}>{group.taskLabel}</span>
                                <span style={{ fontSize: 12, color: '#888' }}>({group.items.length} {group.items.length === 1 ? 'file' : 'files'})</span>
                              </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                              {group.items.map(p => {
                                const url = allPhotoUrls[p.id]
                                const img = isImage(p.storage_path)
                                const fileName = p.storage_path.split('/').pop().replace(/^\d+_[a-z0-9]+_/, '')
                                if (img) {
                                  return (
                                    <div key={p.id}
                                      onClick={() => setLightbox({ url, caption: p.caption || group.taskLabel || activeStage?.label })}
                                      style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 3px 14px rgba(0,0,0,.12)', cursor: 'pointer', background: '#f0f0f0', transition: 'transform 0.15s, box-shadow 0.15s' }}
                                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,.22)' }}
                                      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 3px 14px rgba(0,0,0,.12)' }}>
                                      <img src={url} alt={p.caption || group.taskLabel || activeStage?.label}
                                        style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
                                      {p.caption && (
                                        <div style={{ padding: '8px 12px', fontSize: 12, color: '#555', fontWeight: 600, background: '#fff', borderTop: '1px solid #f0f0f0' }}>
                                          {p.caption}
                                        </div>
                                      )}
                                    </div>
                                  )
                                } else {
                                  return (
                                    <a key={p.id} href={url} target="_blank" rel="noopener noreferrer"
                                      style={{ borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px 16px', gap: 10, boxShadow: '0 3px 14px rgba(0,0,0,.1)', background: '#fff', cursor: 'pointer', textDecoration: 'none', transition: 'transform 0.15s, box-shadow 0.15s', border: '1.5px solid #e8edf3' }}
                                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,.15)' }}
                                      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 3px 14px rgba(0,0,0,.1)' }}>
                                      <span style={{ fontSize: 40 }}>{fileIcon(p.storage_path)}</span>
                                      <span style={{ fontSize: 12, fontWeight: 700, color: '#1E3070', textAlign: 'center', wordBreak: 'break-word', maxWidth: '100%' }}>{fileName}</span>
                                      <span style={{ fontSize: 11, color: '#F9C800', fontWeight: 600 }}>Click to open ↗</span>
                                    </a>
                                  )
                                }
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </>
              )}
            </div>
          )
        })()}

        {/* LIGHTBOX */}
        {/* ── Change Password Modal ──────────────────────────────────── */}
        {changePwdOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={e => { if (e.target === e.currentTarget) setChangePwdOpen(false) }}>
            <div style={{ background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 420, boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#1E3070', marginBottom: 20 }}>🔑 Change Password</div>

              {changePwdMsg === 'success' ? (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#15803d', marginBottom: 8 }}>Password updated!</div>
                  <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>You can now log in with your new password.</p>
                  <button onClick={() => setChangePwdOpen(false)}
                    style={{ padding: '10px 28px', background: '#1E3070', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                    Close
                  </button>
                </div>
              ) : (
                <>
                  {changePwdMsg && (
                    <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#991b1b', marginBottom: 16 }}>
                      ⚠️ {changePwdMsg}
                    </div>
                  )}
                  {[['New Password', 'next'], ['Confirm New Password', 'confirm']].map(([label, field]) => (
                    <div key={field} style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 6 }}>{label}</label>
                      <input
                        type="password"
                        value={changePwdForm[field]}
                        onChange={e => setChangePwdForm(p => ({ ...p, [field]: e.target.value }))}
                        style={{ width: '100%', padding: '11px 14px', border: '2px solid #e2e8f0', borderRadius: 10, fontFamily: 'inherit', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                        placeholder="••••••••"
                      />
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    <button
                      disabled={changePwdBusy}
                      onClick={async () => {
                        const { next, confirm } = changePwdForm
                        if (!next) { setChangePwdMsg('Please enter a new password.'); return }
                        if (next.length < 8) { setChangePwdMsg('Password must be at least 8 characters.'); return }
                        if (next !== confirm) { setChangePwdMsg('Passwords do not match.'); return }
                        setChangePwdBusy(true); setChangePwdMsg('')
                        const { error } = await supabase.auth.updateUser({ password: next })
                        setChangePwdBusy(false)
                        if (error) { setChangePwdMsg(error.message); return }
                        setChangePwdMsg('success')
                      }}
                      style={{ flex: 1, padding: '12px', background: '#1E3070', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: changePwdBusy ? 'not-allowed' : 'pointer', opacity: changePwdBusy ? 0.6 : 1 }}>
                      {changePwdBusy ? 'Saving…' : 'Update Password'}
                    </button>
                    <button onClick={() => setChangePwdOpen(false)}
                      style={{ padding: '12px 18px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {lightbox && (
          <div
            onClick={() => setLightbox(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, cursor: 'zoom-out' }}>
            <img src={lightbox.url} alt={lightbox.caption}
              style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 14, boxShadow: '0 8px 40px rgba(0,0,0,.6)', objectFit: 'contain' }} />
            {lightbox.caption && (
              <p style={{ color: '#fff', marginTop: 14, fontWeight: 700, fontSize: 14, textAlign: 'center', textShadow: '0 1px 4px #0008' }}>{lightbox.caption}</p>
            )}
            <button onClick={() => setLightbox(null)}
              style={{ position: 'absolute', top: 16, right: 20, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 22, width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✕
            </button>
          </div>
        )}

        {/* DELIVERY */}
        {tab === 'delivery' && (
          <div>
            <h2 style={{ fontFamily: "'Fredoka One'", fontSize: 26, color: '#1E3070', marginBottom: 16 }}>🚚 Delivery & Installation</h2>
            <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div className="card">
                <div style={{ fontFamily: "'Fredoka One'", fontSize: 18, color: '#1E3070', marginBottom: 12 }}>📅 Scheduled Date</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#1E3070', fontFamily: "'Fredoka One'" }}>{installDate}</div>
                <div style={{ fontWeight: 700, color: '#475569', marginTop: 4 }}>{installWindow}</div>
                {address !== '—' && (
                  <div style={{ marginTop: 16, fontSize: 14 }}>
                    <div style={{ fontWeight: 700 }}>📍 Installation Address</div>
                    <div style={{ color: '#555', marginTop: 4 }}>{address}</div>
                  </div>
                )}
              </div>
              <div className="card">
                <div style={{ fontFamily: "'Fredoka One'", fontSize: 18, color: '#1565c0', marginBottom: 12 }}>📝 Access & Notes</div>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
                  Let us know any access details for installation day — gate codes, parking, pets, etc.
                </p>
                <textarea
                  style={{ width: '100%', border: '2px solid #e0e0e0', borderRadius: 10, padding: 10, fontFamily: 'inherit', fontSize: 13, resize: 'vertical', minHeight: 100 }}
                  placeholder="e.g. Side gate code is 1234, please park on driveway…"
                  value={accessNotes}
                  onChange={e => setAccessNotes(e.target.value)}
                />
                <button
                  className="btn-green"
                  style={{ marginTop: 10, width: '100%', opacity: savingNotes ? 0.6 : 1 }}
                  disabled={savingNotes}
                  onClick={saveAccessNotes}
                >
                  {savingNotes ? 'Saving…' : notesSaved ? '✓ Saved!' : 'Save Notes'}
                </button>
              </div>
              <div className="card grid-span-2" style={{ gridColumn: 'span 2', background: '#e3f2fd', border: '2px solid #90caf9' }}>
                <div style={{ fontFamily: "'Fredoka One'", fontSize: 17, color: '#1565c0', marginBottom: 4 }}>👷 Your Installer</div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>{workerName}</div>
                <div style={{ color: '#555', fontSize: 14 }}>{workerPhone}</div>
                {workerPhone !== '028 2044 0670' && (
                  <a href={`tel:${workerPhone}`} className="btn-green" style={{ marginTop: 10, display: 'inline-block', textDecoration: 'none' }}>
                    📞 Call {workerName.split(' ')[0]}
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* EXTRAS & VARIATIONS */}
        {tab === 'extras' && (
          <div>
            <h2 style={{ fontFamily: "'Fredoka One'", fontSize: 26, color: '#1E3070', marginBottom: 16 }}>⭐ Extras & Variations</h2>

            {/* Sub-nav pills */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
              {[
                { id: 'extras',     label: '🛒 Add Extras',           count: null },
                { id: 'request',    label: '📝 Request a Variation',   count: varRequests.length || null },
                { id: 'agreements', label: '📄 Variation Agreements',  count: varAlertCount || null },
              ].map(s => (
                <button key={s.id}
                  onClick={() => { setExtrasSubTab(s.id); if (s.id === 'agreements') loadVarAgreements() }}
                  style={{
                    padding: '9px 18px', borderRadius: 99, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
                    background: extrasSubTab === s.id ? '#1E3070' : '#fff',
                    color:      extrasSubTab === s.id ? '#F9C800'  : '#555',
                    boxShadow:  extrasSubTab === s.id ? '0 3px 12px rgba(0,0,0,0.18)' : '0 1px 4px rgba(0,0,0,0.08)',
                  }}>
                  {s.label}
                  {s.count > 0 && (
                    <span style={{ background: '#ef4444', color: '#fff', borderRadius: 99, fontSize: 10, fontWeight: 800, padding: '1px 6px', lineHeight: '16px' }}>{s.count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* ── ADD EXTRAS ── */}
            {extrasSubTab === 'extras' && (
              <div>
                <div style={{ background: '#fffde7', borderRadius: 12, padding: '10px 16px', marginBottom: 20, fontSize: 13, fontWeight: 600, color: '#D4A800' }}>
                  ⚡ Add-ons are subject to installation feasibility — BCF will confirm before charging.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                  {extras.length === 0 && <p style={{ color: '#aaa', fontSize: 14 }}>No extras available right now.</p>}
                  {extras.map(e => {
                    const inCart = !!cart.find(c => c.id === e.id)
                    return (
                      <div key={e.id} className="extra-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        {/* Product image */}
                        <div style={{ position: 'relative', width: '100%', paddingTop: '72%', background: '#f8fafc', flexShrink: 0 }}>
                          {e.image_url
                            ? <img src={e.image_url} alt={e.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52 }}>{e.icon}</div>
                          }
                          {inCart && (
                            <div style={{ position: 'absolute', top: 8, right: 8, background: '#F9C800', color: '#1E3070', borderRadius: 99, fontSize: 11, fontWeight: 800, padding: '3px 10px' }}>✓ Added</div>
                          )}
                        </div>
                        {/* Info */}
                        <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#e53935', marginBottom: 2 }}>£{Number(e.price).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</div>
                          <div style={{ fontFamily: "'Fredoka One'", fontSize: 16, color: '#1E3070', marginBottom: 4 }}>{e.name}</div>
                          {e.description && <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5, flex: 1, marginBottom: 12 }}>{e.description}</div>}
                          <button
                            style={{ width: '100%', padding: '9px', borderRadius: 10, border: 'none', cursor: inCart ? 'default' : 'pointer', fontFamily: 'inherit', fontWeight: 800, fontSize: 13, transition: 'all 0.15s',
                              background: inCart ? '#FFFBE6' : '#F9C800', color: inCart ? '#A07800' : '#1E3070' }}
                            onClick={() => !inCart && addToCart(e)}>
                            {inCart ? '✓ Added to Request' : 'Add to Order'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {requestSent && (
                  <div style={{ marginTop: 24, background: '#FFFBE6', border: '2px solid #F9C800', borderRadius: 14, padding: '20px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
                    <div style={{ fontFamily: "'Fredoka One'", fontSize: 20, color: '#F9C800' }}>Request Sent!</div>
                    <p style={{ fontSize: 13, color: '#555', marginTop: 6 }}>BCF will review your extras and get back to you to confirm feasibility and arrange payment.</p>
                  </div>
                )}
                {cart.length > 0 && (
                  <div className="card" style={{ marginTop: 24, background: '#FFFBE6', border: '2px solid #FFE082' }}>
                    <div style={{ fontFamily: "'Fredoka One'", fontSize: 18, color: '#F9C800' }}>🛒 Your Extras Request</div>
                    {cart.map(c => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700, margin: '6px 0', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {c.image_url
                            ? <img src={c.image_url} alt={c.name} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                            : <span style={{ fontSize: 22 }}>{c.icon}</span>}
                          <span>{c.name}</span>
                        </div>
                        <span>£{c.price}</span>
                      </div>
                    ))}
                    <div style={{ fontWeight: 800, fontSize: 18, marginTop: 10, borderTop: '1px solid #FFF1AA', paddingTop: 10 }}>
                      Total: £{cart.reduce((s, c) => s + c.price, 0)}
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                      <button className="btn-green" onClick={sendExtrasRequest} disabled={sendingRequest} style={{ opacity: sendingRequest ? 0.6 : 1 }}>
                        {sendingRequest ? 'Sending…' : '📤 Send Request to BCF Team'}
                      </button>
                      <button onClick={() => setCart([])} style={{ background: 'none', border: '2px solid #FFE082', borderRadius: 10, padding: '10px 16px', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, color: '#F9C800', cursor: 'pointer' }}>
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── REQUEST A VARIATION ── */}
            {extrasSubTab === 'request' && (
              <div>
                {/* Submit form */}
                <div className="card" style={{ marginBottom: 24 }}>
                  <div style={{ fontFamily: "'Fredoka One'", fontSize: 18, color: '#1E3070', marginBottom: 6 }}>📝 Submit a Variation Request</div>
                  <p style={{ fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 1.6 }}>
                    Need to change the design, dimensions, materials, or anything else about your build?
                    Describe your request below and BCF will review it and get back to you with a variation agreement.
                  </p>
                  <textarea
                    value={varDesc}
                    onChange={e => { setVarDesc(e.target.value); setVarErr('') }}
                    placeholder="e.g. We'd like to increase the platform height from 1.2m to 1.5m and add an additional rope access point on the north side…"
                    style={{ width: '100%', minHeight: 130, padding: '12px 14px', borderRadius: 12, border: '2px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box', lineHeight: 1.6 }}
                    onFocus={e => e.target.style.borderColor = '#F9C800'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                  {varErr && <p style={{ color: '#e53935', fontSize: 13, marginTop: 6 }}>{varErr}</p>}
                  {varSubmitted && (
                    <div style={{ marginTop: 12, background: '#FFFBE6', border: '1px solid #FFE082', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 700, color: '#F9C800' }}>
                      ✅ Variation request submitted — BCF will be in touch shortly.
                    </div>
                  )}
                  <button className="btn-green" style={{ marginTop: 14, opacity: varSubmitting ? 0.6 : 1 }}
                    disabled={varSubmitting || !varDesc.trim()}
                    onClick={submitVariation}>
                    {varSubmitting ? 'Submitting…' : '📤 Submit Variation Request'}
                  </button>
                </div>

                {/* Previous requests */}
                {varRequests.length > 0 && (
                  <div>
                    <div style={{ fontFamily: "'Fredoka One'", fontSize: 17, color: '#1E3070', marginBottom: 12 }}>Your Requests</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {varRequests.map(r => {
                        const STATUS = {
                          pending:   { label: 'Pending Review', color: '#D4A800', bg: '#FFFDE7', border: '#F9C800',  icon: '⏳' },
                          reviewing: { label: 'Under Review',   color: '#1565c0', bg: '#e3f2fd', border: '#90caf9',  icon: '🔍' },
                          approved:  { label: 'Approved',       color: '#A07800', bg: '#FFFBE6', border: '#FFE082',  icon: '✅' },
                          rejected:  { label: 'Not Approved',   color: '#c62828', bg: '#ffebee', border: '#ef9a9a',  icon: '❌' },
                        }
                        const s = STATUS[r.status] || STATUS.pending
                        return (
                          <div key={r.id} className="card" style={{ borderLeft: `4px solid ${s.border}`, padding: '16px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                              <span style={{ fontSize: 11, color: '#aaa', fontWeight: 600 }}>
                                {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                              <span style={{ fontSize: 12, fontWeight: 800, background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 99, padding: '3px 10px' }}>
                                {s.icon} {s.label}
                              </span>
                            </div>
                            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, margin: 0 }}>{r.description}</p>
                            {r.admin_notes && (
                              <div style={{ marginTop: 10, background: '#FFFDE7', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#1E3070', fontWeight: 600, borderLeft: '3px solid #F9C800' }}>
                                <span style={{ fontWeight: 800 }}>BCF Response:</span> {r.admin_notes}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {varRequests.length === 0 && !varSubmitted && (
                  <div className="card" style={{ textAlign: 'center', padding: '40px 24px', color: '#aaa' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                    <p style={{ fontSize: 14 }}>No variation requests yet. Use the form above to submit one.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── VARIATION AGREEMENTS ── */}
            {extrasSubTab === 'agreements' && (
              <div>
                <div style={{ background: '#e3f2fd', borderRadius: 12, padding: '10px 16px', marginBottom: 20, fontSize: 13, fontWeight: 600, color: '#1565c0' }}>
                  📌 Variation agreements sent by BCF appear here. Please review and acknowledge each one.
                </div>
                {varAgreementsLoading ? (
                  <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                    <p style={{ color: '#aaa', fontWeight: 700 }}>Loading…</p>
                  </div>
                ) : varAgreements.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '52px 32px' }}>
                    <div style={{ fontSize: 52, marginBottom: 14 }}>📄</div>
                    <div style={{ fontFamily: "'Fredoka One'", fontSize: 20, color: '#1E3070', marginBottom: 8 }}>No Agreements Yet</div>
                    <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6 }}>Once BCF approves a variation, the agreement document will appear here for your review.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {varAgreements.map(doc => (
                      <div key={doc.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderLeft: `4px solid ${doc.acknowledged_at ? '#F9C800' : '#1565c0'}` }}>
                        <div style={{ fontSize: 32, flexShrink: 0 }}>📋</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: 15, color: '#1E3070' }}>{doc.label}</div>
                          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{doc.file_name}</div>
                          <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                            Sent {new Date(doc.uploaded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          {doc.acknowledged_at && (
                            <div style={{ fontSize: 12, color: '#1E3070', fontWeight: 700, marginTop: 4 }}>
                              ✓ Acknowledged {new Date(doc.acknowledged_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                          <button className="btn-green" style={{ fontSize: 13, padding: '8px 16px', minHeight: 'unset' }}
                            onClick={() => downloadPortalDocument(doc.file_path)}>
                            ⬇ Download
                          </button>
                          {!doc.acknowledged_at && (
                            <button className="btn-yellow" style={{ fontSize: 12, padding: '7px 14px', minHeight: 'unset' }}
                              onClick={() => acknowledgeDocument(doc.id).then(() => setVarAgreements(ds => ds.map(d => d.id === doc.id ? { ...d, acknowledged_at: new Date().toISOString() } : d)))}>
                              ✓ Acknowledge
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* REFER */}
        {tab === 'refer' && (() => {
          const referralCode  = order?.order_number || 'BCF-YOUR-CODE'
          const referralLink  = `${window.location.origin}/refer/${referralCode}`
          const converted     = referrals.filter(r => r.status === 'converted')
          const totalEarned   = converted.filter(r => r.reward_paid).reduce((s, r) => s + r.reward_amount, 0)
          const pendingReward = converted.filter(r => !r.reward_paid).reduce((s, r) => s + r.reward_amount, 0)

          function copyLink() {
            navigator.clipboard.writeText(referralLink)
            setReferCopied(true)
            setTimeout(() => setReferCopied(false), 2000)
          }

          return (
            <div>
              <h2 style={{ fontFamily: "'Fredoka One'", fontSize: 26, color: '#1E3070', marginBottom: 16 }}>🎁 Refer a Friend — Earn £50</h2>

              {/* Hero */}
              <div className="card" style={{ background: 'linear-gradient(135deg, #1E3070, #253080)', color: '#fff', marginBottom: 20, textAlign: 'center', padding: 32 }}>
                <div style={{ fontSize: 48 }}>🎁</div>
                <div style={{ fontFamily: "'Fredoka One'", fontSize: 32, color: '#F9C800', margin: '8px 0' }}>£50 Per Referral</div>
                <div style={{ color: '#FFE082', fontSize: 14 }}>Share your unique link — earn £50 for every friend who books a build!</div>
              </div>

              {/* Referral link */}
              <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>Your Referral Link</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1, background: '#f5f5f5', borderRadius: 10, padding: '10px 14px', fontFamily: 'monospace', fontSize: 13, color: '#555', wordBreak: 'break-all' }}>
                    {referralLink}
                  </div>
                  <button className="btn-green" onClick={copyLink} style={{ whiteSpace: 'nowrap' }}>
                    {referCopied ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`I'm using Ballycastle Climbing Frames — they built my kids' climbing frame and it's brilliant! 🌳 Use my link and we both benefit: ${referralLink}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-green"
                    style={{ background: '#25D366', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                  >
                    💬 Share on WhatsApp
                  </a>
                  <a
                    href={`mailto:${referForm.email ? encodeURIComponent(referForm.email) : ''}?subject=${encodeURIComponent('You should check out Ballycastle Climbing Frames!')}&body=${encodeURIComponent(`Hi${referForm.name ? ` ${referForm.name.split(' ')[0]}` : ''}!\n\nI recently had a climbing frame built by Ballycastle Climbing Frames and it's fantastic. Thought you might be interested!\n\nUse my referral link and I'll earn £50 as a thank you:\n${referralLink}\n\nHope to see you there!`)}`}
                    className="btn-green"
                    style={{ background: '#1565c0', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                  >
                    📧 Share by Email
                  </a>
                </div>
              </div>

              {/* Stats */}
              <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
                {[
                  ['👤', 'Referrals Sent',  referrals.length],
                  ['✅', 'Converted',        converted.length],
                  ['💰', 'Total Earned',     `£${totalEarned}${pendingReward > 0 ? ` (+£${pendingReward} pending)` : ''}`],
                ].map(([icon, label, val]) => (
                  <div key={label} className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 28 }}>{icon}</div>
                    <div style={{ fontFamily: "'Fredoka One'", fontSize: 22, color: '#F9C800', marginTop: 4 }}>{val}</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Submit a referral */}
              <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: "'Fredoka One'", fontSize: 18, color: '#1E3070', marginBottom: 4 }}>📨 Tell Us Who You've Referred</div>
                <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>Know someone who's interested? Send us their details and we'll reach out on your behalf.</p>
                {referSent && (
                  <div style={{ background: '#FFFBE6', border: '1px solid #FFE082', borderRadius: 10, padding: '12px 16px', marginBottom: 14, fontWeight: 700, color: '#F9C800' }}>
                    ✅ Referral submitted — we'll be in touch with them soon!
                  </div>
                )}
                <form onSubmit={sendReferral} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="refer-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 4 }}>Friend's Name *</label>
                      <input
                        value={referForm.name}
                        onChange={e => setReferForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="Sarah Henderson"
                        style={{ width: '100%', padding: '9px 12px', border: '2px solid #e0e0e0', borderRadius: 10, fontFamily: 'inherit', fontSize: 14 }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 4 }}>Their Email *</label>
                      <input
                        type="email"
                        value={referForm.email}
                        onChange={e => setReferForm(p => ({ ...p, email: e.target.value }))}
                        placeholder="sarah@example.com"
                        style={{ width: '100%', padding: '9px 12px', border: '2px solid #e0e0e0', borderRadius: 10, fontFamily: 'inherit', fontSize: 14 }}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 4 }}>Their Phone (optional)</label>
                    <input
                      value={referForm.phone}
                      onChange={e => setReferForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="07911 123456"
                      style={{ width: '100%', padding: '9px 12px', border: '2px solid #e0e0e0', borderRadius: 10, fontFamily: 'inherit', fontSize: 14 }}
                    />
                  </div>
                  {referErr && <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }}>{referErr}</p>}
                  <button type="submit" className="btn-green" disabled={referSending} style={{ alignSelf: 'flex-start', opacity: referSending ? 0.6 : 1 }}>
                    {referSending ? 'Sending…' : '🎁 Submit Referral'}
                  </button>
                </form>
              </div>

              {/* Referral history */}
              {referrals.length > 0 && (
                <div className="card">
                  <div style={{ fontFamily: "'Fredoka One'", fontSize: 16, marginBottom: 12 }}>📋 Your Referrals</div>
                  {referrals.map(r => (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0ede8' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{r.referred_name}</div>
                        <div style={{ fontSize: 12, color: '#888' }}>{r.referred_email} · {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      </div>
                      <span style={{
                        fontSize: 12, fontWeight: 700, borderRadius: 99, padding: '3px 10px',
                        background: r.status === 'converted' ? '#FFFBE6' : r.status === 'declined' ? '#fee2e2' : '#fef3c7',
                        color:      r.status === 'converted' ? '#1E3070' : r.status === 'declined' ? '#991b1b' : '#92400e',
                      }}>
                        {r.status === 'converted' ? `Converted${r.reward_paid ? ' · £50 paid ✓' : ' · £50 pending'}` : r.status === 'declined' ? 'Declined' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })()}

        {/* REMINDERS */}
        {tab === 'reminders' && (
          <div>
            <h2 style={{ fontFamily: "'Fredoka One'", fontSize: 26, color: '#1E3070', marginBottom: 16 }}>🔔 Annual Maintenance Reminders</h2>

            {!buildComplete ? (
              /* ── LOCKED STATE ── */
              <div className="card" style={{ marginBottom: 20, textAlign: 'center', padding: '40px 28px', background: '#f8fafc', border: '2px dashed #cbd5e1' }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>🔒</div>
                <div style={{ fontFamily: "'Fredoka One'", fontSize: 22, color: '#475569', marginBottom: 8 }}>
                  Available After Handover
                </div>
                <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, maxWidth: 380, margin: '0 auto 20px' }}>
                  Annual maintenance reminders unlock once your build is fully complete and all stages — including <strong>Handover</strong> — are marked done by the BCF team.
                </div>
                <div style={{ background: '#e2e8f0', borderRadius: 12, padding: '12px 20px', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                  <div className="progress-bar" style={{ width: 140, margin: 0 }}>
                    <div className="progress-fill" style={{ width: `${progressPct}%` }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>{progressPct}% Complete</span>
                </div>
                <div style={{ marginTop: 10, fontSize: 13, color: '#94a3b8' }}>
                  {doneCount} of {stages.length} stage{stages.length !== 1 ? 's' : ''} done
                </div>
                <button className="btn-green" style={{ marginTop: 20, fontSize: 13, opacity: 0.7, cursor: 'default' }} disabled>
                  🔔 Set Reminder — unlocks at completion
                </button>
              </div>
            ) : (
              /* ── UNLOCKED STATE ── */
              <div className="card" style={{ marginBottom: 20, background: '#FFFBE6', border: '2px solid #FFE082' }}>
                <div style={{ fontFamily: "'Fredoka One'", fontSize: 18, color: '#F9C800', marginBottom: 8 }}>
                  {reminderExists ? '✅ Reminder Active' : '🔔 Set Your Annual Reminder'}
                </div>
                <div style={{ fontSize: 14, color: '#555', marginBottom: 16 }}>
                  We'll send you a reminder each year to check bolts, treat timber, and keep your frame safe.
                </div>

                {reminderSaved && (
                  <div style={{ background: '#FFF1AA', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontWeight: 700, color: '#D4A800', fontSize: 14 }}>
                    ✅ Reminder saved! We'll notify you every {reminderMonth} via {reminderNotify}.
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div>
                    <label style={{ fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 4 }}>Reminder Month</label>
                    <select
                      value={reminderMonth}
                      onChange={e => setReminderMonth(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: 10, border: '2px solid #FFF1AA', fontFamily: 'inherit', fontSize: 14 }}
                    >
                      {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 4 }}>Notify via</label>
                    <select
                      value={reminderNotify}
                      onChange={e => setReminderNotify(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: 10, border: '2px solid #FFF1AA', fontFamily: 'inherit', fontSize: 14 }}
                    >
                      <option>Email</option>
                      <option>Email + SMS</option>
                      <option>SMS only</option>
                    </select>
                  </div>
                  <button
                    className="btn-green"
                    onClick={saveReminder}
                    disabled={reminderSaving}
                    style={{ opacity: reminderSaving ? 0.6 : 1 }}
                  >
                    {reminderSaving ? 'Saving…' : reminderExists ? '💾 Update Reminder' : '🔔 Set Reminder'}
                  </button>
                </div>
              </div>
            )}

            <div className="card">
              <div style={{ fontFamily: "'Fredoka One'", fontSize: 16, marginBottom: 12 }}>📋 Annual Maintenance Checklist</div>
              {[
                'Check and tighten all bolts and fixings',
                'Re-treat timber with preservative oil or stain',
                'Inspect rope ladders and swings for wear',
                'Clear bark/safety surface and top up if needed',
                'Check slide for cracks or sharp edges',
                'Oil any metal hinges or chains',
              ].map((item, i, arr) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid #f0ede8' : 'none' }}>
                  <span style={{ color: buildComplete ? '#F9C800' : '#94a3b8', fontWeight: 800, fontSize: 16 }}>✓</span>
                  <span style={{ fontSize: 14, color: buildComplete ? 'inherit' : '#94a3b8' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PAYMENTS */}
        {tab === 'payments' && (() => {
          if (!paymentsLoaded) loadPayments()

          const invoices   = payments.filter(p => p.type === 'invoice'   || !p.type)
          const amendments = payments.filter(p => p.type === 'amendment')
          const received   = payments.filter(p => p.type === 'received')
          const savingsDeps = payments.filter(p => p.type === 'savings')
          const base         = Number(order?.contract_amount || 0)
          const amendTotal   = amendments.reduce((s, a) => s + Number(a.amount), 0)
          const contractTotal = base + amendTotal
          const totalReceived = received.reduce((s, r) => s + Number(r.amount), 0)
          const balance       = contractTotal - totalReceived
          const pct           = contractTotal > 0 ? Math.min(100, Math.round((totalReceived / contractTotal) * 100)) : 0

          const INV_STATUS = {
            paid:     { label: 'Paid',     color: '#F9C800', bg: '#FFFBE6', border: '#FFE082', icon: '✅' },
            due:      { label: 'Due',      color: '#D4A800', bg: '#FFFDE7', border: '#F9C800', icon: '⚠️' },
            overdue:  { label: 'Overdue',  color: '#c62828', bg: '#ffebee', border: '#ef9a9a', icon: '🔴' },
            upcoming: { label: 'Upcoming', color: '#1565c0', bg: '#e3f2fd', border: '#90caf9', icon: '📅' },
          }

          const paymentDetailsCard = (
            <div className="card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, #1E3070 0%, #253080 100%)', color: '#fff' }}>
              <div style={{ fontFamily: "'Fredoka One'", fontSize: 18, color: '#F9C800', marginBottom: 14 }}>🏦 How to Pay</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="grid-2">
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#F9C800', marginBottom: 8 }}>🏛 Bank Transfer</div>
                  {[
                    ['Account', 'Ballycastle Climbing Frames NI Ltd'],
                    ['Bank',    'Revolut Business Global Account'],
                    ['Sort',    '23 01 20'],
                    ['Acc No',  '11592777'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: '#FFE082', fontWeight: 700, minWidth: 54 }}>{k}:</span>
                      <span style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#F9C800', marginBottom: 8 }}>💙 PayPal</div>
                  <div style={{ fontSize: 12, color: '#fff', marginBottom: 6, fontWeight: 600 }}>info@ballycastleclimbingframes.co.uk</div>
                  <div style={{ fontSize: 11, color: '#FFE082', lineHeight: 1.5 }}>Please use <strong style={{ color: '#F9C800' }}>Family and Friends</strong> to avoid fees.</div>
                </div>
              </div>
              <div style={{ marginTop: 14, fontSize: 12, color: '#FFE082' }}>
                💬 Questions? Call <strong style={{ color: '#fff' }}>028 2044 0670</strong> or email <strong style={{ color: '#fff' }}>info@ballycastleclimbingframes.co.uk</strong>
              </div>
            </div>
          )

          return (
            <div>
              <h2 style={{ fontFamily: "'Fredoka One'", fontSize: 26, color: '#1E3070', marginBottom: 16 }}>💳 Payment Tracker</h2>

              {paymentAlertType && (
                <div style={{
                  background: paymentAlertType === 'overdue' ? '#ffebee' : '#fffde7',
                  border: `2px solid ${paymentAlertType === 'overdue' ? '#ef9a9a' : '#F9C800'}`,
                  borderRadius: 12, padding: '14px 18px', marginBottom: 20,
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{paymentAlertType === 'overdue' ? '🔴' : '⚠️'}</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: paymentAlertType === 'overdue' ? '#c62828' : '#D4A800' }}>
                      {paymentAlertType === 'overdue' ? 'You have overdue payments' : 'Payment due within 7 days'}
                    </div>
                    <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>
                      Please settle the highlighted item{payAlerts.length > 1 ? 's' : ''} below and contact BCF if you have any questions.
                    </div>
                  </div>
                </div>
              )}

              {loadingPayments ? (
                <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                  <p style={{ color: '#aaa', fontWeight: 700 }}>Loading…</p>
                </div>
              ) : !paymentsLoaded ? null : payments.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '52px 32px' }}>
                  <div style={{ fontSize: 52, marginBottom: 14 }}>💳</div>
                  <div style={{ fontFamily: "'Fredoka One'", fontSize: 20, color: '#1E3070', marginBottom: 8 }}>No Payments Yet</div>
                  <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6 }}>Your payment schedule will appear here once set up by the BCF team.</p>
                </div>
              ) : (
                <>
                  {/* Summary — only if contract amount is set */}
                  {contractTotal > 0 && (
                    <>
                      <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
                        {[
                          { label: 'Contract Total', value: `£${contractTotal.toLocaleString()}`, bg: '#f8fafc', color: '#1E3070', border: '#1E3070' },
                          { label: 'Received',        value: `£${totalReceived.toLocaleString()}`, bg: '#FFFBE6', color: '#F9C800', border: '#F9C800' },
                          { label: 'Balance Due',     value: `£${balance.toLocaleString()}`,       bg: balance > 0 ? '#FFFBE6' : '#FFFBE6', color: balance > 0 ? '#A07800' : '#F9C800', border: balance > 0 ? '#F9C800' : '#F9C800' },
                        ].map(c => (
                          <div key={c.label} className="card" style={{ background: c.bg, textAlign: 'center', padding: '16px 10px', borderTop: `3px solid ${c.border}` }}>
                            <div style={{ fontFamily: "'Fredoka One'", fontSize: 24, color: c.color }}>{c.value}</div>
                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.label}</div>
                          </div>
                        ))}
                      </div>
                      <div className="card" style={{ marginBottom: 20, padding: '12px 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontWeight: 800, fontSize: 13 }}>Payment Progress</span>
                          <span style={{ fontFamily: "'Fredoka One'", color: '#F9C800', fontSize: 15 }}>{pct}%</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Christmas Savings Club */}
                  {savingsPlan && (() => {
                    const target     = Number(savingsPlan.target_amount || 0)
                    const totalSaved = savingsDeps.reduce((s, p) => s + Number(p.amount), 0)
                    const remaining  = Math.max(0, target - totalSaved)
                    const pct        = target > 0 ? Math.min(100, Math.round((totalSaved / target) * 100)) : 0
                    const targetDate = savingsPlan.target_date ? new Date(savingsPlan.target_date) : null
                    const monthsLeft = targetDate
                      ? Math.max(0, Math.ceil((targetDate - new Date()) / (1000 * 60 * 60 * 24 * 30.4)))
                      : null
                    return (
                      <div className="card" style={{ marginBottom: 20, background: 'linear-gradient(150deg, #1E3070 0%, #25408f 50%, #1a2d6b 100%)', color: '#fff', overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.1)' }}>

                        {/* Big Christmas tree bg */}
                        <div style={{ position: 'absolute', bottom: -20, right: -16, fontSize: 160, opacity: 0.07, pointerEvents: 'none', lineHeight: 1 }}>🎄</div>
                        {/* Gold star top-right */}
                        <div style={{ position: 'absolute', top: 14, right: 18, fontSize: 28, opacity: 0.3, pointerEvents: 'none' }}>⭐</div>

                        {/* Floating snowflakes */}
                        {[
                          { t:'10%', l:'5%',  s:13, d:0    },
                          { t:'60%', l:'20%', s:9,  d:0.7  },
                          { t:'25%', l:'45%', s:11, d:1.3  },
                          { t:'72%', l:'58%', s:8,  d:0.4  },
                          { t:'38%', l:'75%', s:10, d:1.0  },
                        ].map((f, i) => (
                          <div key={i} style={{ position: 'absolute', top: f.t, left: f.l, fontSize: f.s, opacity: 0.2, pointerEvents: 'none', animation: `bcf-float ${3 + i * 0.5}s ease-in-out infinite`, animationDelay: `${f.d}s` }}>❄️</div>
                        ))}

                        {/* Header */}
                        <div style={{ fontFamily: "'Fredoka One'", fontSize: 26, color: '#F9C800', marginBottom: 4, letterSpacing: '0.3px', textShadow: '0 2px 16px rgba(249,200,0,0.35)' }}>
                          🎄 {savingsPlan.name}
                        </div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 20, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          {targetDate ? `Target: ${targetDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}` : 'Save towards your Christmas frame!'}
                          {monthsLeft !== null && monthsLeft > 0 && (
                            <span style={{ background: 'rgba(249,200,0,0.18)', border: '1px solid rgba(249,200,0,0.35)', borderRadius: 99, padding: '2px 10px', color: '#F9C800', fontSize: 12 }}>
                              🕐 {monthsLeft} month{monthsLeft !== 1 ? 's' : ''} to go
                            </span>
                          )}
                        </div>

                        {/* Stat cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18 }} className="grid-3">
                          {[
                            { label: '🎯 Target',   value: target > 0 ? `£${target.toLocaleString()}` : 'TBC',   color: '#F9C800', bg: 'rgba(249,200,0,0.12)',     border: 'rgba(249,200,0,0.25)'   },
                            { label: '✅ Saved',     value: `£${totalSaved.toLocaleString()}`,                    color: '#fff',    bg: 'rgba(255,255,255,0.1)',   border: 'rgba(255,255,255,0.18)' },
                            { label: '⏳ Remaining', value: target > 0 ? `£${remaining.toLocaleString()}` : '—', color: '#fca5a5', bg: 'rgba(255,255,255,0.07)',  border: 'rgba(255,255,255,0.12)' },
                          ].map(s => (
                            <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: '14px 10px', textAlign: 'center', border: `1px solid ${s.border}` }}>
                              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 800, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</div>
                              <div style={{ fontFamily: "'Fredoka One'", fontSize: 22, color: s.color }}>{s.value}</div>
                            </div>
                          ))}
                        </div>

                        {/* Progress bar — gold shimmer */}
                        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 99, height: 12, marginBottom: 8, overflow: 'hidden' }}>
                          <div style={{ background: 'linear-gradient(90deg, #c8860a, #F9C800, #FFE566, #c8860a)', backgroundSize: '300% 100%', height: '100%', borderRadius: 99, width: `${pct}%`, transition: 'width 1.5s cubic-bezier(0.25,1,0.5,1)', boxShadow: '0 0 12px rgba(249,200,0,0.5)', animation: 'bcf-bar-shimmer 2.5s linear infinite' }} />
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: savingsDeps.length > 0 ? 18 : 0, fontWeight: 700 }}>
                          🎅 {pct}% saved{savingsPlan.monthly_amount ? ` · Suggested: £${Number(savingsPlan.monthly_amount).toLocaleString()}/month` : ''}
                        </div>

                        {/* Recent deposits */}
                        {savingsDeps.length > 0 && (
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 14 }}>
                            <div style={{ fontWeight: 800, fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>🎁 Recent Deposits</div>
                            {savingsDeps.slice(0, 5).map(dep => (
                              <div key={dep.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.85)' }}>
                                <span style={{ fontWeight: 600 }}>{dep.label || 'Deposit'}{dep.received_date ? ` · ${new Date(dep.received_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}</span>
                                <span style={{ fontWeight: 800, color: '#F9C800' }}>+£{Number(dep.amount).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })()}

                  {/* Invoice schedule */}
                  {invoices.length > 0 && (
                    <div className="card" style={{ marginBottom: 20 }}>
                      <div style={{ fontFamily: "'Fredoka One'", fontSize: 17, color: '#1E3070', marginBottom: 14 }}>📄 Payment Schedule</div>
                      {invoices.map((p, i) => {
                        const s = INV_STATUS[getPayStatus(p)] || INV_STATUS.upcoming
                        const dueDate  = p.due_date  ? new Date(p.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null
                        const paidDate = p.paid_date ? new Date(p.paid_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null
                        return (
                          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i < invoices.length - 1 ? '1px solid #f0ede8' : 'none' }}>
                            <div style={{ width: 38, height: 38, borderRadius: '50%', background: s.bg, border: `2px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                              {s.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 800, fontSize: 14, color: '#1E3070' }}>{p.label}</div>
                              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                                {paidDate ? `Paid ${paidDate}` : dueDate ? `Due ${dueDate}` : 'Date TBC'}
                                {p.notes && <span style={{ marginLeft: 8 }}>· {p.notes}</span>}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontFamily: "'Fredoka One'", fontSize: 20, color: s.color }}>£{Number(p.amount).toLocaleString()}</div>
                              <span style={{ fontSize: 11, fontWeight: 800, borderRadius: 99, padding: '2px 8px', background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{s.label}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Amendments */}
                  {amendments.length > 0 && (
                    <div className="card" style={{ marginBottom: 20 }}>
                      <div style={{ fontFamily: "'Fredoka One'", fontSize: 17, color: '#1E3070', marginBottom: 14 }}>📝 Contract Amendments</div>
                      {amendments.map((p, i) => (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: i < amendments.length - 1 ? '1px solid #f0ede8' : 'none' }}>
                          <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#FFFDE7', border: '2px solid #F9C800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>📝</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: 14, color: '#1E3070' }}>{p.label}</div>
                            {p.due_date && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Approved {new Date(p.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>}
                            {p.notes && <div style={{ fontSize: 12, color: '#888' }}>{p.notes}</div>}
                          </div>
                          <div style={{ fontFamily: "'Fredoka One'", fontSize: 20, color: Number(p.amount) >= 0 ? '#F9C800' : '#c62828' }}>
                            {Number(p.amount) >= 0 ? '+' : ''}£{Number(p.amount).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Payments received */}
                  {received.length > 0 && (
                    <div className="card" style={{ marginBottom: 20 }}>
                      <div style={{ fontFamily: "'Fredoka One'", fontSize: 17, color: '#1E3070', marginBottom: 14 }}>✅ Payments Received</div>
                      {received.map((p, i) => (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: i < received.length - 1 ? '1px solid #f0ede8' : 'none' }}>
                          <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#FFFBE6', border: '2px solid #FFE082', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>💰</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: 14, color: '#1E3070' }}>{p.label}</div>
                            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                              {p.received_date ? new Date(p.received_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Confirmed'}
                              {p.method && <span style={{ marginLeft: 6 }}>· via {p.method === 'bank' ? 'Bank Transfer' : p.method === 'paypal' ? 'PayPal' : p.method}</span>}
                            </div>
                          </div>
                          <div style={{ fontFamily: "'Fredoka One'", fontSize: 20, color: '#1E3070' }}>£{Number(p.amount).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Bank details */}
                  {paymentDetailsCard}
                </>
              )}
            </div>
          )
        })()}

        {/* MY PROFILE — hidden tab, accessible via avatar dropdown */}
        {tab === 'profile' && (
          <div>
            <h2 style={{ fontFamily: "'Fredoka One'", fontSize: 26, color: '#1E3070', marginBottom: 20 }}>👤 My Profile</h2>

            <div className="card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 90, height: 90, borderRadius: '50%', overflow: 'hidden', border: '3px solid #FFF1AA', background: '#FFFBE6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt={firstName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 32, fontWeight: 800, color: '#F9C800' }}>{initials}</span>}
                </div>
                {avatarUploading && (
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>…</span>
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 18, color: '#1E3070', marginBottom: 4 }}>{clientName}</div>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>{session.user.email}</div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  style={{ display: 'none' }}
                  onChange={e => { if (e.target.files?.[0]) uploadAvatar(e.target.files[0]); e.target.value = '' }}
                />
                <button className="btn-green" style={{ fontSize: 13, padding: '8px 18px', minHeight: 'unset' }}
                  disabled={avatarUploading}
                  onClick={() => avatarInputRef.current?.click()}>
                  {avatarUploading ? 'Uploading…' : avatarUrl ? '📷 Change Photo' : '📷 Upload Photo'}
                </button>
              </div>
            </div>

            <div className="card">
              <div style={{ fontWeight: 800, fontSize: 16, color: '#1E3070', marginBottom: 16 }}>Personal Details</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Full Name</label>
                  <input
                    value={profileForm.name}
                    onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Your full name"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '2px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit', outline: 'none', color: '#1e293b' }}
                    onFocus={e => e.target.style.borderColor = '#F9C800'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Phone Number</label>
                  <input
                    value={profileForm.phone}
                    onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="e.g. 07851 388660"
                    type="tel"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '2px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit', outline: 'none', color: '#1e293b' }}
                    onFocus={e => e.target.style.borderColor = '#F9C800'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Email Address</label>
                  <input
                    value={session.user.email}
                    disabled
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '2px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit', color: '#94a3b8', background: '#f8fafc' }}
                  />
                  <p style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>Email cannot be changed. Contact BCF if you need to update it.</p>
                </div>
                <button className="btn-green" style={{ alignSelf: 'flex-start', padding: '10px 28px', fontSize: 14 }}
                  disabled={profileSaving || !profileForm.name.trim()}
                  onClick={saveProfile}>
                  {profileSaving ? 'Saving…' : profileSaved ? '✓ Saved!' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DOCUMENTS */}
        {tab === 'documents' && (() => {
          if (!docsLoaded) loadDocuments()
          return (
            <div>
              <h2 style={{ fontFamily: "'Fredoka One'", fontSize: 26, color: '#1E3070', marginBottom: 16 }}>📄 Documents</h2>
              {docAlertCount > 0 && (
                <div style={{
                  background: '#e3f2fd', border: '2px solid #90caf9',
                  borderRadius: 12, padding: '14px 18px', marginBottom: 16,
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>📄</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#1565c0' }}>
                      {docAlertCount} document{docAlertCount > 1 ? 's' : ''} need{docAlertCount === 1 ? 's' : ''} your acknowledgment
                    </div>
                    <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>
                      Please review and tap <strong>✓ Acknowledge</strong> on each new document below.
                    </div>
                  </div>
                </div>
              )}
              {loadingDocs ? (
                <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                  <p style={{ color: '#aaa', fontWeight: 700 }}>Loading…</p>
                </div>
              ) : !docsLoaded ? null : orderDocs.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px 32px' }}>
                  <div style={{ fontSize: 52, marginBottom: 14 }}>📁</div>
                  <div style={{ fontFamily: "'Fredoka One'", fontSize: 20, color: '#1E3070', marginBottom: 8 }}>No Documents Yet</div>
                  <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6 }}>Your quotes, contracts, and warranties will appear here once uploaded by the BCF team.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {orderDocs.map(doc => (
                    <div key={doc.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderLeft: `4px solid ${doc.acknowledged_at ? '#F9C800' : '#F9C800'}` }}>
                      <div style={{ fontSize: 32, flexShrink: 0 }}>📄</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: '#1E3070' }}>{doc.label}</div>
                        <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{doc.file_name}</div>
                        <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                          Uploaded {new Date(doc.uploaded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        {doc.acknowledged_at && (
                          <div style={{ fontSize: 12, color: '#F9C800', fontWeight: 700, marginTop: 4 }}>
                            ✓ Acknowledged {new Date(doc.acknowledged_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                        <button className="btn-green" style={{ fontSize: 13, padding: '8px 16px', minHeight: 'unset' }}
                          onClick={() => downloadPortalDocument(doc.file_path)}>
                          ⬇ Download
                        </button>
                        {!doc.acknowledged_at && (
                          <button className="btn-yellow" style={{ fontSize: 12, padding: '7px 14px', minHeight: 'unset' }}
                            onClick={() => acknowledgeDocument(doc.id)}>
                            ✓ Acknowledge
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })()}

      </div>

      {/* ── REVIEW MODAL ─────────────────────────────────────────────── */}
      {showReviewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="bcfp" style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', position: 'relative', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #1E3070 0%, #253080 100%)', padding: '20px 24px' }}>
              <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 22, color: '#F9C800' }}>🎉 Your Build is Complete!</div>
              <div style={{ color: '#FFE082', fontSize: 13, marginTop: 4 }}>We'd love to hear what you think</div>
            </div>

            {/* Close button */}
            <button onClick={() => setShowReviewModal(false)}
              style={{ position: 'absolute', top: 14, right: 16, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 20, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>
              ✕
            </button>

            <div style={{ padding: '24px 24px 28px' }}>
              {reviewSubmitted ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
                  <div style={{ fontFamily: "'Fredoka One'", fontSize: 24, color: '#F9C800', marginBottom: 8 }}>Thank You!</div>
                  <div style={{ fontSize: 14, color: '#555', marginBottom: 20 }}>Your review means the world to us!</div>
                  {existingReview && (
                    <div style={{ background: '#FFFDE7', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
                      <div style={{ color: '#F9C800', fontSize: 24, letterSpacing: 2, marginBottom: 4 }}>
                        {'★'.repeat(existingReview.stars)}{'☆'.repeat(5 - existingReview.stars)}
                      </div>
                      {existingReview.body && (
                        <p style={{ fontSize: 13, color: '#555', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>"{existingReview.body}"</p>
                      )}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button className="btn-green" style={{ background: '#25D366', fontSize: 13 }}
                      onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('⭐ Just left a 5-star review for Ballycastle Climbing Frames! Brilliant local company — they built an amazing climbing frame for my kids. Highly recommend! 🌳 ballycastleclimbingframes.co.uk')}`, '_blank')}>
                      💬 WhatsApp
                    </button>
                    <button className="btn-green" style={{ background: '#EA4335', fontSize: 13 }}
                      onClick={() => window.open('https://g.page/r/ballycastleclimbingframes/review', '_blank')}>
                      ⭐ Google Review
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14, color: '#1E3070' }}>How would you rate your BCF experience?</div>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 18 }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <button key={s} className="star-btn"
                        onClick={() => { setReviewStars(s); setReviewErr('') }}
                        style={{ color: s <= reviewStars ? '#F9C800' : '#ddd', fontSize: 40 }}>★</button>
                    ))}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: '#1E3070' }}>Tell us about your experience</div>
                  <textarea
                    value={reviewText}
                    onChange={e => setReviewText(e.target.value)}
                    style={{ width: '100%', border: '2px solid #e0e0e0', borderRadius: 10, padding: 12, fontFamily: 'inherit', fontSize: 14, resize: 'vertical', minHeight: 110, outline: 'none', boxSizing: 'border-box' }}
                    placeholder="We'd love to hear about your kids enjoying the frame!"
                  />
                  {reviewErr && <div style={{ color: '#e53935', fontSize: 13, marginTop: 6 }}>{reviewErr}</div>}
                  <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                    <button className="btn-green" style={{ flex: 1, fontSize: 15, opacity: reviewSubmitting ? 0.6 : 1 }}
                      onClick={submitReview} disabled={reviewSubmitting}>
                      {reviewSubmitting ? 'Submitting…' : '⭐ Submit Review'}
                    </button>
                    <button onClick={() => setShowReviewModal(false)}
                      style={{ background: 'none', border: '2px solid #e0e0e0', borderRadius: 10, padding: '10px 16px', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, color: '#888', cursor: 'pointer' }}>
                      Later
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

