// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to get a field value, trying multiple keys and applying a type conversion
const getFieldValue = (rowData: any, keys: string[], typeConverter: (value: any) => any) => {
  for (const key of keys) {
    const value = rowData[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return typeConverter(value);
    }
  }
  return null;
};

// Type converters
const toString = (value: any) => String(value).trim();
const toNumber = (value: any) => {
  const num = Number(value);
  return isNaN(num) ? null : num;
};

// Helper function to clean and map incoming client data to database schema
function mapClientData(rowData: any) {
  const ragione_sociale = getFieldValue(rowData, ['Ragione Sociale', 'ragione_sociale', 'ragioneSociale'], toString);
  if (!ragione_sociale) {
    throw new Error('Ragione Sociale is required and cannot be empty.');
  }

  return {
    ragione_sociale: ragione_sociale,
    codice_fiscale: getFieldValue(rowData, ['Codice Fiscale', 'codice_fiscale', 'codiceFiscale'], toString),
    partita_iva: getFieldValue(rowData, ['Partita IVA', 'partita_iva', 'partitaIva'], toString),
    indirizzo: getFieldValue(rowData, ['Indirizzo', 'indirizzo'], toString),
    citta: getFieldValue(rowData, ['Città', 'citta'], toString),
    cap: getFieldValue(rowData, ['CAP', 'cap'], toString),
    provincia: getFieldValue(rowData, ['Provincia', 'provincia'], toString),
    telefono: getFieldValue(rowData, ['Telefono', 'telefono'], toString),
    email: getFieldValue(rowData, ['Email', 'email'], toString),
    pec: getFieldValue(rowData, ['PEC', 'pec'], toString),
    sdi: getFieldValue(rowData, ['SDI', 'sdi'], toString),
    attivo: getFieldValue(rowData, ['Attivo', 'attivo'], (val: any) => val === 'TRUE' || val === true || val === 1 || val === 'true'),
    note: getFieldValue(rowData, ['Note', 'note'], toString),
  };
}

// Helper function to clean and map incoming service point data to database schema
function mapPuntoServizioData(rowData: any) {
  const nome_punto_servizio = getFieldValue(rowData, ['Nome Punto Servizio', 'nome_punto_servizio', 'nomePuntoServizio'], toString);
  if (!nome_punto_servizio) {
    throw new Error('Nome Punto Servizio is required and cannot be empty.');
  }

  const isValidUuid = (uuid: any) => typeof uuid === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(uuid.trim());

  let id_cliente = getFieldValue(rowData, ['ID Cliente', 'id_cliente', 'idCliente'], toString);
  id_cliente = (id_cliente && isValidUuid(id_cliente)) ? id_cliente : null;

  let fornitore_id = getFieldValue(rowData, ['ID Fornitore', 'fornitore_id', 'fornitoreId'], toString);
  fornitore_id = (fornitore_id && isValidUuid(fornitore_id)) ? fornitore_id : null;

  // Explicitly get latitude and longitude from their expected columns
  let latitude = getFieldValue(rowData, ['Latitudine', 'latitude'], toNumber);
  let longitude = getFieldValue(rowData, ['Longitudine', 'longitude'], toNumber);

  let note = getFieldValue(rowData, ['Note', 'note'], toString);

  // Heuristic to detect and correct shifted coordinates
  if (latitude === null && longitude === null) {
    const potentialShiftedLat = toNumber(rowData['Note'] || rowData['note']);
    const potentialShiftedLon = toNumber(rowData['fornitore_id'] || rowData['fornitoreId']);

    // Check if potential shifted values look like valid coordinates
    if (potentialShiftedLat !== null && potentialShiftedLon !== null && Math.abs(potentialShiftedLat) <= 90 && Math.abs(potentialShiftedLon) <= 180) {
      latitude = potentialShiftedLat;
      longitude = potentialShiftedLon;
      // Clear the fields where the coordinates were mistakenly placed
      note = null;
      fornitore_id = null; // This might overwrite a valid fornitore_id if it was present and not a coordinate
    }
  }

  return {
    nome_punto_servizio: nome_punto_servizio,
    id_cliente: id_cliente,
    indirizzo: getFieldValue(rowData, ['Indirizzo', 'indirizzo'], toString),
    citta: getFieldValue(rowData, ['Città', 'citta'], toString),
    cap: getFieldValue(rowData, ['CAP', 'cap'], toString),
    provincia: getFieldValue(rowData, ['Provincia', 'provincia'], toString),
    referente: getFieldValue(rowData, ['Referente', 'referente'], toString),
    telefono_referente: getFieldValue(rowData, ['Telefono Referente', 'telefono_referente', 'telefonoReferente'], toString),
    telefono: getFieldValue(rowData, ['Telefono', 'telefono'], toString),
    email: getFieldValue(rowData, ['Email', 'email'], toString),
    note: note, // Use the potentially cleared note
    tempo_intervento: getFieldValue(rowData, ['Tempo Intervento', 'tempo_intervento', 'tempoIntervento'], toString),
    fornitore_id: fornitore_id, // Use the potentially cleared fornitore_id
    codice_cliente: getFieldValue(rowData, ['Codice Cliente', 'codice_cliente', 'codiceCliente'], toString),
    codice_sicep: getFieldValue(rowData, ['Codice SICEP', 'codice_sicep', 'codiceSicep'], toString),
    codice_fatturazione: getFieldValue(rowData, ['Codice Fatturazione', 'codice_fatturazione', 'codiceFatturazione'], toString),
    latitude: latitude,
    longitude: longitude,
    nome_procedura: getFieldValue(rowData, ['Nome Procedura', 'nome_procedura', 'nomeProcedura'], toString),
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