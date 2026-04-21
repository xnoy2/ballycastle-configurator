import React, { useState } from 'react'

/* ════════════════════════════════════
   DELIVERY
   ════════════════════════════════════ */
export function Delivery() {
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)

  return (
    <div>
      <div className="p-sh"><h2>Delivery Information</h2></div>
      <div className="p-g2" style={{ gap:20 }}>

        <div className="p-card">
          <div className="p-card-header"><span>🚚</span><span className="p-card-title">Delivery Details</span></div>
          <div className="p-card-body" style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {[
              { icon:'📅', label:'Delivery Date',   value:'12 April 2025' },
              { icon:'⏰', label:'Time Window',      value:'8:00 AM – 12:00 PM' },
              { icon:'📍', label:'Address',          value:'14 Glenshane Rd, Ballycastle, BT54 6PH' },
              { icon:'📞', label:'Driver Contact',   value:'07890 123 456' },
            ].map(r => (
              <div key={r.label} style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                <span style={{ fontSize:18, flexShrink:0 }}>{r.icon}</span>
                <div>
                  <div className="p-label">{r.label}</div>
                  <div style={{ fontSize:13.5, fontWeight:600, color:'var(--p-text)' }}>{r.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="p-card">
            <div className="p-card-header"><span>📝</span><span className="p-card-title">Access Notes</span></div>
            <div className="p-card-body" style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <textarea
                className="p-input"
                rows={4}
                placeholder="E.g. Side gate will be open. Gate code: 1234. Please call on arrival."
                value={notes}
                onChange={e => { setNotes(e.target.value); setSaved(false) }}
                style={{ resize:'vertical' }}
              />
              <button className="p-btn p-btn-primary" onClick={() => setSaved(true)}>
                {saved ? '✓ Saved' : 'Save Notes'}
              </button>
            </div>
          </div>

          <div className="p-card" style={{ background:'var(--p-green-lt)', border:'1.5px solid var(--p-green)' }}>
            <div className="p-card-body" style={{ textAlign:'center', padding:'22px 18px' }}>
              <div style={{ fontSize:34, marginBottom:8 }}>📦</div>
              <div style={{ fontWeight:800, fontSize:15, color:'var(--p-green-dk)' }}>Materials Arriving Soon</div>
              <div style={{ fontSize:12.5, color:'var(--p-green)', marginTop:6, lineHeight:1.6 }}>
                Your timber and components are scheduled for 12 Apr. Our driver will call 30 min before arrival.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════
   ADD EXTRAS
   ════════════════════════════════════ */
const EXTRAS = [
  { id:1, emoji:'🪢', name:'Rope Bridge',         price:249, desc:'Connects two towers at height. Treated timber frame.' },
  { id:2, emoji:'🧱', name:'Rock Climbing Wall',   price:199, desc:'12 coloured hand-holds, suits ages 4+.' },
  { id:3, emoji:'🔥', name:"Fireman's Pole",       price:129, desc:'Galvanised steel pole, 3m height.' },
  { id:4, emoji:'🛝', name:'Tube Slide — 5ft',     price:349, desc:'Fun moulded plastic tube with grip handles.' },
  { id:5, emoji:'🎯', name:'Target & Bow Set',     price:79,  desc:'Safe foam arrows with large target board.' },
  { id:6, emoji:'🔦', name:'Solar Garden Lights',  price:59,  desc:'Set of 4 stake LED lights, no wiring needed.' },
]

export function AddExtras() {
  const [cart, setCart] = useState([])
  const toggle = id => setCart(p => p.includes(id) ? p.filter(x => x!==id) : [...p,id])
  const total  = EXTRAS.filter(e => cart.includes(e.id)).reduce((s,e) => s+e.price, 0)

  return (
    <div>
      <div className="p-sh">
        <h2>Add Extras to Your Build</h2>
        {cart.length > 0 && (
          <span className="p-badge p-badge-green">{cart.length} selected · £{total}</span>
        )}
      </div>
      <div className="p-g3" style={{ marginBottom:22 }}>
        {EXTRAS.map(e => (
          <div key={e.id} className={`p-product${cart.includes(e.id)?' selected':''}`}>
            <div className="p-product-thumb">{e.emoji}</div>
            <div className="p-product-body">
              <div className="p-product-name">{e.name}</div>
              <div className="p-product-price">£{e.price}</div>
              <div className="p-product-desc">{e.desc}</div>
              <button
                className={`p-btn ${cart.includes(e.id)?'p-btn-secondary':'p-btn-primary'}`}
                style={{ width:'100%', marginTop:11 }}
                onClick={() => toggle(e.id)}
              >{cart.includes(e.id) ? '✓ Added' : 'Add to Build'}</button>
            </div>
          </div>
        ))}
      </div>
      {cart.length > 0 && (
        <div style={{ background:'var(--p-green)', borderRadius:'var(--p-r-lg)', padding:'16px 22px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14 }}>
          <div style={{ color:'#fff' }}>
            <div style={{ fontWeight:800, fontSize:15 }}>{cart.length} extra{cart.length>1?'s':''} selected</div>
            <div style={{ fontSize:12.5, opacity:0.75 }}>Additional cost: £{total}</div>
          </div>
          <button className="p-btn" style={{ background:'#fff', color:'var(--p-green)', fontWeight:800 }}>
            Request These Extras →
          </button>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════
   REFER A FRIEND
   ════════════════════════════════════ */
export function ReferAFriend() {
  const [copied, setCopied] = useState(false)
  const link = 'https://ballycastleclimbingframes.co.uk/ref/henderson2025'
  const copy = () => { navigator.clipboard?.writeText(link); setCopied(true); setTimeout(()=>setCopied(false),2200) }

  return (
    <div>
      <div className="p-sh"><h2>Refer a Friend</h2></div>

      <div className="p-banner" style={{ marginBottom:22, textAlign:'center' }}>
        <div style={{ fontSize:46, marginBottom:10 }}>🎁</div>
        <div className="p-banner-title">Earn £50 for Every Referral!</div>
        <div className="p-banner-sub" style={{ maxWidth:420, margin:'8px auto 0' }}>
          When your friend completes a purchase using your link, you both benefit. You receive £50 cash — automatically.
        </div>
      </div>

      <div className="p-g2" style={{ gap:20, marginBottom:22 }}>
        <div className="p-card">
          <div className="p-card-header"><span>🔗</span><span className="p-card-title">Your Referral Link</span></div>
          <div className="p-card-body" style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'flex', gap:8 }}>
              <input className="p-input" readOnly value={link} style={{ flex:1, fontSize:11.5 }} />
              <button className="p-btn p-btn-primary" onClick={copy}>{copied?'✓ Copied!':'Copy'}</button>
            </div>
            <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
              {['📧 Email','💬 WhatsApp','📱 SMS','🐦 X / Twitter'].map(s => (
                <button key={s} className="p-btn p-btn-secondary p-btn-sm">{s}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-card">
          <div className="p-card-header"><span>💰</span><span className="p-card-title">Your Earnings</span></div>
          <div className="p-card-body">
            <div style={{ textAlign:'center', padding:'14px 0' }}>
              <div style={{ fontFamily:'var(--p-font-h)', fontSize:40, color:'var(--p-green)', fontWeight:700 }}>£0</div>
              <div style={{ fontSize:12.5, color:'var(--p-text-3)', marginTop:4 }}>Earned so far</div>
            </div>
            <div style={{ background:'var(--p-surface-2)', borderRadius:'var(--p-r-md)', padding:13, textAlign:'center', fontSize:12.5, color:'var(--p-text-3)', lineHeight:1.5 }}>
              Share your link to start earning. Rewards paid monthly by bank transfer.
            </div>
          </div>
        </div>
      </div>

      <div className="p-card">
        <div className="p-card-header"><span>ℹ️</span><span className="p-card-title">How It Works</span></div>
        <div className="p-card-body">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, textAlign:'center' }}>
            {[
              ['🔗','Share Your Link','Send your unique referral link to friends or family.'],
              ['✅','They Purchase','Your friend buys a climbing frame using your link.'],
              ['💰','You Earn £50','£50 credited to your account. Every single time.'],
            ].map(([e,t,d]) => (
              <div key={t}>
                <div style={{ fontSize:30, marginBottom:8 }}>{e}</div>
                <div style={{ fontWeight:800, fontSize:13.5, color:'var(--p-text)', marginBottom:5 }}>{t}</div>
                <div style={{ fontSize:12, color:'var(--p-text-3)', lineHeight:1.6 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════
   MAINTENANCE
   ════════════════════════════════════ */
const CHECKS = [
  'Check all bolts and fixings are tight',
  'Inspect timber for splinters — sand smooth if needed',
  'Apply wood preservative stain to all exposed timber',
  'Check ropes, nets and straps for wear or fraying',
  'Clear leaves and debris from platform and decking',
  'Inspect all slides for cracks or sharp edges',
  'Test all anchor points and safety handrails',
  'Lubricate swing chains and pivot points',
]

export function Maintenance() {
  const [done, setDone]   = useState([])
  const toggle = i => setDone(p => p.includes(i) ? p.filter(x=>x!==i) : [...p,i])
  const pct = Math.round((done.length / CHECKS.length)*100)

  return (
    <div>
      <div className="p-sh"><h2>Maintenance Reminders</h2></div>
      <div className="p-g2" style={{ gap:20 }}>

        <div className="p-card">
          <div className="p-card-header">
            <span>📋</span>
            <span className="p-card-title">Annual Checklist</span>
            <span className="p-badge p-badge-green">{done.length}/{CHECKS.length} done</span>
          </div>
          <div className="p-card-body" style={{ display:'flex', flexDirection:'column', gap:4 }}>
            {CHECKS.map((item,i) => (
              <label key={i} className={`p-check-item${done.includes(i)?' done':''}`} onClick={() => toggle(i)}>
                <input type="checkbox" checked={done.includes(i)} onChange={() => toggle(i)} />
                <span style={{ fontSize:13 }}>{item}</span>
              </label>
            ))}
            <div className="p-progress" style={{ height:7, marginTop:10 }}>
              <div className="p-progress-bar" style={{ width:`${pct}%` }} />
            </div>
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="p-card">
            <div className="p-card-header"><span>🔔</span><span className="p-card-title">Reminder Settings</span></div>
            <div className="p-card-body" style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label className="p-label">Reminder Month</label>
                <select className="p-input">
                  {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m=>(
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="p-label">Notify via</label>
                {['Email','SMS','Push Notification'].map(n => (
                  <label key={n} style={{ display:'flex', gap:9, alignItems:'center', cursor:'pointer', fontSize:13, marginBottom:7 }}>
                    <input type="checkbox" defaultChecked={n==='Email'} style={{ accentColor:'var(--p-green)', width:15, height:15 }} />
                    {n}
                  </label>
                ))}
              </div>
              <button className="p-btn p-btn-primary">Save Preferences</button>
            </div>
          </div>

          <div className="p-card" style={{ background:'var(--p-sky-lt)', border:'1.5px solid var(--p-sky)' }}>
            <div className="p-card-body" style={{ textAlign:'center', padding:'20px' }}>
              <div style={{ fontSize:28, marginBottom:8 }}>🛡️</div>
              <div style={{ fontWeight:800, color:'#0369a1', fontSize:14 }}>Book a Professional Service</div>
              <div style={{ fontSize:12, color:'#0284c7', marginTop:5, lineHeight:1.6 }}>
                Annual inspection and service by our team — just £149.
              </div>
              <button className="p-btn" style={{ background:'var(--p-sky)', color:'#fff', marginTop:12, fontWeight:800 }}>Book Service</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════
   LEAVE A REVIEW
   ════════════════════════════════════ */
export function LeaveReview() {
  const [rating, setRating] = useState(0)
  const [hover,  setHover]  = useState(0)
  const [text,   setText]   = useState('')
  const [sent,   setSent]   = useState(false)

  const LABELS = ['','Poor','Fair','Good','Great','Excellent!']

  if (sent) return (
    <div style={{ textAlign:'center', padding:'60px 24px' }}>
      <div style={{ fontSize:54, marginBottom:16 }}>🌟</div>
      <h2 style={{ fontFamily:'var(--p-font-h)', fontSize:26, marginBottom:8 }}>Thank you for your review!</h2>
      <p style={{ fontSize:13.5, color:'var(--p-text-3)', maxWidth:380, margin:'0 auto', lineHeight:1.6 }}>
        Your feedback means the world to us and helps other families choose with confidence.
      </p>
      <div style={{ display:'flex', gap:10, justifyContent:'center', marginTop:24 }}>
        <button className="p-btn p-btn-primary">Share on Google</button>
        <button className="p-btn p-btn-secondary">Share on Facebook</button>
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth:580, margin:'0 auto' }}>
      <div className="p-sh"><h2>Leave a Review</h2></div>
      <div className="p-card">
        <div className="p-card-body" style={{ display:'flex', flexDirection:'column', gap:22 }}>

          {/* Stars */}
          <div style={{ textAlign:'center', paddingTop:8 }}>
            <div className="p-label" style={{ marginBottom:12 }}>How would you rate your overall experience?</div>
            <div className="p-stars" style={{ justifyContent:'center', gap:6 }}>
              {[1,2,3,4,5].map(s => (
                <span
                  key={s}
                  className={`p-star${s<=(hover||rating)?' on':''}`}
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHover(s)}
                  onMouseLeave={() => setHover(0)}
                >★</span>
              ))}
            </div>
            {rating > 0 && (
              <div style={{ fontSize:13, color:'var(--p-text-3)', marginTop:7 }}>{LABELS[rating]}</div>
            )}
          </div>

          {/* Text */}
          <div>
            <label className="p-label">Your Review</label>
            <textarea
              className="p-input"
              rows={5}
              placeholder="Tell us about your experience — the build quality, your installer, and how much your children enjoy the frame…"
              value={text}
              onChange={e => setText(e.target.value)}
              style={{ resize:'vertical' }}
            />
          </div>

          {/* Photo */}
          <div>
            <label className="p-label">Add a Photo (optional)</label>
            <div className="p-upload" style={{ padding:18 }} onClick={() => document.getElementById('rv-img').click()}>
              <div style={{ fontSize:26, marginBottom:6 }}>📸</div>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--p-text)' }}>Add a photo of the finished frame</div>
              <input id="rv-img" type="file" accept="image/*" multiple style={{ display:'none' }} />
            </div>
          </div>

          <button
            className="p-btn p-btn-primary p-btn-lg"
            disabled={!rating || !text.trim()}
            style={{ opacity:(!rating||!text.trim())?0.45:1, width:'100%' }}
            onClick={() => setSent(true)}
          >Submit Review ★</button>
        </div>
      </div>
    </div>
  )
}
