"use client";

import { supabase } from "@/integrations/supabase/client";

export type PostgrestTestResult = {
  success: boolean;
  error?: string;
  data?: unknown;
};

export type AnagraficaTable =
  | "clienti"
  | "fornitori"
  | "punti_servizio"
  | "personale"
  | "operatori_network"
  | "procedure"
  | "tariffe"
  | "rubrica_clienti"
  | "rubrica_fornitori"
  | "rubrica_punti_servizio";

export type ColumnInfo = {
  column_name: string;
  data_type: string;
  is_nullable: "YES" | "NO";
  column_default: string | null;
};

export const ANAGRAFICA_TABLE_OPTIONS: { value: AnagraficaTable; label: string }[] = [
  { value: "clienti", label: "Clienti" },
  { value: "fornitori", label: "Fornitori" },
  { value: "punti_servizio", label: "Punti Servizio" },
  { value: "personale", label: "Personale" },
  { value: "operatori_network", label: "Operatori Network" },
  { value: "procedure", label: "Procedure" },
  { value: "tariffe", label: "Tariffe" },
  { value: "rubrica_punti_servizio", label: "Rubrica Punti Servizio" },
  { value: "rubrica_clienti", label: "Rubrica Clienti" },
  { value: "rubrica_fornitori", label: "Rubrica Fornitori" },
];

const EXCLUDED_INSERT_COLUMNS = new Set([
  "id",
  "created_at",
  "updated_at",
]);

function uniqueText(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

async function getFirstId(table: "clienti" | "fornitori" | "punti_servizio") {
  const { data, error } = await supabase.from(table).select("id").limit(1).maybeSingle();
  if (error) throw error;
  return (data as any)?.id as string | undefined;
}

async function buildBaseInsertPayload(table: AnagraficaTable): Promise<Record<string, unknown>> {
  switch (table) {
    case "clienti":
      return { ragione_sociale: uniqueText("Test Cliente") };
    case "fornitori":
      return { ragione_sociale: uniqueText("Test Fornitore") };
    case "punti_servizio":
      return { nome_punto_servizio: uniqueText("Test Punto Servizio") };
    case "personale":
      return { nome: "Test", cognome: uniqueText("Personale") };
    case "operatori_network":
      return { nome: "Test", cognome: uniqueText("Operatore"), email: `${uniqueText("test")}@example.com` };
    case "procedure":
      return { nome_procedura: uniqueText("Test Procedura") };
    case "tariffe":
      return { tipo_servizio: "Test", importo: 1 };

    case "rubrica_clienti": {
      const clientId = await getFirstId("clienti");
      if (!clientId) {
        throw new Error(
          "Impossibile fare il test INSERT su rubrica_clienti: non esiste alcun Cliente (serve almeno 1 record in clienti)."
        );
      }
      return { client_id: clientId, tipo_recapito: "Test" };
    }

    case "rubrica_fornitori": {
      const fornitoreId = await getFirstId("fornitori");
      if (!fornitoreId) {
        throw new Error(
          "Impossibile fare il test INSERT su rubrica_fornitori: non esiste alcun Fornitore (serve almeno 1 record in fornitori)."
        );
      }
      return { fornitore_id: fornitoreId, tipo_recapito: "Test" };
    }

    case "rubrica_punti_servizio": {
      const puntoId = await getFirstId("punti_servizio");
      if (!puntoId) {
        throw new Error(
          "Impossibile fare il test INSERT su rubrica_punti_servizio: non esiste alcun Punto Servizio (serve almeno 1 record in punti_servizio)."
        );
      }
      return { punto_servizio_id: puntoId, tipo_recapito: "Test" };
    }
  }
}

export async function runSelectAllColumns(table: AnagraficaTable, columns: ColumnInfo[]): Promise<PostgrestTestResult> {
  const names = columns.map((c) => c.column_name);
  if (names.length === 0) {
    return { success: false, error: "Nessuna colonna trovata per la tabella selezionata." };
  }

  try {
    const { data, error } = await supabase.from(table).select(names.join(",")).limit(1);
    if (error) {
      console.error("[postgrest-diagnostics] select-all error", { table, error });
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err) {
    console.error("[postgrest-diagnostics] select-all unexpected", err);
    return { success: false, error: (err as Error).message };
  }
}

export async function runInsertAllColumns(table: AnagraficaTable, columns: ColumnInfo[]): Promise<PostgrestTestResult> {
  try {
    const payload = await buildBaseInsertPayload(table);

    for (const col of columns) {
      const name = col.column_name;
      if (EXCLUDED_INSERT_COLUMNS.has(name)) continue;
      if (name in payload) continue;

      // We include as many columns as possible just to validate they exist in PostgREST schema.
      // To keep the test safe, we only set NULL for nullable columns.
      if (col.is_nullable === "YES") {
        (payload as any)[name] = null;
      }
    }

    const { data, error } = await supabase.from(table).insert(payload).select("id").single();
    if (error) {
      console.error("[postgrest-diagnostics] insert-all error", { table, error });
      return { success: false, error: error.message };
    }

    const insertedId = (data as any)?.id as string | undefined;
    if (insertedId) {
      await supabase.from(table).delete().eq("id", insertedId);
    }

    return { success: true, data };
  } catch (err) {
    console.error("[postgrest-diagnostics] insert-all unexpected", err);
    return { success: false, error: (err as Error).message };
  }
}