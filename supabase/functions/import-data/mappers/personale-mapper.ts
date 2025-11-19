// @ts-nocheck
import { getFieldValue, toString, toNumber, toBoolean, toDateString, isValidUuid } from '../utils/data-mapping.ts';

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