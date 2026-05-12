import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const ghlApiKey     = Deno.env.get('GHL_API_KEY')
    const ghlLocationId = Deno.env.get('GHL_LOCATION_ID')
    const ghlPipelineId = Deno.env.get('GHL_PIPELINE_ID') ?? 'Rki3r8dMJp0elw44sK5C'
    const portalUrl     = Deno.env.get('PORTAL_URL') ?? 'https://portal.ballycastleclimbingframes.co.uk/portal'
    const supabaseUrl   = Deno.env.get('SUPABASE_URL')!
    const serviceKey    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!ghlApiKey || !ghlLocationId) {
      return new Response(JSON.stringify({ error: 'GHL_API_KEY or GHL_LOCATION_ID not configured' }), {
        status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    // ── Fetch ALL opportunities from GHL pipeline (cursor-based pagination) ──
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allOpps: any[] = []
    let startAfterId: string | null = null
    let startAfter:   number | null = null

    for (;;) {
      let url = `https://services.leadconnectorhq.com/opportunities/search?location_id=${ghlLocationId}&pipeline_id=${ghlPipelineId}&limit=100`
      if (startAfterId) url += `&startAfterId=${startAfterId}&startAfter=${startAfter}`

      const res  = await fetch(url, { headers: { 'Authorization': `Bearer ${ghlApiKey}`, 'Version': '2021-07-28' } })
      const data = await res.json()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const opps: any[] = data?.opportunities ?? []
      allOpps.push(...opps)

      if (opps.length < 100) break
      const meta = data?.meta ?? {}
      if (!meta.startAfterId) break
      startAfterId = meta.startAfterId
      startAfter   = meta.startAfter ?? null
    }

    console.log(`sync-ghl: fetched ${allOpps.length} opportunities from GHL pipeline ${ghlPipelineId}`)

    const results: { email: string; action: 'created' | 'skipped' | 'error'; detail?: string }[] = []

    for (const opp of allOpps) {
      const opportunityId = opp.id
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contact: any  = opp.contact ?? {}
      const email         = contact.email ?? opp.email ?? ''

      if (!email) {
        results.push({ email: '(no email)', action: 'skipped', detail: `opp ${opportunityId} has no email` })
        continue
      }

      // Already synced?
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('ghl_opportunity_id', opportunityId)
        .maybeSingle()

      if (existingOrder) {
        results.push({ email, action: 'skipped', detail: 'already exists in BCF' })
        continue
      }

      const firstName = contact.firstName ?? contact.first_name
        ?? (contact.name ? contact.name.split(' ')[0] : '')
      const lastName  = contact.lastName  ?? contact.last_name
        ?? (contact.name ? contact.name.split(' ').slice(1).join(' ') : '')
      const phone     = contact.phone ?? opp.phone ?? ''
      const address   = contact.address1 ?? contact.address ?? ''

      try {
        const createRes  = await fetch(`${supabaseUrl}/functions/v1/create-client`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
          body: JSON.stringify({
            first_name:         firstName,
            last_name:          lastName,
            email,
            phone,
            address,
            ghl_opportunity_id: opportunityId,
            send_email:         false,
            redirect_to:        portalUrl,
          }),
        })
        const createText = await createRes.text()
        console.log(`sync-ghl: create-client for ${email} → status=${createRes.status} body=${createText.substring(0, 200)}`)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let createData: any = {}
        try { createData = JSON.parse(createText) } catch { createData = { raw: createText } }

        if (!createRes.ok || createData.error || createData.code) {
          results.push({ email, action: 'error', detail: `${createRes.status}: ${createData.error ?? createData.message ?? createText.substring(0, 100)}` })
        } else {
          results.push({ email, action: 'created', detail: `order ${createData.orderNumber}` })
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        results.push({ email, action: 'error', detail: msg })
      }
    }

    const created = results.filter(r => r.action === 'created').length
    const skipped = results.filter(r => r.action === 'skipped').length
    const errors  = results.filter(r => r.action === 'error')

    console.log(`sync-ghl done: created=${created} skipped=${skipped} errors=${errors.length}`)

    return new Response(JSON.stringify({
      success: true,
      total:   allOpps.length,
      created,
      skipped,
      errors:  errors.length > 0 ? errors : undefined,
      results,
    }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('sync-ghl error:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
