// @ts-nocheck
import { getFieldValue, toString, toNumber, isValidUuid } from '../utils/data-mapping.ts';

/**
 * Mappa i dati di una riga Excel a un formato Punto Servizio.
 * Include la logica per la ricerca di ID cliente/fornitore tramite codici manuali.
 * @param rowData L'oggetto riga da mappare.
 * @param supabaseAdmin Il client Supabase con privilegi di amministratore per le lookup.
 * @returns Un oggetto Punto Servizio.
 * @throws Error se il Nome Punto Servizio è mancante o se i lookup falliscono.
 */
export async function mapPuntoServizioData(rowData: any, supabaseAdmin: any) {
  const nome_punto_servizio = getFieldValue(rowData, ['Nome Punto Servizio', 'nome_punto_servizio', 'nomePuntoServizio'], toString);
  if (!nome_punto_servizio) {
    throw new Error('Nome Punto Servizio is required and cannot be empty.');
  }

  let id_cliente = getFieldValue(rowData, ['ID Cliente', 'id_cliente', 'idCliente', 'ID Cliente (UUID)'], toString);
  if (id_cliente && !isValidUuid(id_cliente)) {
    id_cliente = null;
  }

  // Lookup client by codice_cliente_custom if id_cliente is not provided
  if (!id_cliente) {
    const codice_cliente_custom = getFieldValue(rowData, ['Codice Cliente Manuale', 'codice_cliente_custom', 'codiceClienteCustom'], toString);
    if (codice_cliente_custom) {
      const { data: clientData, error: clientError } = await supabaseAdmin
        .from('clienti')
        .select('id')
        .eq('codice_cliente_custom', codice_cliente_custom)
        .single();
      if (clientError || !clientData) {
        throw new Error(`Cliente con Codice Cliente Manuale '${codice_cliente_custom}' non trovato.`);
      }
      id_cliente = clientData.id;
    }
  }

  let fornitore_id = getFieldValue(rowData, ['ID Fornitore', 'fornitore_id', 'fornitoreId', 'ID Fornitore (UUID)'], toString);
  if (fornitore_id && !isValidUuid(fornitore_id)) {
    fornitore_id = null;
  }

  // Lookup fornitore by codice_cliente_associato (manual supplier code) if fornitore_id is not provided
  if (!fornitore_id) {
    const codice_fornitore_manuale = getFieldValue(rowData, ['Codice Fornitore Manuale', 'codice_fornitore_manuale', 'codiceFornitoreManuale'], toString);
    if (codice_fornitore_manuale) {
      const { data: fornitoreData, error: fornitoreError } = await supabaseAdmin
        .from('fornitori')
        .select('id')
        .eq('codice_cliente_associato', codice_fornitore_manuale) // Assuming this is the manual code for suppliers
        .single();
      if (fornitoreError || !fornitoreData) {
        throw new Error(`Fornitore con Codice Fornitore Manuale '${codice_fornitore_manuale}' non trovato.`);
      }
      fornitore_id = fornitoreData.id;
    }
  }

  let latitude = getFieldValue(rowData, ['Latitudine', 'latitude'], toNumber);
  let longitude = getFieldValue(rowData, ['Longitudine', 'longitude'], toNumber);

  let note = getFieldValue(rowData, ['Note', 'note'], toString);

  // Handle potential shifted lat/lon if 'Note' or 'fornitore_id' columns were used for them
  if (latitude === null && longitude === null) {
    const potentialShiftedLat = toNumber(rowData['Note'] || rowData['note']);
    const potentialShiftedLon = toNumber(rowData['fornitore_id'] || rowData['fornitoreId']);

    if (potentialShiftedLat !== null && potentialShiftedLon !== null && Math.abs(potentialShiftedLat) <= 90 && Math.abs(potentialShiftedLon) <= 180) {
      latitude = potentialShiftedLat;
      longitude = potentialShiftedLon;
      note = null; // Clear note if it was actually latitude
    }
  }

  return {
    nome_punto_servizio: nome_punto_servizio,
    id_cliente: id_cliente,
    indirizzo: getFieldValue(rowData, ['Indirizzo', 'indirizzo'], toString),
    citta: getFieldValue(rowData, ['Città', 'citta'], toString),
    cap: getFieldValue(rowData, ['CAP', 'cap'], toString),
    provincia: getFieldValue(rowData, ['Provincia', 'provincia'], toString),
    referente: getFieldValue(rowData, ['Referente', 'referente'], toString),
    telefono_referente: getFieldValue(rowData, ['Telefono Referente', 'telefono_referente', 'telefonoReferente'], toString),
    telefono: getFieldValue(rowData, ['Telefono', 'telefono'], toString),
    email: getFieldValue(rowData, ['Email', 'email'], toString),
    note: note,
    tempo_intervento: getFieldValue(rowData, ['Tempo Intervento', 'tempo_intervento', 'tempoIntervento'], toString),
    fornitore_id: fornitore_id,
    codice_cliente: getFieldValue(rowData, ['Codice Cliente Punto Servizio', 'codice_cliente', 'codiceCliente'], toString),
    codice_sicep: getFieldValue(rowData, ['Codice SICEP', 'codice_sicep', 'codiceSicep'], toString),
    codice_fatturazione: getFieldValue(rowData, ['Codice Fatturazione', 'codice_fatturazione', 'codiceFatturazione'], toString),
    latitude: latitude,
    longitude: longitude,
    nome_procedura: getFieldValue(rowData, ['Nome Procedura', 'nome_procedura', 'nomeProcedura'], toString),
  };
}