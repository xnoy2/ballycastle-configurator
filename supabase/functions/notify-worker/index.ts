import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { order_id, type, notes } = await req.json()
    if (!order_id) throw new Error('order_id is required')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Get order with worker and client details
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*, worker:worker_profiles(name, email), client:client_profiles(name, email, phone)')
      .eq('id', order_id)
      .single()

    if (orderErr || !order) throw new Error('Order not found')
    if (!order.worker?.email) {
      return new Response(JSON.stringify({ skipped: 'No worker assigned to this order' }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const resendKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('RESEND_FROM') ?? 'Ballycastle Climbing Frames <onboarding@resend.dev>'
    const workerPanelUrl = Deno.env.get('WORKER_URL') ?? 'https://portal.ballycastleclimbingframes.co.uk/worker'

    const subject = type === 'access_notes'
      ? `📝 Client Access Notes Updated — ${order.client?.name} (${order.order_number})`
      : `🔔 Client Update — ${order.client?.name} (${order.order_number})`

    const html = `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f1f5f9;margin:0;padding:0">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:linear-gradient(135deg,#1a2e44,#2e5339);padding:24px 28px">
      <h1 style="color:#FFD700;margin:0;font-size:20px">Ballycastle Climbing Frames</h1>
      <p style="color:#a5d6a7;margin:4px 0 0;font-size:13px">Worker Notification</p>
    </div>
    <div style="padding:28px">
      <p style="font-size:15px;color:#1e293b;margin:0 0 16px">Hi <strong>${order.worker.name}</strong>,</p>

      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:16px;margin-bottom:20px">
        <div style="font-weight:700;color:#92400e;font-size:14px;margin-bottom:8px">
          📝 ${order.client?.name} has updated their access notes for order <strong>${order.order_number}</strong>:
        </div>
        <div style="background:#fff;border-radius:8px;padding:12px;font-size:14px;color:#374151;line-height:1.6;border:1px solid #fde68a">
          "${notes || 'No notes provided.'}"
        </div>
      </div>

      <div style="background:#f0fdf4;border-radius:10px;padding:14px;margin-bottom:20px;font-size:13px;color:#166534">
        <strong>📋 Job Details</strong><br>
        Order: ${order.order_number}<br>
        Client: ${order.client?.name}<br>
        ${order.installation_date ? `Installation Date: ${new Date(order.installation_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}` : ''}
        ${order.address ? `<br>Address: ${order.address}` : ''}
      </div>

      <div style="text-align:center">
        <a href="${workerPanelUrl}"
          style="background:#2e7d32;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px;display:inline-block">
          View in Worker Panel →
        </a>
      </div>
    </div>
    <div style="background:#1a2e44;padding:14px;text-align:center">
      <p style="color:#a5d6a7;margin:0;font-size:12px">Ballycastle Climbing Frames · ballycastleclimbingframes.co.uk</p>
    </div>
  </div>
</body>
</html>`

    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fromEmail, to: [order.worker.email], subject, html }),
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Resend error (${res.status}): ${body}`)
    }

    return new Response(JSON.stringify({ success: true, notified: order.worker.email }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('notify-worker error:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
