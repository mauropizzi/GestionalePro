import { getFieldValue, toString, isValidUuid } from '../data-mapping.ts';

export function mapRubricaClientiData(rowData: any) {
  const tipo_recapito = getFieldValue(rowData, ['Tipo Recapito', 'tipo_recapito', 'tipoRecapito'], toString);
  if (!tipo_recapito) throw new Error('Tipo Recapito is required.');

  let client_id = getFieldValue(rowData, ['ID Cliente', 'client_id', 'clientId', 'ID Cliente (UUID)'], toString);
  if (!client_id || !isValidUuid(client_id)) throw new Error('Valid ID Cliente is required.');

  return {
    client_id,
    tipo_recapito,
    nome_persona: getFieldValue(rowData, ['Nome Persona', 'nome_persona', 'nomePersona'], toString),
    telefono_fisso: getFieldValue(rowData, ['Telefono Fisso', 'telefono_fisso', 'telefonoFisso'], toString),
    telefono_cellulare: getFieldValue(rowData, ['Telefono Cellulare', 'telefono_cellulare', 'telefonoCellulare'], toString),
    email_recapito: getFieldValue(rowData, ['Email Recapito', 'email_recapito', 'emailRecapito'], toString),
    note: getFieldValue(rowData, ['Note', 'note'], toString),
  };
}