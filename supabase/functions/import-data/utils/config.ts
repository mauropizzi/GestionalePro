/**
 * Configurazione delle chiavi uniche per il controllo dei duplicati per ogni tabella.
 */
export const UNIQUE_KEYS_CONFIG = {
  clienti: [
    ['ragione_sociale'],
    ['partita_iva'],
    ['codice_fiscale'],
    ['codice_cliente_custom'],
  ],
  punti_servizio: [
    ['nome_punto_servizio', 'id_cliente'],
    ['nome_punto_servizio'],
    ['codice_cliente'],
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