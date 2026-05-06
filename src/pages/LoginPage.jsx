import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Nunito', sans-serif; overflow: hidden; }

  @keyframes lp-float {
    0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
    33%  { transform: translateY(-20px) rotate(6deg) scale(1.05); }
    66%  { transform: translateY(-10px) rotate(-4deg) scale(0.97); }
  }
  @keyframes lp-float-r {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    40%  { transform: translateY(16px) rotate(-5deg); }
    75%  { transform: translateY(6px) rotate(4deg); }
  }
  @keyframes lp-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes lp-slide-up {
    from { opacity: 0; transform: translateY(40px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes lp-logo-bob {
    0%, 100% { transform: translateY(0) scale(1); }
    45%  { transform: translateY(-10px) scale(1.04); }
    65%  { transform: translateY(-5px) scale(1.02); }
  }
  @keyframes lp-bg-shift {
    0%, 100% { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
  }
  @keyframes lp-btn-pulse {
    0%, 100% { box-shadow: 0 6px 20px rgba(249,200,0,0.45); }
    50%  { box-shadow: 0 6px 32px rgba(249,200,0,0.75), 0 0 0 6px rgba(249,200,0,0.12); }
  }
  @keyframes lp-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes lp-shake {
    0%, 100% { transform: translateX(0); }
    20%  { transform: translateX(-6px); }
    40%  { transform: translateX(6px); }
    60%  { transform: translateX(-4px); }
    80%  { transform: translateX(4px); }
  }
  @keyframes lp-pop-in {
    from { opacity: 0; transform: scale(0.85) translateY(6px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes lp-star-spin {
    0%,100% { transform: rotate(0deg) scale(1); }
    50%  { transform: rotate(180deg) scale(1.15); }
  }

  .lp-wrap {
    min-height: 100vh;
    background: linear-gradient(270deg, #1a2875, #1E3070, #243490, #1a2875);
    background-size: 400% 400%;
    animation: lp-bg-shift 10s ease infinite;
    display: flex; align-items: center; justify-content: center;
    padding: 24px;
    font-family: 'Nunito', sans-serif;
    position: relative; overflow: hidden;
  }

  /* ── Floating background decorations ── */
  .lp-deco {
    position: absolute; pointer-events: none; user-select: none;
    line-height: 1; will-change: transform;
  }

  /* ── Card ── */
  .lp-card {
    background: #fff;
    border-radius: 28px;
    padding: 42px 40px 36px;
    width: 100%; max-width: 420px;
    box-shadow: 0 32px 80px rgba(0,0,0,0.45), 0 0 0 1.5px rgba(255,255,255,0.08);
    position: relative; z-index: 10;
    animation: lp-slide-up 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    overflow: hidden;
  }

  /* top rainbow bar */
  .lp-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 5px;
    background: linear-gradient(90deg, #F9C800, #ff6b6b, #4ecdc4, #45b7d1, #F9C800);
    background-size: 200% auto;
    animation: lp-shimmer 3s linear infinite;
  }

  .lp-logo {
    height: 72px; display: block; margin: 0 auto 18px;
    animation: lp-logo-bob 3s ease-in-out infinite;
    filter: drop-shadow(0 6px 14px rgba(0,0,0,0.18));
  }

  .lp-brand {
    font-family: 'Fredoka One', cursive;
    font-size: 23px; color: #1E3070; text-align: center; margin-bottom: 3px;
  }

  .lp-sub {
    font-size: 13px; color: #94a3b8; text-align: center; margin-bottom: 30px;
  }

  .lp-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }

  .lp-label {
    font-size: 11px; font-weight: 800; color: #64748b;
    text-transform: uppercase; letter-spacing: .07em;
  }

  .lp-input {
    padding: 13px 16px;
    border: 2px solid #e2e8f0; border-radius: 14px;
    font-family: 'Nunito', sans-serif; font-size: 14px;
    outline: none; width: 100%; color: #1e293b;
    background: #f8fafc;
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s, background 0.2s;
  }
  .lp-input:focus {
    border-color: #F9C800;
    box-shadow: 0 0 0 4px rgba(249,200,0,0.15);
    background: #fffdf0;
    transform: scale(1.015);
  }

  .lp-btn {
    width: 100%; padding: 15px; border: none; border-radius: 16px;
    background: linear-gradient(135deg, #F9C800 0%, #e8b800 50%, #F9C800 100%);
    background-size: 200% auto;
    color: #1E3070; font-family: 'Fredoka One', cursive; font-size: 19px;
    cursor: pointer; margin-top: 10px; letter-spacing: 0.5px;
    transition: transform 0.15s, box-shadow 0.15s;
    animation: lp-btn-pulse 2.2s ease-in-out infinite;
  }
  .lp-btn:hover:not(:disabled) {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 10px 28px rgba(249,200,0,0.55);
    animation: none;
    background-position: right center;
  }
  .lp-btn:active:not(:disabled) { transform: scale(0.97); }
  .lp-btn:disabled { opacity: 0.5; cursor: not-allowed; animation: none; }

  .lp-error {
    background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 12px;
    padding: 11px 16px; font-size: 13px; color: #991b1b;
    margin-bottom: 14px; display: flex; align-items: center; gap: 8px;
    animation: lp-shake 0.4s ease both;
  }

  .lp-hint {
    font-size: 12px; color: #94a3b8; text-align: center;
    margin-top: 18px; line-height: 1.7;
  }

  /* ── Stars sprinkled around the card ── */
  .lp-card-star {
    position: absolute; font-size: 18px; opacity: 0.13; pointer-events: none;
    animation: lp-star-spin 4s ease-in-out infinite;
  }
`

const DECOS = [
  { e: '🛝', top: '7%',  left: '4%',  size: 44, dur: '7s',  delay: '0s',   anim: 'lp-float'   },
  { e: '⭐', top: '12%', left: '86%', size: 34, dur: '9s',  delay: '1.2s', anim: 'lp-float-r' },
  { e: '🌈', top: '68%', left: '3%',  size: 40, dur: '8s',  delay: '0.4s', anim: 'lp-float-r' },
  { e: '🎠', top: '74%', left: '87%', size: 42, dur: '10s', delay: '2s',   anim: 'lp-float'   },
  { e: '🌟', top: '42%', left: '2%',  size: 30, dur: '6s',  delay: '1.8s', anim: 'lp-float'   },
  { e: '🎪', top: '18%', left: '92%', size: 32, dur: '8.5s',delay: '0.8s', anim: 'lp-float-r' },
  { e: '🎡', top: '85%', left: '40%', size: 38, dur: '11s', delay: '3s',   anim: 'lp-float'   },
  { e: '⭐', top: '5%',  left: '52%', size: 24, dur: '6.5s',delay: '2.5s', anim: 'lp-spin'    },
  { e: '🏅', top: '55%', left: '94%', size: 28, dur: '7.5s',delay: '0.6s', anim: 'lp-float-r' },
  { e: '🎈', top: '90%', left: '10%', size: 32, dur: '9.5s',delay: '1.5s', anim: 'lp-float'   },
]

export default function LoginPage() {
  const navigate   = useNavigate()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [busy,     setBusy]     = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) redirectByRole(session.user.id)
    })
  }, [])

  async function redirectByRole(userId) {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()
    const role = data?.role
    if      (role === 'admin')  navigate('/admin',  { replace: true })
    else if (role === 'worker') navigate('/worker', { replace: true })
    else                        navigate('/portal', { replace: true })
  }

  async function handleLogin(e) {
    e.preventDefault()
    setBusy(true); setError('')
    const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password })
    if (authErr) { setError(authErr.message); setBusy(false); return }
    await redirectByRole(data.user.id)
    setBusy(false)
  }

  return (
    <div className="lp-wrap">
      <style>{STYLES}</style>

      {/* Floating background decorations */}
      {DECOS.map((d, i) => (
        <div key={i} className="lp-deco" style={{
          top: d.top, left: d.left,
          fontSize: d.size,
          opacity: 0.18,
          animation: `${d.anim} ${d.dur} ease-in-out ${d.delay} infinite`,
        }}>
          {d.e}
        </div>
      ))}

      <div className="lp-card">
        {/* Corner star sparkles */}
        <span className="lp-card-star" style={{ top: 16, right: 20, animationDelay: '0s' }}>✦</span>
        <span className="lp-card-star" style={{ bottom: 20, left: 16, animationDelay: '2s' }}>✦</span>

        <img src="/images/bcf.png" alt="BCF" className="lp-logo" />
        <div className="lp-brand">Ballycastle Climbing Frames</div>
        <div className="lp-sub">Sign in to your account</div>

        {error && <div className="lp-error" key={error}>⚠️ {error}</div>}

        <form onSubmit={handleLogin}>
          <div className="lp-field">
            <label className="lp-label">Email Address</label>
            <input
              className="lp-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              placeholder="your@email.com"
            />
          </div>
          <div className="lp-field">
            <label className="lp-label">Password</label>
            <input
              className="lp-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          <button className="lp-btn" type="submit" disabled={busy}>
            {busy ? '✨ Signing in…' : 'Sign In →'}
          </button>
        </form>

        <p className="lp-hint">
          Not a client yet?{' '}
          <a href="https://ballycastleclimbingframes.co.uk/about/" target="_blank" rel="noopener noreferrer"
            style={{ color: '#1E3070', fontWeight: 700, textDecoration: 'underline' }}>
            Visit our website
          </a>
        </p>
      </div>
    </div>
  )
}
