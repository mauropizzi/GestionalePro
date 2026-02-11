import { getFieldValue, toString, toBoolean } from "../data-mapping.ts";

export function mapFornitoreData(rowData: any) {
  const ragione_sociale = getFieldValue(
    rowData,
    ["Ragione Sociale", "ragione_sociale", "ragioneSociale"],
    toString
  );
  if (!ragione_sociale) throw new Error("Ragione Sociale is required.");

  const attivo = getFieldValue(rowData, ["Attivo", "attivo", "Attivo (TRUE/FALSE)"], toBoolean);

  return {
    ragione_sociale: ragione_sociale,
    codice_fiscale: getFieldValue(rowData, ["Codice Fiscale", "codice_fiscale", "codiceFiscale"], toString),
    partita_iva: getFieldValue(rowData, ["Partita IVA", "partita_iva", "partitaIva"], toString),
    indirizzo: getFieldValue(rowData, ["Indirizzo", "indirizzo"], toString),
    citta: getFieldValue(rowData, ["Città", "citta"], toString),
    cap: getFieldValue(rowData, ["CAP", "cap"], toString),
    provincia: getFieldValue(rowData, ["Provincia", "provincia"], toString),
    telefono: getFieldValue(rowData, ["Telefono", "telefono"], toString),
    email: getFieldValue(rowData, ["Email", "email"], toString),
    pec: getFieldValue(rowData, ["PEC", "pec"], toString),
    tipo_servizio: getFieldValue(rowData, ["Tipo Servizio", "tipo_servizio", "tipoServizio"], toString),

    // attivo is NOT NULL with a DB default; omit it if not provided
    ...(attivo === null ? {} : { attivo }),

    note: getFieldValue(rowData, ["Note", "note"], toString),
    codice_cliente_associato: getFieldValue(
      rowData,
      ["Codice Fornitore Manuale", "codice_cliente_associato", "codiceClienteAssociato"],
      toString
    ),
  };
}