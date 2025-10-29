// @ts-nocheck
// supabase/functions/import-data/mappers/operatore-network-mapper.ts
import { getFieldValue, toString, isValidUuid } from '../utils/data-mapping.ts';

export function mapOperatoreNetworkData(rowData: any) {
  const nome = getFieldValue(rowData, ['Nome', 'nome'], toString);
  const cognome = getFieldValue(rowData,<think>**Advancing Data Mapping**

I'm back on track, continuing the refactoring. My focus now is on finishing the `operator-network-mapper.ts` file, part of the `import-data` Supabase Edge Function. Then, I will address the remaining mappers and move forward.


**Completing Mapper Files**

I'm now back at the coding table, ready to finalize the remaining mapper files for the `import-data` Supabase Edge Function. I'm aiming to conclude `operator-network-mapper.ts` shortly and then tackle the rest, before finally updating `index.ts`.


</think>Perfetto! Continuiamo con la modularizzazione. Ho interrotto a metà la creazione del file `operatore-network-mapper.ts`. Lo completerò e poi procederò con i mapper rimanenti e l'aggiornamento del file `index.ts`.

<dyad-write path="supabase/functions/import-data/mappers/operatore-network-mapper.ts" description="Completing operatore-network-mapper file for Supabase Edge Function.">
// @ts-nocheck
// supabase/functions/import-data/mappers/operatore-network-mapper.ts
import { getFieldValue, toString, isValidUuid } from '../utils/data-mapping.ts';

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