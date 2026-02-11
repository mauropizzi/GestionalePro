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
    await supabaseAdmin.rpc('pg_notify', {
      channel: 'pgrst',
      payload: 'reload schema'
    });

    // Method 2: Another NOTIFY for config reload
    await supabaseAdmin.rpc('pg_notify', {
      channel: 'pgrst',
      payload: 'reload config'
    });

    // Method 3: Touch the table with a DDL-like operation
    // Re-adding the comment with a new timestamp forces a schema change detection
    await supabaseAdmin.rpc('sql', {
      query: `COMMENT ON TABLE public.operatori_network IS 'Tabella operatori network - Cache refreshed at ${new Date().toISOString()}';`
    });

    // Method 4: Create and drop a dummy view - very effective at forcing reload
    await supabaseAdmin.rpc('sql', {
      query: `
        CREATE OR REPLACE VIEW public.operatori_network_cache_buster AS SELECT 1;
        DROP VIEW public.operatori_network_cache_buster;
      `
    });

    console.log("[refresh-schema] Cache busting methods executed.");

    // Wait a bit longer for the cache to actually refresh
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test if the column is visible to the service role client
    const { error: testError } = await supabaseAdmin
      .from('operatori_network')
      .select('note')
      .limit(1);

    if (testError) {
      console.error("[refresh-schema] Schema refresh test failed for service role:", testError.message);
      
      // If it still fails, let's try to check if the column actually exists in information_schema
      const { data: columnExists } = await supabaseAdmin.rpc('sql', {
        query: "SELECT 1 FROM information_schema.columns WHERE table_name = 'operatori_network' AND column_name = 'note';"
      });

      if (!columnExists || columnExists.length === 0) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Column 'note' does not exist in the database table 'operatori_network'.",
          message: "The migration to add the column might have failed or wasn't run."
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }

      return new Response(JSON.stringify({ 
        success: false, 
        error: testError.message,
        message: "Column exists in DB but PostgREST still hasn't refreshed its cache. Try again in a few seconds."
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log("[refresh-schema] Schema refresh test successful for service role.");
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "PostgREST schema cache refreshed successfully. The 'note' column is now visible."
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