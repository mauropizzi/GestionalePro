// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log("Function invoked with method:", req.method);
  console.log("Headers:", Object.fromEntries(req.headers.entries()));

  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Attempting to parse request body...");
    const { anagraficaType } = await req.json();
    console.log("Request body parsed successfully. anagraficaType:", anagraficaType);

    if (!anagraficaType) {
      console.error("Invalid request: anagraficaType is required.");
      return new Response(JSON.stringify({ error: 'Invalid request: anagraficaType is required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log("Creating Supabase admin client...");
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.log("Supabase admin client created.");

    console.log(`Fetching data from table: ${anagraficaType}...`);
    const { data, error } = await supabaseAdmin
      .from(anagraficaType)
      .select('*');

    if (error) {
      console.error(`Error fetching data for ${anagraficaType}:`, error);
      let errorMessage = error.message;
      if (error.details) errorMessage += ` Details: ${error.details}`;
      if (error.hint) errorMessage += ` Hint: ${error.hint}`;
      if (error.code) errorMessage += ` Code: ${error.code}`;
      console.log("Returning error response:", errorMessage);
      return new Response(JSON.stringify({ error: errorMessage }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log("Data fetched successfully. Data length:", data?.length);

    if (!data || data.length === 0) {
      console.log(`No data found for ${anagraficaType}.`);
      return new Response(JSON.stringify({ message: `No data found for ${anagraficaType}.` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    console.log("Creating Excel workbook...");
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, anagraficaType);

    console.log("Writing workbook to buffer...");
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    console.log("Workbook written to buffer.");

    return new Response(excelBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${anagraficaType}_export_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
      status: 200,
    });

  } catch (error) {
    console.error("Unhandled error in export-data function:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});