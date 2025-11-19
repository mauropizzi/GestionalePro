// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Recupera il valore di un campo da un oggetto riga, provando diverse chiavi e convertendolo al tipo desiderato.
 * @param rowData L'oggetto riga da cui estrarre il valore.
 * @param keys Un array di chiavi da provare (in ordine di preferenza).
 * @param typeConverter La funzione di conversione del tipo da applicare al valore trovato.
 * @returns Il valore convertito o null se non trovato o non valido.
 */
export const getFieldValue = (rowData: any, keys: string[], typeConverter: (value: any) => any) => {
  for (const key of keys) {
    const value = rowData[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return typeConverter(value);
    }
  }
  return null;
};

/** Converte un valore in stringa, rimuovendo gli spazi bianchi. */
export const toString = (value: any) => String(value).trim();

/** Converte un valore in numero. */
export const toNumber = (value: any) => {
  const num = Number(value);
  return isNaN(num) ? null : num;
};

/** Converte un valore in booleano (true per 'true'/'1', false per 'false'/'0'). */
export const toBoolean = (value: any) => {
  if (typeof value === 'boolean') return value;
  const s = String(value).trim().toLowerCase();
  if (s === 'true' || s === '1') return true;
  if (s === 'false' || s === '0') return false;
  return null;
};

/** Converte un valore in stringa data (YYYY-MM-DD), gestendo anche i formati numerici di Excel. */
export const toDateString = (value: any) => {
  if (!value) return null;
  try {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    }
  } catch (e) {
    // Tentativo di interpretare come numero di giorni da epoch Excel
    if (typeof value === 'number' && value > 1) {
      const excelEpoch = new Date('1899-12-30T00:00:00Z'); // Excel epoch (1900-01-01 è giorno 1, ma Excel ha un bug con il 1900)
      const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
  }
  return null;
};

/** Verifica se una stringa è un UUID valido. */
export const isValidUuid = (uuid: any) => typeof uuid === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(uuid.trim());


/**
 * Configurazione delle chiavi uniche per il controllo dei duplicati per ogni tabella.
 * Ogni elemento nell'array è un set di chiavi che, se combinate, identificano un record unico.
 */
