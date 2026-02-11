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

    // Method 2: Force reload by performing a DDL-like operation (comment update)
    // We use a direct SQL approach if possible, but since we are using the client:
    const { error: sqlError } = await supabaseAdmin.from('operatori_network').select('id').limit(1);
    
    // We can also try to "touch" the schema by altering a comment directly via RPC if available
    // or just assume the NOTIFY is enough if the column actually exists now.

    if (notifyError) {
      console.error("[refresh-schema] NOTIFY method failed:", notifyError);
    } else {
      console.log("[refresh-schema] NOTIFY method successful");
    }

    // Method 3: Touch the schema by running a simple query
    // We wrap this in a try/catch to avoid function failure if column still not "seen"
    let touchSuccess = false;
    try {
      const { error: touchError } = await supabaseAdmin
        .from('operatori_network')
        .select('id, note')
        .limit(1);
      
      if (!touchError) touchSuccess = true;
      console.log("[refresh-schema] Touch method result:", touchError ? touchError.message : "Success");
    } catch (e) {
      console.error("[refresh-schema] Touch method crashed:", e);
    }

    // Wait a moment for the cache to refresh
    await new Promise(resolve => setTimeout(resolve, 2000));

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