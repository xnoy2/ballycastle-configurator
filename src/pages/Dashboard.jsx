import React from 'react'

const STEPS = [
  { label: 'Order Confirmed',       meta: '28 Mar 2025',  status: 'done'    },
  { label: 'Groundwork',            meta: '4 Apr 2025',   status: 'done'    },
  { label: 'Frame Construction',    meta: 'In progress',  status: 'active'  },
  { label: 'Accessories & Extras',  meta: 'Est. 14 Apr',  status: 'pending' },
  { label: 'Safety Inspection',     meta: 'Est. 17 Apr',  status: 'pending' },
  { label: 'Handover',              meta: 'Est. 18 Apr',  status: 'pending' },
]

const STATS = [
  { icon: '💷', bg: '#e8f2eb', label: 'Order Total',      value: '£4,346', sub: 'inc. VAT' },
  { icon: '📅', bg: '#e0f2fe', label: 'Est. Completion',  value: '18 Apr', sub: '2025'     },
  { icon: '🏗️', bg: '#fef3c7', label: 'Build Stage',      value: 'Stage 3', sub: 'of 6'   },
  { icon: '⭐', bg: '#fdf0e9', label: 'Add-Ons Available', value: '6 items', sub: 'Explore' },
]

export default function Dashboard() {
  return (
    <div>
      {/* Welcome banner */}
      <div className="p-banner">
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:20, flexWrap:'wrap' }}>
          <div style={{ flex:1 }}>
            <div className="p-banner-title">Welcome back, Sarah & David! 👋</div>
            <div className="p-banner-sub">Your climbing frame is being built — here's your live project update.</div>
            <div className="p-banner-acts">
              <a href="/portal/progress" className="p-btn p-btn-primary">📊 View Progress</a>
              <a href="/portal/extras"   className="p-btn p-btn-ghost">⭐ Add Extras</a>
            </div>
          </div>
          <div style={{ textAlign:'right', flexShrink:0 }}>
            <div style={{ fontFamily:'var(--p-font-h)', fontSize:38, fontWeight:700, color:'#fff', lineHeight:1 }}>40%</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.65)', marginTop:4 }}>Build Complete</div>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ marginTop:16 }}>
          <div className="p-progress" style={{ height:7, background:'rgba(255,255,255,0.2)' }}>
            <div className="p-progress-bar" style={{ width:'40%', background:'rgba(255,255,255,0.80)' }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10.5, color:'rgba(255,255,255,0.45)', marginTop:5 }}>
            {['Order','Groundwork','Frame','Extras','Inspect','Handover'].map(l => (
              <span key={l}>{l}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-g4" style={{ marginBottom:22 }}>
        {STATS.map(s => (
          <div key={s.label} className="p-stat">
            <div className="p-stat-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div>
              <div className="p-stat-label">{s.label}</div>
              <div className="p-stat-value">{s.value}</div>
              <div className="p-stat-sub">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="p-g2" style={{ gap:20 }}>
        {/* Build timeline */}
        <div className="p-card">
          <div className="p-card-header">
            <span style={{ fontSize:15 }}>🏗️</span>
            <span className="p-card-title">Project Tracker</span>
            <span className="p-badge p-badge-amber">In Progress</span>
          </div>
          <div className="p-card-body">
            <div className="p-steps">
              {STEPS.map((s, i) => (
                <div key={i} className={`p-step p-step-${s.status}`}>
                  <div className="p-step-line" />
                  <div className="p-step-dot">
                    {s.status === 'done' ? '✓' : s.status === 'active' ? '●' : i + 1}
                  </div>
                  <div style={{ flex:1 }}>
                    <div className="p-step-label">{s.label}</div>
                    <div className="p-step-meta">{s.meta}</div>
                  </div>
                  {s.status === 'active' && (
                    <span className="p-badge p-badge-amber" style={{ marginTop:4 }}>Now</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Installer */}
          <div className="p-card">
            <div className="p-card-header">
              <span style={{ fontSize:15 }}>👷</span>
              <span className="p-card-title">Your Installer</span>
              <span className="p-badge p-badge-green">✓ Verified</span>
            </div>
            <div className="p-card-body" style={{ display:'flex', flexDirection:'column', gap:13 }}>
              <div style={{ display:'flex', gap:13, alignItems:'center' }}>
                <div style={{ width:50, height:50, borderRadius:'50%', background:'var(--p-green-lt)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>👷</div>
                <div>
                  <div style={{ fontWeight:800, fontSize:14.5 }}>Jamie Robinson</div>
                  <div style={{ fontSize:11.5, color:'var(--p-text-3)' }}>Lead Installer · 15+ yrs</div>
                </div>
              </div>
              {[
                { i:'📍', t:'5 Fairhill Street, Ballycastle BT54 6AY' },
                { i:'📞', t:'028 2044 0670' },
                { i:'✉️', t:'jamie@ballycastleclimbingframes.co.uk' },
              ].map(c => (
                <div key={c.t} style={{ display:'flex', gap:8, fontSize:12, color:'var(--p-text-2)', alignItems:'flex-start' }}>
                  <span style={{ flexShrink:0 }}>{c.i}</span><span>{c.t}</span>
                </div>
              ))}
              <a href="tel:02820440670" className="p-btn p-btn-primary" style={{ width:'100%' }}>📞 Call Jamie Now</a>
            </div>
          </div>

          {/* Trust row */}
          <div className="p-card">
            <div className="p-card-body">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {[
                  { e:'🏆', v:'500+', l:'Builds Done' },
                  { e:'⭐', v:'5-Star', l:'Reviews' },
                  { e:'🛡️', v:'15+', l:'Yrs Experience' },
                  { e:'📋', v:'Insured', l:'Fully Covered' },
                ].map(t => (
                  <div key={t.l} style={{ textAlign:'center', padding:'10px 0' }}>
                    <div style={{ fontSize:20 }}>{t.e}</div>
                    <div style={{ fontFamily:'var(--p-font-h)', fontSize:17, color:'var(--p-green)', fontWeight:700, marginTop:4 }}>{t.v}</div>
                    <div style={{ fontSize:10.5, color:'var(--p-text-3)', marginTop:1 }}>{t.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Referral teaser */}
          <a href="/portal/refer" style={{ textDecoration:'none' }}>
            <div className="p-card" style={{ background:'linear-gradient(135deg,#fef3c7,#fde68a)', border:'1.5px solid #fbbf24', cursor:'pointer' }}>
              <div className="p-card-body" style={{ display:'flex', alignItems:'center', gap:14 }}>
                <span style={{ fontSize:30 }}>🎁</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800, fontSize:14 }}>Earn £50 per referral!</div>
                  <div style={{ fontSize:11.5, color:'var(--p-text-2)', marginTop:2 }}>Share your link — earn when friends purchase.</div>
                </div>
                <span style={{ fontSize:18, color:'var(--p-amber)' }}>→</span>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
