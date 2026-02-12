"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useSession } from "@/components/session-context-provider";
import { ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { HistoricalSearchFilters } from "@/types/centrale-operativa";
import { useCentraleOperativaData } from "@/hooks/use-centrale-operativa-data";
import {
  alarmEntryFormSchema,
  historicalSearchSchema,
  AlarmEntryFormSchema,
  HistoricalSearchSchema,
} from "@/lib/centrale-operativa-schemas";
import {
  getDefaultAlarmFormValues,
  formatAlarmDataForSubmission,
} from "@/lib/centrale-operativa-utils";
import { CentraleOperativaLayout } from "@/components/centrale-operativa/centrale-operativa-layout";

export default function CentraleOperativaPage() {
  const { profile: currentUserProfile, isLoading: isSessionLoading } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    historicalAlarms,
    loading,
    personaleOptions,
    networkOperatorsOptions,
    puntoServizioOptions,
    fetchDependencies,
    fetchHistoricalAlarms,
  } = useCentraleOperativaData();

  const hasAccess =
    currentUserProfile?.role === "super_admin" ||
    currentUserProfile?.role === "amministrazione" ||
    currentUserProfile?.role === "responsabile_operativo" ||
    currentUserProfile?.role === "operativo";

  const form = useForm<AlarmEntryFormSchema>({
    resolver: zodResolver(alarmEntryFormSchema),
    defaultValues: getDefaultAlarmFormValues(),
  });

  const searchForm = useForm<HistoricalSearchSchema>({
    resolver: zodResolver(historicalSearchSchema),
    defaultValues: {
      from_date: null,
      to_date: null,
      punto_servizio_id: null,
    },
  });

  useEffect(() => {
    if (!isSessionLoading && hasAccess) {
      fetchDependencies();
      fetchHistoricalAlarms();
    }
  }, [isSessionLoading, hasAccess, fetchDependencies, fetchHistoricalAlarms]);

  const handleNewAlarmEntry = async (values: AlarmEntryFormSchema) => {
    setIsSubmitting(true);
    const alarmData = formatAlarmDataForSubmission(values);

    const { error } = await supabase.from("allarme_entries").insert(alarmData);

    if (error) {
      toast.error("Errore durante la registrazione dell'allarme: " + error.message);
    } else {
      toast.success("Allarme registrato con successo!");
      form.reset(getDefaultAlarmFormValues());
      fetchHistoricalAlarms();
    }
    setIsSubmitting(false);
  };

  const onSearchSubmit = (values: HistoricalSearchSchema) => {
    const filters: HistoricalSearchFilters = {
      ...values,
      punto_servizio_id: values.punto_servizio_id === "all" ? null : values.punto_servizio_id,
    };
    fetchHistoricalAlarms(filters);
  };

  if (isSessionLoading) {
    return null;
  }

  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full text-center">
          <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Accesso Negato</h2>
          <p className="text-sm text-muted-foreground">
            Non hai i permessi necessari per visualizzare questa pagina.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <CentraleOperativaLayout
        form={form}
        searchForm={searchForm}
        historicalAlarms={historicalAlarms}
        loading={loading}
        isSubmitting={isSubmitting}
        personaleOptions={personaleOptions}
        networkOperatorsOptions={networkOperatorsOptions}
        puntoServizioOptions={puntoServizioOptions}
        onSubmit={handleNewAlarmEntry}
        onSearchSubmit={onSearchSubmit}
        onHistoricalRefresh={() => fetchHistoricalAlarms()}
      />
    </DashboardLayout>
  );
}