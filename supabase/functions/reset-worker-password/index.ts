import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#'
  let p = ''
  for (let i = 0; i < 12; i++) p += chars[Math.floor(Math.random() * chars.length)]
  return p
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { worker_id, worker_name, worker_email, worker_url, custom_password, send_email = false } = await req.json()
    if (!worker_id || !worker_email) throw new Error('worker_id and worker_email are required')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const tempPassword = custom_password || generateTempPassword()

    // Set the new password via admin API
    const { error: updateErr } = await supabase.auth.admin.updateUserById(worker_id, {
      password: tempPassword,
    })
    if (updateErr) throw new Error(`Password update failed: ${updateErr.message}`)

    // Only send email if explicitly requested
    const resendKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('RESEND_FROM') ?? 'Ballycastle Climbing Frames <onboarding@resend.dev>'
    const panelUrl  = worker_url ?? Deno.env.get('WORKER_URL') ?? 'https://portal.ballycastleclimbingframes.co.uk/worker'

    if (send_email && resendKey) {
      await fetch('https://api.resend.com/emails', {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from:    fromEmail,
          to:      [worker_email],
          subject: '👷 Your BCF Worker Panel — New Password',
          html: `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f0f4f8;margin:0;padding:0">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:linear-gradient(135deg,#1e4a2a,#2e6b3e);padding:28px 32px;text-align:center">
      <h1 style="color:#FFD700;margin:0;font-size:20px">Ballycastle Climbing Frames</h1>
      <p style="color:#a5d6a7;margin:6px 0 0;font-size:13px">Worker Panel — Password Reset</p>
    </div>
    <div style="padding:32px">
      <p style="font-size:15px;color:#333">Hi <strong>${worker_name || worker_email}</strong> 👷</p>
      <p style="font-size:14px;color:#555;line-height:1.6">Your Worker Panel password has been reset. Use the credentials below to log in:</p>

      <div style="background:#f8fafc;border:2px solid #e2e8f0;border-radius:10px;padding:20px 24px;margin:20px 0">
        <div style="margin-bottom:12px">
          <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:700;margin-bottom:4px">Email</div>
          <div style="font-size:15px;font-weight:700;color:#1e293b;font-family:monospace">${worker_email}</div>
        </div>
        <div>
          <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:700;margin-bottom:4px">Temporary Password</div>
          <div style="font-size:18px;font-weight:800;color:#2e6b3e;font-family:monospace;letter-spacing:2px">${tempPassword}</div>
        </div>
      </div>

      <div style="text-align:center;margin:24px 0">
        <a href="${panelUrl}" style="background:#2e6b3e;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;display:inline-block">
          👷 Log In to Worker Panel →
        </a>
      </div>
      <p style="font-size:12px;color:#999;text-align:center">Please log in and change your password as soon as possible.</p>
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

    // Return the password so admin can copy and share it
    return new Response(JSON.stringify({ success: true, password: tempPassword }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
