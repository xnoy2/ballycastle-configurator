import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const {
      referrer_name,   // first name of client who referred
      referred_name,   // friend's name
      referred_email,  // friend's email
      referral_link,   // e.g. https://...com/refer/BCF-2026-8888
    } = await req.json()

    if (!referred_email) throw new Error('referred_email is required')

    const resendKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('RESEND_FROM') ?? 'Ballycastle Climbing Frames <onboarding@resend.dev>'

    if (!resendKey) throw new Error('RESEND_API_KEY not configured')

    const friendFirst = referred_name?.split(' ')[0] || 'there'

    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:    fromEmail,
        to:      [referred_email],
        subject: `${referrer_name} thinks you'd love a Ballycastle Climbing Frame 🌳`,
        html: `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f0f7ec;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">

    <div style="background:linear-gradient(135deg,#1e4a2a,#2e6b3e);padding:28px 32px;text-align:center">
      <h1 style="color:#FFD700;margin:0;font-size:22px">Ballycastle Climbing Frames</h1>
      <p style="color:#a5d6a7;margin:6px 0 0;font-size:14px">You've been personally referred!</p>
    </div>

    <div style="padding:32px">
      <p style="font-size:16px;color:#333">Hi <strong>${friendFirst}</strong> 👋</p>
      <p style="font-size:14px;color:#555;line-height:1.7">
        Your friend <strong>${referrer_name}</strong> recently had a custom climbing frame built by
        Ballycastle Climbing Frames — and loved it so much they thought of you!
      </p>

      <div style="background:#e8f5e9;border-radius:10px;padding:20px 24px;margin:24px 0;text-align:center">
        <div style="font-size:40px;margin-bottom:8px">🌳</div>
        <p style="margin:0 0 4px;font-weight:800;color:#1e4a2a;font-size:16px">Bespoke Timber Climbing Frames</p>
        <p style="margin:0;font-size:13px;color:#555">Designed, built & installed across Northern Ireland</p>
      </div>

      <p style="font-size:14px;color:#555;line-height:1.7">
        Every frame is custom-built to suit your garden and your kids — from compact starter sets
        to full multi-tower adventures with slides, swings, monkey bars, and more.
      </p>

      <div style="text-align:center;margin:28px 0">
        <a href="${referral_link}"
          style="background:#2e6b3e;color:#fff;text-decoration:none;padding:16px 36px;border-radius:12px;font-weight:700;font-size:16px;display:inline-block">
          View Your Referral &amp; Get a Free Quote →
        </a>
      </div>

      <p style="font-size:12px;color:#999;text-align:center;line-height:1.6">
        No obligation — we're happy to chat about ideas, sizes, and budgets.<br>
        Free consultation available by phone or in person.
      </p>

      <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
      <p style="font-size:13px;color:#555">
        Questions? Call us on <strong>028 2044 0670</strong> or email
        <a href="mailto:info@ballycastleclimbingframes.co.uk" style="color:#2e6b3e">
          info@ballycastleclimbingframes.co.uk
        </a>
      </p>
    </div>

    <div style="background:#1e4a2a;padding:16px;text-align:center">
      <p style="color:#a5d6a7;margin:0;font-size:12px">
        Ballycastle Climbing Frames · ballycastleclimbingframes.co.uk<br>
        You received this because ${referrer_name} personally referred you.
      </p>
    </div>
  </div>
</body>
</html>`,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Resend error: ${body}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('notify-referral error:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})

