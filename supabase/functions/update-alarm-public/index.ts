// @ts-nocheck

import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Body = {
  token?: string
  intervention_start_time?: string | null
  intervention_end_time?: string | null
  service_outcome?: string | null
  delay_minutes?: number | null
  anomalies_found?: string | null
  client_request_barcode?: string | null
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body: Body = await req.json().catch(() => ({}))
    const { token } = body

    if (!token) {
      console.error('[update-alarm-public] missing token')
      return new Response(JSON.stringify({ error: 'token is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const url = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAdmin = createClient(url, serviceKey)

    // Validate token and expiry
    const { data: linkRow, error: linkError } = await supabaseAdmin
      .from('alarm_public_links')
      .select('alarm_id, expires_at')
      .eq('token', token)
      .maybeSingle()

    if (linkError) {
      console.error('[update-alarm-public] link select error', { linkError })
      return new Response(JSON.stringify({ error: linkError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!linkRow) {
      console.error('[update-alarm-public] invalid link token')
      return new Response(JSON.stringify({ error: 'Link non valido' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const expires = new Date(linkRow.expires_at)
    if (Number.isNaN(expires.getTime()) || expires.getTime() < Date.now()) {
      console.warn('[update-alarm-public] link expired')
      return new Response(JSON.stringify({ error: 'Link scaduto' }), {
        status: 410,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Prepare allowed update fields only
    const updateData: Record<string, any> = {}
    if ('intervention_start_time' in body) updateData.intervention_start_time = body.intervention_start_time ?? null
    if ('intervention_end_time' in body) updateData.intervention_end_time = body.intervention_end_time ?? null
    if ('service_outcome' in body) updateData.service_outcome = body.service_outcome ?? null
    if ('delay_minutes' in body) {
      const n = typeof body.delay_minutes === 'number' ? body.delay_minutes : null
      updateData.delay_minutes = n
    }
    if ('anomalies_found' in body) updateData.anomalies_found = body.anomalies_found ?? null
    if ('client_request_barcode' in body) updateData.client_request_barcode = body.client_request_barcode ?? null

    // No fields to update
    if (Object.keys(updateData).length === 0) {
      console.warn('[update-alarm-public] no fields to update')
      return new Response(JSON.stringify({ error: 'Nessun cambiamento richiesto' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Optional: prevent updates if already closed (service_outcome not null)
    const { data: current, error: currentError } = await supabaseAdmin
      .from('allarme_entries')
      .select('id, service_outcome')
      .eq('id', linkRow.alarm_id)
      .single()

    if (currentError) {
      console.error('[update-alarm-public] current alarm fetch error', { currentError })
      return new Response(JSON.stringify({ error: currentError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Perform update
    const { error: updateError } = await supabaseAdmin
      .from('allarme_entries')
      .update(updateData)
      .eq('id', linkRow.alarm_id)

    if (updateError) {
      console.error('[update-alarm-public] update error', { updateError })
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Return minimal refreshed alarm view
    const { data: alarm, error: alarmError } = await supabaseAdmin
      .from('allarme_entries')
      .select(`
        id,
        registration_date,
        request_time_co,
        punti_servizio:punti_servizio(nome_punto_servizio),
        intervention_start_time,
        intervention_end_time,
        anomalies_found,
        delay_minutes,
        service_outcome,
        client_request_barcode
      `)
      .eq('id', linkRow.alarm_id)
      .single()

    if (alarmError) {
      console.error('[update-alarm-public] alarm select after update error', { alarmError })
      return new Response(JSON.stringify({ error: alarmError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.info('[update-alarm-public] update success', { alarm_id: linkRow.alarm_id })
    return new Response(JSON.stringify({ alarm }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[update-alarm-public] unexpected error', { error })
    return new Response('Internal Server Error', { status: 500, headers: corsHeaders })
  }
})