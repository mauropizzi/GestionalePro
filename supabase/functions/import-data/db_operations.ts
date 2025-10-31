// @ts-nocheck
// Configurazione delle chiavi uniche per il controllo dei duplicati
export const UNIQUE_KEYS_CONFIG = {
  clienti: [
    ['ragione_sociale'],
    ['partita_iva'],
    ['codice_fiscale'],
    ['codice_cliente_custom'],
  ],
  punti_servizio: [
    ['nome_punto_servizio', 'id_cliente'], // Unique per nome e cliente
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

// Configurazione delle chiavi esterne per la validazione
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

// Funzione per controllare l'esistenza di un record
export async function checkExistingRecord(supabaseAdmin: any, tableName: string, processedData: any) {
  const uniqueKeys = UNIQUE_KEYS_CONFIG[tableName as keyof typeof UNIQUE_KEYS_CONFIG];
  let existingRecord = null;

  if (!uniqueKeys || uniqueKeys.length === 0) {
    return { status: 'NEW', message: 'Nuovo record da inserire (nessuna chiave unica definita per il controllo).', updatedFields: [], id: null };
  }

  // Try each unique key combination
  for (const keyset of uniqueKeys) {
    let query = supabaseAdmin.from(tableName).select('*');
    let allKeysPresent = true;

    for (const key of keyset) {
      const value = processedData[key];
      if (value === null || value === undefined || String(value).trim() === '') {
        allKeysPresent = false;
        break;
      }
      query = query.eq(key, value); // Chain .eq() for AND logic
    }

    if (allKeysPresent) {
      const { data, error } = await query.limit(1);
      if (error) throw error;
      if (data && data.length > 0) {
        existingRecord = data[0];
        break; // Found an existing record, no need to check other unique key sets
      }
    }
  }

  if (existingRecord) {
    let hasChanges = false;
    const updatedFields = [];
    for (const key in processedData) {
      // Exclude 'created_at' and 'updated_at' from comparison
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

// Funzione per validare le chiavi esterne
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