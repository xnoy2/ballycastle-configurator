import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ReferralLanding() {
  const { code }                      = useParams()
  const navigate                      = useNavigate()
  const [referrerName, setReferrerName] = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [form,         setForm]         = useState({ name: '', email: '', phone: '' })
  const [sending,      setSending]      = useState(false)
  const [sent,         setSent]         = useState(false)
  const [err,          setErr]          = useState('')

  useEffect(() => {
    async function lookupReferrer() {
      const { data } = await supabase.rpc('get_referrer_name', { referral_code: code })
      setReferrerName(data || null)
      setLoading(false)
    }
    lookupReferrer()
  }, [code])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) { setErr('Please fill in your name and email.'); return }
    setSending(true)
    setErr('')

    // Save as a quote lead with the referral code noted
    const { error } = await supabase.from('quotes').insert({
      name:        form.name.trim(),
      email:       form.email.trim(),
      phone:       form.phone.trim() || '',
      status:      'new',
      notes:       `Referred by order: ${code}`,
      line_items:  [],
      total_price: 0,
    })

    setSending(false)
    if (error) { setErr('Something went wrong — please try again.'); return }

    // Track this visit so the admin sees it linked to the referrer
    supabase.rpc('track_referral_visit', {
      p_referral_code: code,
      p_friend_name:   form.name.trim(),
      p_friend_email:  form.email.trim(),
      p_friend_phone:  form.phone.trim() || null,
    }).catch(console.warn)

    setSent(true)
  }

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Nunito', sans-serif; }
    .rl-wrap { min-height: 100vh; background: linear-gradient(160deg, #1E3070 0%, #253080 60%, #1E3070 100%); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; }
    .rl-card { background: #fff; border-radius: 24px; padding: 40px 36px; max-width: 520px; width: 100%; box-shadow: 0 24px 80px rgba(0,0,0,0.35); }
    .rl-logo { height: 56px; margin-bottom: 20px; display: block; }
    .rl-hero { text-align: center; margin-bottom: 28px; }
    .rl-gift { font-size: 52px; margin-bottom: 8px; }
    .rl-title { font-family: 'Fredoka One', cursive; font-size: 28px; color: #1E3070; line-height: 1.2; }
    .rl-sub { font-size: 15px; color: #555; margin-top: 10px; line-height: 1.6; }
    .rl-referrer { display: inline-block; background: #FFFBE6; color: #F9C800; border-radius: 10px; padding: 4px 14px; font-weight: 800; font-size: 16px; margin-bottom: 4px; }
    .rl-divider { border: none; border-top: 1px solid #eee; margin: 24px 0; }
    .rl-form-title { font-family: 'Fredoka One', cursive; font-size: 18px; color: #1E3070; margin-bottom: 14px; }
    .rl-input { width: 100%; padding: 11px 14px; border: 2px solid #e0e0e0; border-radius: 12px; font-family: inherit; font-size: 14px; outline: none; transition: border-color 0.15s; }
    .rl-input:focus { border-color: #F9C800; }
    .rl-btn { width: 100%; padding: 14px; background: #F9C800; color: #1E3070; border: none; border-radius: 12px; font-family: 'Fredoka One', cursive; font-size: 18px; cursor: pointer; transition: background 0.15s; }
    .rl-btn:hover { background: #D4A800; }
    .rl-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .rl-or { text-align: center; font-size: 13px; color: #aaa; margin: 12px 0; }
    .rl-configurator { width: 100%; padding: 12px; background: #fff; color: #F9C800; border: 2px solid #F9C800; border-radius: 12px; font-family: 'Fredoka One', cursive; font-size: 16px; cursor: pointer; transition: all 0.15s; }
    .rl-configurator:hover { background: #FFFDE7; }
    .rl-success { text-align: center; padding: 16px 0; }
    .rl-error { color: #dc2626; font-size: 13px; margin-top: 4px; }
    .rl-badge { display: flex; align-items: center; gap: 10px; background: #FFFDE7; border: 1px solid #FFF1AA; border-radius: 12px; padding: 12px 16px; margin-bottom: 20px; }
    .rl-badge-icon { font-size: 24px; }
    .rl-badge-text { font-size: 13px; color: #1E3070; font-weight: 600; }
  `

  return (
    <div className="rl-wrap">
      <style>{styles}</style>
      <div className="rl-card">
        <div style={{ textAlign: 'center' }}>
          <img src="/images/bcf.png" alt="Ballycastle Climbing Frames" className="rl-logo" />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#888' }}>Loading…</div>
        ) : sent ? (
          <div className="rl-success">
            <div style={{ fontSize: 56 }}>🎉</div>
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 26, color: '#F9C800', marginTop: 12 }}>We'll be in touch!</div>
            <p style={{ fontSize: 14, color: '#555', marginTop: 10, lineHeight: 1.6 }}>
              Thanks for your interest in Ballycastle Climbing Frames. We'll reach out shortly to discuss your dream build.
            </p>
            <button className="rl-btn" style={{ marginTop: 24 }} onClick={() => navigate('/')}>
              🛝 Explore the Configurator
            </button>
          </div>
        ) : (
          <>
            <div className="rl-hero">
              <div className="rl-gift">🎁</div>
              {referrerName ? (
                <>
                  <div className="rl-title">You were invited by</div>
                  <div style={{ marginTop: 8 }}>
                    <span className="rl-referrer">{referrerName}</span>
                  </div>
                  <div className="rl-sub">
                    Your friend loves their Ballycastle Climbing Frame — and thinks you will too!
                  </div>
                </>
              ) : (
                <>
                  <div className="rl-title">You've been referred to<br />Ballycastle Climbing Frames!</div>
                  <div className="rl-sub">
                    Custom-built climbing frames for kids — designed, delivered & installed across Northern Ireland.
                  </div>
                </>
              )}
            </div>

            <div className="rl-badge">
              <span className="rl-badge-icon">🌳</span>
              <span className="rl-badge-text">Ballycastle Climbing Frames · Custom-built for kids · Free consultation</span>
            </div>

            <hr className="rl-divider" />

            <div className="rl-form-title">📞 Get a Free Consultation</div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                className="rl-input"
                placeholder="Your name *"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                required
                autoFocus
              />
              <input
                className="rl-input"
                type="email"
                placeholder="Your email *"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
              />
              <input
                className="rl-input"
                type="tel"
                placeholder="Phone number (optional)"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              />
              {err && <p className="rl-error">{err}</p>}
              <button type="submit" className="rl-btn" disabled={sending}>
                {sending ? 'Sending…' : '✉️ Request a Callback'}
              </button>
            </form>

            <div className="rl-or">— or —</div>

            <button className="rl-configurator" onClick={() => navigate('/')}>
              🛝 Design Your Frame Now
            </button>
          </>
        )}
      </div>
    </div>
  )
}
