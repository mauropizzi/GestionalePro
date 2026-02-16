import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Body = {
  alarm_id?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('[create-alarm-public-link] missing auth header')
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const { alarm_id }: Body = await req.json().catch(() => ({}))
    if (!alarm_id) {
      return new Response(JSON.stringify({ error: 'alarm_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const url = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Create auth client for user verification
    const supabaseAuth = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const { data: userData, error: userError } = await supabaseAuth.auth.getUser()
    if (userError || !userData?.user) {
      console.error('[create-alarm-public-link] auth.getUser error', { userError })
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    // Create admin client for operations with service role
    const supabaseAdmin = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: {
        schema: 'public',
      },
    })

    // Role check using RPC
    const { data: role, error: roleError } = await supabaseAdmin.rpc('get_user_role', {
      user_id: userData.user.id,
    })

    if (roleError) {
      console.error('[create-alarm-public-link] get_user_role error', { roleError })
      return new Response('Forbidden', { status: 403, headers: corsHeaders })
    }

    const allowed = ['super_admin', 'amministrazione', 'responsabile_operativo', 'operativo']
    if (!allowed.includes(role)) {
      return new Response('Forbidden', { status: 403, headers: corsHeaders })
    }

    // Generate unique token
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    // Create public link
    const { error: insertError } = await supabaseAdmin
      .from('alarm_public_links')
      .insert({
        alarm_id,
        token,
        expires_at: expiresAt,
        created_by: userData.user.id,
      })

    if (insertError) {
      console.error('[create-alarm-public-link] insert error', { insertError })
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('[create-alarm-public-link] link created successfully', { 
      alarm_id, 
      user_id: userData.user.id,
      token: token.substring(0, 8) + '...' 
    })

    return new Response(JSON.stringify({ token, expires_at: expiresAt }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[create-alarm-public-link] unexpected error', { error })
    return new Response('Internal Server Error', { status: 500, headers: corsHeaders })
  }
})