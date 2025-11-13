// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.0';

// Import utility functions
import { checkExistingRecord, validateForeignKeys } from './utils/db-operations';

// Import mappers
import { mapClientData } from './mappers/client-mapper';
import { mapFornitoreData } from './mappers/fornitore-mapper';
import { mapOperatoreNetworkData } from './mappers/operatore-network-mapper';
import { mapPersonaleData } from './mappers/personale-mapper';
import { mapProceduraData } from './mappers/procedura-mapper';
import { mapPuntoServizioData } from './mappers/punto-servizio-mapper';
import { mapRubricaClientiData } from './mappers/rubrica-clienti-mapper';
import { mapRubricaFornitoriData } from './mappers/rubrica-fornitori-mapper';
import { mapRubricaPuntiServizioData } from './mappers/rubrica-punti-servizio-mapper';
import { mapTariffaData } from './mappers/tariffa-mapper';

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

// Define a batch size for concurrent operations
const BATCH_SIZE = 50; // You can adjust this value based on your needs and Supabase limits

serve(async (req: Request) => {
  console.log("import-data function invoked.");
  console.time("import-data-total");

  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request for import-data.");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.time("parse-request-body");
    const { anagraficaType, data: importData, mode } = await req.json();
    console.timeEnd("parse-request-body");
    console.log(`Starting ${mode} for anagraficaType: ${anagraficaType} with ${importData.length} rows.`);

    console.time("create-supabase-client");
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.timeEnd("create-supabase-client");

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

    // Fase di anteprima/validazione
    console.time("preview-validation-loop");
    const previewTasks = importData.map(async (row: any, rowIndex: number) => {
      let processedData: any = {};
      let rowStatus = 'UNKNOWN';
      let message: string | null = '';
      let updatedFields: string[] = [];
      let existingRecordId: string | null = null;

      try {
        processedData = await mapper(row, supabaseAdmin);

        const { status, message: checkMessage, updatedFields: fields, id } = await checkExistingRecord(supabaseAdmin, anagraficaType, processedData);
        rowStatus = status;
        message = checkMessage;
        updatedFields = fields;
        existingRecordId = id;

        if (rowStatus !== 'ERROR' && rowStatus !== 'INVALID_FK') {
          const { isValid, message: fkMessage } = await validateForeignKeys(supabaseAdmin, anagraficaType, processedData);
          if (!isValid) {
            rowStatus = 'INVALID_FK';
            message = fkMessage;
          }
        }

      } catch (rowError: any) {
        rowStatus = 'ERROR';
        message = `Errore di validazione: ${rowError.message}`;
        console.error(`Detailed error for row ${rowIndex}:`, rowError);
      }

      return {
        originalRow: row,
        processedData: processedData,
        status: rowStatus,
        message: message,
        updatedFields: updatedFields,
        id: existingRecordId,
      };
    });

    // Execute preview tasks in batches
    for (let i = 0; i < previewTasks.length; i += BATCH_SIZE) {
      const batch = previewTasks.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.allSettled(batch);
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          report.push(result.value);
          if (result.value.status === 'ERROR' || result.value.status === 'INVALID_FK') {
            errorCount++;
          }
        } else {
          // Handle rejected promises (should ideally not happen if try/catch is robust inside map)
          report.push({
            originalRow: {}, // Placeholder
            processedData: {}, // Placeholder
            status: 'ERROR',
            message: `Unhandled error during preview: ${result.reason?.message || 'Unknown error'}`,
            updatedFields: [],
            id: null,
          });
          errorCount++;
          console.error("Unhandled promise rejection in preview batch:", result.reason);
        }
      });
    }
    console.timeEnd("preview-validation-loop");

    if (mode === 'preview') {
      console.log("Returning preview response.");
      console.timeEnd("import-data-total");
      return new Response(JSON.stringify({ report }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Fase di importazione effettiva (se mode è 'import')
    console.log("Starting actual import process...");
    console.time("actual-import-loop");
    successCount = 0;
    updateCount = 0;
    errorCount = 0;
    duplicateCount = 0; // Reset counts for actual import

    const importTasks = report.map(async (rowReport) => {
      if (rowReport.status === 'ERROR' || rowReport.status === 'INVALID_FK') {
        errors.push(`Riga con errore non importata: ${rowReport.message}`);
        return { status: 'error' };
      }
      if (rowReport.status === 'DUPLICATE' && rowReport.updatedFields.length === 0) {
        errors.push(`Riga duplicata e senza modifiche, saltata: ${rowReport.message}`);
        return { status: 'duplicate' };
      }

      const dataToSave = { ...rowReport.processedData };
      const now = new Date().toISOString();

      try {
        if (rowReport.status === 'NEW') {
          const { error: insertError } = await supabaseAdmin
            .from(anagraficaType)
            .insert({ ...dataToSave, created_at: now, updated_at: now });
          if (insertError) throw insertError;
          return { status: 'new' };
        } else if (rowReport.status === 'UPDATE' || (rowReport.status === 'DUPLICATE' && rowReport.updatedFields.length > 0)) {
          const { error: updateError } = await supabaseAdmin
            .from(anagraficaType)
            .update({ ...dataToSave, updated_at: now })
            .eq('id', rowReport.id);
          if (updateError) throw updateError;
          return { status: 'update' };
        }
      } catch (dbError: any) {
        errors.push(`Errore DB per riga ${JSON.stringify(rowReport.originalRow)}: ${dbError.message}`);
        console.error(`DB error during import for row:`, dbError);
        return { status: 'error' };
      }
      return { status: 'unknown' }; // Should not be reached
    });

    // Execute import tasks in batches
    for (let i = 0; i < importTasks.length; i += BATCH_SIZE) {
      const batch = importTasks.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.allSettled(batch);
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          if (result.value.status === 'new') successCount++;
          else if (result.value.status === 'update') updateCount++;
          else if (result.value.status === 'duplicate') duplicateCount++;
          else if (result.value.status === 'error') errorCount++;
        } else {
          errorCount++;
          errors.push(`Unhandled promise rejection during import: ${result.reason?.message || 'Unknown error'}`);
          console.error("Unhandled promise rejection in import batch:", result.reason);
        }
      });
    }
    console.timeEnd("actual-import-loop");

    if (errorCount > 0 || duplicateCount > 0) {
      console.log("Returning partial content response.");
      console.timeEnd("import-data-total");
      return new Response(JSON.stringify({
        message: `Importazione completata con ${successCount} nuovi record, ${updateCount} aggiornamenti, ${duplicateCount} duplicati saltati e ${errorCount} errori.`,
        successCount,
        updateCount,
        duplicateCount,
        errorCount,
        errors,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 207, // Partial Content
      });
    }

    console.log("Returning full success response.");
    console.timeEnd("import-data-total");
    return new Response(JSON.stringify({
      message: `Importazione completata con successo. ${successCount} nuovi record e ${updateCount} aggiornamenti.`,
      successCount,
      updateCount,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Unhandled error in import-data function:', error);
    console.timeEnd("import-data-total");
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});