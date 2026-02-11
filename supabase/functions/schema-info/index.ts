import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

const ALLOWED_ROLES = new Set(["super_admin", "amministrazione"]);

type ColumnInfo = {
  column_name: string;
  data_type: string;
  is_nullable: "YES" | "NO";
  column_default: string | null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) {
      console.error("[schema-info] auth.getUser failed", { userErr });
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (profileErr) {
      console.error("[schema-info] profile fetch failed", { profileErr });
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!profile?.role || !ALLOWED_ROLES.has(profile.role)) {
      console.warn("[schema-info] forbidden role", { role: profile?.role });
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    const tableName = body?.tableName;

    if (!tableName || typeof tableName !== "string" || !ALLOWED_TABLES.has(tableName)) {
      return new Response(JSON.stringify({ error: "tableName non valido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Query information_schema via SQL RPC if available, otherwise use direct SQL via pg
    // We rely on a sql(query text) function if it exists; if it doesn't, return a clear error.
    const sqlQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = '${tableName.replaceAll("'", "''")}'
      ORDER BY ordinal_position;
    `;

    const { data: cols, error: sqlErr } = await admin.rpc("sql", { query: sqlQuery });

    if (sqlErr) {
      console.error("[schema-info] sql rpc failed", { sqlErr });
      return new Response(
        JSON.stringify({ error: "SQL RPC non disponibile per leggere lo schema." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ tableName, columns: (cols ?? []) as ColumnInfo[] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (e) {
    console.error("[schema-info] unhandled", { message: (e as Error).message });
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
