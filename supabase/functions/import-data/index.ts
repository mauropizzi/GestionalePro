// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.0';
import { fetchReferenceData, checkExistingRecord, validateForeignKeys } from './utils/db-ops.ts';
import { mapClientData } from './utils/mappers/client-mapper.ts';
import { mapFornitoreData } from './utils/mappers/fornitore-mapper.ts';
import { mapOperatoreNetworkData } from './utils/mappers/operatore-network-mapper.ts';
import { mapPersonaleData } from './utils/mappers/personale-mapper.ts';
import { mapProceduraData } from './utils/mappers/procedura-mapper.ts';
import { mapPuntoServizioData } from './utils/mappers/punto-servizio-mapper.ts';
import { mapRubricaClientiData } from './utils/mappers/rubrica-clienti-mapper.ts';
import { mapRubricaFornitoriData } from './utils/mappers/rubrica-fornitori-mapper.ts';
import { mapRubricaPuntiServizioData } from './utils/mappers/rubrica-punti-servizio-mapper.ts';
import { mapTariffaData } from './utils/mappers/tariffa-mapper.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const dataMappers: { [key: string]: (rowData: any, supabaseAdmin: any) => Promise<any> | any } = {
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
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { anagraficaType, data: importData, mode } = await req.json();

    if (!anagraficaType || !importData || !Array.isArray(importData) || !mode) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const mapper = dataMappers[anagraficaType];
    if (!mapper) throw new Error(`Import logic not implemented for: ${anagraficaType}`);

    const referenceData = await fetchReferenceData(supabaseAdmin, anagraficaType);
    const report: any[] = [];
    let errorCount = 0;

    for (const [rowIndex, row] of importData.entries()) {
      let processedData: any = {};
      let rowStatus = 'UNKNOWN';
      let message: string | null = '';
      let updatedFields: string[] = [];
      let existingRecordId: string | null = null;

      try {
        processedData = await mapper(row, supabaseAdmin);
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
        message = `Errore: ${rowError.message}`;
        errorCount++;
      }

      report.push({ originalRow: row, processedData, status: rowStatus, message, updatedFields, id: existingRecordId });
    }

    if (mode === 'preview') {
      return new Response(JSON.stringify({ report }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    // Import logic
    let successCount = 0;
    let updateCount = 0;
    let duplicateCount = 0;
    const errors: string[] = [];

    for (const [rowIndex, rowReport] of report.entries()) {
      if (rowReport.status === 'ERROR' || rowReport.status === 'INVALID_FK') {
        errorCount++;
        errors.push(`Riga ${rowIndex + 1}: ${rowReport.message}`);
        continue;
      }
      if (rowReport.status === 'DUPLICATE' && rowReport.updatedFields.length === 0) {
        duplicateCount++;
        continue;
      }

      const dataToSave = { ...rowReport.processedData };
      const now = new Date().toISOString();

      try {
        if (rowReport.status === 'NEW') {
          const { error: insertError } = await supabaseAdmin.from(anagraficaType).insert({ ...dataToSave, created_at: now, updated_at: now });
          if (insertError) throw insertError;
          successCount++;
        } else if (rowReport.status === 'UPDATE' || (rowReport.status === 'DUPLICATE' && rowReport.updatedFields.length > 0)) {
          const { error: updateError } = await supabaseAdmin.from(anagraficaType).update({ ...dataToSave, updated_at: now }).eq('id', rowReport.id);
          if (updateError) throw updateError;
          updateCount++;
        }
      } catch (dbError: any) {
        errorCount++;
        errors.push(`Errore DB riga ${rowIndex + 1}: ${dbError.message}`);
      }
    }

    return new Response(JSON.stringify({
      message: `Importazione completata. ${successCount} nuovi, ${updateCount} aggiornati, ${duplicateCount} saltati, ${errorCount} errori.`,
      successCount, updateCount, duplicateCount, errorCount, errors
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});