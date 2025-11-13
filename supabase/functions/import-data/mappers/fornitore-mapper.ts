// @ts-nocheck
import { getFieldValue, toString, toBoolean } from '../utils/data-mapping.ts';

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