import React from 'react'

const STAGES = [
  {
    n:1, label:'Order Confirmed', status:'done', date:'28 Mar 2025', done:'28 Mar 2025',
    desc:'Your order has been confirmed and payment processed successfully.',
    updates:['Payment received in full','Order reference BCF-2025-0842 issued','Materials procurement started'],
  },
  {
    n:2, label:'Site Survey & Groundwork', status:'done', date:'4 Apr 2025', done:'4 Apr 2025',
    desc:'Site cleared, measured, levelled and prepared for installation.',
    updates:['Site survey completed','Ground levelled and compacted','Post hole positions marked and dug'],
  },
  {
    n:3, label:'Frame Construction', status:'active', date:'10 Apr 2025', done:null,
    desc:'Main frame structure being assembled and secured on site.',
    updates:['Main upright posts installed and cemented','Cross beams fitted — upper section in progress'],
  },
  {
    n:4, label:'Accessories & Add-Ons', status:'pending', date:'Est. 14 Apr 2025', done:null,
    desc:'Slides, swings, climbing nets and all accessories fitted.',
    updates:[],
  },
  {
    n:5, label:'Safety Inspection', status:'pending', date:'Est. 17 Apr 2025', done:null,
    desc:'Full safety check and quality sign-off before handover.',
    updates:[],
  },
  {
    n:6, label:'Handover & Sign-Off', status:'pending', date:'Est. 18 Apr 2025', done:null,
    desc:'Walk-through with installer, documentation and project sign-off.',
    updates:[],
  },
]

const PCT = Math.round((STAGES.filter(s=>s.status==='done').length / STAGES.length)*100)

export default function BuildProgress() {
  return (
    <div>
      {/* Header summary */}
      <div className="p-card" style={{ marginBottom:22 }}>
        <div className="p-card-body">
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap', marginBottom:16 }}>
            <div>
              <h2 style={{ fontFamily:'var(--p-font-h)', fontSize:19 }}>Henderson Family Build</h2>
              <p style={{ fontSize:12.5, color:'var(--p-text-3)', marginTop:4 }}>Ref: BCF-2025-0842 · Started 28 Mar 2025</p>
            </div>
            <span className="p-badge p-badge-amber" style={{ fontSize:12, padding:'6px 13px' }}>🔨 In Progress</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:13 }}>
            <div className="p-progress" style={{ flex:1, height:10 }}>
              <div className="p-progress-bar" style={{ width:`${PCT}%` }} />
            </div>
            <span style={{ fontFamily:'var(--p-font-h)', fontSize:20, fontWeight:700, color:'var(--p-green)', flexShrink:0 }}>{PCT}%</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11.5, color:'var(--p-text-3)', marginTop:7 }}>
            <span>{STAGES.filter(s=>s.status==='done').length} of {STAGES.length} stages complete</span>
            <span>Est. completion: 18 Apr 2025</span>
          </div>
        </div>
      </div>

      {/* Stage list */}
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {STAGES.map((s,i) => (
          <div key={i} className="p-card" style={{
            borderLeft:`4px solid ${s.status==='done'?'var(--p-green)':s.status==='active'?'var(--p-amber)':'var(--p-border)'}`
          }}>
            <div className="p-card-body">
              <div style={{ display:'flex', alignItems:'flex-start', gap:15, flexWrap:'wrap' }}>
                {/* Dot */}
                <div style={{
                  width:42, height:42, borderRadius:'50%', flexShrink:0,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize: s.status==='done'?17:14, fontWeight:800,
                  background: s.status==='done'?'var(--p-green)':s.status==='active'?'var(--p-amber)':'var(--p-surface-2)',
                  color: s.status==='pending'?'var(--p-text-3)':'#fff',
                }}>
                  {s.status==='done'?'✓':s.n}
                </div>

                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:9, flexWrap:'wrap', marginBottom:4 }}>
                    <span style={{ fontWeight:800, fontSize:14 }}>Stage {s.n}: {s.label}</span>
                    <span className={`p-badge p-badge-${s.status==='done'?'green':s.status==='active'?'amber':'muted'}`}>
                      {s.status==='done'?'✓ Complete':s.status==='active'?'🔨 In Progress':'⏳ Upcoming'}
                    </span>
                  </div>
                  <p style={{ fontSize:12.5, color:'var(--p-text-3)', marginBottom:6 }}>{s.desc}</p>
                  <p style={{ fontSize:11.5, color:'var(--p-text-3)' }}>
                    {s.done ? `Completed: ${s.done}` : `Estimated: ${s.date}`}
                  </p>

                  {s.updates.length > 0 && (
                    <div style={{ marginTop:12, padding:'10px 13px', background:'var(--p-surface-2)', borderRadius:'var(--p-r-md)' }}>
                      <div className="p-label" style={{ marginBottom:6 }}>Updates</div>
                      {s.updates.map((u,j) => (
                        <div key={j} style={{ display:'flex', gap:8, fontSize:12.5, color:'var(--p-text-2)', marginBottom:3 }}>
                          <span style={{ color:'var(--p-green)', fontWeight:800 }}>·</span>{u}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
