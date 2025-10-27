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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { anagraficaType } = await req.json();

    if (!anagraficaType) {
      return new Response(JSON.stringify({ error: 'Invalid request: anagraficaType is required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data, error } = await supabaseAdmin
      .from(anagraficaType)
      .select('*');

    if (error) {
      console.error(`Error fetching data for ${anagraficaType}:`, error);
      let errorMessage = error.message;
      if (error.details) errorMessage += ` Details: ${error.details}`;
      if (error.hint) errorMessage += ` Hint: ${error.hint}`;
      if (error.code) errorMessage += ` Code: ${error.code}`;
      return new Response(JSON.stringify({ error: errorMessage }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!data || data.length === 0) {
      return new Response(JSON.stringify({ message: `No data found for ${anagraficaType}.` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, anagraficaType);

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    return new Response(excelBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${anagraficaType}_export_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
      status: 200,
    });

  } catch (error) {
    console.error('Error in export-data function:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});