export const UNIQUE_KEYS_CONFIG = {
  clienti: [
    ['ragione_sociale'],
    ['partita_iva'],
    ['codice_fiscale'],
    ['codice_cliente_custom'],
  ],
  punti_servizio: [
    ['nome_punto_servizio', 'id_cliente'], // Unique per nome e cliente
    ['nome_punto_servizio'], // Aggiunto: nome_punto_servizio da solo
    ['codice_cliente'], // Aggiunto: codice_cliente del punto servizio
    ['codice_sicep'],
    ['codice_fatturazione'],
  ],
  fornitori: [
    ['ragione_sociale'],
    ['partita_iva'],
    ['codice_fiscale'],
    ['codice_cliente_associato'],
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
  rubrica_fornitori: [
    ['fornitore_id', 'tipo_recapito'],
  ],
};

/**
 * Configurazione delle chiavi esterne per la validazione per ogni tabella.
 * Definisce quali campi sono chiavi esterne e a quale tabella fanno riferimento.
 */
export const FOREIGN_KEYS_CONFIG = {
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
  rubrica_fornitori: [
    { field: 'fornitore_id', refTable: 'fornitori' },
  ],
};

/**
 * Fetches all necessary unique keys and foreign key IDs for a given table
 * to enable efficient in-memory lookups during the preview phase.
 * @param supabaseAdmin The Supabase client with admin privileges.
 * @param tableName The name of the target table.
 * @returns An object containing maps/sets of existing records and foreign key values.
 * @throws Error in case of database query failure.
 */
export async function fetchReferenceData(supabaseAdmin: any, tableName: string) {
  const referenceData: {
    existingRecords: Map<string, any>; // Map of unique key combinations to existing record IDs/data
    foreignKeyValues: Map<string, Set<string>>; // Map of refTable to Set of valid IDs
  } = {
    existingRecords: new Map(),
    foreignKeyValues: new Map(),
  };

  // 1. Fetch all existing records for the target table to check for duplicates/updates
  const uniqueKeys = UNIQUE_KEYS_CONFIG[tableName as keyof typeof UNIQUE_KEYS_CONFIG];
  if (uniqueKeys && uniqueKeys.length > 0) {
    const { data, error } = await supabaseAdmin.from(tableName).select('*');
    if (error) throw error;

    for (const record of data) {
      for (const keyset of uniqueKeys) {
        const uniqueIdentifierParts = [];
        let allKeysPresent = true;
        for (const key of keyset) {
          const value = record[key];
          if (value === null || value === undefined || toString(value) === '') {
            allKeysPresent = false;
            break;
          }
          uniqueIdentifierParts.push(toString(value).toLowerCase());
        }
        if (allKeysPresent) {
          const identifier = keyset.join('_') + ':' + uniqueIdentifierParts.join('|');
          referenceData.existingRecords.set(identifier, record);
        }
      }
    }
  }

  // 2. Fetch all valid foreign key IDs for validation
  const fkDefinitions = FOREIGN_KEYS_CONFIG[tableName as keyof typeof FOREIGN_KEYS_CONFIG];
  if (fkDefinitions && fkDefinitions.length > 0) {
    const refTablesToFetch = new Set<string>();
    for (const fk of fkDefinitions) {
      refTablesToFetch.add(fk.refTable);
    }

    for (const refTable of refTablesToFetch) {
      const { data, error } = await supabaseAdmin.from(refTable).select('id');
      if (error) throw error;
      referenceData.foreignKeyValues.set(refTable, new Set(data.map((d: any) => d.id)));
    }
  }

  return referenceData;
}

/**
 * Controlla se un record esiste già nel database e determina se è nuovo, un aggiornamento o un duplicato.
 * Utilizza i dati di riferimento pre-caricati per la modalità preview.
 * @param supabaseAdmin Il client Supabase con privilegi di amministratore.
 * @param tableName Il nome della tabella.
 * @param processedData I dati del record processato.
 * @param referenceData Dati di riferimento pre-caricati (opzionale, per modalità preview).
 * @returns Un oggetto con lo stato ('NEW', 'UPDATE', 'DUPLICATE'), un messaggio, i campi aggiornati e l'ID del record esistente.
 * @throws Error in caso di errore del database (solo se referenceData non è fornito).
 */
export async function checkExistingRecord(supabaseAdmin: any, tableName: string, processedData: any, referenceData?: any) {
  const uniqueKeys = UNIQUE_KEYS_CONFIG[tableName as keyof typeof UNIQUE_KEYS_CONFIG];
  let existingRecord = null;

  if (!uniqueKeys || uniqueKeys.length === 0) {
    return { status: 'NEW', message: 'Nuovo record da inserire (nessuna chiave unica definita per il controllo).', updatedFields: [], id: null };
  }

  if (referenceData && referenceData.existingRecords) {
    // Use pre-fetched data for preview mode
    for (const keyset of uniqueKeys) {
      const uniqueIdentifierParts = [];
      let allKeysPresent = true;
      for (const key of keyset) {
        const value = processedData[key];
        if (value === null || value === undefined || String(value).trim() === '') {
          allKeysPresent = false;
          break;
        }
        uniqueIdentifierParts.push(String(value).trim().toLowerCase());
      }
      if (allKeysPresent) {
        const identifier = keyset.join('_') + ':' + uniqueIdentifierParts.join('|');
        if (referenceData.existingRecords.has(identifier)) {
          existingRecord = referenceData.existingRecords.get(identifier);
          break;
        }
      }
    }
  } else {
    // Fallback to direct DB query for import mode or if referenceData is not provided
    for (const keyset of uniqueKeys) {
      let query = supabaseAdmin.from(tableName).select('*');
      let allKeysPresent = true;

      for (const key of keyset) {
        const value = processedData[key];
        if (value === null || value === undefined || String(value).trim() === '') {
          allKeysPresent = false;
          break;
        }
        query = query.eq(key, value);
      }

      if (allKeysPresent) {
        const { data, error } = await query.limit(1);
        if (error) throw error;
        if (data && data.length > 0) {
          existingRecord = data[0];
          break;
        }
      }
    }
  }

  if (existingRecord) {
    let hasChanges = false;
    const updatedFields = [];

    // Helper to normalize values for comparison (treat null, undefined, empty string as null; normalize numbers)
    const normalizeValue = (val: any) => {
      if (val === null || val === undefined || (typeof val === 'string' && val.trim() === '')) {
        return null;
      }
      if (typeof val === 'number') {
        return parseFloat(val.toFixed(10)); // Normalize floating point precision
      }
      return val;
    };

    for (const key in processedData) {
      // Exclude 'created_at' and 'updated_at' from comparison
      if (key === 'created_at' || key === 'updated_at') {
        continue;
      }

      const normalizedProcessedValue = normalizeValue(processedData[key]);
      const normalizedExistingValue = normalizeValue(existingRecord[key]);

      if (normalizedProcessedValue !== normalizedExistingValue) {
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

/**
 * Valida le chiavi esterne di un record rispetto alle tabelle di riferimento.
 * Utilizza i dati di riferimento pre-caricati per la modalità preview.
 * @param supabaseAdmin Il client Supabase con privilegi di amministratore.
 * @param tableName Il nome della tabella.
 * @param processedData I dati del record processato.
 * @param referenceData Dati di riferimento pre-caricati (opzionale, per modalità preview).
 * @returns Un oggetto con isValid (booleano) e un messaggio di errore se non valido.
 * @throws Error in caso di errore del database (solo se referenceData non è fornito).
 */
export async function validateForeignKeys(supabaseAdmin: any, tableName: string, processedData: any, referenceData?: any) {
  const fkDefinitions = FOREIGN_KEYS_CONFIG[tableName as keyof typeof FOREIGN_KEYS_CONFIG];
  if (!fkDefinitions || fkDefinitions.length === 0) {
    return { isValid: true, message: null };
  }

  for (const fk of fkDefinitions) {
    const fkValue = processedData[fk.field];
    if (fkValue) {
      if (referenceData && referenceData.foreignKeyValues && referenceData.foreignKeyValues.has(fk.refTable)) {
        // Use pre-fetched data for preview mode
        if (!referenceData.foreignKeyValues.get(fk.refTable).has(fkValue)) {
          return { isValid: false, message: `Errore: ID ${fk.field.replace('_id', '').replace('_', ' ').toUpperCase()} '${fkValue}' non trovato nella tabella '${fk.refTable}'.` };
        }
      } else {
        // Fallback to direct DB query for import mode or if referenceData is not provided
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
  }
  return { isValid: true, message: null };
}

// --- Mappers (from mappers.ts) ---
/**
 * Mappa i dati di una riga Excel a un formato Cliente.
 * @param rowData L'oggetto riga da mappare.
 * @returns Un oggetto Cliente.
 * @throws Error se la Ragione Sociale è mancante.
 */
export function mapClientData(rowData: any) {
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
    codice_cliente_custom: getFieldValue(rowData, ['Codice Cliente Manuale', 'codice_cliente_custom', 'codiceClienteCustom'], toString),
  };
}

/**
 * Mappa i dati di una riga Excel a un formato Fornitore.
 * @param rowData L'oggetto riga da mappare.
 * @returns Un oggetto Fornitore.
 * @throws Error se la Ragione Sociale è mancante.
 */
export function mapFornitoreData(rowData: any) {
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
    codice_cliente_associato: getFieldValue(rowData, ['Codice Fornitore Manuale', 'codice_cliente_associato', 'codiceClienteAssociato'], toString),
  };
}

/**
 * Mappa i dati di una riga Excel a un formato Operatore Network.
 * @param rowData L'oggetto riga da mappare.
 * @returns Un oggetto Operatore Network.
 * @throws Error se Nome o Cognome sono mancanti.
 */
export function mapOperatoreNetworkData(rowData: any) {
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

/**
 * Mappa i dati di una riga Excel a un formato Personale.
 * @param rowData L'oggetto riga da mappare.
 * @returns Un oggetto Personale.
 * @throws Error se Nome o Cognome sono mancanti.
 */
export function mapPersonaleData(rowData: any) {
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

/**
 * Mappa i dati di una riga Excel a un formato Procedura.
 * @param rowData L'oggetto riga da mappare.
 * @returns Un oggetto Procedura.
 * @throws Error se il Nome Procedura è mancante.
 */
export function mapProceduraData(rowData: any) {
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

/**
 * Mappa i dati di una riga Excel a un formato Punto Servizio.
 * Include la logica per la ricerca di ID cliente/fornitore tramite codici manuali.
 * @param rowData L'oggetto riga da mappare.
 * @param supabaseAdmin Il client Supabase con privilegi di amministratore per le lookup.
 * @returns Un oggetto Punto Servizio.
 * @throws Error se il Nome Punto Servizio è mancante o se i lookup falliscono.
 */
export async function mapPuntoServizioData(rowData: any, supabaseAdmin: any) {
  const nome_punto_servizio = getFieldValue(rowData, ['Nome Punto Servizio', 'nome_punto_servizio', 'nomePuntoServizio'], toString);
  if (!nome_punto_servizio) {
    throw new Error('Nome Punto Servizio is required and cannot be empty.');
  }

  let id_cliente: string | null = null;
  const id_cliente_from_excel = getFieldValue(rowData, ['ID Cliente', 'id_cliente', 'idCliente', 'ID Cliente (UUID)'], toString);
  const codice_cliente_custom_from_excel = getFieldValue(rowData, ['Codice Cliente Manuale', 'codice_cliente_custom', 'codiceClienteCustom'], toString);

  if (id_cliente_from_excel && isValidUuid(id_cliente_from_excel)) {
    id_cliente = id_cliente_from_excel;
  } else if (codice_cliente_custom_from_excel) {
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('clienti')
      .select('id')
      .eq('codice_cliente_custom', codice_cliente_custom_from_excel)
      .single();
    if (clientError || !clientData) {
      throw new Error(`Cliente con Codice Cliente Manuale '${codice_cliente_custom_from_excel}' non trovato.`);
    }
    id_cliente = clientData.id;
  } else if (id_cliente_from_excel) { // If id_cliente_from_excel was provided but not a valid UUID, and no custom code was found
    throw new Error(`ID Cliente '${id_cliente_from_excel}' non è un UUID valido e nessun Codice Cliente Manuale valido è stato fornito o trovato.`);
  }


  let fornitore_id: string | null = null;
  const fornitore_id_from_excel = getFieldValue(rowData, ['ID Fornitore', 'fornitore_id', 'fornitoreId', 'ID Fornitore (UUID)'], toString);
  const codice_fornitore_manuale_from_excel = getFieldValue(rowData, ['Codice Fornitore Manuale', 'codice_fornitore_manuale', 'codiceFornitoreManuale'], toString);

  if (fornitore_id_from_excel && isValidUuid(fornitore_id_from_excel)) {
    fornitore_id = fornitore_id_from_excel;
  } else if (codice_fornitore_manuale_from_excel) {
    const { data: fornitoreData, error: fornitoreError } = await supabaseAdmin
      .from('fornitori')
      .select('id')
      .eq('codice_cliente_associato', codice_fornitore_manuale_from_excel)
      .single();
    if (fornitoreError || !fornitoreData) {
      throw new Error(`Fornitore con Codice Fornitore Manuale '${codice_fornitore_manuale_from_excel}' non trovato.`);
    }
    fornitore_id = fornitoreData.id;
  } else if (fornitore_id_from_excel) { // If fornitore_id_from_excel was provided but not a valid UUID, and no manual code was found
    throw new Error(`ID Fornitore '${fornitore_id_from_excel}' non è un UUID valido e nessun Codice Fornitore Manuale valido è stato fornito o trovato.`);
  }


  const latitude = getFieldValue(rowData, ['Latitudine', 'latitude'], toNumber);
  const longitude = getFieldValue(rowData, ['Longitudine', 'longitude'], toNumber);
  const note = getFieldValue(rowData, ['Note', 'note'], toString);

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
    codice_cliente: getFieldValue(rowData, ['Codice Cliente Punto Servizio', 'codice_cliente', 'codiceCliente'], toString),
    codice_sicep: getFieldValue(rowData, ['Codice SICEP', 'codice_sicep', 'codiceSicep'], toString),
    codice_fatturazione: getFieldValue(rowData, ['Codice Fatturazione', 'codice_fatturazione', 'codiceFatturazione'], toString),
    latitude: latitude,
    longitude: longitude,
    nome_procedura: getFieldValue(rowData, ['Nome Procedura', 'nome_procedura', 'nomeProcedura'], toString),
  };
}

/**
 * Mappa i dati di una riga Excel a un formato Rubrica Clienti.
 * @param rowData L'oggetto riga da mappare.
 * @returns Un oggetto Rubrica Clienti.
 * @throws Error se Tipo Recapito o ID Cliente sono mancanti/non validi.
 */
export function mapRubricaClientiData(rowData: any) {
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

/**
 * Mappa i dati di una riga Excel a un formato Rubrica Fornitori.
 * @param rowData L'oggetto riga da mappare.
 * @returns Un oggetto Rubrica Fornitori.
 * @throws Error se Tipo Recapito o ID Fornitore sono mancanti/non validi.
 */
export function mapRubricaFornitoriData(rowData: any) {
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

/**
 * Mappa i dati di una riga Excel a un formato Rubrica Punti Servizio.
 * @param rowData L'oggetto riga da mappare.
 * @returns Un oggetto Rubrica Punti Servizio.
 * @throws Error se Tipo Recapito o ID Punto Servizio sono mancanti/non validi.
 */
export function mapRubricaPuntiServizioData(rowData: any) {
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

/**
 * Mappa i dati di una riga Excel a un formato Tariffa.
 * @param rowData L'oggetto riga da mappare.
 * @returns Un oggetto Tariffa.
 * @throws Error se Tipo Servizio o Importo sono mancanti.
 */
export function mapTariffaData(rowData: any) {
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