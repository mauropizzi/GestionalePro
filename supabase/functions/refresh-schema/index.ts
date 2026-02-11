// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_TABLES = new Set([
  "clienti",
  "fornitori",
  "punti_servizio",
  "personale",
  "operatori_network",
  "procedure",
  "tariffe",
  "rubrica_clienti",
  "rubrica_fornitori",
  "rubrica_punti_servizio",
]);

serve(async (req: Request) => {
  console.log("[refresh-schema] Function invoked.");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let tableName = "operatori_network";
    try {
      const body = await req.json().catch(() => null);
      if (body?.tableName && typeof body.tableName === "string") {
        tableName = body.tableName;
      }
    } catch {
      // ignore
    }

    if (!ALLOWED_TABLES.has(tableName)) {
      console.warn("[refresh-schema] Rejected tableName (not allowed)", { tableName });
      return new Response(
        JSON.stringify({ success: false, error: "tableName non valido" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("[refresh-schema] Forcing PostgREST schema cache refresh...", { tableName });

    // Method 1: NOTIFY reload schema/config
    await supabaseAdmin.rpc("pg_notify", {
      channel: "pgrst",
      payload: "reload schema",
    });
    await supabaseAdmin.rpc("pg_notify", {
      channel: "pgrst",
      payload: "reload config",
    });

    // Method 2: (optional) touch table via SQL RPC, if installed.
    // tableName is allowlisted, so it's safe to interpolate.
    try {
      await supabaseAdmin.rpc("sql", {
        query: `COMMENT ON TABLE public.${tableName} IS 'PostgREST cache refresh at ${new Date().toISOString()}';`,
      });
      await supabaseAdmin.rpc("sql", {
        query: `CREATE OR REPLACE VIEW public.${tableName}_cache_buster AS SELECT 1; DROP VIEW public.${tableName}_cache_buster;`,
      });
      console.log("[refresh-schema] SQL cache-busting executed", { tableName });
    } catch (sqlErr) {
      console.warn("[refresh-schema] SQL cache-busting skipped (sql RPC missing?)", {
        tableName,
        message: sqlErr?.message,
      });
    }

    await new Promise((r) => setTimeout(r, 2000));

    // Lightweight check that PostgREST responds for the table
    const { error: testError } = await supabaseAdmin.from(tableName).select("id").limit(1);
    if (testError) {
      console.error("[refresh-schema] Post-refresh select failed", {
        tableName,
        error: testError,
      });
      return new Response(
        JSON.stringify({ success: false, error: testError.message }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cache schema aggiornata (richiesta) per: ${tableName}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[refresh-schema] Unhandled error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});