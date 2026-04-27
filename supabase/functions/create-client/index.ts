import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const STAGE_LABELS = [
  'Order Confirmed',
  'Materials Ordered',
  'Groundwork',
  'Frame Construction',
  'Accessories Installed',
  'Final Inspection',
  'Handover Complete',
]

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      address,
      order_number,
      installation_date,
      installation_window,
      ghl_opportunity_id,
    } = await req.json()

    if (!email) throw new Error('email is required')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const name = [first_name, last_name].filter(Boolean).join(' ') || email

    // ── 1. Create Supabase Auth user ───────────────────────────────────
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { name },
    })
    if (authError && !authError.message.includes('already been registered')) {
      throw new Error(`Auth error: ${authError.message}`)
    }

    // If user already exists, fetch them
    let userId = authData?.user?.id
    if (!userId) {
      const { data: existing } = await supabase.auth.admin.listUsers()
      const found = existing?.users?.find(u => u.email === email)
      if (!found) throw new Error('Could not find or create user')
      userId = found.id
    }

    // ── 2. Assign client role ──────────────────────────────────────────
    await supabase.from('user_roles').upsert({ user_id: userId, role: 'client' })

    // ── 3. Create client profile ───────────────────────────────────────
    await supabase.from('client_profiles').upsert({
      id: userId, name, email, phone: phone ?? null,
    })

    // ── 4. Create order ────────────────────────────────────────────────
    const orderNum = order_number ?? `BCF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .upsert({
        client_id:           userId,
        order_number:        orderNum,
        address:             address ?? null,
        installation_date:   installation_date ?? null,
        installation_window: installation_window ?? null,
        ghl_opportunity_id:  ghl_opportunity_id ?? null,
      }, { onConflict: 'order_number' })
      .select()
      .single()

    if (orderError) throw new Error(`Order error: ${orderError.message}`)

    // ── 5. Create all 7 build stages ───────────────────────────────────
    const stages = STAGE_LABELS.map((label, i) => ({
      order_id:     order.id,
      stage_number: i + 1,
      label,
      status:       i === 0 ? 'done' : 'pending',
      completed_at: i === 0 ? new Date().toISOString() : null,
    }))

    await supabase.from('build_stages').upsert(stages, { onConflict: 'order_id,stage_number' })

    // ── 6. Send welcome email with magic link ──────────────────────────
    const resendKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('RESEND_FROM') ?? 'Ballycastle Climbing Frames <onboarding@resend.dev>'
    const portalUrl = Deno.env.get('PORTAL_URL') ?? 'https://configurator.ballycastleclimbingframes.co.uk/portal'

    const { data: linkData } = await supabase.auth.admin.generateLink({
      type:  'magiclink',
      email,
      options: { redirectTo: portalUrl },
    })

    const magicLink = linkData?.properties?.action_link ?? portalUrl

    if (resendKey) {
      await fetch('https://api.resend.com/emails', {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from:    fromEmail,
          to:      [email],
          subject: `Your Ballycastle Climbing Frames Portal is Ready! 🎉`,
          html: `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f0f7ec;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:linear-gradient(135deg,#1e4a2a,#2e6b3e);padding:28px 32px;text-align:center">
      <h1 style="color:#FFD700;margin:0;font-size:22px">Ballycastle Climbing Frames</h1>
      <p style="color:#a5d6a7;margin:6px 0 0;font-size:14px">Your Client Portal is Ready!</p>
    </div>
    <div style="padding:32px">
      <p style="font-size:15px;color:#333">Hi <strong>${name}</strong>,</p>
      <p style="font-size:14px;color:#555;line-height:1.6">
        Welcome to your Ballycastle Climbing Frames client portal! You can now track your build progress,
        view your installation details, and stay up to date every step of the way.
      </p>
      <div style="background:#e8f5e9;border-radius:8px;padding:16px;margin:20px 0;text-align:center">
        <p style="margin:0 0 8px;font-weight:700;color:#1e4a2a;font-size:14px">Order Number</p>
        <p style="margin:0;font-size:22px;font-weight:800;color:#2e6b3e">${orderNum}</p>
      </div>
      <div style="text-align:center;margin:24px 0">
        <a href="${magicLink}"
          style="background:#2e6b3e;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:16px;display:inline-block">
          Access Your Portal →
        </a>
      </div>
      <p style="font-size:12px;color:#999;text-align:center">
        This link will log you in automatically. It expires in 24 hours.<br>
        After that, visit the portal and enter your email to get a new link.
      </p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
      <p style="font-size:13px;color:#555">
        Questions? Call us on <strong>+44 (0) 28 2076 9090</strong> or email
        <a href="mailto:info@ballycastleclimbingframes.co.uk" style="color:#2e6b3e">info@ballycastleclimbingframes.co.uk</a>
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
    }

    return new Response(JSON.stringify({ success: true, userId, orderId: order.id, orderNumber: orderNum }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('create-client error:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
