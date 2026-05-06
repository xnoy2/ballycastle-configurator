import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// BCF stage number → GHL pipeline stage ID
function getGhlStageId(stageNumber: number): string | null {
  return Deno.env.get(`GHL_STAGE_${stageNumber}`) ?? null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { order_id, opportunity_id, stage_number } = await req.json()

    const apiKey     = Deno.env.get('GHL_API_KEY')
    const locationId = Deno.env.get('GHL_LOCATION_ID')

    if (!apiKey || !locationId) {
      return new Response(JSON.stringify({ skipped: true, reason: 'GHL not configured' }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Resolve opportunity ID — use passed value or look it up from the order
    let ghlOpportunityId = opportunity_id

    if (!ghlOpportunityId && order_id) {
      const { data: order } = await supabase
        .from('orders')
        .select('ghl_opportunity_id, client:client_profiles(email)')
        .eq('id', order_id)
        .single()

      ghlOpportunityId = order?.ghl_opportunity_id

      // Last resort: search GHL by client email
      if (!ghlOpportunityId && order?.client?.email) {
        const searchRes = await fetch(
          `https://services.leadconnectorhq.com/contacts/?locationId=${locationId}&query=${encodeURIComponent(order.client.email)}`,
          { headers: { 'Authorization': `Bearer ${apiKey}`, 'Version': '2021-07-28' } }
        )
        const searchData = await searchRes.json()
        const contactId  = searchData?.contacts?.[0]?.id

        if (contactId) {
          const oppRes = await fetch(
            `https://services.leadconnectorhq.com/opportunities/search?location_id=${locationId}&contact_id=${contactId}`,
            { headers: { 'Authorization': `Bearer ${apiKey}`, 'Version': '2021-07-28' } }
          )
          const oppData = await oppRes.json()
          ghlOpportunityId = oppData?.opportunities?.[0]?.id

          // Cache it back to the order so future calls are fast
          if (ghlOpportunityId && order_id) {
            await supabase.from('orders').update({ ghl_opportunity_id: ghlOpportunityId }).eq('id', order_id)
          }
        }
      }
    }

    if (!ghlOpportunityId) {
      return new Response(JSON.stringify({ skipped: true, reason: 'No GHL opportunity ID found' }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // Advance to next stage
    const nextStageId = getGhlStageId(stage_number + 1)
    if (!nextStageId) {
      return new Response(JSON.stringify({ skipped: true, reason: `No GHL stage mapped for stage ${stage_number + 1}` }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const res = await fetch(`https://services.leadconnectorhq.com/opportunities/${ghlOpportunityId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
        'Version':       '2021-07-28',
      },
      body: JSON.stringify({ pipelineStageId: nextStageId }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(`GHL update failed: ${JSON.stringify(data)}`)

    return new Response(JSON.stringify({ success: true, moved_to_stage: stage_number + 1 }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('advance-ghl-stage error:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
