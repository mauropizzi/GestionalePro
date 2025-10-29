// @ts-nocheck
// supabase/functions/import-data/utils/db-operations.ts

/**
 * Definisce le chiavi uniche per ogni tabella per il controllo dei duplicati.
 * Ogni elemento nell'array è un set di campi che, combinati, devono essere unici.
 * Se ci sono più set, significa che la tabella può essere identificata in più modi.
 */
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
  rubrica_fornitori: [
    ['fornitore_id', 'tipo_recapito'],
  ],
  richieste_servizio: [ // Unique key for service requests
    ['client_id', 'punto_servizio_id', 'tipo_servizio', 'data_inizio_servizio', 'data_fine_servizio'],
  ],
  richieste_servizio_orari_giornalieri: [ // Unique key for daily schedules
    ['richiesta_servizio_id', 'giorno_settimana'],
  ],
};

/**
 * Definisce le chiavi esterne per ogni tabella per la validazione.
 */
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
  rubrica_fornitori: [
    { field: 'fornitore_id', refTable: 'fornitori' },
  ],
  richieste_servizio: [ // Foreign keys for service requests
    { field: 'client_id', refTable: 'clienti' },
    { field: 'punto_servizio_id', refTable: 'punti_servizio' },
    { field: 'fornitore_id', refTable: 'fornitori' },
  ],
  richieste_servizio_orari_giornalieri: [ // Foreign keys for daily schedules
    { field: 'richiesta_servizio_id', refTable: 'richieste_servizio' },
  ],
};

/**
 * Controlla se un record esiste già nel database e determina se è un nuovo record, un duplicato o un aggiornamento.
 * @param {object} supabaseAdmin - Il client Supabase con privilegi di amministratore.
 * @param {string} tableName - Il nome della tabella.
 * @param {object} processedData - I dati del record processati.
 * @returns {Promise<{status: string, message: string, updatedFields: string[], id: string|null}>} Il report dello stato del record.
 */
export async function checkExistingRecord(supabaseAdmin, tableName, processedData) {
  const uniqueKeys = UNIQUE_KEYS_CONFIG[tableName];
  let existingRecord = null;
  let queryBuilder = supabaseAdmin.from(tableName).select('*');

  if (!uniqueKeys || uniqueKeys.length === 0) {
    // Se non ci sono chiavi uniche definite, non possiamo controllare i duplicati in modo affidabile.
    // Trattiamo come nuovo record per evitare errori, ma è una situazione da migliorare.
    return { status: 'NEW', message: 'Nuovo record da inserire (nessuna chiave unica definita per il controllo).', updatedFields: [], id: null };
  }

  // Costruisci la clausola OR per cercare i record esistenti
  const orConditions = uniqueKeys.map(keyset => {
    const conditions = keyset.map(key => {
      const value = processedData[key];
      return value ? `${key}.eq.${value}` : null;
    }).filter(Boolean); // Rimuovi le condizioni nulle se il valore è null

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
      // Confronta solo i campi che sono stati forniti nel processedData e che non sono campi di timestamp
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

/**
 * Valida le chiavi esterne per un record.
 * @param {object} supabaseAdmin - Il client Supabase con privilegi di amministratore.
 * @param {string} tableName - Il nome della tabella.
 * @param {object} processedData - I dati del record processati.
 * @returns {Promise<{isValid: boolean, message: string|null}>} Il risultato della validazione.
 */
export async function validateForeignKeys(supabaseAdmin, tableName, processedData) {
  const fkDefinitions = FOREIGN_KEYS_CONFIG[tableName];
  if (!fkDefinitions || fkDefinitions.length === 0) {
    return { isValid: true, message: null };
  }

  for (const fk of fkDefinitions) {
    const fkValue = processedData[fk.field];
    if (fkValue) { // Solo se il campo FK è presente
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