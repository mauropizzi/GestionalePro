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

function uniqueText(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

function parseColumns(input: string): string[] {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
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
        throw new Error("Impossibile fare il test INSERT su rubrica_clienti: non esiste alcun Cliente (serve almeno 1 record in clienti). ");
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

function applyExtraColumns(payload: Record<string, unknown>, extraColumns: string[]) {
  for (const col of extraColumns) {
    if (!col) continue;
    if (payload[col] !== undefined) continue;

    // Default: treat as text. Most "diagnostic" columns (like note) are text.
    payload[col] = `Test ${col}`;
  }
}

export async function runSelectTest(table: AnagraficaTable, columnsCsv: string): Promise<PostgrestTestResult> {
  const columns = parseColumns(columnsCsv);
  if (columns.length === 0) {
    return { success: false, error: "Seleziona almeno una colonna da testare (SELECT)." };
  }

  try {
    const { data, error } = await supabase
      .from(table)
      .select(columns.join(","))
      .limit(1);

    if (error) {
      console.error("[postgrest-diagnostics] select test error", { table, columns, error });
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error("[postgrest-diagnostics] select test unexpected error", err);
    return { success: false, error: (err as Error).message };
  }
}

export async function runInsertTest(
  table: AnagraficaTable,
  insertColumnsCsv: string
): Promise<PostgrestTestResult> {
  const extraCols = parseColumns(insertColumnsCsv);
  if (extraCols.length === 0) {
    return { success: false, error: "Seleziona almeno una colonna da testare (INSERT)." };
  }

  try {
    const payload = await buildBaseInsertPayload(table);
    applyExtraColumns(payload, extraCols);

    const { data, error } = await supabase.from(table).insert(payload).select("id").single();

    if (error) {
      console.error("[postgrest-diagnostics] insert test error", { table, payload, error });
      return { success: false, error: error.message };
    }

    const insertedId = (data as any)?.id as string | undefined;
    if (insertedId) {
      await supabase.from(table).delete().eq("id", insertedId);
    }

    return { success: true, data };
  } catch (err) {
    console.error("[postgrest-diagnostics] insert test unexpected error", err);
    return { success: false, error: (err as Error).message };
  }
}
