import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function generateTempPassword(): string {
  // Unambiguous chars — no 0/O, 1/I/l
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let pwd = ''
  for (let i = 0; i < 10; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)]
  }
  return pwd
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { userId, email, name, portalUrl } = await req.json()
    if (!userId || !email) throw new Error('userId and email are required')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Generate and set the temp password
    const tempPassword = generateTempPassword()
    const { error: updateErr } = await supabase.auth.admin.updateUserById(userId, {
      password: tempPassword,
    })
    if (updateErr) throw new Error(`Failed to set password: ${updateErr.message}`)

    // Send email via Resend
    const resendKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('RESEND_FROM') ?? 'Ballycastle Climbing Frames <onboarding@resend.dev>'
    const loginUrl  = portalUrl ?? Deno.env.get('PORTAL_URL') ?? 'https://portal.ballycastleclimbingframes.co.uk/portal'
    const displayName = name || email

    if (resendKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from:    fromEmail,
          to:      [email],
          subject: '🔑 Your Ballycastle Climbing Frames Portal Login',
          html: `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f0f4f8;margin:0;padding:0">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">

    <div style="background:linear-gradient(135deg,#1E3070,#253080);padding:28px 32px;text-align:center">
      <h1 style="color:#F9C800;margin:0;font-size:22px;font-weight:800">Ballycastle Climbing Frames</h1>
      <p style="color:#93c5fd;margin:6px 0 0;font-size:13px">Client Portal Access</p>
    </div>

    <div style="padding:32px">
      <p style="font-size:15px;color:#1e293b;margin-bottom:6px">Hi <strong>${displayName}</strong>,</p>
      <p style="font-size:14px;color:#475569;line-height:1.7;margin-bottom:24px">
        Your Ballycastle Climbing Frames client portal account is ready. Use the login details below to sign in and track your build progress.
      </p>

      <div style="background:#f8fafc;border:2px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin-bottom:24px">
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;padding-bottom:4px">Login URL</td>
          </tr>
          <tr>
            <td style="font-size:14px;color:#1E3070;font-weight:600;padding-bottom:16px">
              <a href="${loginUrl}" style="color:#1E3070">${loginUrl}</a>
            </td>
          </tr>
          <tr>
            <td style="font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;padding-bottom:4px">Email</td>
          </tr>
          <tr>
            <td style="font-size:14px;color:#1e293b;font-weight:600;padding-bottom:16px">${email}</td>
          </tr>
          <tr>
            <td style="font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;padding-bottom:4px">Temporary Password</td>
          </tr>
          <tr>
            <td style="font-size:24px;font-weight:800;color:#1E3070;letter-spacing:.12em;font-family:monospace">${tempPassword}</td>
          </tr>
        </table>
      </div>

      <div style="background:#fefce8;border:1.5px solid #fef08a;border-radius:10px;padding:14px 18px;margin-bottom:24px">
        <p style="margin:0;font-size:13px;color:#713f12;line-height:1.6">
          ⚠️ <strong>Please change your password</strong> after your first login.<br>
          Go to <strong>Account Settings</strong> in your portal to set a new one.
        </p>
      </div>

      <div style="text-align:center;margin-bottom:24px">
        <a href="${loginUrl}" style="background:#F9C800;color:#1E3070;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:800;font-size:16px;display:inline-block">
          Sign In to Your Portal →
        </a>
      </div>

      <hr style="border:none;border-top:1px solid #f1f5f9;margin:0 0 20px">
      <p style="font-size:12px;color:#94a3b8;line-height:1.6;margin:0">
        Questions? Call us on <strong>028 2044 0670</strong> or email
        <a href="mailto:info@ballycastleclimbingframes.co.uk" style="color:#1E3070">info@ballycastleclimbingframes.co.uk</a>
      </p>
    </div>

    <div style="background:#1E3070;padding:14px;text-align:center">
      <p style="color:#93c5fd;margin:0;font-size:12px">Ballycastle Climbing Frames · ballycastleclimbingframes.co.uk</p>
    </div>
  </div>
</body>
</html>`,
        }),
      })
      if (!res.ok) {
        const errBody = await res.text()
        throw new Error(`Resend error: ${errBody}`)
      }
    }

    return new Response(JSON.stringify({ success: true, tempPassword }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('send-temp-password error:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
