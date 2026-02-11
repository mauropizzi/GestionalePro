import { getFieldValue, toString, toNumber, isValidUuid } from '../data-mapping.ts';

export async function mapPuntoServizioData(rowData: any, supabaseAdmin: any) {
  const nome_punto_servizio = getFieldValue(rowData, ['Nome Punto Servizio', 'nome_punto_servizio', 'nomePuntoServizio'], toString);
  if (!nome_punto_servizio) throw new Error('Nome Punto Servizio is required.');

  let id_cliente: string | null = null;
  const id_cliente_from_excel = getFieldValue(rowData, ['ID Cliente', 'id_cliente', 'idCliente', 'ID Cliente (UUID)'], toString);
  const codice_cliente_custom_from_excel = getFieldValue(rowData, ['Codice Cliente Manuale', 'codice_cliente_custom', 'codiceClienteCustom'], toString);

  if (id_cliente_from_excel && isValidUuid(id_cliente_from_excel)) {
    id_cliente = id_cliente_from_excel;
  } else if (codice_cliente_custom_from_excel) {
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('clienti')
      .select('id')
      .eq('codice_cliente_custom', codice_cliente_custom_from_excel)
      .single();
    if (clientError || !clientData) {
      throw new Error(`Cliente con Codice Cliente Manuale '${codice_cliente_custom_from_excel}' non trovato.`);
    }
    id_cliente = clientData.id;
  }

  let fornitore_id: string | null = null;
  const fornitore_id_from_excel = getFieldValue(rowData, ['ID Fornitore', 'fornitore_id', 'fornitoreId', 'ID Fornitore (UUID)'], toString);
  const codice_fornitore_manuale_from_excel = getFieldValue(rowData, ['Codice Fornitore Manuale', 'codice_fornitore_manuale', 'codiceFornitoreManuale'], toString);

  if (fornitore_id_from_excel && isValidUuid(fornitore_id_from_excel)) {
    fornitore_id = fornitore_id_from_excel;
  } else if (codice_fornitore_manuale_from_excel) {
    const { data: fornitoreData, error: fornitoreError } = await supabaseAdmin
      .from('fornitori')
      .select('id')
      .eq('codice_cliente_associato', codice_fornitore_manuale_from_excel)
      .single();
    if (fornitoreError || !fornitoreData) {
      throw new Error(`Fornitore con Codice Fornitore Manuale '${codice_fornitore_manuale_from_excel}' non trovato.`);
    }
    fornitore_id = fornitoreData.id;
  }

  return {
    nome_punto_servizio,
    id_cliente,
    indirizzo: getFieldValue(rowData, ['Indirizzo', 'indirizzo'], toString),
    citta: getFieldValue(rowData, ['Città', 'citta'], toString),
    cap: getFieldValue(rowData, ['CAP', 'cap'], toString),
    provincia: getFieldValue(rowData, ['Provincia', 'provincia'], toString),
    referente: getFieldValue(rowData, ['Referente', 'referente'], toString),
    telefono_referente: getFieldValue(rowData, ['Telefono Referente', 'telefono_referente', 'telefonoReferente'], toString),
    telefono: getFieldValue(rowData, ['Telefono', 'telefono'], toString),
    email: getFieldValue(rowData, ['Email', 'email'], toString),
    note: getFieldValue(rowData, ['Note', 'note'], toString),
    tempo_intervento: getFieldValue(rowData, ['Tempo Intervento', 'tempo_intervento', 'tempoIntervento'], toString),
    fornitore_id,
    codice_cliente: getFieldValue(rowData, ['Codice Cliente Punto Servizio', 'codice_cliente', 'codiceCliente'], toString),
    codice_sicep: getFieldValue(rowData, ['Codice SICEP', 'codice_sicep', 'codiceSicep'], toString),
    codice_fatturazione: getFieldValue(rowData, ['Codice Fatturazione', 'codice_fatturazione', 'codiceFatturazione'], toString),
    latitude: getFieldValue(rowData, ['Latitudine', 'latitude'], toNumber),
    longitude: getFieldValue(rowData, ['Longitudine', 'longitude'], toNumber),
    nome_procedura: getFieldValue(rowData, ['Nome Procedura', 'nome_procedura', 'nomeProcedura'], toString),
  };
}