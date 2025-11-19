// @ts-nocheck
import { UNIQUE_KEYS_CONFIG, FOREIGN_KEYS_CONFIG } from './config.ts';
import { isValidUuid, toString } from './utils.ts';

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
        if (value === null || value === undefined || toString(value) === '') {
          allKeysPresent = false;
          break;
        }
        uniqueIdentifierParts.push(toString(value).toLowerCase());
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
        if (value === null || value === undefined || toString(value) === '') {
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
    for (const key in processedData) {
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