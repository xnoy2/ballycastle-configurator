import React from 'react'

const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap');
  @keyframes bcf-pulse {
    0%,100% { transform: scale(1);    }
    50%      { transform: scale(1.07); }
  }
  @keyframes bcf-dot {
    0%,80%,100% { transform: scale(0); opacity: 0; }
    40%         { transform: scale(1); opacity: 1; }
  }
  @keyframes bcf-twinkle {
    0%,100% { opacity: 0.15; transform: scale(0.7); }
    50%     { opacity: 1;    transform: scale(1.3); }
  }
  @keyframes bcf-float {
    0%,100% { transform: translateY(0px);  }
    50%     { transform: translateY(-10px); }
  }
  @keyframes bcf-cloud-l {
    0%,100% { transform: translateX(0);    }
    50%     { transform: translateX(18px); }
  }
  @keyframes bcf-cloud-r {
    0%,100% { transform: translateX(0);     }
    50%     { transform: translateX(-18px); }
  }
  @keyframes bcf-sway {
    0%,100% { transform: rotate(-4deg) translateY(0);  }
    50%     { transform: rotate(4deg)  translateY(-4px); }
  }
`

/* Fixed star positions — no Math.random() so renders are stable */
const STARS = [
  { id:  0, top:  '7%', left: '10%', size: 3, delay: 0.0, dur: 2.1 },
  { id:  1, top:  '4%', left: '32%', size: 2, delay: 0.4, dur: 1.8 },
  { id:  2, top: '13%', left: '54%', size: 4, delay: 0.8, dur: 2.4 },
  { id:  3, top:  '5%', left: '74%', size: 2, delay: 0.2, dur: 1.6 },
  { id:  4, top: '19%', left: '19%', size: 3, delay: 1.1, dur: 2.2 },
  { id:  5, top: '10%', left: '87%', size: 2, delay: 0.6, dur: 1.9 },
  { id:  6, top: '27%', left:  '6%', size: 3, delay: 0.3, dur: 2.5 },
  { id:  7, top: '23%', left: '44%', size: 2, delay: 0.9, dur: 1.7 },
  { id:  8, top: '16%', left: '64%', size: 4, delay: 1.4, dur: 2.3 },
  { id:  9, top: '33%', left: '81%', size: 2, delay: 0.5, dur: 2.0 },
  { id: 10, top: '38%', left: '27%', size: 3, delay: 1.2, dur: 1.8 },
  { id: 11, top:  '9%', left: '49%', size: 2, delay: 0.7, dur: 2.1 },
  { id: 12, top: '30%', left: '67%', size: 3, delay: 1.6, dur: 2.4 },
  { id: 13, top: '21%', left: '91%', size: 2, delay: 0.1, dur: 1.9 },
  { id: 14, top: '43%', left:  '4%', size: 4, delay: 1.8, dur: 2.2 },
]

/**
 * Branded full-screen loading splash — Admin, Portal, Worker.
 * Uses the downloaded transparent-background swing GIF from Pixabay.
 */
export default function LoadingScreen({ subtitle = 'Loading your dashboard…' }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'linear-gradient(180deg, #0b1a5e 0%, #1a3070 45%, #1e5c8a 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <style>{KEYFRAMES}</style>

      {/* ── Twinkling stars ───────────────────────────────────── */}
      {STARS.map(s => (
        <div key={s.id} style={{
          position: 'absolute', top: s.top, left: s.left,
          width: s.size, height: s.size, borderRadius: '50%',
          background: '#fff',
          animation: `bcf-twinkle ${s.dur}s ${s.delay}s ease-in-out infinite`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* ── Moon ─────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 28, right: 56,
        fontSize: 46, lineHeight: 1,
        animation: 'bcf-float 5s ease-in-out infinite',
        filter: 'drop-shadow(0 0 12px rgba(255,220,80,0.6))',
        userSelect: 'none',
      }}>🌙</div>

      {/* ── Clouds ───────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 52, left: 32,
        fontSize: 52, opacity: 0.55,
        animation: 'bcf-cloud-l 9s ease-in-out infinite',
        userSelect: 'none',
      }}>☁️</div>
      <div style={{
        position: 'absolute', top: 84, right: 48,
        fontSize: 38, opacity: 0.45,
        animation: 'bcf-cloud-r 11s ease-in-out infinite',
        userSelect: 'none',
      }}>☁️</div>

      {/* ── Swing GIF (transparent background from Pixabay) ───── */}
      <img
        src="/images/swing.gif"
        alt="Child on swing"
        style={{
          width: 220,
          marginBottom: 4,
          filter: 'drop-shadow(0 12px 28px rgba(0,0,0,0.45))',
          animation: 'bcf-float 3.2s ease-in-out infinite',
          flexShrink: 0,
        }}
      />

      {/* ── Logo ─────────────────────────────────────────────── */}
      <img
        src="/images/bcf.png"
        alt="Ballycastle Climbing Frames"
        style={{
          width: 64, height: 64, objectFit: 'contain',
          marginBottom: 12,
          animation: 'bcf-pulse 2.4s ease-in-out infinite',
          filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.5))',
          flexShrink: 0,
        }}
      />

      {/* ── Brand name ───────────────────────────────────────── */}
      <h1 style={{
        fontFamily: "'Fredoka One', cursive",
        fontSize: 24, color: '#F9C800',
        margin: '0 0 6px', letterSpacing: 1,
        textAlign: 'center', padding: '0 20px',
        textShadow: '0 2px 14px rgba(0,0,0,0.45)',
      }}>
        Ballycastle Climbing Frames
      </h1>

      {/* ── Subtitle ─────────────────────────────────────────── */}
      <p style={{
        fontSize: 13, color: 'rgba(255,255,255,0.7)',
        margin: '0 0 22px', textAlign: 'center',
      }}>
        {subtitle}
      </p>

      {/* ── Bouncing dots ────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 110 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: '50%', background: '#F9C800',
            animation: `bcf-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>

      {/* ── Grass strip + trees at the bottom ────────────────── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 100,
        background: 'linear-gradient(180deg, #2ecc71 0%, #27ae60 40%, #1e8449 100%)',
        borderRadius: '55% 55% 0 0 / 28px 28px 0 0',
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: '0 16px',
        pointerEvents: 'none',
      }}>
        {/* Left tree */}
        <span style={{
          fontSize: 64, lineHeight: 1, marginTop: -38,
          animation: 'bcf-sway 4s ease-in-out infinite',
          display: 'inline-block', transformOrigin: 'bottom center',
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
          userSelect: 'none',
        }}>🌳</span>

        {/* Centre flowers */}
        <div style={{ display: 'flex', gap: 6, marginTop: 10, alignSelf: 'flex-start' }}>
          <span style={{ fontSize: 22, userSelect: 'none' }}>🌼</span>
          <span style={{ fontSize: 18, userSelect: 'none' }}>🌸</span>
          <span style={{ fontSize: 22, userSelect: 'none' }}>🌼</span>
        </div>

        {/* Right tree */}
        <span style={{
          fontSize: 64, lineHeight: 1, marginTop: -38,
          animation: 'bcf-sway 4.8s ease-in-out infinite reverse',
          display: 'inline-block', transformOrigin: 'bottom center',
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
          userSelect: 'none',
        }}>🌳</span>
      </div>
    </div>
  )
}
