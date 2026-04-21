import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { name, email, phone, lineItems, totalPrice, pdfBase64 } =
      await req.json() as {
        name: string
        email: string
        phone: string
        lineItems: Array<{ label: string; price: number; category?: string }>
        totalPrice: number
        pdfBase64: string
      }

    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) throw new Error('RESEND_API_KEY secret not set in Supabase dashboard.')

    const safeName  = name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')
    const filename  = `BCF-Quote-${safeName}.pdf`

    const itemsHtml = lineItems
      .map(i => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e8e6e0;color:#222">${i.label}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e8e6e0;text-align:right;color:#1e4a2a;font-weight:600">
            &pound;${i.price.toLocaleString()}
          </td>
        </tr>`)
      .join('')

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f3ef;font-family:Arial,sans-serif">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">

    <!-- Header -->
    <div style="background:#1e4a2a;padding:28px 32px">
      <h1 style="margin:0;color:#fff;font-size:22px;letter-spacing:.5px">Ballycastle Climbing Frames</h1>
      <p style="margin:6px 0 0;color:#b4dcbe;font-size:14px">ballycastleclimbingframes.co.uk</p>
    </div>

    <!-- Body -->
    <div style="padding:32px">
      <h2 style="margin:0 0 8px;color:#1e4a2a;font-size:20px">Your Custom Quote</h2>
      <p style="margin:0 0 24px;color:#555;font-size:15px">Hi ${name}, thank you for using our configurator! Your personalised PDF quote is attached to this email.</p>

      <!-- Items table -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:4px">
        <thead>
          <tr style="background:#f4f3ef">
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b6860;font-weight:600;text-transform:uppercase;letter-spacing:.5px">Item</th>
            <th style="padding:8px 12px;text-align:right;font-size:12px;color:#6b6860;font-weight:600;text-transform:uppercase;letter-spacing:.5px">Price (inc. VAT)</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr style="background:#2e6b3e">
            <td style="padding:12px;color:#fff;font-weight:700;font-size:15px">ESTIMATED TOTAL</td>
            <td style="padding:12px;color:#fff;font-weight:700;font-size:15px;text-align:right">&pound;${totalPrice.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>

      <p style="margin:4px 0 24px;font-size:12px;color:#999">Prices include VAT. Delivery and installation quoted separately.</p>

      <!-- Next steps -->
      <div style="background:#e8f2eb;border-left:4px solid #2e6b3e;border-radius:4px;padding:16px 20px;margin-bottom:24px">
        <strong style="color:#1e4a2a;font-size:15px">What happens next?</strong>
        <p style="margin:8px 0 0;color:#444;font-size:14px;line-height:1.5">Our team will be in touch within 24 hours to discuss your quote and arrange a convenient time to finalise your order.</p>
      </div>

      <!-- Contact -->
      <p style="margin:0;font-size:14px;color:#555">Questions? Contact us at
        <a href="mailto:info@ballycastleclimbingframes.co.uk" style="color:#2e6b3e">info@ballycastleclimbingframes.co.uk</a>
        or call <strong>+44 (0) 28 2076 9090</strong>.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#1e4a2a;padding:16px 32px;text-align:center">
      <p style="margin:0;color:#b4dcbe;font-size:12px">Ballycastle Climbing Frames &nbsp;&middot;&nbsp; +44 (0) 28 2076 9090 &nbsp;&middot;&nbsp; info@ballycastleclimbingframes.co.uk</p>
      <p style="margin:4px 0 0;font-size:11px;color:#6b9e79">This is an indicative estimate. Final pricing may vary based on site survey, delivery, and installation.</p>
    </div>
  </div>
</body>
</html>`

    const fromEmail = Deno.env.get('RESEND_FROM') ?? 'Ballycastle Climbing Frames <onboarding@resend.dev>'

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:        fromEmail,
        to:          [email],
        subject:     `Your Ballycastle Climbing Frames Quote \u2014 \u00a3${totalPrice.toLocaleString()}`,
        html,
        attachments: [{ filename, content: pdfBase64 }],
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Resend error (${res.status}): ${body}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('send-quote error:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
