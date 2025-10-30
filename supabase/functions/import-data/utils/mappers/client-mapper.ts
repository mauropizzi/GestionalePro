// @ts-nocheck
// supabase/functions/import-data/utils/mappers/client-mapper.ts
import { getFieldValue, toString, toBoolean } from '../data-mapping.ts';

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
  };
}