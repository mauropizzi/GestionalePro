// @ts-nocheck
// supabase/functions/import-data/mappers/richiesta-servizio-mapper.ts
import { getFieldValue, toString, toNumber, toDateString, isValidUuid } from '../utils/data-mapping.ts';
import { SERVICE_TYPES, APERTURA_CHIUSURA_TYPES } from '../utils/supabase-constants.ts';

export function mapRichiestaServizioData(rowData: any) {
  const tipo_servizio_raw = getFieldValue(rowData, ['Tipo Servizio', 'tipo_servizio', 'tipoServizio'], toString);
  const tipo_servizio = SERVICE_TYPES.find(t => t.label.toLowerCase() === tipo_servizio_raw?.toLowerCase())?.value || tipo_servizio_raw;

  if (!tipo_servizio) {
    throw new Error('Tipo Servizio is required and must be a valid service type.');
  }

  const data_inizio_servizio = getFieldValue(rowData, ['Data Inizio Servizio', 'data_inizio_servizio', 'dataInizioServizio', 'Data Inizio Servizio (YYYY-MM-DD)'], toDateString);
  const data_fine_servizio = getFieldValue(rowData, ['Data Fine Servizio', 'data_fine_servizio', 'dataFineServizio', 'Data Fine Servizio (YYYY-MM-DD)'], toDateString);
  const numero_agenti = getFieldValue(rowData, ['Numero Agenti', 'numero_agenti', 'numeroAgenti'], toNumber);

  if (!data_inizio_servizio || !data_fine_servizio || numero_agenti === null) {
    throw new Error('Data Inizio Servizio, Data Fine Servizio, and Numero Agenti are required.');
  }

  let client_id = getFieldValue(rowData, ['ID Cliente', 'client_id', 'clientId', 'ID Cliente (UUID)'], toString);
  client_id = (client_id && isValidUuid(client_id)) ? client_id : null;
  if (!client_id) {
    throw new Error('ID Cliente is required and must be a valid UUID.');
  }

  let punto_servizio_id = getFieldValue(rowData, ['ID Punto Servizio', 'punto_servizio_id', 'puntoServizioId', 'ID Punto Servizio (UUID)'], toString);
  punto_servizio_id = (punto_servizio_id && isValidUuid(punto_servizio_id)) ? punto_servizio_id : null;

  let fornitore_id = getFieldValue(rowData, ['ID Fornitore', 'fornitore_id', 'fornitoreId', 'ID Fornitore (UUID)'], toString);
  fornitore_id = (fornitore_id && isValidUuid(fornitore_id)) ? fornitore_id : null;

  const status = getFieldValue(rowData, ['Status', 'status'], toString) || 'pending'; // Default status

  const mappedData: any = {
    client_id: client_id,
    punto_servizio_id: punto_servizio_id,
    fornitore_id: fornitore_id,
    tipo_servizio: tipo_servizio,
    data_inizio_servizio: data_inizio_servizio,
    data_fine_servizio: data_fine_servizio,
    numero_agenti: numero_agenti,
    note: getFieldValue(rowData, ['Note', 'note'], toString),
    status: status,
    total_hours_calculated: getFieldValue(rowData, ['Total Hours Calculated', 'total_hours_calculated', 'totalHoursCalculated'], toNumber),
  };

  if (tipo_servizio === "APERTURA_CHIUSURA") {
    const tipo_apertura_chiusura_raw = getFieldValue(rowData, ['Tipo Apertura Chiusura', 'tipo_apertura_chiusura', 'tipoAperturaChiusura'], toString);
    const tipo_apertura_chiusura = APERTURA_CHIUSURA_TYPES.find(t => t.label.toLowerCase() === tipo_apertura_chiusura_raw?.toLowerCase())?.value || tipo_apertura_chiusura_raw;
    if (!tipo_apertura_chiusura) {
      throw new Error('Tipo Apertura Chiusura is required for APERTURA_CHIUSURA service type.');
    }
    mappedData.tipo_apertura_chiusura = tipo_apertura_chiusura;
  }

  // Note: Inspection details are handled in a separate table (richieste_servizio_ispezioni)
  // and daily schedules in richieste_servizio_orari_giornalieri.
  // This mapper only handles the main 'richieste_servizio' table.

  return mappedData;
}