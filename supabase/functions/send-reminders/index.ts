import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CHECKLIST = [
  'Check and tighten all bolts and fixings',
  'Re-treat timber with preservative oil or stain',
  'Inspect rope ladders and swings for wear',
  'Clear bark/safety surface and top up if needed',
  'Check slide for cracks or sharp edges',
  'Oil any metal hinges or chains',
]

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    // Accept an optional month override (for testing). Default = current month.
    const body       = await req.json().catch(() => ({}))
    const month      = body.month || new Intl.DateTimeFormat('en-GB', { month: 'long' }).format(new Date())

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Load all active reminders for this month + client + order info
    const { data: reminders, error } = await supabase
      .from('reminders')
      .select(`
        *,
        client:client_profiles(name, email),
        order:orders(order_number)
      `)
      .eq('reminder_month', month)
      .eq('is_active', true)

    if (error) throw new Error(`DB error: ${error.message}`)

    const resendKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('RESEND_FROM') ?? 'Ballycastle Climbing Frames <onboarding@resend.dev>'
    const portalUrl = Deno.env.get('PORTAL_URL')  ?? 'https://portal.ballycastleclimbingframes.co.uk/portal'

    if (!resendKey) throw new Error('RESEND_API_KEY not configured')

    const results: { email: string; status: string }[] = []

    for (const reminder of reminders ?? []) {
      const email     = reminder.client?.email
      const name      = reminder.client?.name  || 'there'
      const firstName = name.split(' ')[0]
      const orderNum  = reminder.order?.order_number ?? ''

      if (!email) continue

      const checklistHtml = CHECKLIST.map(item =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0ede8;font-size:14px;color:#333">
            <span style="color:#4CAF50;font-weight:800;margin-right:10px">✓</span>${item}
          </td>
        </tr>`
      ).join('')

      const res = await fetch('https://api.resend.com/emails', {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from:    fromEmail,
          to:      [email],
          subject: `🌳 Time for your annual frame check, ${firstName}!`,
          html: `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f0f7ec;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">

    <div style="background:linear-gradient(135deg,#1e4a2a,#2e6b3e);padding:28px 32px;text-align:center">
      <h1 style="color:#FFD700;margin:0;font-size:22px">Ballycastle Climbing Frames</h1>
      <p style="color:#a5d6a7;margin:6px 0 0;font-size:14px">Annual Maintenance Reminder 🔔</p>
    </div>

    <div style="padding:32px">
      <p style="font-size:16px;color:#333">Hi <strong>${firstName}</strong> 👋</p>
      <p style="font-size:14px;color:#555;line-height:1.7">
        It's that time of year again! Your annual maintenance check for order
        <strong>${orderNum}</strong> is due this month.
        A few simple checks now will keep your frame safe, strong, and looking great for years to come.
      </p>

      <div style="background:#e8f5e9;border-radius:10px;padding:20px 24px;margin:24px 0">
        <p style="margin:0 0 12px;font-weight:800;color:#1e4a2a;font-size:15px">📋 Annual Maintenance Checklist</p>
        <table style="width:100%;border-collapse:collapse">
          ${checklistHtml}
        </table>
      </div>

      <p style="font-size:14px;color:#555;line-height:1.7">
        Need timber treatment oil, replacement parts, or a professional service visit?
        We're here to help — just get in touch.
      </p>

      <div style="text-align:center;margin:28px 0">
        <a href="${portalUrl}"
          style="background:#2e6b3e;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;display:inline-block">
          View Your Portal →
        </a>
      </div>

      <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
      <p style="font-size:13px;color:#555">
        Questions? Call us on <strong>028 2044 0670</strong> or email
        <a href="mailto:info@ballycastleclimbingframes.co.uk" style="color:#2e6b3e">
          info@ballycastleclimbingframes.co.uk
        </a>
      </p>
      <p style="font-size:11px;color:#bbb;margin-top:8px">
        You're receiving this because you set up an annual reminder in your client portal.
        To turn it off, visit the Reminders tab in your portal.
      </p>
    </div>

    <div style="background:#1e4a2a;padding:16px;text-align:center">
      <p style="color:#a5d6a7;margin:0;font-size:12px">Ballycastle Climbing Frames · ballycastleclimbingframes.co.uk</p>
    </div>
  </div>
</body>
</html>`,
        }),
      })

      results.push({ email, status: res.ok ? 'sent' : 'failed' })
    }

    return new Response(JSON.stringify({
      success: true,
      month,
      total:  results.length,
      sent:   results.filter(r => r.status === 'sent').length,
      failed: results.filter(r => r.status === 'failed').length,
      results,
    }), { headers: { ...CORS, 'Content-Type': 'application/json' } })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('send-reminders error:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})

