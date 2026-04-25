import { useState, useRef } from 'react'

const TABS = [
  { id: 'dashboard',    icon: '🏠', label: 'Dashboard'      },
  { id: 'configurator', icon: '🎮', label: 'Configurator'   },
  { id: 'progress',     icon: '🔨', label: 'Build Progress' },
  { id: 'photos',       icon: '📸', label: 'Photos'         },
  { id: 'delivery',     icon: '🚚', label: 'Delivery'       },
  { id: 'extras',       icon: '⭐', label: 'Add Extras'     },
  { id: 'refer',        icon: '🎁', label: 'Refer a Friend' },
  { id: 'reminders',    icon: '🔔', label: 'Reminders'      },
  { id: 'review',       icon: '✏️', label: 'Leave a Review' },
]

const STAGES = [
  { id: 1, label: 'Order Confirmed',       date: '12 Mar 2026', done: true  },
  { id: 2, label: 'Materials Ordered',     date: '18 Mar 2026', done: true  },
  { id: 3, label: 'Groundwork',            date: '28 Mar 2026', done: true  },
  { id: 4, label: 'Frame Construction',    date: 'In progress', done: false, active: true },
  { id: 5, label: 'Accessories Installed', date: '~22 Apr 2026',done: false },
  { id: 6, label: 'Final Inspection',      date: '~25 Apr 2026',done: false },
  { id: 7, label: 'Handover Complete',     date: '~26 Apr 2026',done: false },
]

const EXTRAS = [
  { id: 1, name: 'Nest Swing',          price: 89,  icon: '🪹', desc: 'Large 80cm nest swing, fits 2 kids' },
  { id: 2, name: 'Wave Slide',          price: 145, icon: '🛝', desc: 'Fun wavy plastic slide in bright red' },
  { id: 3, name: 'Rock Climbing Wall',  price: 120, icon: '🧗', desc: 'Bolt-on rock holds, various colours' },
  { id: 4, name: 'Monkey Bars',         price: 199, icon: '🐒', desc: 'Pressure-treated timber monkey bars' },
  { id: 5, name: 'Mud Kitchen',         price: 165, icon: '🍳', desc: 'Wooden mud kitchen with sink & hob' },
  { id: 6, name: 'Safety Bark (1m³)',   price: 55,  icon: '🌿', desc: 'Play-grade certified safety bark' },
]

const ACCESSORIES = ['🪢 Rope Ladder', '🎯 Target Wall', '🛝 Slide', '🪹 Nest Swing', '🌿 Bark Border', '⛺ Den Kit']

