import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

async function syncOrder(
  supabase: ReturnType<typeof createClient>,
  apiKey: string,
  locationId: string,
  orderId: string,
): Promise<{ order_id: string; status: string; value?: number; reason?: string }> {
  // Fetch order
  const { data: order, error: oErr } = await supabase
    .from('orders')
    .select('contract_amount, ghl_opportunity_id, client:client_profiles(email)')
    .eq('id', orderId)
    .single()

  if (oErr || !order) return { order_id: orderId, status: 'skipped', reason: 'Order not found' }

  // Calculate full contract total (base + amendments)
  const { data: payments } = await supabase
    .from('order_payments')
    .select('amount')
    .eq('order_id', orderId)
    .eq('type', 'amendment')

  const base       = Number(order.contract_amount || 0)
  const amendTotal = (payments ?? []).reduce((s: number, p: { amount: number }) => s + Number(p.amount), 0)
  const total      = base + amendTotal

  // Resolve GHL opportunity ID
  let ghlOpportunityId = order.ghl_opportunity_id

  if (!ghlOpportunityId && order.client?.email) {
    const searchRes  = await fetch(
      `https://services.leadconnectorhq.com/contacts/?locationId=${locationId}&query=${encodeURIComponent(order.client.email)}`,
      { headers: { 'Authorization': `Bearer ${apiKey}`, 'Version': '2021-07-28' } },
    )
    const searchData = await searchRes.json()
    const contactId  = searchData?.contacts?.[0]?.id

    if (contactId) {
      const oppRes  = await fetch(
        `https://services.leadconnectorhq.com/opportunities/search?location_id=${locationId}&contact_id=${contactId}`,
        { headers: { 'Authorization': `Bearer ${apiKey}`, 'Version': '2021-07-28' } },
      )
      const oppData = await oppRes.json()
      ghlOpportunityId = oppData?.opportunities?.[0]?.id

      if (ghlOpportunityId) {
        await supabase.from('orders').update({ ghl_opportunity_id: ghlOpportunityId }).eq('id', orderId)
      }
    }
  }

  if (!ghlOpportunityId) return { order_id: orderId, status: 'skipped', reason: 'No GHL opportunity linked' }

  // Push monetary value to GHL
  const res = await fetch(`https://services.leadconnectorhq.com/opportunities/${ghlOpportunityId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type':  'application/json',
      'Version':       '2021-07-28',
    },
    body: JSON.stringify({ monetaryValue: total }),
  })

  if (!res.ok) {
    const err = await res.json()
    return { order_id: orderId, status: 'error', reason: JSON.stringify(err) }
  }

  return { order_id: orderId, status: 'synced', value: total }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const body = await req.json()

    const apiKey     = Deno.env.get('GHL_API_KEY')
    const locationId = Deno.env.get('GHL_LOCATION_ID')
    if (!apiKey || !locationId) return json({ skipped: true, reason: 'GHL not configured' })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // ── Bulk sync all orders ──────────────────────────────────────────
    if (body.sync_all === true) {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id')
        .not('contract_amount', 'is', null)

      if (error) throw error

      const results = []
      for (const o of orders ?? []) {
        const result = await syncOrder(supabase, apiKey, locationId, o.id)
        results.push(result)
      }

      const synced  = results.filter(r => r.status === 'synced').length
      const skipped = results.filter(r => r.status === 'skipped').length
      const errors  = results.filter(r => r.status === 'error').length

      return json({ summary: { total: results.length, synced, skipped, errors }, results })
    }

    // ── Single order sync ─────────────────────────────────────────────
    const { order_id } = body
    if (!order_id) return json({ skipped: true, reason: 'Provide order_id or sync_all: true' })

    const result = await syncOrder(supabase, apiKey, locationId, order_id)
    return json(result)

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('update-ghl-value error:', message)
    return json({ error: message }, 500)
  }
})
