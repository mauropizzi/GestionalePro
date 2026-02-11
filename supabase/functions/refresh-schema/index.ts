// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  console.log("[refresh-schema] Function invoked.");

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log("[refresh-schema] Forcing PostgREST schema cache refresh...");

    // Method 1: Using NOTIFY to trigger pgrst reload
    const { error: notifyError } = await supabaseAdmin.rpc('pg_notify', {
      channel: 'pgrst',
      payload: 'reload schema'
    });

    if (notifyError) {
      console.error("[refresh-schema] NOTIFY method failed:", notifyError);
    } else {
      console.log("[refresh-schema] NOTIFY method successful");
    }

    // Method 2: Update a comment on a table to trigger cache refresh
    const { error: commentError } = await supabaseAdmin.rpc('sql', {
      query: 'COMMENT ON TABLE public.operatori_network IS \'Network operators table - schema refresh: \' || now()'
    });

    if (commentError) {
      console.error("[refresh-schema] Comment method failed:", commentError);
    } else {
      console.log("[refresh-schema] Comment method successful");
    }

    // Method 3: Touch the schema by running a simple query
    const { error: touchError } = await supabaseAdmin
      .from('operatori_network')
      .select('id, note')
      .limit(1);

    if (touchError) {
      console.error("[refresh-schema] Touch method failed:", touchError);
    } else {
      console.log("[refresh-schema] Touch method successful");
    }

    // Wait a moment for the cache to refresh
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test if the refresh worked
    const { data: testData, error: testError } = await supabaseAdmin
      .from('operatori_network')
      .select('id, nome, cognome, note')
      .limit(1);

    if (testError) {
      console.error("[refresh-schema] Schema refresh test failed:", testError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: testError.message,
        message: "Schema cache refresh attempted but test query still failed"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log("[refresh-schema] Schema refresh test successful");
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "PostgREST schema cache refreshed successfully",
      testData: testData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("[refresh-schema] Unhandled error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: (error as Error).message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});