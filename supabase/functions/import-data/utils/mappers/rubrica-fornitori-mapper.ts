// @ts-nocheck
// supabase/functions/import-data/utils/mappers/rubrica-fornitori-mapper.ts
import { getFieldValue, toString, isValidUuid } from '../data-mapping.ts';

export function mapRubricaFornitoriData(rowData: any) {
  const tipo_recapito = getFieldValue(rowData, ['Tipo Recapito', 'tipo_recapito', 'tipoRecapito'], toString);
  if (!tipo_recapito) {
    throw new Error('Tipo Recapito is required and cannot be empty.');
  }

  let fornitore_id = getFieldValue(rowData, ['ID Fornitore', 'fornitore_id', 'fornitoreId', 'ID Fornitore (UUID)'], toString);
  fornitore_id = (fornitore_id && isValidUuid(fornitore_id)) ? fornitore_id : null;
  if (!fornitore_id) {
    throw new Error('ID Fornitore is required and must be a valid UUID.');
  }

  return {
    fornitore_id: fornitore_id,
    tipo_recapito: tipo_recapito,
    nome_persona: getFieldValue(rowData, ['Nome Persona', 'nome_persona', 'nomePersona'], toString),
    telefono_fisso: getFieldValue(rowData, ['Telefono Fisso', 'telefono_fisso', 'telefonoFisso'], toString),
    telefono_cellulare: getFieldValue(rowData, ['Telefono Cellulare', 'telefono_cellulare', 'telefonoCellulare'], toString),
    email_recapito: getFieldValue(rowData, ['Email Recapito', 'email_recapito', 'emailRecapito'], toString),
    note: getFieldValue(rowData, ['Note', 'note'], toString),
  };
}