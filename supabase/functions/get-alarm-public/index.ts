import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Body = {
  token?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { token }: Body = await req.json().catch(() => ({}))
    if (!token) {
      return new Response(JSON.stringify({ error: 'token is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const url = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAdmin = createClient(url, serviceKey)

    const { data: linkRow, error: linkError } = await supabaseAdmin
      .from('alarm_public_links')
      .select('alarm_id, expires_at')
      .eq('token', token)
      .maybeSingle()

    if (linkError) {
      console.error('[get-alarm-public] link select error', { linkError })
      return new Response(JSON.stringify({ error: linkError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!linkRow) {
      return new Response(JSON.stringify({ error: 'Link non valido' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const expires = new Date(linkRow.expires_at)
    if (Number.isNaN(expires.getTime()) || expires.getTime() < Date.now()) {
      return new Response(JSON.stringify({ error: 'Link scaduto' }), {
        status: 410,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch alarm details (keep it minimal)
    const { data: alarm, error: alarmError } = await supabaseAdmin
      .from('allarme_entries')
      .select(`
        id,
        registration_date,
        request_time_co,
        punto_servizio_id,
        punti_servizio(nome_punto_servizio),
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
      console.error('[get-alarm-public] alarm select error', { alarmError })
      return new Response(JSON.stringify({ error: alarmError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ alarm, expires_at: linkRow.expires_at }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[get-alarm-public] unexpected error', { error })
    return new Response('Internal Server Error', { status: 500, headers: corsHeaders })
  }
})
