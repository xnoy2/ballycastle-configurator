import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Recursively list and delete all files under a storage folder prefix
async function deleteStorageFolder(supabase: any, bucket: string, prefix: string) {
  const { data: items } = await supabase.storage
    .from(bucket)
    .list(prefix, { limit: 1000, offset: 0 })

  if (!items?.length) return

  const filePaths: string[] = []
  const subfolders: string[] = []

  for (const item of items) {
    const fullPath = `${prefix}/${item.name}`
    if (item.id) {
      filePaths.push(fullPath)
    } else {
      subfolders.push(fullPath)
    }
  }

  if (filePaths.length) {
    await supabase.storage.from(bucket).remove(filePaths)
  }

  for (const folder of subfolders) {
    await deleteStorageFolder(supabase, bucket, folder)
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const payload = await req.json()

    // Accept: GHL webhook (opportunityId), admin call (orderId), or admin call (clientId only)
    const ghlOpportunityId = payload.id ?? payload.opportunityId ?? payload.ghlOpportunityId
    const directOrderId    = payload.orderId
    const directClientId   = payload.clientId

    if (!ghlOpportunityId && !directOrderId && !directClientId) {
      return new Response(
        JSON.stringify({ error: 'Provide opportunityId, orderId, or clientId' }),
        { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } },
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // ── 1. Resolve the order ───────────────────────────────────────────────
    let orderId: string | null = null
    let clientId: string | null = directClientId ?? null

    if (directOrderId) {
      const { data } = await supabase
        .from('orders').select('id, client_id').eq('id', directOrderId).maybeSingle()
      orderId  = data?.id        ?? null
      clientId = data?.client_id ?? clientId
    } else if (ghlOpportunityId) {
      const { data } = await supabase
        .from('orders').select('id, client_id').eq('ghl_opportunity_id', ghlOpportunityId).maybeSingle()
      orderId  = data?.id        ?? null
      clientId = data?.client_id ?? clientId
    }

    // If clientId-only call (no order), skip straight to client purge below
    if (!orderId && !clientId) {
      return new Response(
        JSON.stringify({ ok: true, skipped: true, reason: 'Nothing found to delete' }),
        { headers: { ...CORS, 'Content-Type': 'application/json' } },
      )
    }

    console.log(`Deleting order ${orderId} for client ${clientId}`)

    // ── 2. Delete storage files before removing DB records ────────────────
    // order-photos bucket: files nested under orderId/
    await deleteStorageFolder(supabase, 'order-photos', orderId)

    // order-documents bucket: files nested under orderId/
    await deleteStorageFolder(supabase, 'order-documents', orderId)

    // ── 3. Delete order-level DB records (explicit — most cascade anyway) ─
    // Child tables first so FK constraints don't block parent deletes
    await supabase.from('order_photos')       .delete().eq('order_id', orderId)
    await supabase.from('order_documents')    .delete().eq('order_id', orderId)
    await supabase.from('variation_requests') .delete().eq('order_id', orderId)
    await supabase.from('order_extra_requests').delete().eq('order_id', orderId)
    await supabase.from('order_payments')     .delete().eq('order_id', orderId)
    await supabase.from('savings_plans')      .delete().eq('order_id', orderId)
    await supabase.from('reminders')          .delete().eq('order_id', orderId)
    await supabase.from('reviews')            .delete().eq('order_id', orderId)
    await supabase.from('build_stages')       .delete().eq('order_id', orderId) // cascades stage_tasks
    await supabase.from('orders')             .delete().eq('id', orderId)

    // ── 4. Check if client has any remaining orders ────────────────────────
    const { count: remainingOrders } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId)

    if (remainingOrders === 0 && clientId) {
      console.log(`No remaining orders for client ${clientId} — purging account`)

      // Delete avatar from storage
      const { data: profile } = await supabase
        .from('client_profiles')
        .select('avatar_url')
        .eq('id', clientId)
        .maybeSingle()

      if (profile?.avatar_url) {
        const avatarPath = profile.avatar_url.split('/avatars/')[1]
        if (avatarPath) await supabase.storage.from('avatars').remove([avatarPath])
      }

      // Delete client-level records
      await supabase.from('client_notifications').delete().eq('client_id', clientId)
      await supabase.from('referrals')           .delete().eq('referrer_id', clientId)
      await supabase.from('client_profiles')     .delete().eq('id', clientId)
      await supabase.from('user_roles')          .delete().eq('user_id', clientId)

      // Delete auth user last — cascades any remaining references
      const { error: authErr } = await supabase.auth.admin.deleteUser(clientId)
      if (authErr) console.error('Auth user delete error:', authErr.message)
    }

    return new Response(
      JSON.stringify({ ok: true, orderId, clientId, clientPurged: remainingOrders === 0 }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } },
    )

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('ghl-opportunity-deleted error:', message)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } },
    )
  }
})
