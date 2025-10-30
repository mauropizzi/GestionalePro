// @ts-nocheck
// supabase/functions/import-data/utils/mappers/rubrica-clienti-mapper.ts
import { getFieldValue, toString, isValidUuid } from '../data-mapping.ts';

export function mapRubricaClientiData(rowData: any) {
  const tipo_recapito = getFieldValue(rowData, ['Tipo Recapito', 'tipo_recapito', 'tipoRecapito'], toString);
  if (!tipo_recapito) {
    throw new Error('Tipo Recapito is required and cannot be empty.');
  }

  let client_id = getFieldValue(rowData, ['ID Cliente', 'client_id', 'clientId', 'ID Cliente (UUID)'], toString);
  client_id = (client_id && isValidUuid(client_id)) ? client_id : null;
  if (!client_id) {
    throw new Error('ID Cliente is required and must be a valid UUID.');
  }

  return {
    client_id: client_id,
    tipo_recapito: tipo_recapito,
    nome_persona: getFieldValue(rowData, ['Nome Persona', 'nome_persona', 'nomePersona'], toString),
    telefono_fisso: getFieldValue(rowData, ['Telefono Fisso', 'telefono_fisso', 'telefonoFisso'], toString),
    telefono_cellulare: getFieldValue(rowData, ['Telefono Cellulare', 'telefono_cellulare', 'telefonoCellulare'], toString),
    email_recapito: getFieldValue(rowData, ['Email Recapito', 'email_recapito', 'emailRecapito'], toString),
    note: getFieldValue(rowData, ['Note', 'note'], toString),
  };
}