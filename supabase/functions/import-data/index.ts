// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to clean and map incoming client data to database schema
function mapClientData(rowData: any) {
  const ragione_sociale = rowData['Ragione Sociale'] || rowData['ragione_sociale'] || rowData['ragioneSociale'];
  if (!ragione_sociale || typeof ragione_sociale !== 'string' || ragione_sociale.trim() === '') {
    throw new Error('Ragione Sociale is required and cannot be empty.');
  }

  return {
    ragione_sociale: ragione_sociale.trim(),
    codice_fiscale: (rowData['Codice Fiscale'] || rowData['codice_fiscale'] || rowData['codiceFiscale'])?.trim() || null,
    partita_iva: (rowData['Partita IVA'] || rowData['partita_iva'] || rowData['partitaIva'])?.trim() || null,
    indirizzo: (rowData['Indirizzo'] || rowData['indirizzo'] || rowData['indirizzo'])?.trim() || null,
    citta: (rowData['Città'] || rowData['citta'] || rowData['citta'])?.trim() || null,
    cap: (rowData['CAP'] || rowData['cap'] || rowData['cap'])?.trim() || null,
    provincia: (rowData['Provincia'] || rowData['provincia'] || rowData['provincia'])?.trim() || null,
    telefono: (rowData['Telefono'] || rowData['telefono'] || rowData['telefono'])?.trim() || null,
    email: (rowData['Email'] || rowData['email'] || rowData['email'])?.trim() || null,
    pec: (rowData['PEC'] || rowData['pec'] || rowData['pec'])?.trim() || null,
    sdi: (rowData['SDI'] || rowData['sdi'] || rowData['sdi'])?.trim() || null,
    attivo: rowData['Attivo'] === 'TRUE' || rowData['attivo'] === true || rowData['Attivo'] === 1 || rowData['attivo'] === 'true', // Handle boolean conversion
    note: (rowData['Note'] || rowData['note'] || rowData['note'])?.trim() || null,
  };
}

// Helper function to clean and map incoming service point data to database schema
function mapPuntoServizioData(rowData: any) {
  const nome_punto_servizio = rowData['Nome Punto Servizio'] || rowData['nome_punto_servizio'] || rowData['nomePuntoServizio'];
  if (!nome_punto_servizio || typeof nome_punto_servizio !== 'string' || nome_punto_servizio.trim() === '') {
    throw new Error('Nome Punto Servizio is required and cannot be empty.');
  }

  const isValidUuid = (uuid: any) => typeof uuid === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(uuid.trim());

  const id_cliente_raw = rowData['ID Cliente'] || rowData['id_cliente'] || rowData['idCliente'];
  const fornitore_id_raw = rowData['ID Fornitore'] || rowData['fornitore_id'] || rowData['fornitoreId'];

  const id_cliente = (id_cliente_raw && typeof id_cliente_raw === 'string' && isValidUuid(id_cliente_raw.trim())) ? id_cliente_raw.trim() : null;
  const fornitore_id = (fornitore_id_raw && typeof fornitore_id_raw === 'string' && isValidUuid(fornitore_id_raw.trim())) ? fornitore_id_raw.trim() : null;

  return {
    nome_punto_servizio: nome_punto_servizio.trim(),
    id_cliente: id_cliente,
    indirizzo: (rowData['Indirizzo'] || rowData['indirizzo'] || rowData['indirizzo'])?.trim() || null,
    citta: (rowData['Città'] || rowData['citta'] || rowData['citta'])?.trim() || null,
    cap: (rowData['CAP'] || rowData['cap'] || rowData['cap'])?.trim() || null,
    provincia: (rowData['Provincia'] || rowData['provincia'] || rowData['provincia'])?.trim() || null,
    referente: (rowData['Referente'] || rowData['referente'] || rowData['referente'])?.trim() || null,
    telefono_referente: (rowData['Telefono Referente'] || rowData['telefono_referente'] || rowData['telefonoReferente'])?.trim() || null,
    telefono: (rowData['Telefono'] || rowData['telefono'] || rowData['telefono'])?.trim() || null,
    email: (rowData['Email'] || rowData['email'] || rowData['email'])?.trim() || null,
    note: (rowData['Note'] || rowData['note'] || rowData['note'])?.trim() || null,
    tempo_intervento: (rowData['Tempo Intervento'] || rowData['tempo_intervento'] || rowData['tempoIntervento'])?.trim() || null,
    fornitore_id: fornitore_id,
    codice_cliente: (rowData['Codice Cliente'] || rowData['codice_cliente'] || rowData['codiceCliente'])?.trim() || null,
    codice_sicep: (rowData['Codice SICEP'] || rowData['codice_sicep'] || rowData['codiceSicep'])?.trim() || null,
    codice_fatturazione: (rowData['Codice Fatturazione'] || rowData['codice_fatturazione'] || rowData['codiceFatturazione'])?.trim() || null,
    latitude: typeof rowData['Latitudine'] === 'number' ? rowData['Latitudine'] : (typeof rowData['latitude'] === 'number' ? rowData['latitude'] : null),
    longitude: typeof rowData['Longitudine'] === 'number' ? rowData['Longitudine'] : (typeof rowData['longitude'] === 'number' ? rowData['longitude'] : null),
    nome_procedura: (rowData['Nome Procedura'] || rowData['nome_procedura'] || rowData['nomeProcedura'])?.trim() || null,
  };
}


serve(async (req) => {
  console.log("import-data function invoked.");

  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request for import-data.");
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

    console.log(`Starting import for anagraficaType: ${anagraficaType} with ${importData.length} rows.`);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    try {
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
          console.error(`Detailed error for row:`, rowError);
        }
      }
    } catch (overallError: any) {
      errorCount = importData.length;
      const errorMessage = `Overall import process failed: ${overallError.message}`;
      errors.push(errorMessage);
      console.error(`Overall import error:`, overallError);
    }


    if (errorCount > 0) {
      return new Response(JSON.stringify({
        message: `Import completed with ${successCount} successes and ${errorCount} errors.`,
        errors,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 207,
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