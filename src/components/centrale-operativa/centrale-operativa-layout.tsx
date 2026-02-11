import React from "react";
import { BellRing, History } from "lucide-react";
import { AlarmEntryFormSchema, HistoricalSearchSchema } from "@/lib/centrale-operativa-schemas";
import { AlarmEntry, HistoricalSearchFilters } from "@/types/centrale-operativa";
import { Personale, NetworkOperator } from "@/types/anagrafiche";
import { PuntoServizio } from "@/types/richieste-servizio";
import { AlarmRegistrationForm } from "./alarm-registration-form";
import { HistoricalSearchForm } from "./historical-search-form";
import { HistoricalAlarmsTable } from "./historical-alarms-table";
import { Loader2 } from "lucide-react";

interface CentraleOperativaLayoutProps {
  form: any; // UseFormReturn<AlarmEntryFormSchema>
  searchForm: any; // UseFormReturn<HistoricalSearchSchema>
  currentAlarm: AlarmEntry | null;
  historicalAlarms: AlarmEntry[];
  loading: boolean;
  isSubmitting: boolean;
  personaleOptions: Personale[];
  networkOperatorsOptions: NetworkOperator[];
  puntoServizioOptions: PuntoServizio[];
  onSubmit: (data: AlarmEntryFormSchema) => void;
  onSearchSubmit: (data: HistoricalSearchSchema) => void;
}

export function CentraleOperativaLayout({
  form,
  searchForm,
  currentAlarm,
  historicalAlarms,
  loading,
  isSubmitting,
  personaleOptions,
  networkOperatorsOptions,
  puntoServizioOptions,
  onSubmit,
  onSearchSubmit,
}: CentraleOperativaLayoutProps) {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-4">Centrale Operativa</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Gestione delle ispezioni e degli allarmi in tempo reale e storico.
      </p>

      {/* Sezione Registrazione Servizi */}
      <div className="p-6 border rounded-lg shadow-sm mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <BellRing className="h-5 w-5 mr-2" /> Registrazione Servizi
        </h2>
        <AlarmRegistrationForm
          form={form}
          isSubmitting={isSubmitting}
          personaleOptions={personaleOptions}
          networkOperatorsOptions={networkOperatorsOptions}
          onSubmit={onSubmit}
          submitButtonText={currentAlarm ? "Aggiorna Allarme" : "Registra Allarme"}
        />
      </div>

      {/* Sezione Storico Servizi */}
      <div className="p-6 border rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <History className="h-5 w-5 mr-2" /> Storico Servizi
        </h2>
        <HistoricalSearchForm
          form={searchForm}
          puntoServizioOptions={puntoServizioOptions}
          onSubmit={onSearchSubmit}
          loading={loading}
        />

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : historicalAlarms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
            <History className="h-10 w-10 mb-3" />
            <p className="text-sm">Nessun allarme storico trovato con i filtri selezionati.</p>
          </div>
        ) : (
          <HistoricalAlarmsTable alarms={historicalAlarms} />
        )}
      </div>
    </div>
  );
}