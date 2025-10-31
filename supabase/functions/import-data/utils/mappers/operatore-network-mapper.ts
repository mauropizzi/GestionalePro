// @ts-nocheck
// supabase/functions/import-data/utils/mappers/operatore-network-mapper.ts
import { getFieldValue, toString, toNumber, toBoolean, toDateString, isValidUuid } from '../data-mapping.ts';

export function mapOperatoreNetworkData(rowData: any) {
  const nome = getFieldValue(rowData, ['Nome', 'nome'], toString);
  const cognome = getFieldValue(rowData, ['Cognome', 'cognome'], toString);
  if (!nome || !cognome) {
    throw new Error('Nome and Cognome are required and cannot be empty.');
  }

  let cliente_id = getFieldValue(rowData, ['ID Cliente', 'id_cliente', 'idCliente', 'ID Cliente (UUID)'], toString);
  cliente_id = (cliente_id && isValidUuid(cliente_id)) ? cliente_id : null;

  return {
    nome: nome,
    cognome: cognome,
    cliente_id: cliente_id,
    telefono: getFieldValue(rowData, ['Telefono', 'telefono'], toString),
    email: getFieldValue(rowData, ['Email', 'email'], toString),
    note: getFieldValue(rowData, ['Note', 'note'], toString),
  };
}