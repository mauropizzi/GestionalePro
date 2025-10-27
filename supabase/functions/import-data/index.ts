// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to clean and map incoming data to database schema
function mapClientData(rowData: any) {
  return {
    ragione_sociale: rowData['Ragione Sociale'] || rowData['ragione_sociale'],
    codice_fiscale: rowData['Codice Fiscale'] || rowData['codice_fiscale'] || null,
    partita_iva: rowData['Partita IVA'] || rowData['partita_iva'] || null,
    indirizzo: rowData['Indirizzo'] || rowData['indirizzo'] || null,
    citta: rowData['Città'] || rowData['citta'] || null,
    cap: rowData['CAP'] || rowData['cap'] || null,
    provincia: rowData['Provincia'] || rowData['provincia'] || null,
    telefono: rowData['Telefono'] || rowData['telefono'] || null,
    email: rowData['Email'] || rowData['email'] || null,
    pec: rowData['PEC'] || rowData['pec'] || null,
    sdi: rowData['SDI'] || rowData['sdi'] || null,
    attivo: rowData['Attivo'] === 'TRUE' || rowData['attivo'] === true || rowData['Attivo'] === 1, // Handle boolean conversion
    note: rowData['Note'] || rowData['note'] || null,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { anagraficaType, data: importData } = await req.json();

    if (!anagraficaType || !importData || !Array.isArray(importData)) {
      return new Response(JSON.stringify({ error: 'Invalid request: anagraficaType and data array are required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const row of importData) {
      try {
        if (anagraficaType === 'clienti') {
          const clientToProcess = mapClientData(row);

          // Check if client already exists by ragione_sociale or partita_iva
          const { data: existingClients, error: fetchError } = await supabaseAdmin
            .from('clienti')
            .select('id')
            .or(`ragione_sociale.eq.${clientToProcess.ragione_sociale},partita_iva.eq.${clientToProcess.partita_iva}`)
            .limit(1);

          if (fetchError) throw fetchError;

          if (existingClients && existingClients.length > 0) {
            // Update existing client
            const { error: updateError } = await supabaseAdmin
              .from('clienti')
              .update({ ...clientToProcess, updated_at: new Date().toISOString() })
              .eq('id', existingClients[0].id);
            if (updateError) throw updateError;
          } else {
            // Insert new client
            const { error: insertError } = await supabaseAdmin
              .from('clienti')
              .insert({ ...clientToProcess, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
            if (insertError) throw insertError;
          }
          successCount++;
        } else {
          // TODO: Implement logic for other anagrafica types (fornitori, punti_servizio, etc.)
          // For now, if anagraficaType is not 'clienti', it will be skipped or throw an error.
          throw new Error(`Import logic not implemented for anagrafica type: ${anagraficaType}`);
        }
      } catch (rowError: any) {
        errorCount++;
        errors.push(`Error processing row ${JSON.stringify(row)}: ${rowError.message}`);
        console.error(`Error processing row for ${anagraficaType}:`, rowError);
      }
    }

    if (errorCount > 0) {
      return new Response(JSON.stringify({
        message: `Import completed with ${successCount} successes and ${errorCount} errors.`,
        errors,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 207, // Multi-Status
      });
    }

    return new Response(JSON.stringify({ message: `Import completed successfully. ${successCount} records processed.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in import-data function:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});