// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Utils: data-mapping.ts content ---
const getFieldValue = (rowData: any, keys: string[], typeConverter: (value: any) => any) => {
  for (const key of keys) {
    const value = rowData[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return typeConverter(value);
    }
  }
  return null;
};

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
  return null;
};
const toDateString = (value: any) => {
  if (!value) return null;
  try {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    }
  } catch (e) {
    if (typeof value === 'number' && value > 1) {
      const excelEpoch = new Date('1899-12-30T00:00:00Z');
      const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
  }
  return null;
};

const isValidUuid = (uuid: any) => typeof uuid === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(uuid.trim());

// --- Mappers: client-mapper.ts content ---
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

// --- Mappers: punto-servizio-mapper.ts content ---
// Updated to accept supabaseAdmin for lookups
async function mapPuntoServizioData(rowData: any, supabaseAdmin: any) {
  const nome_punto_servizio = getFieldValue(rowData, ['Nome Punto Servizio', 'nome_punto_servizio', 'nomePuntoServizio'], toString);
  if (!nome_punto_servizio) {
    throw new Error('Nome Punto Servizio is required and cannot be empty.');
  }

  let id_cliente = getFieldValue(rowData, ['ID Cliente', 'id_cliente', 'idCliente', 'ID Cliente (UUID)'], toString);
  if (id_cliente && !isValidUuid(id_cliente)) {
    id_cliente = null; // Invalida l'UUID se non è corretto
  }

  // Se l'ID cliente non è un UUID valido, prova a cercarlo tramite codice manuale
  if (!id_cliente) {
    const codice_cliente_custom = getFieldValue(rowData, ['Codice Cliente Manuale', 'codice_cliente_custom', 'codiceClienteCustom'], toString);
    if (codice_cliente_custom) {
      const { data: clientData, error: clientError } = await supabaseAdmin
        .from('clienti')
        .select('id')
        .eq('codice_cliente_custom', codice_cliente_custom)
        .single();
      if (clientError || !clientData) {
        throw new Error(`Cliente con Codice Cliente Manuale '${codice_cliente_custom}' non trovato.`);
      }
      id_cliente = clientData.id;
    }
  }

  let fornitore_id = getFieldValue(rowData, ['ID Fornitore', 'fornitore_id', 'fornitoreId', 'ID Fornitore (UUID)'], toString);
  if (fornitore_id && !isValidUuid(fornitore_id)) {
    fornitore_id = null; // Invalida l'UUID se non è corretto
  }

  // Se l'ID fornitore non è un UUID valido, prova a cercarlo tramite codice manuale
  if (!fornitore_id) {
    const codice_fornitore_manuale = getFieldValue(rowData, ['Codice Fornitore Manuale', 'codice_cliente_associato', 'codiceClienteAssociato'], toString);
    if (codice_fornitore_manuale) {
      const { data: fornitoreData, error: fornitoreError } = await supabaseAdmin
        .from('fornitori')
        .select('id')
        .eq('codice_cliente_associato', codice_fornitore_manuale)
        .single();
      if (fornitoreError || !fornitoreData) {
        throw new Error(`Fornitore con Codice Fornitore Manuale '${codice_fornitore_manuale}' non trovato.`);
      }
      fornitore_id = fornitoreData.id;
    }
  }

  let latitude = getFieldValue(rowData, ['Latitudine', 'latitude'], toNumber);
  let longitude = getFieldValue(rowData, ['Longitudine', 'longitude'], toNumber);

  let note = getFieldValue(rowData, ['Note', 'note'], toString);

  if (latitude === null && longitude === null) {
    const potentialShiftedLat = toNumber(rowData['Note'] || rowData['note']);
    const potentialShiftedLon = toNumber(rowData['fornitore_id'] || rowData['fornitoreId']);

    if (potentialShiftedLat !== null && potentialShiftedLon !== null && Math.abs(potentialShiftedLat) <= 90 && Math.abs(potentialShiftedLon) <= 180) {
      latitude = potentialShiftedLat;
      longitude = potentialShiftedLon;
      note = null;
      // fornitore_id = null; // This line might need review if fornitore_id was already resolved
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
    note: note,
    tempo_intervento: getFieldValue(rowData, ['Tempo Intervento', 'tempo_intervento', 'tempoIntervento'], toString),
    fornitore_id: fornitore_id,
    codice_cliente: getFieldValue(rowData, ['Codice Cliente', 'codice_cliente', 'codiceCliente'], toString),
    codice_sicep: getFieldValue(rowData, ['Codice SICEP', 'codice_sicep', 'codiceSicep'], toString),
    codice_fatturazione: getFieldValue(rowData, ['Codice Fatturazione', 'codice_fatturazione', 'codiceFatturazione'], toString),
    latitude: latitude,
    longitude: longitude,
    nome_procedura: getFieldValue(rowData, ['Nome Procedura', 'nome_procedura', 'nomeProcedura'], toString),
  };
}

// --- Mappers: fornitore-mapper.ts content ---
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

// --- Mappers: personale-mapper.ts content ---
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

// --- Mappers: operatore-network-mapper.ts content ---
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

// --- Mappers: procedura-mapper.ts content ---
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

// --- Mappers: tariffa-mapper.ts content ---
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

// --- Mappers: rubrica-punti-servizio-mapper.ts content ---
function mapRubricaPuntiServizioData(rowData: any) {
  const tipo_recapito = getFieldValue(rowData, ['Tipo Recapito', 'tipo_recapito', 'tipoRecapito'], toString);
  if (!tipo_recapito) {
    throw new Error('Tipo Recapito is required and cannot be empty.');
  }

  let punto_servizio_id = getFieldValue(rowData, ['ID Punto Servizio', 'punto_servizio_id', 'puntoServizioId', 'ID Punto Servizio (UUID)'], toString);
  punto_servizio_id = (punto_servizio_id && isValidUuid(punto_servizio_id)) ? punto_servizio_id : null;
  if (!punto_servizio_id) {
    throw new Error('ID Punto Servizio is required and must be a valid UUID.');
  }

  return {
    punto_servizio_id: punto_servizio_id,
    tipo_recapito: tipo_recapito,
    nome_persona: getFieldValue(rowData, ['Nome Persona', 'nome_persona', 'nomePersona'], toString),
    telefono_fisso: getFieldValue(rowData, ['Telefono Fisso', 'telefono_fisso', 'telefonoFisso'], toString),
    telefono_cellulare: getFieldValue(rowData, ['Telefono Cellulare', 'telefono_cellulare', 'telefonoCellulare'], toString),
    email_recapito: getFieldValue(rowData, ['Email Recapito', 'email_recapito', 'emailRecapito'], toString),
    note: getFieldValue(rowData, ['Note', 'note'], toString),
  };
}

// --- Mappers: rubrica-clienti-mapper.ts content ---
function mapRubricaClientiData(rowData: any) {
  const tipo_recapito = getFieldValue(rowData, ['Tipo Recapito', 'tipo_recapito', 'tipoRecapito'], toString);
  if (!tipo_recapito) {
    throw new Error('Tipo Recapito is required and cannot be empty.');
  }

  let client_id = getFieldValue(rowData, ['ID Cliente', 'client_id', 'clientId', 'ID Cliente (UUID)'], toString);
  client_id = (client_id && isValidUuid(client_id)) ? client_id : null;
  if (!client_id) {
    throw new Error('ID Cliente is required and must be a valid UUID.');
  }

  return {
    client_id: client_id,
    tipo_recapito: tipo_recapito,
    nome_persona: getFieldValue(rowData, ['Nome Persona', 'nome_persona', 'nomePersona'], toString),
    telefono_fisso: getFieldValue(rowData, ['Telefono Fisso', 'telefono_fisso', 'telefonoFisso'], toString),
    telefono_cellulare: getFieldValue(rowData, ['Telefono Cellulare', 'telefono_cellulare', 'telefonoCellulare'], toString),
    email_recapito: getFieldValue(rowData, ['Email Recapito', 'email_recapito', 'emailRecapito'], toString),
    note: getFieldValue(rowData, ['Note', 'note'], toString),
  };
}

// --- Mappers: rubrica-fornitori-mapper.ts content ---
function mapRubricaFornitoriData(rowData: any) {
  const tipo_recapito = getFieldValue(rowData, ['Tipo Recapito', 'tipo_recapito', 'tipoRecapito'], toString);
  if (!tipo_recapito) {
    throw new Error('Tipo Recapito is required and cannot be empty.');
  }

  let fornitore_id = getFieldValue(rowData, ['ID Fornitore', 'fornitore_id', 'fornitoreId', 'ID Fornitore (UUID)'], toString);
  fornitore_id = (fornitore_id && isValidUuid(fornitore_id)) ? fornitore_id : null;
  if (!fornitore_id) {
    throw new Error('ID Fornitore is required and must be a valid UUID.');
  }

  return {
    fornitore_id: fornitore_id,
    tipo_recapito: tipo_recapito,
    nome_persona: getFieldValue(rowData, ['Nome Persona', 'nome_persona', 'nomePersona'], toString),
    telefono_fisso: getFieldValue(rowData, ['Telefono Fisso', 'telefono_fisso', 'telefonoFisso'], toString),
    telefono_cellulare: getFieldValue(rowData, ['Telefono Cellulare', 'telefono_cellulare', 'telefonoCellulare'], toString),
    email_recapito: getFieldValue(rowData, ['Email Recapito', 'email_recapito', 'emailRecapito'], toString),
    note: getFieldValue(rowData, ['Note', 'note'], toString),
  };
}


// --- Utils: db-operations.ts content ---
const UNIQUE_KEYS_CONFIG = {
  clienti: [
    ['ragione_sociale'],
    ['partita_iva'],
    ['codice_fiscale'],
  ],
  punti_servizio: [
    ['nome_punto_servizio'],
  ],
  fornitori: [
    ['ragione_sociale'],
    ['partita_iva'],
    ['codice_fiscale'],
  ],
  personale: [
    ['nome', 'cognome'],
    ['codice_fiscale'],
    ['email'],
  ],
  operatori_network: [
    ['nome', 'cognome', 'cliente_id'],
    ['email'],
  ],
  procedure: [
    ['nome_procedura'],
  ],
  tariffe: [
    ['client_id', 'tipo_servizio', 'punto_servizio_id'],
    ['client_id', 'tipo_servizio', 'fornitore_id'],
  ],
  rubrica_punti_servizio: [
    ['punto_servizio_id', 'tipo_recapito'],
  ],
  rubrica_clienti: [
    ['client_id', 'tipo_recapito'],
  ],
  rubrica_fornitori: [ // Nuova configurazione per rubrica_fornitori
    ['fornitore_id', 'tipo_recapito'],
  ],
};

const FOREIGN_KEYS_CONFIG = {
  punti_servizio: [
    { field: 'id_cliente', refTable: 'clienti' },
    { field: 'fornitore_id', refTable: 'fornitori' },
  ],
  operatori_network: [
    { field: 'cliente_id', refTable: 'clienti' },
  ],
  tariffe: [
    { field: 'client_id', refTable: 'clienti' },
    { field: 'punto_servizio_id', refTable: 'punti_servizio' },
    { field: 'fornitore_id', refTable: 'fornitori' },
  ],
  rubrica_punti_servizio: [
    { field: 'punto_servizio_id', refTable: 'punti_servizio' },
  ],
  rubrica_clienti: [
    { field: 'client_id', refTable: 'clienti' },
  ],
  rubrica_fornitori: [ // Nuova configurazione per rubrica_fornitori
    { field: 'fornitore_id', refTable: 'fornitori' },
  ],
};

async function checkExistingRecord(supabaseAdmin: any, tableName: string, processedData: any) {
  const uniqueKeys = UNIQUE_KEYS_CONFIG[tableName];
  let existingRecord = null;
  let queryBuilder = supabaseAdmin.from(tableName).select('*');

  if (!uniqueKeys || uniqueKeys.length === 0) {
    return { status: 'NEW', message: 'Nuovo record da inserire (nessuna chiave unica definita per il controllo).', updatedFields: [], id: null };
  }

  const orConditions = uniqueKeys.map(keyset => {
    const conditions = keyset.map(key => {
      const value = processedData[key];
      return value ? `${key}.eq.${value}` : null;
    }).filter(Boolean);

    return conditions.length > 0 ? `(${conditions.join(',')})` : null;
  }).filter(Boolean);

  if (orConditions.length > 0) {
    const { data, error } = await queryBuilder.or(orConditions.join(',')).limit(1);
    if (error) throw error;
    if (data && data.length > 0) {
      existingRecord = data[0];
    }
  }

  if (existingRecord) {
    let hasChanges = false;
    const updatedFields = [];
    for (const key in processedData) {
      if (processedData[key] !== existingRecord[key] && key !== 'created_at' && key !== 'updated_at') {
        hasChanges = true;
        updatedFields.push(key);
      }
    }

    if (hasChanges) {
      return { status: 'UPDATE', message: `Aggiornerà ${updatedFields.length} campi.`, updatedFields, id: existingRecord.id };
    } else {
      return { status: 'DUPLICATE', message: 'Record esistente, nessun cambiamento rilevato.', updatedFields: [], id: existingRecord.id };
    }
  } else {
    return { status: 'NEW', message: 'Nuovo record da inserire.', updatedFields: [], id: null };
  }
}

async function validateForeignKeys(supabaseAdmin: any, tableName: string, processedData: any) {
  const fkDefinitions = FOREIGN_KEYS_CONFIG[tableName];
  if (!fkDefinitions || fkDefinitions.length === 0) {
    return { isValid: true, message: null };
  }

  for (const fk of fkDefinitions) {
    const fkValue = processedData[fk.field];
    if (fkValue) {
      const { data, error } = await supabaseAdmin
        .from(fk.refTable)
        .select('id')
        .eq('id', fkValue)
        .single();

      if (error || !data) {
        return { isValid: false, message: `Errore: ID ${fk.field.replace('_id', '').replace('_', ' ').toUpperCase()} '${fkValue}' non trovato nella tabella '${fk.refTable}'.` };
      }
    }
  }
  return { isValid: true, message: null };
}

// --- Main Edge Function Logic ---
// Modified dataMappers to be an object of functions that accept supabaseAdmin
const dataMappers: { [key: string]: (rowData: any, supabaseAdmin: any) => Promise<any> | any } = {
  clienti: mapClientData,
  punti_servizio: mapPuntoServizioData, // Now an async function
  fornitori: mapFornitoreData,
  personale: mapPersonaleData,
  operatori_network: mapOperatoreNetworkData,
  procedure: mapProceduraData,
  tariffe: mapTariffaData,
  rubrica_punti_servizio: mapRubricaPuntiServizioData,
  rubrica_clienti: mapRubricaClientiData,
  rubrica_fornitori: mapRubricaFornitoriData,
};

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

    const mapper = dataMappers[anagraficaType];
    if (!mapper) {
      throw new Error(`Import logic not implemented for anagrafica type: ${anagraficaType}`);
    }

    for (const [rowIndex, row] of importData.entries()) {
      let processedData: any = {};
      let rowStatus = 'UNKNOWN';
      let message = '';
      let updatedFields: string[] = [];
      let existingRecordId: string | null = null;

      try {
        // Pass supabaseAdmin to the mapper if it's mapPuntoServizioData
        processedData = anagraficaType === 'punti_servizio' ? await mapper(row, supabaseAdmin) : mapper(row);

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

    console.log("Starting actual import process...");
    successCount = 0;
    updateCount = 0;
    errorCount = 0;
    duplicateCount = 0;

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
        } else if (rowReport.status === 'UPDATE') {
          const { error: updateError } = await supabaseAdmin
            .from(anagraficaType)
            .update({ ...dataToSave, updated_at: now })
            .eq('id', rowReport.id);
          if (updateError) throw updateError;
          updateCount++;
        } else if (rowReport.status === 'DUPLICATE' && rowReport.updatedFields.length > 0) {
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
        status: 207,
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