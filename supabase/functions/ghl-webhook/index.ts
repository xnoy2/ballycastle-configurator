import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-ghl-signature',
}

// BCF stage labels — must match the order in create-client
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
    const payload = await req.json()
    console.log('GHL webhook received:', JSON.stringify(payload))

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const portalUrl = Deno.env.get('PORTAL_URL') ?? 'https://portal.ballycastleclimbingframes.co.uk/portal'
    const ghlStage1 = Deno.env.get('GHL_STAGE_1') // "Order Confirmed" stage ID in GHL

    // GHL sends opportunity data in multiple formats depending on the trigger type:
    // - Direct/native webhook: flat top-level fields (payload.id, payload.pipelineStageId)
    // - Workflow Webhook action: nested under payload.opportunity { id, pipelineStageId }
    // - Workflow snake_case: payload.opportunity_id, payload.pipeline_stage_id
    // Support all variants.
    const opp = payload.opportunity ?? {}

    const opportunityId   = payload.id
                         ?? opp.id                       // nested: payload.opportunity.id
                         ?? payload.opportunityId
                         ?? opp.opportunityId
                         ?? payload.opportunity_id
                         ?? payload.ghl_opportunity_id
                         ?? payload.ghl_opportunit        // truncated key variant

    const pipelineStageId = payload.pipelineStageId
                         ?? opp.pipelineStageId          // nested: payload.opportunity.pipelineStageId
                         ?? payload.pipeline_stage_id
                         ?? opp.pipeline_stage_id
                         ?? payload.stageId
                         ?? opp.stageId
                         ?? payload.customData?.pipelineStageId

    // Contact fields — check nested opportunity.contact, top-level contact{}, then flat fields
    const contact         = opp.contact ?? payload.contact ?? {}
    const email           = contact.email   ?? payload.email   ?? opp.email
    const phone           = contact.phone   ?? payload.phone   ?? opp.phone   ?? ''
    const address         = contact.address ?? payload.address ?? opp.address ?? ''

    const contactFullName = contact.name ?? opp.contactName ?? payload.full_name ?? payload.contactName ?? ''
    const firstName = contact.firstName ?? payload.first_name ?? payload.firstName ?? opp.firstName
      ?? (contactFullName ? contactFullName.split(' ')[0] : '')
    const lastName  = contact.lastName  ?? payload.last_name  ?? payload.lastName  ?? opp.lastName
      ?? (contactFullName ? contactFullName.split(' ').slice(1).join(' ') : '')

    console.log('Resolved fields:', JSON.stringify({ opportunityId, pipelineStageId, email, firstName, lastName }))

    if (!opportunityId || !pipelineStageId) {
      return new Response(JSON.stringify({ skipped: true, reason: 'Missing opportunityId or pipelineStageId' }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // ── Case 1: Opportunity entered "Order Confirmed" → create BCF client ───
    if (ghlStage1 && pipelineStageId === ghlStage1) {
      if (!email) {
        return new Response(JSON.stringify({ skipped: true, reason: 'No email on contact — cannot create client' }), {
          headers: { ...CORS, 'Content-Type': 'application/json' },
        })
      }

      // Call create-client function with send_email: false
      const createRes = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/create-client`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
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

      const createData = await createRes.json()
      console.log('create-client result:', JSON.stringify(createData))

      return new Response(JSON.stringify({ success: true, action: 'client_created', ...createData }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // ── Case 2: Opportunity moved to a later stage → update BCF build stage ─
    // Find BCF stage ID that matches this GHL stage
    let matchedStageNumber: number | null = null
    for (let i = 1; i <= STAGE_LABELS.length; i++) {
      const envStageId = Deno.env.get(`GHL_STAGE_${i}`)
      if (envStageId && envStageId === pipelineStageId) {
        matchedStageNumber = i
        break
      }
    }

    if (matchedStageNumber === null) {
      return new Response(JSON.stringify({ skipped: true, reason: `No BCF stage mapped to GHL stage ${pipelineStageId}` }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // Find the BCF order linked to this GHL opportunity
    const { data: orderRow } = await supabase
      .from('orders')
      .select('id')
      .eq('ghl_opportunity_id', opportunityId)
      .single()

    if (!orderRow) {
      return new Response(JSON.stringify({ skipped: true, reason: 'No BCF order found for this opportunity' }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // Mark BCF stage as in_progress (GHL being on stage N means BCF stage N is active)
    const { error: stageErr } = await supabase
      .from('build_stages')
      .update({ status: 'in_progress' })
      .eq('order_id', orderRow.id)
      .eq('stage_number', matchedStageNumber)
      .eq('status', 'pending') // only advance if still pending

    if (stageErr) throw new Error(`Stage update failed: ${stageErr.message}`)

    return new Response(JSON.stringify({ success: true, action: 'stage_updated', stage_number: matchedStageNumber }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('ghl-webhook error:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
