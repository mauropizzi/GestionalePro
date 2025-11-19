// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.0';

// Import utility functions
import { getFieldValue, toString, toNumber, toBoolean, toDateString, isValidUuid } from './utils.ts';
// Import configuration
import { UNIQUE_KEYS_CONFIG, FOREIGN_KEYS_CONFIG } from './config.ts';
// Import database operations
import { fetchReferenceData, checkExistingRecord, validateForeignKeys } from './db-operations.ts';
// Import mappers
import {
  mapClientData,
  mapFornitoreData,
  mapOperatoreNetworkData,
  mapPersonaleData,
  mapProceduraData,
  mapPuntoServizioData,
  mapRubricaClientiData,
  mapRubricaFornitoriData,
  mapRubricaPuntiServizioData,
  mapTariffaData,
} from './mappers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const dataMappers: { [key: string]: (rowData: any, supabaseAdmin: any) => Promise<any> | any } = {
  clienti: mapClientData,
  punti_servizio: mapPuntoServizioData,
  fornitori: mapFornitoreData,
  personale: mapPersonaleData,
  operatori_network: mapOperatoreNetworkData,
  procedure: mapProceduraData,
  tariffe: mapTariffaData,
  rubrica_punti_servizio: mapRubricaPuntiServizioData,
  rubrica_clienti: mapRubricaClientiData,
  rubrica_fornitori: mapRubricaFornitoriData,
};

serve(async (req: Request) => {
  console.log("import-data function invoked.");

  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request for import-data.");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { anagraficaType, data: importData, mode } = await req.json();

    if (!anagraficaType || !importData || !Array.isArray(importData) || !mode) {
      console.error('Invalid request: anagraficaType, data array, and mode are required.');
      return new Response(JSON.stringify({ error: 'Invalid request: anagraficaType, data array, and mode are required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log(`Starting ${mode} for anagraficaType: ${anagraficaType} with ${importData.length} rows.`);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let successCount = 0;
    let updateCount = 0;
    let errorCount = 0;
    let duplicateCount = 0;
    const errors: string[] = [];
    const report: any[] = [];

    const mapper = dataMappers[anagraficaType];
    if (!mapper) {
      throw new Error(`Import logic not implemented for anagrafica type: ${anagraficaType}`);
    }

    // Fetch reference data once at the beginning for both preview and import modes
    console.log("Fetching reference data...");
    const referenceData = await fetchReferenceData(supabaseAdmin, anagraficaType);
    console.log("Reference data fetched.");

    // Fase di anteprima/validazione
    for (const [rowIndex, row] of importData.entries()) {
      let processedData: any = {};
      let rowStatus = 'UNKNOWN';
      let message: string | null = '';
      let updatedFields: string[] = [];
      let existingRecordId: string | null = null;

      try {
        // Pass supabaseAdmin to mappers that need it for lookups (e.g., punto_servizio)
        processedData = await mapper(row, supabaseAdmin);

        // Pass the fetched referenceData to checkExistingRecord and validateForeignKeys
        const { status, message: checkMessage, updatedFields: fields, id } = await checkExistingRecord(supabaseAdmin, anagraficaType, processedData, referenceData);
        rowStatus = status;
        message = checkMessage;
        updatedFields = fields;
        existingRecordId = id;

        if (rowStatus !== 'ERROR' && rowStatus !== 'INVALID_FK') {
          const { isValid, message: fkMessage } = await validateForeignKeys(supabaseAdmin, anagraficaType, processedData, referenceData);
          if (!isValid) {
            rowStatus = 'INVALID_FK';
            message = fkMessage;
            errorCount++;
          }
        }

      } catch (rowError: any) {
        rowStatus = 'ERROR';
        message = `Errore di validazione: ${rowError.message}`;
        errorCount++;
        console.error(`Detailed error for row ${rowIndex}:`, rowError);
      }

      report.push({
        originalRow: row,
        processedData: processedData,
        status: rowStatus,
        message: message,
        updatedFields: updatedFields,
        id: existingRecordId,
      });
    }

    if (mode === 'preview') {
      return new Response(JSON.stringify({ report }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Fase di importazione effettiva (se mode è 'import')
    console.log("Starting actual import process...");
    successCount = 0;
    updateCount = 0;
    errorCount = 0;
    duplicateCount = 0; // Reset counts for actual import

    const importPromise = (async () => {
      for (const rowReport of report) {
        if (rowReport.status === 'ERROR' || rowReport.status === 'INVALID_FK') {
          errorCount++;
          errors.push(`Riga con errore non importata: ${rowReport.message}`);
          continue;
        }
        if (rowReport.status === 'DUPLICATE' && rowReport.updatedFields.length === 0) {
          duplicateCount++;
          errors.push(`Riga duplicata e senza modifiche, saltata: ${rowReport.message}`);
          continue;
        }

        const dataToSave = { ...rowReport.processedData };
        const now = new Date().toISOString();

        try {
          if (rowReport.status === 'NEW') {
            const { error: insertError } = await supabaseAdmin
              .from(anagraficaType)
              .insert({ ...dataToSave, created_at: now, updated_at: now });
            if (insertError) throw insertError;
            successCount++;
          } else if (rowReport.status === 'UPDATE' || (rowReport.status === 'DUPLICATE' && rowReport.updatedFields.length > 0)) {
            const { error: updateError } = await supabaseAdmin
              .from(anagraficaType)
              .update({ ...dataToSave, updated_at: now })
              .eq('id', rowReport.id);
            if (updateError) throw updateError;
            updateCount++;
          }
        } catch (dbError: any) {
          errorCount++;
          errors.push(`Errore DB per riga ${JSON.stringify(rowReport.originalRow)}: ${dbError.message}`);
          console.error(`DB error during import for row:`, dbError);
        }
      }
    })();

    req.waitUntil(importPromise);

    if (errorCount > 0 || duplicateCount > 0) {
      return new Response(JSON.stringify({
        message: `Importazione avviata. ${successCount} nuovi record, ${updateCount} aggiornamenti, ${duplicateCount} duplicati saltati e ${errorCount} errori. Controlla i log per i dettagli.`,
        successCount,
        updateCount,
        duplicateCount,
        errorCount,
        errors,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 202,
      });
    }

    return new Response(JSON.stringify({
      message: `Importazione avviata con successo. ${successCount} nuovi record e ${updateCount} aggiornamenti.`,
      successCount,
      updateCount,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 202,
    });

  } catch (error) {
    console.error('Unhandled error in import-data function:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});