import { getFieldValue, toString, toBoolean, toDateString } from "../data-mapping.ts";

export function mapPersonaleData(rowData: any) {
  const nome = getFieldValue(rowData, ["Nome", "nome"], toString);
  const cognome = getFieldValue(rowData, ["Cognome", "cognome"], toString);
  if (!nome || !cognome) throw new Error("Nome and Cognome are required.");

  const attivo = getFieldValue(rowData, ["Attivo", "attivo", "Attivo (TRUE/FALSE)"], toBoolean);

  return {
    nome,
    cognome,
    codice_fiscale: getFieldValue(rowData, ["Codice Fiscale", "codice_fiscale", "codiceFiscale"], toString),
    ruolo: getFieldValue(rowData, ["Ruolo", "ruolo"], toString),
    telefono: getFieldValue(rowData, ["Telefono", "telefono"], toString),
    email: getFieldValue(rowData, ["Email", "email"], toString),
    data_nascita: getFieldValue(
      rowData,
      ["Data Nascita", "data_nascita", "dataNascita", "Data Nascita (YYYY-MM-DD)"],
      toDateString
    ),
    luogo_nascita: getFieldValue(rowData, ["Luogo Nascita", "luogo_nascita", "luogoNascita"], toString),
    indirizzo: getFieldValue(rowData, ["Indirizzo", "indirizzo"], toString),
    cap: getFieldValue(rowData, ["CAP", "cap"], toString),
    citta: getFieldValue(rowData, ["Città", "citta"], toString),
    provincia: getFieldValue(rowData, ["Provincia", "provincia"], toString),
    data_assunzione: getFieldValue(
      rowData,
      ["Data Assunzione", "data_assunzione", "dataAssunzione", "Data Assunzione (YYYY-MM-DD)"],
      toDateString
    ),
    data_cessazione: getFieldValue(
      rowData,
      ["Data Cessazione", "data_cessazione", "dataAssunzione", "Data Cessazione (YYYY-MM-DD)"],
      toDateString
    ),

    // NOTE: attivo is NOT NULL with a DB default.
    // If the column is not present in Excel, keep it undefined so Postgres default applies.
    ...(attivo === null ? {} : { attivo }),

    note: getFieldValue(rowData, ["Note", "note"], toString),
  };
}