export default function BCFPortal() {
  const [tab,             setTab]             = useState('dashboard')
  const [cart,            setCart]            = useState([])
  const [referCopied,     setReferCopied]     = useState(false)
  const [reminderSet,     setReminderSet]     = useState(false)
  const [reviewStars,     setReviewStars]     = useState(0)
  const [reviewText,      setReviewText]      = useState('')
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [dragging,        setDragging]        = useState(null)
  const [placed,          setPlaced]          = useState([
    { id: 'frame', label: '🏗️ Your Frame', x: 110, y: 80, color: '#8B5E3C' },
  ])
  const [photos, setPhotos] = useState([])
  const canvasRef = useRef(null)
  const fileRef   = useRef(null)

  const addToCart = item => {
    if (!cart.find(c => c.id === item.id)) setCart([...cart, item])
  }

  const handleDrop = e => {
    e.preventDefault()
    if (!dragging || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    setPlaced([...placed, { id: Date.now(), label: dragging, x: e.clientX - rect.left - 30, y: e.clientY - rect.top - 20, color: '#4CAF50' }])
    setDragging(null)
  }

  const handlePhotoUpload = e => {
    Array.from(e.target.files).forEach(f => {
      const reader = new FileReader()
      reader.onload = ev => setPhotos(p => [...p, { src: ev.target.result, name: f.name }])
      reader.readAsDataURL(f)
    })
  }

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: '#F0F7EC', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap');
        .bcfp * { box-sizing: border-box; margin: 0; padding: 0; }
        .bcfp ::-webkit-scrollbar { width: 6px; }
        .bcfp ::-webkit-scrollbar-thumb { background: #8B5E3C55; border-radius: 3px; }
        .bcfp .tab-btn { background: none; border: none; cursor: pointer; padding: 8px 12px; border-radius: 10px; font-family: inherit; font-size: 13px; font-weight: 700; color: #4a3728; transition: all 0.18s; display: flex; align-items: center; gap: 5px; white-space: nowrap; }
        .bcfp .tab-btn:hover { background: #fff8; }
        .bcfp .tab-btn.active { background: #fff; color: #2e7d32; box-shadow: 0 2px 8px #0001; }
        .bcfp .card { background: #fff; border-radius: 16px; padding: 20px; box-shadow: 0 2px 12px #0001; }
        .bcfp .btn-green { background: #2e7d32; color: #fff; border: none; border-radius: 10px; padding: 10px 20px; font-family: inherit; font-weight: 800; cursor: pointer; font-size: 15px; transition: background 0.15s; }
        .bcfp .btn-green:hover { background: #1b5e20; }
        .bcfp .btn-yellow { background: #FFD700; color: #3e2700; border: none; border-radius: 10px; padding: 10px 20px; font-family: inherit; font-weight: 800; cursor: pointer; font-size: 15px; }
        .bcfp .btn-yellow:hover { background: #FFC200; }
        .bcfp .progress-bar { height: 14px; background: #e0e0e0; border-radius: 99px; overflow: hidden; }
        .bcfp .progress-fill { height: 100%; background: linear-gradient(90deg, #4CAF50, #8BC34A); border-radius: 99px; transition: width 0.4s; }
        .bcfp .stage-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f0ede8; }
        .bcfp .star-btn { background: none; border: none; font-size: 28px; cursor: pointer; transition: transform 0.1s; }
        .bcfp .star-btn:hover { transform: scale(1.2); }
        .bcfp .acc-chip { background: #e8f5e9; border: 2px dashed #4CAF50; border-radius: 10px; padding: 8px 14px; cursor: grab; font-size: 13px; font-weight: 700; color: #2e7d32; user-select: none; }
        .bcfp .acc-chip:active { cursor: grabbing; opacity: 0.7; }
        .bcfp .placed-item { position: absolute; background: #ffffffdd; border: 2px solid; border-radius: 8px; padding: 4px 8px; font-size: 12px; font-weight: 700; cursor: move; white-space: nowrap; }
        .bcfp .extra-card { border: 2px solid #e8f0e0; border-radius: 14px; padding: 16px; background: #fff; transition: border-color 0.15s; }
        .bcfp .extra-card:hover { border-color: #4CAF50; }
        .bcfp .photo-box { border: 2px dashed #8B5E3C55; border-radius: 14px; padding: 30px; text-align: center; cursor: pointer; background: #fff; transition: background 0.15s; }
        .bcfp .photo-box:hover { background: #f9f5ef; }
        .bcfp .tag { display: inline-block; background: #e8f5e9; color: #2e7d32; border-radius: 99px; padding: 3px 10px; font-size: 12px; font-weight: 700; margin: 2px; }
        @media (max-width: 700px) {
          .bcfp .grid-2 { grid-template-columns: 1fr !important; }
          .bcfp .grid-3 { grid-template-columns: 1fr 1fr !important; }
          .bcfp .hide-mobile { display: none !important; }
          .bcfp .nav-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        }
      `}</style>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="bcfp" style={{ background: 'linear-gradient(135deg, #1A2E44 0%, #2e5339 100%)', padding: '0 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, paddingBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/images/bcf.png" alt="BCF" style={{ height: 40, width: 'auto' }} />
            <div>
              <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 20, color: '#FFD700', letterSpacing: 1 }}>Ballycastle Climbing Frames</div>
              <div style={{ color: '#a5d6a7', fontSize: 12, fontWeight: 600 }}>Client Portal</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>Welcome, Sarah & David! 👋</div>
            <div style={{ color: '#81c784', fontSize: 12 }}>Order #BCF-2026-0847</div>
          </div>
        </div>

        {/* NAV TABS */}
        <div className="bcfp nav-scroll" style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 4, flexWrap: 'wrap', paddingBottom: 8, borderTop: '1px solid #ffffff18', paddingTop: 8 }}>
          {TABS.map(t => (
            <button key={t.id} className={`bcfp tab-btn${tab === t.id ? ' active' : ''}`}
              style={{ color: tab === t.id ? '#2e7d32' : '#c8e6c9' }}
              onClick={() => setTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ────────────────────────────────────────────────────── */}
      <div className="bcfp" style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>

        {/* DASHBOARD */}
        {tab === 'dashboard' && (
          <div>
            <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div className="card" style={{ background: 'linear-gradient(135deg, #e8f5e9, #f1f8e9)', border: '2px solid #c8e6c9' }}>
                <div style={{ fontFamily: "'Fredoka One'", fontSize: 20, color: '#2e7d32', marginBottom: 8 }}>🏗️ Your Build</div>
                <div style={{ marginBottom: 8, fontWeight: 700, fontSize: 14 }}>Frame Construction — 40% Complete</div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: '40%' }} /></div>
                <div style={{ marginTop: 10, color: '#558b2f', fontWeight: 600, fontSize: 13 }}>📅 Next update in 48 hours</div>
                <button className="btn-green" style={{ marginTop: 12, fontSize: 13 }} onClick={() => setTab('progress')}>View Progress →</button>
              </div>

              <div className="card" style={{ background: 'linear-gradient(135deg, #fff8e1, #fff3cd)', border: '2px solid #ffe082' }}>
                <div style={{ fontFamily: "'Fredoka One'", fontSize: 20, color: '#e65100', marginBottom: 8 }}>📅 Installation Date</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#bf360c' }}>26 April 2026</div>
                <div style={{ color: '#795548', fontSize: 13, fontWeight: 600, marginTop: 4 }}>10:00am – 2:00pm window</div>
                <div style={{ color: '#8d6e63', fontSize: 12, marginTop: 6 }}>📍 14 Glenshesk Road, Ballycastle</div>
                <button className="btn-yellow" style={{ marginTop: 12, fontSize: 13 }} onClick={() => setTab('delivery')}>Delivery Details →</button>
              </div>
            </div>

            <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
              {[
                { icon: '🎮', title: 'Configurator', desc: 'Design your play area',   id: 'configurator', bg: '#e3f2fd' },
                { icon: '⭐', title: 'Add Extras',   desc: 'Upgrade your frame',       id: 'extras',       bg: '#f3e5f5' },
                { icon: '🎁', title: 'Refer a Friend', desc: 'Earn £50 reward',        id: 'refer',        bg: '#fce4ec' },
              ].map(c => (
                <div key={c.id} className="card" style={{ background: c.bg, cursor: 'pointer', transition: 'transform 0.15s' }}
                  onClick={() => setTab(c.id)}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = ''}>
                  <div style={{ fontSize: 30 }}>{c.icon}</div>
                  <div style={{ fontFamily: "'Fredoka One'", fontSize: 17, marginTop: 6 }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{c.desc}</div>
                </div>
              ))}
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: "'Fredoka One'", fontSize: 17, color: '#1A2E44' }}>🔔 Annual Maintenance Reminder</div>
                <div style={{ fontSize: 13, color: '#666' }}>Get a free yearly reminder to keep your frame in top condition</div>
              </div>
              <button className="btn-green" onClick={() => setTab('reminders')}>Set Up Free Reminder</button>
            </div>

            <div style={{ background: '#1A2E44', borderRadius: 16, padding: '16px 24px', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 12 }}>
              {[['🏗️', '500+', 'Builds Completed'], ['⭐', '5-Star', 'Client Reviews'], ['🌳', '15+', 'Years Experience']].map(([icon, num, label]) => (
                <div key={label} style={{ textAlign: 'center', color: '#fff' }}>
                  <div style={{ fontSize: 20 }}>{icon}</div>
                  <div style={{ fontFamily: "'Fredoka One'", fontSize: 22, color: '#FFD700' }}>{num}</div>
                  <div style={{ fontSize: 11, color: '#a5d6a7' }}>{label}</div>
                </div>
              ))}
              <div style={{ textAlign: 'center', color: '#fff' }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>👷 Jamie Robinson</div>
                <div style={{ fontSize: 13, color: '#81c784' }}>028 2044 0670</div>
                <div style={{ fontSize: 11, color: '#80cbc4' }}>5 Fairhill St, Ballycastle</div>
              </div>
            </div>
          </div>
        )}

        {/* CONFIGURATOR */}
        {tab === 'configurator' && (
          <div>
            <h2 style={{ fontFamily: "'Fredoka One'", fontSize: 26, color: '#1A2E44', marginBottom: 16 }}>🎮 Play Area Configurator</h2>
            <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>
              <div>
                <div className="card" style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: "'Fredoka One'", fontSize: 15, marginBottom: 10, color: '#2e7d32' }}>🧩 Accessories</div>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Drag onto your garden canvas →</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {ACCESSORIES.map(a => (
                      <div key={a} className="acc-chip" draggable onDragStart={() => setDragging(a)}>{a}</div>
                    ))}
                  </div>
                </div>
                <div className="card" style={{ background: '#e8f5e9' }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#2e7d32', marginBottom: 4 }}>💰 Extras Added</div>
                  {cart.length === 0
                    ? <div style={{ fontSize: 12, color: '#888' }}>None yet</div>
                    : cart.map(c => <div key={c.id} style={{ fontSize: 12, fontWeight: 700, color: '#2e7d32' }}>✓ {c.name} — £{c.price}</div>)
                  }
                  {cart.length > 0 && <div style={{ marginTop: 8, fontWeight: 800, color: '#1b5e20' }}>Total: £{cart.reduce((s, c) => s + c.price, 0)}</div>}
                </div>
              </div>

              <div>
                <div className="card" style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: "'Fredoka One'", fontSize: 15, color: '#5BB8F5', marginBottom: 4 }}>🌿 Your Garden Canvas</div>
                  <div style={{ fontSize: 12, color: '#888' }}>Drop accessories onto your space</div>
                </div>
                <div ref={canvasRef} onDragOver={e => e.preventDefault()} onDrop={handleDrop}
                  style={{ position: 'relative', height: 380, background: 'linear-gradient(180deg, #87CEEB 0%, #87CEEB 30%, #4CAF50 30%, #388e3c 100%)', borderRadius: 16, overflow: 'hidden', border: '3px solid #2e7d32', cursor: 'copy' }}>
                  <div style={{ position: 'absolute', top: 20, left: 40,  width: 80, height: 30, background: '#ffffffaa', borderRadius: 99 }} />
                  <div style={{ position: 'absolute', top: 30, left: 200, width: 60, height: 22, background: '#ffffffaa', borderRadius: 99 }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: '#8B5E3C', display: 'flex', gap: 8, alignItems: 'center', paddingLeft: 8 }}>
                    {Array(18).fill(0).map((_, i) => <div key={i} style={{ width: 12, height: 48, background: '#6D4C41', borderRadius: '4px 4px 0 0' }} />)}
                  </div>
                  {placed.map(p => (
                    <div key={p.id} className="placed-item" style={{ left: p.x, top: p.y, borderColor: p.color, color: p.color }}>{p.label}</div>
                  ))}
                  {placed.length === 1 && (
                    <div style={{ position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)', color: '#ffffffcc', fontSize: 13, fontWeight: 700, textAlign: 'center', pointerEvents: 'none' }}>
                      Drag accessories from the sidebar!
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
                  <button className="btn-green" onClick={() => setPlaced([{ id: 'frame', label: '🏗️ Your Frame', x: 110, y: 80, color: '#8B5E3C' }])}>Reset Canvas</button>
                  <button className="btn-yellow">📤 Send to BCF Team</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BUILD PROGRESS */}
        {tab === 'progress' && (
          <div>
            <h2 style={{ fontFamily: "'Fredoka One'", fontSize: 26, color: '#1A2E44', marginBottom: 16 }}>🔨 Build Progress</h2>
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 800 }}>Overall Progress</span>
                <span style={{ fontFamily: "'Fredoka One'", color: '#2e7d32', fontSize: 18 }}>40%</span>
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: '40%' }} /></div>
            </div>
            <div className="card">
              {STAGES.map((s, i) => (
                <div key={s.id} className="stage-row" style={{ borderBottom: i < STAGES.length - 1 ? '1px solid #f0ede8' : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
                    background: s.done ? '#e8f5e9' : s.active ? '#fff8e1' : '#f5f5f5',
                    border: `2px solid ${s.done ? '#4CAF50' : s.active ? '#FFD700' : '#e0e0e0'}` }}>
                    {s.done ? '✅' : s.active ? '🔄' : '⏳'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: s.done ? '#2e7d32' : s.active ? '#e65100' : '#9e9e9e' }}>{s.label}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{s.date}</div>
                  </div>
                  {s.active && <span className="tag" style={{ background: '#fff8e1', color: '#e65100' }}>In Progress</span>}
                  {s.done  && <span className="tag">Done</span>}
                </div>
              ))}
            </div>
            <div className="card" style={{ marginTop: 20, background: '#e8f5e9', border: '2px solid #c8e6c9' }}>
              <div style={{ fontWeight: 800, marginBottom: 4 }}>📲 Get notified on each update</div>
              <div style={{ fontSize: 13, color: '#555', marginBottom: 10 }}>We'll email you when each stage is completed.</div>
              <button className="btn-green">Enable Email Updates</button>
            </div>
          </div>
        )}

        {/* PHOTOS */}
        {tab === 'photos' && (
          <div>
            <h2 style={{ fontFamily: "'Fredoka One'", fontSize: 26, color: '#1A2E44', marginBottom: 16 }}>📸 Your Photos</h2>
            <div className="photo-box" onClick={() => fileRef.current?.click()} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 40 }}>📁</div>
              <div style={{ fontWeight: 800, fontSize: 16, marginTop: 8 }}>Drop photos here or click to upload</div>
              <div style={{ fontSize: 13, color: '#888' }}>Before, during or after shots — share the journey!</div>
              <input ref={fileRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
            </div>
            {photos.length === 0
              ? <div className="card" style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>No photos yet — upload your first one above!</div>
              : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                  {photos.map((p, i) => (
                    <div key={i} style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px #0002' }}>
                      <img src={p.src} alt={p.name} style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
                      <div style={{ padding: '6px 8px', background: '#fff', fontSize: 11, color: '#666', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        )}

        {/* DELIVERY */}
        {tab === 'delivery' && (
          <div>
            <h2 style={{ fontFamily: "'Fredoka One'", fontSize: 26, color: '#1A2E44', marginBottom: 16 }}>🚚 Delivery & Installation</h2>
            <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div className="card">
                <div style={{ fontFamily: "'Fredoka One'", fontSize: 18, color: '#e65100', marginBottom: 12 }}>📅 Scheduled Date</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#bf360c' }}>26 April 2026</div>
                <div style={{ fontWeight: 700, color: '#795548', marginTop: 4 }}>10:00am – 2:00pm</div>
                <div style={{ marginTop: 16, fontSize: 14 }}>
                  <div style={{ fontWeight: 700 }}>📍 Installation Address</div>
                  <div style={{ color: '#555', marginTop: 4 }}>14 Glenshesk Road<br />Ballycastle, BT54 6AY</div>
                </div>
              </div>
              <div className="card">
                <div style={{ fontFamily: "'Fredoka One'", fontSize: 18, color: '#1565c0', marginBottom: 12 }}>📝 Access & Notes</div>
                <textarea style={{ width: '100%', border: '2px solid #e0e0e0', borderRadius: 10, padding: 10, fontFamily: 'inherit', fontSize: 13, resize: 'vertical', minHeight: 100 }}
                  placeholder="e.g. Side gate code is 1234, please park on driveway…"
                  defaultValue="Side gate will be unlocked. Dog will be inside." />
                <button className="btn-green" style={{ marginTop: 10, width: '100%' }}>Save Notes</button>
              </div>
              <div className="card" style={{ gridColumn: 'span 2', background: '#e3f2fd', border: '2px solid #90caf9' }}>
                <div style={{ fontFamily: "'Fredoka One'", fontSize: 17, color: '#1565c0', marginBottom: 4 }}>👷 Your Installer</div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>Jamie Robinson</div>
                <div style={{ color: '#555', fontSize: 14 }}>028 2044 0670 · 5 Fairhill Street, Ballycastle</div>
                <button className="btn-green" style={{ marginTop: 10 }}>📞 Call Jamie</button>
              </div>
            </div>
          </div>
        )}

        {/* EXTRAS */}
        {tab === 'extras' && (
          <div>
            <h2 style={{ fontFamily: "'Fredoka One'", fontSize: 26, color: '#1A2E44', marginBottom: 16 }}>⭐ Add Extras to Your Build</h2>
            <div style={{ background: '#fffde7', borderRadius: 12, padding: '10px 16px', marginBottom: 20, fontSize: 13, fontWeight: 600, color: '#e65100' }}>
              ⚡ Add-ons are subject to installation feasibility — BCF will confirm before charging.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {EXTRAS.map(e => (
                <div key={e.id} className="extra-card">
                  <div style={{ fontSize: 36 }}>{e.icon}</div>
                  <div style={{ fontFamily: "'Fredoka One'", fontSize: 17, marginTop: 6 }}>{e.name}</div>
                  <div style={{ fontSize: 13, color: '#666', margin: '4px 0 12px' }}>{e.desc}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 800, fontSize: 18, color: '#2e7d32' }}>£{e.price}</span>
                    {cart.find(c => c.id === e.id)
                      ? <span className="tag">✓ Added</span>
                      : <button className="btn-green" style={{ fontSize: 13, padding: '7px 14px' }} onClick={() => addToCart(e)}>Add to Order</button>}
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="card" style={{ marginTop: 24, background: '#e8f5e9', border: '2px solid #a5d6a7' }}>
                <div style={{ fontFamily: "'Fredoka One'", fontSize: 18, color: '#2e7d32' }}>🛒 Your Extras Request</div>
                {cart.map(c => <div key={c.id} style={{ fontWeight: 700, margin: '4px 0' }}>{c.icon} {c.name} — £{c.price}</div>)}
                <div style={{ fontWeight: 800, fontSize: 18, marginTop: 8 }}>Total: £{cart.reduce((s, c) => s + c.price, 0)}</div>
                <button className="btn-green" style={{ marginTop: 12 }}>📤 Send Request to BCF Team</button>
              </div>
            )}
          </div>
        )}

        {/* REFER */}
        {tab === 'refer' && (
          <div>
            <h2 style={{ fontFamily: "'Fredoka One'", fontSize: 26, color: '#1A2E44', marginBottom: 16 }}>🎁 Refer a Friend — Earn £50</h2>
            <div className="card" style={{ background: 'linear-gradient(135deg, #1A2E44, #2e5339)', color: '#fff', marginBottom: 20, textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: 48 }}>🎁</div>
              <div style={{ fontFamily: "'Fredoka One'", fontSize: 32, color: '#FFD700', margin: '8px 0' }}>£50 Per Referral</div>
              <div style={{ color: '#a5d6a7', fontSize: 14 }}>Share your unique link — earn £50 for every friend who books a build!</div>
            </div>
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Your Referral Link</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1, background: '#f5f5f5', borderRadius: 10, padding: '10px 14px', fontFamily: 'monospace', fontSize: 13, color: '#555' }}>
                  bcf.co.uk/refer/SARAH2026
                </div>
                <button className="btn-green" onClick={() => { setReferCopied(true); setTimeout(() => setReferCopied(false), 2000) }}>
                  {referCopied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                <button className="btn-green" style={{ background: '#25D366' }}>💬 Share on WhatsApp</button>
                <button className="btn-green" style={{ background: '#1565c0' }}>📧 Share by Email</button>
              </div>
            </div>
            <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[['👤', 'Referrals Sent', '3'], ['✅', 'Converted', '1'], ['💰', 'Total Earned', '£50']].map(([icon, label, val]) => (
                <div key={label} className="card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28 }}>{icon}</div>
                  <div style={{ fontFamily: "'Fredoka One'", fontSize: 24, color: '#2e7d32' }}>{val}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REMINDERS */}
        {tab === 'reminders' && (
          <div>
            <h2 style={{ fontFamily: "'Fredoka One'", fontSize: 26, color: '#1A2E44', marginBottom: 16 }}>🔔 Annual Maintenance Reminders</h2>
            <div className="card" style={{ marginBottom: 20, background: '#e8f5e9', border: '2px solid #a5d6a7' }}>
              <div style={{ fontFamily: "'Fredoka One'", fontSize: 18, color: '#2e7d32', marginBottom: 8 }}>✅ Free Annual Service Reminder</div>
              <div style={{ fontSize: 14, color: '#555', marginBottom: 16 }}>
                We'll send you a reminder each year to check bolts, treat timber, and keep your frame safe. Completely free — just set your preferred month!
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ fontWeight: 700, fontSize: 13 }}>Reminder Month</label>
                  <select style={{ display: 'block', marginTop: 4, padding: '8px 12px', borderRadius: 10, border: '2px solid #c8e6c9', fontFamily: 'inherit', fontSize: 14 }}>
                    {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontWeight: 700, fontSize: 13 }}>Notify via</label>
                  <select style={{ display: 'block', marginTop: 4, padding: '8px 12px', borderRadius: 10, border: '2px solid #c8e6c9', fontFamily: 'inherit', fontSize: 14 }}>
                    <option>Email</option><option>Email + SMS</option><option>SMS only</option>
                  </select>
                </div>
                <button className="btn-green" style={{ alignSelf: 'flex-end' }} onClick={() => setReminderSet(true)}>
                  {reminderSet ? '✓ Reminder Set!' : 'Set Reminder'}
                </button>
              </div>
            </div>
            <div className="card">
              <div style={{ fontFamily: "'Fredoka One'", fontSize: 16, marginBottom: 12 }}>📋 Annual Maintenance Checklist</div>
              {['Check and tighten all bolts and fixings', 'Re-treat timber with preservative oil or stain', 'Inspect rope ladders and swings for wear', 'Clear bark/safety surface and top up if needed', 'Check slide for cracks or sharp edges', 'Oil any metal hinges or chains'].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '6px 0', borderBottom: i < 5 ? '1px solid #f0ede8' : 'none' }}>
                  <span style={{ color: '#4CAF50', fontWeight: 800 }}>✓</span>
                  <span style={{ fontSize: 14 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REVIEW */}
        {tab === 'review' && (
          <div>
            <h2 style={{ fontFamily: "'Fredoka One'", fontSize: 26, color: '#1A2E44', marginBottom: 16 }}>✏️ Leave a Review</h2>
            {reviewSubmitted ? (
              <div className="card" style={{ textAlign: 'center', padding: 48, background: '#e8f5e9' }}>
                <div style={{ fontSize: 56 }}>🎉</div>
                <div style={{ fontFamily: "'Fredoka One'", fontSize: 26, color: '#2e7d32', marginTop: 12 }}>Thank You!</div>
                <div style={{ color: '#555', marginTop: 8 }}>Your review means the world to us and helps other families find us!</div>
                <div style={{ marginTop: 16, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="btn-green" style={{ background: '#25D366' }}>Share on WhatsApp</button>
                  <button className="btn-green" style={{ background: '#1877f2' }}>Share on Facebook</button>
                </div>
              </div>
            ) : (
              <div className="card" style={{ maxWidth: 540 }}>
                <div style={{ fontWeight: 800, marginBottom: 12 }}>How would you rate your BCF experience?</div>
                <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <button key={s} className="star-btn" onClick={() => setReviewStars(s)}
                      style={{ color: s <= reviewStars ? '#FFD700' : '#ccc' }}>★</button>
                  ))}
                </div>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>Tell us about your experience</div>
                <textarea value={reviewText} onChange={e => setReviewText(e.target.value)}
                  style={{ width: '100%', border: '2px solid #e0e0e0', borderRadius: 10, padding: 12, fontFamily: 'inherit', fontSize: 14, resize: 'vertical', minHeight: 120 }}
                  placeholder="We'd love to hear about your kids enjoying the frame!" />
                <button className="btn-green" style={{ width: '100%', fontSize: 16, marginTop: 16 }}
                  onClick={() => { if (reviewStars > 0 && reviewText.trim()) setReviewSubmitted(true) }}>
                  Submit Review
                </button>
                {reviewStars === 0 && <div style={{ color: '#e53935', fontSize: 12, marginTop: 6 }}>Please select a star rating</div>}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
