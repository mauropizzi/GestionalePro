import { UNIQUE_KEYS_CONFIG, FOREIGN_KEYS_CONFIG } from './config.ts';
import { toString } from './data-mapping.ts';

/**
 * Fetches reference data for lookups and validation.
 */
export async function fetchReferenceData(supabaseAdmin: any, tableName: string) {
  const referenceData: {
    existingRecords: Map<string, any>;
    foreignKeyValues: Map<string, Set<string>>;
  } = {
    existingRecords: new Map(),
    foreignKeyValues: new Map(),
  };

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
 * Checks if a record exists and determines its status.
 */
export async function checkExistingRecord(supabaseAdmin: any, tableName: string, processedData: any, referenceData?: any) {
  const uniqueKeys = UNIQUE_KEYS_CONFIG[tableName as keyof typeof UNIQUE_KEYS_CONFIG];
  let existingRecord = null;

  if (!uniqueKeys || uniqueKeys.length === 0) {
    return { status: 'NEW', message: 'Nuovo record da inserire.', updatedFields: [], id: null };
  }

  if (referenceData && referenceData.existingRecords) {
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
  }

  if (existingRecord) {
    let hasChanges = false;
    const updatedFields = [];

    const normalizeValue = (val: any) => {
      if (val === null || val === undefined || (typeof val === 'string' && val.trim() === '')) return null;
      if (typeof val === 'string') return val.trim().toLowerCase();
      if (typeof val === 'number') return parseFloat(val.toFixed(10));
      return val;
    };

    for (const key in processedData) {
      if (key === 'created_at' || key === 'updated_at') continue;
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
 * Validates foreign keys.
 */
export async function validateForeignKeys(supabaseAdmin: any, tableName: string, processedData: any, referenceData?: any) {
  const fkDefinitions = FOREIGN_KEYS_CONFIG[tableName as keyof typeof FOREIGN_KEYS_CONFIG];
  if (!fkDefinitions || fkDefinitions.length === 0) return { isValid: true, message: null };

  for (const fk of fkDefinitions) {
    const fkValue = processedData[fk.field];
    if (fkValue) {
      if (referenceData && referenceData.foreignKeyValues?.has(fk.refTable)) {
        if (!referenceData.foreignKeyValues.get(fk.refTable).has(fkValue)) {
          return { isValid: false, message: `Errore: ID ${fk.field.replace('_id', '').replace('_', ' ').toUpperCase()} '${fkValue}' non trovato.` };
        }
      }
    }
  }
  return { isValid: true, message: null };
}