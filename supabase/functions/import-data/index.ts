// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to clean and map incoming client data to database schema
function mapClientData(rowData: any) {
  const ragione_sociale = rowData['Ragione Sociale'] || rowData['ragione_sociale'];
  if (!ragione_sociale || typeof ragione_sociale !== 'string' || ragione_sociale.trim() === '') {
    throw new Error('Ragione Sociale is required and cannot be empty.');
  }

  return {
    ragione_sociale: ragione_sociale.trim(),
    codice_fiscale: (rowData['Codice Fiscale'] || rowData['codice_fiscale'] || '').trim() || null,
    partita_iva: (rowData['Partita IVA'] || rowData['partita_iva'] || '').trim() || null,
    indirizzo: (rowData['Indirizzo'] || rowData['indirizzo'] || '').trim() || null,
    citta: (rowData['Città'] || rowData['citta'] || '').trim() || null,
    cap: (rowData['CAP'] || rowData['cap'] || '').trim() || null,
    provincia: (rowData['Provincia'] || rowData['provincia'] || '').trim() || null,
    telefono: (rowData['Telefono'] || rowData['telefono'] || '').trim() || null,
    email: (rowData['Email'] || rowData['email'] || '').trim() || null,
    pec: (rowData['PEC'] || rowData['pec'] || '').trim() || null,
    sdi: (rowData['SDI'] || rowData['sdi'] || '').trim() || null,
    attivo: rowData['Attivo'] === 'TRUE' || rowData['attivo'] === true || rowData['Attivo'] === 1, // Handle boolean conversion
    note: (rowData['Note'] || rowData['note'] || '').trim() || null,
  };
}

// Helper function to clean and map incoming service point data to database schema
function mapPuntoServizioData(rowData: any) {
  const nome_punto_servizio = rowData['Nome Punto Servizio'] || rowData['nome_punto_servizio'];
  if (!nome_punto_servizio || typeof nome_punto_servizio !== 'string' || nome_punto_servizio.trim() === '') {
    throw new Error('Nome Punto Servizio is required and cannot be empty.');
  }

  // Ensure UUIDs are valid or null
  const id_cliente_raw = rowData['ID Cliente'] || rowData['id_cliente'];
  const fornitore_id_raw = rowData['ID Fornitore'] || rowData['fornitore_id'];

  const isValidUuid = (uuid: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(uuid);

  const id_cliente = (id_cliente_raw && typeof id_cliente_raw === 'string' && isValidUuid(id_cliente_raw.trim())) ? id_cliente_raw.trim() : null;
  const fornitore_id = (fornitore_id_raw && typeof fornitore_id_raw === 'string' && isValidUuid(fornitore_id_raw.trim())) ? fornitore_id_raw.trim() : null;

  return {
    nome_punto_servizio: nome_punto_servizio.trim(),
    id_cliente: id_cliente,
    indirizzo: (rowData['Indirizzo'] || rowData['indirizzo'] || '').trim() || null,
    citta: (rowData['Città'] || rowData['citta'] || '').trim() || null,
    cap: (rowData['CAP'] || rowData['cap'] || '').trim() || null,
    provincia: (rowData['Provincia'] || rowData['provincia'] || '').trim() || null,
    referente: (rowData['Referente'] || rowData['referente'] || '').trim() || null,
    telefono_referente: (rowData['Telefono Referente'] || rowData['telefono_referente'] || '').trim() || null,
    telefono: (rowData['Telefono'] || rowData['telefono'] || '').trim() || null,
    email: (rowData['Email'] || rowData['email'] || '').trim() || null,
    note: (rowData['Note'] || rowData['note'] || '').trim() || null,
    tempo_intervento: (rowData['Tempo Intervento'] || rowData['tempo_intervento'] || '').trim() || null,
    fornitore_id: fornitore_id,
    codice_cliente: (rowData['Codice Cliente'] || rowData['codice_cliente'] || '').trim() || null,
    codice_sicep: (rowData['Codice SICEP'] || rowData['codice_sicep'] || '').trim() || null,
    codice_fatturazione: (rowData['Codice Fatturazione'] || rowData['codice_fatturazione'] || '').trim() || null,
    latitude: typeof rowData['Latitudine'] === 'number' ? rowData['Latitudine'] : null,
    longitude: typeof rowData['Longitudine'] === 'number' ? rowData['Longitudine'] : null,
    nome_procedura: (rowData['Nome Procedura'] || rowData['nome_procedura'] || '').trim() || null,
  };
}


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { anagraficaType, data: importData } = await req.json();

    if (!anagraficaType || !importData || !Array.isArray(importData)) {
      console.error('Invalid request: anagraficaType and data array are required.');
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
          console.log('Processing client:', clientToProcess);

          const { data: existingClients, error: fetchError } = await supabaseAdmin
            .from('clienti')
            .select('id')
            .or(`ragione_sociale.eq.${clientToProcess.ragione_sociale},partita_iva.eq.${clientToProcess.partita_iva}`)
            .limit(1);

          if (fetchError) throw fetchError;

          if (existingClients && existingClients.length > 0) {
            const { error: updateError } = await supabaseAdmin
              .from('clienti')
              .update({ ...clientToProcess, updated_at: new Date().toISOString() })
              .eq('id', existingClients[0].id);
            if (updateError) throw updateError;
          } else {
            const { error: insertError } = await supabaseAdmin
              .from('clienti')
              .insert({ ...clientToProcess, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
            if (insertError) throw insertError;
          }
          successCount++;
        } else if (anagraficaType === 'punti_servizio') {
          let puntoServizioToProcess;
          try {
            puntoServizioToProcess = mapPuntoServizioData(row);
            console.log('Processing punto_servizio:', puntoServizioToProcess);
          } catch (mapError: any) {
            throw new Error(`Data mapping error for row ${JSON.stringify(row)}: ${mapError.message}`);
          }

          // Check if punto_servizio already exists by nome_punto_servizio
          const { data: existingPuntiServizio, error: fetchError } = await supabaseAdmin
            .from('punti_servizio')
            .select('id')
            .eq('nome_punto_servizio', puntoServizioToProcess.nome_punto_servizio)
            .limit(1);

          if (fetchError) throw fetchError;

          if (existingPuntiServizio && existingPuntiServizio.length > 0) {
            // Update existing punto_servizio
            const { error: updateError } = await supabaseAdmin
              .from('punti_servizio')
              .update({ ...puntoServizioToProcess, updated_at: new Date().toISOString() })
              .eq('id', existingPuntiServizio[0].id);
            if (updateError) throw updateError;
          } else {
            // Insert new punto_servizio
            const { error: insertError } = await supabaseAdmin
              .from('punti_servizio')
              .insert({ ...puntoServizioToProcess, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
            if (insertError) throw insertError;
          }
          successCount++;
        } else {
          throw new Error(`Import logic not implemented for anagrafica type: ${anagraficaType}`);
        }
      } catch (rowError: any) {
        errorCount++;
        let errorMessage = `Error processing row ${JSON.stringify(row)}: ${rowError.message}`;
        if (rowError.details) errorMessage += ` Details: ${rowError.details}`;
        if (rowError.hint) errorMessage += ` Hint: ${rowError.hint}`;
        if (rowError.code) errorMessage += ` Code: ${rowError.code}`;
        errors.push(errorMessage);
        console.error(`Detailed error for row:`, rowError); // Log the full error object
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
    console.error('Unhandled error in import-data function:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});