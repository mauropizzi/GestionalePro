// @ts-nocheck
import { getFieldValue, toString, toNumber, toBoolean, toDateString, isValidUuid } from '../utils/data-mapping.ts';

/**
 * Mappa i dati di una riga Excel a un formato Rubrica Punti Servizio.
 * @param rowData L'oggetto riga da mappare.
 * @returns Un oggetto Rubrica Punti Servizio.
 * @throws Error se Tipo Recapito o ID Punto Servizio sono mancanti/non validi.
 */
export function mapRubricaPuntiServizioData(rowData: any) {
  const tipo_recapito = getFieldValue(rowData, ['Tipo Recapito', 'tipo_recapito', 'tipoRecapito'], toString);
  if (!tipo_recapito) {
    throw new Error('Tipo Recapito is required and cannot be empty.');
  }

  let punto_servizio_id = getFieldValue(rowData, ['ID Punto Servizio', 'punto_servizio_id', 'puntoServizioId', 'ID Punto Servizio (UUID)'], toString);
  punto_servizio_id = (punto_servizio_id && isValidUuid(punto_servizio_id)) ? punto_servizio_id : null;
  if (!punto_servizio_id) {
    throw new Error('ID Punto Servizio is required and must be a valid UUID.');
  }

  return {
    punto_servizio_id: punto_servizio_id,
    tipo_recapito: tipo_recapito,
    nome_persona: getFieldValue(rowData, ['Nome Persona', 'nome_persona', 'nomePersona'], toString),
    telefono_fisso: getFieldValue(rowData, ['Telefono Fisso', 'telefono_fisso', 'telefonoFisso'], toString),
    telefono_cellulare: getFieldValue(rowData, ['Telefono Cellulare', 'telefono_cellulare', 'telefonoCellulare'], toString),
    email_recapito: getFieldValue(rowData, ['Email Recapito', 'email_recapito', 'emailRecapito'], toString),
    note: getFieldValue(rowData, ['Note', 'note'], toString),
  };
}