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
const toBoolean = (value: any) => {
  if (typeof value === 'boolean') return value;
  const s = String(value).trim().toLowerCase();
  if (s === 'true' || s === '1') return true;
  if (s === 'false' || s === '0') return false;
  return null; // Or undefined, depending on desired strictness
};
const toDateString = (value: any) => {
  if (!value) return null;
  // Attempt to parse various date formats
  try {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    }
  } catch (e) {
    // Fallback for Excel numeric dates (days since 1900)
    if (typeof value === 'number' && value > 1) { // Excel dates are numbers, starting from 1 for Jan 1, 1900
      const excelEpoch = new Date('1899-12-30T00:00:00Z'); // Excel's epoch is Dec 30, 1899
      const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
  }
  return null;
};

const isValidUuid = (uuid: any) => typeof uuid === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(uuid.trim());

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
    attivo: getFieldValue(rowData, ['Attivo', 'attivo', 'Attivo (TRUE/FALSE)'], toBoolean),
    note: getFieldValue(rowData, ['Note', 'note'], toString),
  };
}

// Helper function to clean and map incoming service point data to database schema
function mapPuntoServizioData(rowData: any) {
  const nome_punto_servizio = getFieldValue(rowData, ['Nome Punto Servizio', 'nome_punto_servizio', 'nomePuntoServizio'], toString);
  if (!nome_punto_servizio) {
    throw new Error('Nome Punto Servizio is required and cannot be empty.');
  }

  let id_cliente = getFieldValue(rowData, ['ID Cliente', 'id_cliente', 'idCliente', 'ID Cliente (UUID)'], toString);
  id_cliente = (id_cliente && isValidUuid(id_cliente)) ? id_cliente : null;

  let fornitore_id = getFieldValue(rowData, ['ID Fornitore', 'fornitore_id', 'fornitoreId', 'ID Fornitore (UUID)'], toString);
  fornitore_id = (fornitore_id && isValidUuid(fornitore_id)) ? fornitore_id : null;

  // Explicitly get latitude and longitude from their expected columns
  let latitude = getFieldValue(rowData, ['Latitudine', 'latitude'], toNumber);
  let longitude = getFieldValue(rowData, ['Longitudine', 'longitude'], toNumber);

  let note = getFieldValue(rowData, ['Note', 'note'], toString);

  // Heuristic to detect and correct shifted coordinates if not found in dedicated columns
  if (latitude === null && longitude === null) {
    const potentialShiftedLat = toNumber(rowData['Note'] || rowData['note']);
    const potentialShiftedLon = toNumber(rowData['fornitore_id'] || rowData['fornitoreId']); // Check original parsed keys

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

// Helper function to clean and map incoming supplier data to database schema
function mapFornitoreData(rowData: any) {
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
    tipo_servizio: getFieldValue(rowData, ['Tipo Servizio', 'tipo_servizio', 'tipoServizio'], toString),
    attivo: getFieldValue(rowData, ['Attivo', 'attivo', 'Attivo (TRUE/FALSE)'], toBoolean),
    note: getFieldValue(rowData, ['Note', 'note'], toString),
  };
}

// Helper function to clean and map incoming personale data to database schema
function mapPersonaleData(rowData: any) {
  const nome = getFieldValue(rowData, ['Nome', 'nome'], toString);
  const cognome = getFieldValue(rowData, ['Cognome', 'cognome'], toString);
  if (!nome || !cognome) {
    throw new Error('Nome and Cognome are required and cannot be empty.');
  }

  return {
    nome: nome,
    cognome: cognome,
    codice_fiscale: getFieldValue(rowData, ['Codice Fiscale', 'codice_fiscale', 'codiceFiscale'], toString),
    ruolo: getFieldValue(rowData, ['Ruolo', 'ruolo'], toString),
    telefono: getFieldValue(rowData, ['Telefono', 'telefono'], toString),
    email: getFieldValue(rowData, ['Email', 'email'], toString),
    data_nascita: getFieldValue(rowData, ['Data Nascita', 'data_nascita', 'dataNascita', 'Data Nascita (YYYY-MM-DD)'], toDateString),
    luogo_nascita: getFieldValue(rowData, ['Luogo Nascita', 'luogo_nascita', 'luogoNascita'], toString),
    indirizzo: getFieldValue(rowData, ['Indirizzo', 'indirizzo'], toString),
    cap: getFieldValue(rowData, ['CAP', 'cap'], toString),
    citta: getFieldValue(rowData, ['Città', 'citta'], toString),
    provincia: getFieldValue(rowData, ['Provincia', 'provincia'], toString),
    data_assunzione: getFieldValue(rowData, ['Data Assunzione', 'data_assunzione', 'dataAssunzione', 'Data Assunzione (YYYY-MM-DD)'], toDateString),
    data_cessazione: getFieldValue(rowData, ['Data Cessazione', 'data_cessazione', 'dataCessazione', 'Data Cessazione (YYYY-MM-DD)'], toDateString),
    attivo: getFieldValue(rowData, ['Attivo', 'attivo', 'Attivo (TRUE/FALSE)'], toBoolean),
    note: getFieldValue(rowData, ['Note', 'note'], toString),
  };
}

// Helper function to clean and map incoming network operator data to database schema
function mapOperatoreNetworkData(rowData: any) {
  const nome = getFieldValue(rowData, ['Nome', 'nome'], toString);
  const cognome = getFieldValue(rowData, ['Cognome', 'cognome'], toString);
  if (!nome || !cognome) {
    throw new Error('Nome and Cognome are required and cannot be empty.');
  }

  let cliente_id = getFieldValue(rowData, ['ID Cliente', 'id_cliente', 'idCliente', 'ID Cliente (UUID)'], toString);
  cliente_id = (cliente_id && isValidUuid(cliente_id)) ? cliente_id : null;

  return {
    nome: nome,
    cognome: cognome,
    cliente_id: cliente_id,
    telefono: getFieldValue(rowData, ['Telefono', 'telefono'], toString),
    email: getFieldValue(rowData, ['Email', 'email'], toString),
    note: getFieldValue(rowData, ['Note', 'note'], toString),
  };
}

// Helper function to clean and map incoming procedure data to database schema
function mapProceduraData(rowData: any) {
  const nome_procedura = getFieldValue(rowData, ['Nome Procedura', 'nome_procedura', 'nomeProcedura'], toString);
  if (!nome_procedura) {
    throw new Error('Nome Procedura is required and cannot be empty.');
  }

  return {
    nome_procedura: nome_procedura,
    descrizione: getFieldValue(rowData, ['Descrizione', 'descrizione'], toString),
    versione: getFieldValue(rowData, ['Versione', 'versione'], toString),
    data_ultima_revisione: getFieldValue(rowData, ['Data Ultima Revisione', 'data_ultima_revisione', 'dataUltimaRevisione', 'Data Ultima Revisione (YYYY-MM-DD)'], toDateString),
    responsabile: getFieldValue(rowData, ['Responsabile', 'responsabile'], toString),
    documento_url: getFieldValue(rowData, ['URL Documento', 'documento_url', 'documentoUrl'], toString),
    attivo: getFieldValue(rowData, ['Attivo', 'attivo', 'Attivo (TRUE/FALSE)'], toBoolean),
    note: getFieldValue(rowData, ['Note', 'note'], toString),
  };
}

// Helper function to clean and map incoming tariffa data to database schema
function mapTariffaData(rowData: any) {
  const tipo_servizio = getFieldValue(rowData, ['Tipo Servizio', 'tipo_servizio', 'tipoServizio'], toString);
  const importo = getFieldValue(rowData, ['Importo', 'importo'], toNumber);
  if (!tipo_servizio || importo === null) {
    throw new Error('Tipo Servizio and Importo are required.');
  }

  let client_id = getFieldValue(rowData, ['ID Cliente', 'client_id', 'clientId', 'ID Cliente (UUID)'], toString);
  client_id = (client_id && isValidUuid(client_id)) ? client_id : null;

  let punto_servizio_id = getFieldValue(rowData, ['ID Punto Servizio', 'punto_servizio_id', 'puntoServizioId', 'ID Punto Servizio (UUID)'], toString);
  punto_servizio_id = (punto_servizio_id && isValidUuid(punto_servizio_id)) ? punto_servizio_id : null;

  let fornitore_id = getFieldValue(rowData, ['ID Fornitore', 'fornitore_id', 'fornitoreId', 'ID Fornitore (UUID)'], toString);
  fornitore_id = (fornitore_id && isValidUuid(fornitore_id)) ? fornitore_id : null;

  return {
    client_id: client_id,
    tipo_servizio: tipo_servizio,
    importo: importo,
    supplier_rate: getFieldValue(rowData, ['Costo Fornitore', 'supplier_rate', 'supplierRate'], toNumber),
    unita_misura: getFieldValue(rowData, ['Unità di Misura', 'unita_misura', 'unitaMisura'], toString),
    punto_servizio_id: punto_servizio_id,
    fornitore_id: fornitore_id,
    data_inizio_validita: getFieldValue(rowData, ['Data Inizio Validità', 'data_inizio_validita', 'dataInizioValidita', 'Data Inizio Validità (YYYY-MM-DD)'], toDateString),
    data_fine_validita: getFieldValue(rowData, ['Data Fine Validità', 'data_fine_validita', 'dataFineValidita', 'Data Fine Validità (YYYY-MM-DD)'], toDateString),
    note: getFieldValue(rowData, ['Note', 'note'], toString),
  };
}


serve(async (req) => {
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

    for (const [rowIndex, row] of importData.entries()) {
      let processedData: any = {};
      let rowStatus = 'UNKNOWN';
      let message = '';
      let updatedFields: string[] = [];
      let existingRecordId: string | null = null;

      try {
        // Step 1: Map and validate basic data types and required fields
        if (anagraficaType === 'clienti') {
          processedData = mapClientData(row);
        } else if (anagraficaType === 'punti_servizio') {
          processedData = mapPuntoServizioData(row);
        } else if (anagraficaType === 'fornitori') {
          processedData = mapFornitoreData(row);
        } else if (anagraficaType === 'personale') {
          processedData = mapPersonaleData(row);
        } else if (anagraficaType === 'operatori_network') {
          processedData = mapOperatoreNetworkData(row);
        } else if (anagraficaType === 'procedure') {
          processedData = mapProceduraData(row);
        } else if (anagraficaType === 'tariffe') {
          processedData = mapTariffaData(row);
        } else {
          throw new Error(`Import logic not implemented for anagrafica type: ${anagraficaType}`);
        }

        // Step 2: Check for duplicates and existing records
        let existingRecords: any[] = [];
        if (anagraficaType === 'clienti') {
          const { data, error } = await supabaseAdmin
            .from('clienti')
            .select('id, ragione_sociale, partita_iva, codice_fiscale, indirizzo, citta, cap, provincia, telefono, email, pec, sdi, attivo, note')
            .or(`ragione_sociale.eq.${processedData.ragione_sociale},partita_iva.eq.${processedData.partita_iva}`)
            .limit(1);
          if (error) throw error;
          existingRecords = data;
        } else if (anagraficaType === 'punti_servizio') {
          const { data, error } = await supabaseAdmin
            .from('punti_servizio')
            .select('id, nome_punto_servizio, id_cliente, indirizzo, citta, cap, provincia, referente, telefono_referente, telefono, email, note, tempo_intervento, fornitore_id, codice_cliente, codice_sicep, codice_fatturazione, latitude, longitude, nome_procedura')
            .eq('nome_punto_servizio', processedData.nome_punto_servizio)
            .limit(1);
          if (error) throw error;
          existingRecords = data;
        } else if (anagraficaType === 'fornitori') {
          const { data, error } = await supabaseAdmin
            .from('fornitori')
            .select('id, ragione_sociale, partita_iva, codice_fiscale, indirizzo, cap, citta, provincia, telefono, email, pec, tipo_servizio, attivo, note')
            .or(`ragione_sociale.eq.${processedData.ragione_sociale},partita_iva.eq.${processedData.partita_iva}`)
            .limit(1);
          if (error) throw error;
          existingRecords = data;
        } else if (anagraficaType === 'personale') {
          const { data, error } = await supabaseAdmin
            .from('personale')
            .select('id, nome, cognome, codice_fiscale, ruolo, telefono, email, data_nascita, luogo_nascita, indirizzo, cap, citta, provincia, data_assunzione, data_cessazione, attivo, note')
            .or(`(nome.eq.${processedData.nome},cognome.eq.${processedData.cognome}),codice_fiscale.eq.${processedData.codice_fiscale}`)
            .limit(1);
          if (error) throw error;
          existingRecords = data;
        } else if (anagraficaType === 'operatori_network') {
          const { data, error } = await supabaseAdmin
            .from('operatori_network')
            .select('id, nome, cognome, cliente_id, telefono, email, note')
            .or(`(nome.eq.${processedData.nome},cognome.eq.${processedData.cognome}),email.eq.${processedData.email}`)
            .limit(1);
          if (error) throw error;
          existingRecords = data;
        } else if (anagraficaType === 'procedure') {
          const { data, error } = await supabaseAdmin
            .from('procedure')
            .select('id, nome_procedura, descrizione, versione, data_ultima_revisione, responsabile, documento_url, attivo, note')
            .eq('nome_procedura', processedData.nome_procedura)
            .limit(1);
          if (error) throw error;
          existingRecords = data;
        } else if (anagraficaType === 'tariffe') {
          const { data, error } = await supabaseAdmin
            .from('tariffe')
            .select('id, client_id, tipo_servizio, importo, supplier_rate, unita_misura, punto_servizio_id, fornitore_id, data_inizio_validita, data_fine_validita, note')
            .or(`(client_id.eq.${processedData.client_id},tipo_servizio.eq.${processedData.tipo_servizio},punto_servizio_id.eq.${processedData.punto_servizio_id}),(client_id.eq.${processedData.client_id},tipo_servizio.eq.${processedData.tipo_servizio},fornitore_id.eq.${processedData.fornitore_id})`) // Example: unique by client+service+point OR client+service+supplier
            .limit(1);
          if (error) throw error;
          existingRecords = data;
        }


        if (existingRecords && existingRecords.length > 0) {
          existingRecordId = existingRecords[0].id;
          rowStatus = 'DUPLICATE'; // Default to DUPLICATE, then check for UPDATE
          message = 'Record esistente.';

          // Check for updates
          const existingRecord = existingRecords[0];
          let hasChanges = false;
          for (const key in processedData) {
            if (processedData[key] !== existingRecord[key] && key !== 'created_at' && key !== 'updated_at') {
              hasChanges = true;
              updatedFields.push(key);
            }
          }

          if (hasChanges) {
            rowStatus = 'UPDATE';
            message = `Aggiornerà ${updatedFields.length} campi.`;
          } else {
            message = 'Record esistente, nessun cambiamento rilevato.';
          }
        } else {
          rowStatus = 'NEW';
          message = 'Nuovo record da inserire.';
        }

        // Step 3: Validate Foreign Keys (only for relevant types)
        if (anagraficaType === 'punti_servizio' && processedData.id_cliente) {
          const { data: clientData, error: clientError } = await supabaseAdmin
            .from('clienti')
            .select('id')
            .eq('id', processedData.id_cliente)
            .single();
          if (clientError || !clientData) {
            rowStatus = 'INVALID_FK';
            message = `Errore: ID Cliente '${processedData.id_cliente}' non trovato.`;
            errorCount++;
          }
        }
        if (anagraficaType === 'punti_servizio' && processedData.fornitore_id) {
          const { data: fornitoreData, error: fornitoreError } = await supabaseAdmin
            .from('fornitori')
            .select('id')
            .eq('id', processedData.fornitore_id)
            .single();
          if (fornitoreError || !fornitoreData) {
            rowStatus = 'INVALID_FK';
            message = `Errore: ID Fornitore '${processedData.fornitore_id}' non trovato.`;
            errorCount++;
          }
        }
        if (anagraficaType === 'operatori_network' && processedData.cliente_id) {
          const { data: clientData, error: clientError } = await supabaseAdmin
            .from('clienti')
            .select('id')
            .eq('id', processedData.cliente_id)
            .single();
          if (clientError || !clientData) {
            rowStatus = 'INVALID_FK';
            message = `Errore: ID Cliente '${processedData.cliente_id}' non trovato.`;
            errorCount++;
          }
        }
        if (anagraficaType === 'tariffe' && processedData.client_id) {
          const { data: clientData, error: clientError } = await supabaseAdmin
            .from('clienti')
            .select('id')
            .eq('id', processedData.client_id)
            .single();
          if (clientError || !clientData) {
            rowStatus = 'INVALID_FK';
            message = `Errore: ID Cliente '${processedData.client_id}' non trovato.`;
            errorCount++;
          }
        }
        if (anagraficaType === 'tariffe' && processedData.punto_servizio_id) {
          const { data: puntoServizioData, error: puntoServizioError } = await supabaseAdmin
            .from('punti_servizio')
            .select('id')
            .eq('id', processedData.punto_servizio_id)
            .single();
          if (puntoServizioError || !puntoServizioData) {
            rowStatus = 'INVALID_FK';
            message = `Errore: ID Punto Servizio '${processedData.punto_servizio_id}' non trovato.`;
            errorCount++;
          }
        }
        if (anagraficaType === 'tariffe' && processedData.fornitore_id) {
          const { data: fornitoreData, error: fornitoreError } = await supabaseAdmin
            .from('fornitori')
            .select('id')
            .eq('id', processedData.fornitore_id)
            .single();
          if (fornitoreError || !fornitoreData) {
            rowStatus = 'INVALID_FK';
            message = `Errore: ID Fornitore '${processedData.fornitore_id}' non trovato.`;
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
        processedData: processedData, // Include processed data for potential debugging
        status: rowStatus,
        message: message,
        updatedFields: updatedFields,
        id: existingRecordId,
      });
    } // End of preview loop

    if (mode === 'preview') {
      return new Response(JSON.stringify({ report }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // --- Actual Import Logic (mode === 'import') ---
    console.log("Starting actual import process...");
    successCount = 0;
    updateCount = 0;
    errorCount = 0;
    duplicateCount = 0; // Reset counts for actual import

    for (const rowReport of report) {
      if (rowReport.status === 'ERROR' || rowReport.status === 'INVALID_FK') {
        errorCount++;
        errors.push(`Riga con errore non importata: ${rowReport.message}`);
        continue; // Skip rows with critical errors
      }
      if (rowReport.status === 'DUPLICATE' && rowReport.updatedFields.length === 0) {
        duplicateCount++;
        errors.push(`Riga duplicata e senza modifiche, saltata: ${rowReport.message}`);
        continue; // Skip duplicates with no changes
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
        } else if (rowReport.status === 'UPDATE') {
          const { error: updateError } = await supabaseAdmin
            .from(anagraficaType)
            .update({ ...dataToSave, updated_at: now })
            .eq('id', rowReport.id);
          if (updateError) throw updateError;
          updateCount++;
        } else if (rowReport.status === 'DUPLICATE' && rowReport.updatedFields.length > 0) {
          // This case should ideally be covered by 'UPDATE' status, but as a fallback
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

    if (errorCount > 0 || duplicateCount > 0) {
      return new Response(JSON.stringify({
        message: `Importazione completata con ${successCount} nuovi record, ${updateCount} aggiornamenti, ${duplicateCount} duplicati saltati e ${errorCount} errori.`,
        successCount,
        updateCount,
        duplicateCount,
        errorCount,
        errors,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 207, // Multi-Status
      });
    }

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
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});