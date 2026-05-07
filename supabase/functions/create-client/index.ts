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

// ── GHL API helpers ──────────────────────────────────────────────────────────
async function ghlRequest(path: string, method: string, body: unknown, apiKey: string) {
  const res = await fetch(`https://services.leadconnectorhq.com${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type':  'application/json',
      'Version':       '2021-07-28',
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`GHL ${method} ${path} failed: ${JSON.stringify(data)}`)
  return data
}

async function syncToGHL(params: {
  first_name: string
  last_name:  string
  email:      string
  phone:      string
  orderNum:   string
  apiKey:     string
  locationId: string
  pipelineId: string
  stageId:    string
  existingOpportunityId?: string
}) {
  const { first_name, last_name, email, phone, orderNum, apiKey, locationId, pipelineId, stageId, existingOpportunityId } = params

  let contactId: string
  let ghlWarning: string | null = null

  const searchRes = await fetch(
    `https://services.leadconnectorhq.com/contacts/?locationId=${locationId}&query=${encodeURIComponent(email)}`,
    { headers: { 'Authorization': `Bearer ${apiKey}`, 'Version': '2021-07-28' } }
  )
  const searchData = await searchRes.json()
  contactId = searchData?.contacts?.[0]?.id

  if (contactId) {
    ghlWarning = `Contact with email ${email} already existed in GHL — linked to existing contact. A new opportunity was still created.`
  } else {
    const contactRes = await ghlRequest('/contacts/', 'POST', {
      firstName:  first_name,
      lastName:   last_name,
      email,
      phone:      phone || undefined,
      locationId,
    }, apiKey)
    contactId = contactRes.contact?.id
    if (!contactId) throw new Error(`Contact created but no ID returned: ${JSON.stringify(contactRes)}`)
  }

  if (!existingOpportunityId) {
    await ghlRequest('/opportunities/', 'POST', {
      name:            `${first_name} ${last_name} — ${orderNum}`,
      pipelineId,
      pipelineStageId: stageId,
      contactId,
      locationId,
      status:          'open',
    }, apiKey)
  }

  return { contactId, warning: ghlWarning }
}

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
      role = 'client',           // 'client' | 'worker'
      sync_to_ghl = false,       // true when triggered from Admin manually
      send_email = true,         // false = create account silently, return magic link for admin to share
      redirect_to,               // passed from frontend so it works in dev + prod
    } = await req.json()

    if (!email) throw new Error('email is required')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Use full name if provided; fall back to email only for auth metadata (portal derives display name from email gracefully)
    const name = [first_name, last_name].filter(Boolean).join(' ').trim() || email

    // ── 1. Create Supabase Auth user ───────────────────────────────────
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { name },
    })
    if (authError && !authError.message.includes('already been registered')) {
      throw new Error(`Auth error: ${authError.message}`)
    }

    let userId = authData?.user?.id
    if (!userId) {
      const { data: existing } = await supabase.auth.admin.listUsers()
      const found = existing?.users?.find(u => u.email === email)
      if (!found) throw new Error('Could not find or create user')
      userId = found.id
    }

    // ── 2. Assign role ─────────────────────────────────────────────────
    await supabase.from('user_roles').upsert({ user_id: userId, role })

    // ── 3. Worker path — send password-setup email then exit ───────────
    if (role === 'worker') {
      await supabase.from('worker_profiles').upsert({
        id: userId, name, email, phone: phone ?? null,
      })

      const resendKey  = Deno.env.get('RESEND_API_KEY')
      const fromEmail  = Deno.env.get('RESEND_FROM') ?? 'Ballycastle Climbing Frames <onboarding@resend.dev>'
      const workerUrl  = redirect_to ?? Deno.env.get('WORKER_URL') ?? 'https://portal.ballycastleclimbingframes.co.uk/worker'

      const { data: resetLink } = await supabase.auth.admin.generateLink({
        type: 'recovery', email,
        options: { redirectTo: workerUrl },
      })
      const passwordSetUrl = resetLink?.properties?.action_link ?? workerUrl

      if (send_email && resendKey) {
        await fetch('https://api.resend.com/emails', {
          method:  'POST',
          headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from:    fromEmail,
            to:      [email],
            subject: '👷 Set up your BCF Worker Panel access',
            html: `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f0f4f8;margin:0;padding:0">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:linear-gradient(135deg,#1e4a2a,#2e6b3e);padding:28px 32px;text-align:center">
      <h1 style="color:#FFD700;margin:0;font-size:20px">Ballycastle Climbing Frames</h1>
      <p style="color:#a5d6a7;margin:6px 0 0;font-size:13px">Worker Panel Access</p>
    </div>
    <div style="padding:32px">
      <p style="font-size:15px;color:#333">Hi <strong>${name}</strong> 👷</p>
      <p style="font-size:14px;color:#555;line-height:1.6">
        You've been added as a worker on the BCF team. Click the button below to set your password and access the Worker Panel.
      </p>
      <div style="text-align:center;margin:28px 0">
        <a href="${passwordSetUrl}" style="background:#2e6b3e;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;display:inline-block">
          👷 Set My Password →
        </a>
      </div>
      <p style="font-size:12px;color:#999;text-align:center">This link expires in 24 hours. After setting your password, log in at <a href="${workerUrl}" style="color:#2e6b3e">${workerUrl}</a></p>
    </div>
    <div style="background:#1e4a2a;padding:14px;text-align:center">
      <p style="color:#a5d6a7;margin:0;font-size:12px">Ballycastle Climbing Frames · ballycastleclimbingframes.co.uk</p>
    </div>
  </div>
</body>
</html>`,
          }),
        })
      }

      return new Response(JSON.stringify({ success: true, userId }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // ── 4. Client path — create profile & order (NO email sent) ───────
    // Only store name if it is a real name (not a fallback email string)
    const profileName = name === email ? null : name
    await supabase.from('client_profiles').upsert({
      id: userId, name: profileName, email, phone: phone ?? null,
    })

    // If the client already has an order, return it — never create duplicates
    const { data: existingOrder } = await supabase
      .from('orders')
      .select()
      .eq('client_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const orderNum = order_number ?? existingOrder?.order_number ?? `BCF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .upsert({
        client_id:           userId,
        order_number:        orderNum,
        address:             address ?? existingOrder?.address ?? null,
        installation_date:   installation_date ?? existingOrder?.installation_date ?? null,
        installation_window: installation_window ?? existingOrder?.installation_window ?? null,
        ghl_opportunity_id:  ghl_opportunity_id ?? existingOrder?.ghl_opportunity_id ?? null,
      }, { onConflict: 'order_number' })
      .select()
      .single()

    if (orderError) throw new Error(`Order error: ${orderError.message}`)

    // ── 5. Create all 7 build stages ───────────────────────────────────
    const stages = STAGE_LABELS.map((label, i) => ({
      order_id:     order.id,
      stage_number: i + 1,
      label,
      status:       i === 0 ? 'in_progress' : 'pending',
      completed_at: null,
    }))
    await supabase.from('build_stages').upsert(stages, { onConflict: 'order_id,stage_number' })

    // ── 6. Push to GHL if manually created from Admin ──────────────────
    let ghlSyncWarning: string | null = null
    if (sync_to_ghl) {
      const ghlApiKey     = Deno.env.get('GHL_API_KEY')
      const ghlLocationId = Deno.env.get('GHL_LOCATION_ID')
      const ghlPipelineId = Deno.env.get('GHL_PIPELINE_ID') ?? 'Rki3r8dMJp0elw44sK5C'
      const ghlStageId    = Deno.env.get('GHL_STAGE_ID')    ?? '3a8f4185-cd98-4c3f-854b-be94d0f18827'

      if (ghlApiKey && ghlLocationId) {
        try {
          const result = await syncToGHL({
            first_name:  first_name ?? name.split(' ')[0],
            last_name:   last_name  ?? name.split(' ').slice(1).join(' '),
            email, phone: phone ?? '',
            orderNum, apiKey: ghlApiKey, locationId: ghlLocationId,
            pipelineId: ghlPipelineId, stageId: ghlStageId,
            existingOpportunityId: ghl_opportunity_id,
          })
          if (result.warning) ghlSyncWarning = result.warning
        } catch (ghlErr) {
          const msg = ghlErr instanceof Error ? ghlErr.message : String(ghlErr)
          console.warn('GHL sync warning:', msg)
          ghlSyncWarning = msg
        }
      }
    }

    // ── 7. Generate magic link (always) — optionally send welcome email ───
    const resendKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('RESEND_FROM') ?? 'Ballycastle Climbing Frames <onboarding@resend.dev>'
    const portalUrl = Deno.env.get('PORTAL_URL')  ?? 'https://portal.ballycastleclimbingframes.co.uk/portal'
    const workerUrl = Deno.env.get('WORKER_URL')  ?? 'https://portal.ballycastleclimbingframes.co.uk/worker'

    const redirectTo = redirect_to ?? (role === 'worker' ? workerUrl : portalUrl)

    const { data: linkData } = await supabase.auth.admin.generateLink({
      type: 'magiclink', email,
      options: { redirectTo },
    })
    const magicLink = linkData?.properties?.action_link ?? redirectTo

    // Only send email when explicitly requested (send_email: true)
    if (send_email && resendKey) {
      await fetch('https://api.resend.com/emails', {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from:    fromEmail,
          to:      [email],
          subject: role === 'worker'
            ? `Your BCF Worker Panel Access 👷`
            : `Your Ballycastle Climbing Frames Portal is Ready! 🎉`,
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
        <a href="${magicLink}" style="background:#2e6b3e;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:16px;display:inline-block">
          Access Your Portal →
        </a>
      </div>
      <p style="font-size:12px;color:#999;text-align:center">
        This link will log you in automatically. It expires in 24 hours.<br>
        After that, visit the portal and enter your email to get a new link.
      </p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
      <p style="font-size:13px;color:#555">
        Questions? Call us on <strong>028 2044 0670</strong> or email
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

    return new Response(JSON.stringify({
      success: true, userId, orderId: order.id, orderNumber: orderNum,
      magicLink,
      ghl_warning: ghlSyncWarning ?? null,
    }), {
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

