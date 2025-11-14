// @ts-nocheck

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
 * Controlla se un record esiste già nel database e determina se è nuovo, un aggiornamento o un duplicato.
 * @param supabaseAdmin Il client Supabase con privilegi di amministratore.
 * @param tableName Il nome della tabella.
 * @param processedData I dati del record processato.
 * @returns Un oggetto con lo stato ('NEW', 'UPDATE', 'DUPLICATE'), un messaggio, i campi aggiornati e l'ID del record esistente.
 * @throws Error in caso di errore del database.
 */
export async function checkExistingRecord(supabaseAdmin: any, tableName: string, processedData: any) {
  const uniqueKeys = UNIQUE_KEYS_CONFIG[tableName as keyof typeof UNIQUE_KEYS_CONFIG];
  let existingRecord = null;

  if (!uniqueKeys || uniqueKeys.length === 0) {
    return { status: 'NEW', message: 'Nuovo record da inserire (nessuna chiave unica definita per il controllo).', updatedFields: [], id: null };
  }

  // Prova ogni combinazione di chiavi uniche
  for (const keyset of uniqueKeys) {
    let query = supabaseAdmin.from(tableName).select('*');
    let allKeysPresent = true;

    for (const key of keyset) {
      const value = processedData[key];
      if (value === null || value === undefined || String(value).trim() === '') {
        allKeysPresent = false;
        break;
      }
      query = query.eq(key, value); // Concatenazione di .eq() per logica AND
    }

    if (allKeysPresent) {
      const { data, error } = await query.limit(1);
      if (error) throw error;
      if (data && data.length > 0) {
        existingRecord = data[0];
        break; // Trovato un record esistente, non è necessario controllare altri set di chiavi uniche
      }
    }
  }

  if (existingRecord) {
    let hasChanges = false;
    const updatedFields = [];
    for (const key in processedData) {
      // Escludi 'created_at' e 'updated_at' dal confronto
      if (key !== 'created_at' && key !== 'updated_at' && processedData[key] !== existingRecord[key]) {
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
 * @param supabaseAdmin Il client Supabase con privilegi di amministratore.
 * @param tableName Il nome della tabella.
 * @param processedData I dati del record processato.
 * @returns Un oggetto con isValid (booleano) e un messaggio di errore se non valido.
 * @throws Error in caso di errore del database.
 */
export async function validateForeignKeys(supabaseAdmin: any, tableName: string, processedData: any) {
  const fkDefinitions = FOREIGN_KEYS_CONFIG[tableName as keyof typeof FOREIGN_KEYS_CONFIG];
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