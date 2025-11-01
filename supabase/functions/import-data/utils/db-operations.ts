// @ts-nocheck
import { UNIQUE_KEYS_CONFIG, FOREIGN_KEYS_CONFIG } from './config.ts';

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