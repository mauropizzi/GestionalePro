// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// Removed: import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.0'; // Not needed for minimal test

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  console.log("import-data function received request.");

  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request.");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing non-OPTIONS request.");
    // Restituisce una semplice risposta di successo con gli header CORS
    return new Response(JSON.stringify({ message: "import-data function is alive and responding!" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Unhandled error in minimal import-data function:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});