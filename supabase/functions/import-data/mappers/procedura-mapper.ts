// @ts-nocheck
// supabase/functions/import-data/mappers/procedura-mapper.ts
import { getFieldValue, toString, toBoolean, toDateString } from '../utils/data-mapping.ts';

export function mapProceduraData(rowData: any) {
  const nome_procedura = getFieldValue(rowData, ['Nome Procedura', 'nome_procedura', 'nomeProcedura'], toString);
  if (!nome_procedura) {
    throw new Error('Nome Procedura is required and cannot be empty.');
  }

  return {
    nome_procedura: nome_procedura,
    descrizione: getFieldValue(rowData, ['Descrizione', 'descrizione'], toString),
    versione: getFieldValue(rowData, ['Versione', 'versione'], toString),
    data_ultima_revisione: getFieldValue(rowData, ['Data Ultima Revisione', 'data_ultima_revisione', 'dataUltimaRevisione', 'Data Ultima Revisione (YYYY-MM-DD)'], toDateString),
    responsabile: getFieldValue(rowData, ['Responsabile', 'responsabile'], toString),
    documento_url: getFieldValue(rowData, ['URL Documento', 'documento_url', 'documentoUrl'], toString),
    attivo: getFieldValue(rowData, ['Attivo', 'attivo', 'Attivo (TRUE/FALSE)'], toBoolean),
    note: getFieldValue(rowData, ['Note', 'note'], toString),
  };
}