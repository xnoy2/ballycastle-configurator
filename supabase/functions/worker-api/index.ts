import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

async function hashKey(key: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    // ── Authenticate via API key header ──────────────────────────────
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey) return json({ error: 'Missing x-api-key header' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const keyHash = await hashKey(apiKey)
    const { data: keyRecord } = await supabase
      .from('api_keys')
      .select('id, is_active')
      .eq('key_hash', keyHash)
      .single()

    if (!keyRecord || !keyRecord.is_active) {
      return json({ error: 'Invalid or revoked API key' }, 401)
    }

    // Update last_used_at (fire and forget)
    supabase.from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyRecord.id)
      .then(() => {})

    // ── Route ─────────────────────────────────────────────────────────
    const url  = new URL(req.url)
    const path = url.pathname.replace(/.*\/worker-api/, '') || '/'

    // GET /orders — list all orders
    if (req.method === 'GET' && path === '/orders') {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, order_number, address, installation_date, installation_window,
          is_birthday_booking, product_order, notes,
          worker:worker_profiles(id, name, avatar_url),
          client:client_profiles(name, email, phone)
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      return json({ orders: data })
    }

    // GET /orders/:id — single order with stages + tasks
    const orderMatch = path.match(/^\/orders\/([^/]+)$/)
    if (req.method === 'GET' && orderMatch) {
      const orderId = orderMatch[1]

      const [{ data: order, error: oErr }, { data: stages, error: sErr }] = await Promise.all([
        supabase.from('orders')
          .select('*, worker:worker_profiles(id, name, avatar_url), client:client_profiles(name, email, phone)')
          .eq('id', orderId).single(),
        supabase.from('build_stages').select('*').eq('order_id', orderId).order('stage_number'),
      ])
      if (oErr) throw oErr
      if (sErr) throw sErr

      const stageIds = (stages ?? []).map((s: { id: string }) => s.id)
      const { data: tasks } = stageIds.length
        ? await supabase.from('stage_tasks').select('*').in('stage_id', stageIds).order('created_at')
        : { data: [] }

      const stagesWithTasks = (stages ?? []).map((s: { id: string }) => ({
        ...s,
        tasks: (tasks ?? []).filter((t: { stage_id: string }) => t.stage_id === s.id),
      }))

      return json({ order, stages: stagesWithTasks })
    }

    // PATCH /stages/:id — update stage status
    const stageMatch = path.match(/^\/stages\/([^/]+)$/)
    if (req.method === 'PATCH' && stageMatch) {
      const stageId = stageMatch[1]
      const body = await req.json()
      const allowed = ['pending', 'in_progress', 'done']
      if (!allowed.includes(body.status)) {
        return json({ error: `Invalid status. Allowed: ${allowed.join(', ')}` }, 400)
      }
      const { data, error } = await supabase.from('build_stages')
        .update({
          status:       body.status,
          completed_at: body.status === 'done' ? new Date().toISOString() : null,
        })
        .eq('id', stageId).select().single()
      if (error) throw error
      return json({ stage: data })
    }

    // PATCH /tasks/:id — complete or update a task
    const taskMatch = path.match(/^\/tasks\/([^/]+)$/)
    if (req.method === 'PATCH' && taskMatch) {
      const taskId = taskMatch[1]
      const body = await req.json()
      const { data, error } = await supabase.from('stage_tasks')
        .update({
          completed: body.completed ?? true,
          notes:     body.notes     ?? null,
        })
        .eq('id', taskId).select().single()
      if (error) throw error
      return json({ task: data })
    }

    return json({ error: 'Route not found' }, 404)

  } catch (err) {
    return json({ error: (err as Error).message }, 500)
  }
})
