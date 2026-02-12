"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useSession } from "@/components/session-context-provider";
import { ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlarmEntry, HistoricalSearchFilters } from "@/types/centrale-operativa";
import { useCentraleOperativaData } from "@/hooks/use-centrale-operativa-data";
import {
  alarmEntryFormSchema,
  historicalSearchSchema,
  AlarmEntryFormSchema,
  HistoricalSearchSchema,
} from "@/lib/centrale-operativa-schemas";
import { getDefaultAlarmFormValues, formatAlarmDataForSubmission } from "@/lib/centrale-operativa-utils";
import { CentraleOperativaLayout } from "@/components/centrale-operativa/centrale-operativa-layout";

export default function CentraleOperativaPage() {
  const { profile: currentUserProfile, isLoading: isSessionLoading } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    currentAlarm,
    historicalAlarms,
    loading,
    personaleOptions,
    networkOperatorsOptions,
    puntoServizioOptions,
    fetchDependencies,
    fetchCurrentAlarms,
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
      fetchCurrentAlarms();
      fetchHistoricalAlarms();
    }
  }, [isSessionLoading, hasAccess, fetchDependencies, fetchCurrentAlarms, fetchHistoricalAlarms]);

  useEffect(() => {
    if (currentAlarm) {
      // Populate form with current alarm data for editing
      const { service_type_requested: _ignored, ...alarmRest } = currentAlarm;

      form.reset({
        ...alarmRest,
        registration_date: new Date(alarmRest.registration_date),
        // Usa i minuti salvati nella nuova colonna, se presenti
        intervention_due_by:
          (alarmRest as any).intervention_due_minutes !== undefined &&
          (alarmRest as any).intervention_due_minutes !== null
            ? Number((alarmRest as any).intervention_due_minutes)
            : null,
        request_time_co: alarmRest.request_time_co || "",
        intervention_start_time: alarmRest.intervention_start_time || null,
        intervention_end_time: alarmRest.intervention_end_time || null,
        intervention_start_lat: alarmRest.intervention_start_lat || null,
        intervention_start_long: alarmRest.intervention_start_long || null,
        intervention_start_full_timestamp: alarmRest.intervention_start_full_timestamp ? new Date(alarmRest.intervention_start_full_timestamp) : null,
        intervention_end_lat: alarmRest.intervention_end_lat || null,
        intervention_end_long: alarmRest.intervention_end_long || null,
        intervention_end_full_timestamp: alarmRest.intervention_end_full_timestamp ? new Date(alarmRest.intervention_end_full_timestamp) : null,
        full_site_access: alarmRest.full_site_access || false,
        caveau_access: alarmRest.caveau_access || false,
        network_operator_id: alarmRest.network_operator_id || null,
        gpg_intervention_made: alarmRest.gpg_intervention_made || false,
        anomalies_found: alarmRest.anomalies_found || null,
        delay_minutes: alarmRest.delay_minutes || null,
        service_outcome: alarmRest.service_outcome || null,
        client_request_barcode: alarmRest.client_request_barcode || null,
      });
    }
  }, [currentAlarm, form]);

  const handleNewAlarmEntry = async (values: AlarmEntryFormSchema) => {
    setIsSubmitting(true);
    const alarmData = formatAlarmDataForSubmission(values);

    const { error } = await supabase
      .from("allarme_entries")
      .insert(alarmData);

    if (error) {
      toast.error("Errore durante la registrazione dell'allarme: " + error.message);
    } else {
      toast.success("Allarme registrato con successo!");
      form.reset(getDefaultAlarmFormValues());
      fetchCurrentAlarms();
      fetchHistoricalAlarms();
    }
    setIsSubmitting(false);
  };

  const handleUpdateAlarmEntry = async (values: AlarmEntryFormSchema) => {
    if (!currentAlarm) return;

    setIsSubmitting(true);
    const alarmData = formatAlarmDataForSubmission(values);
    // Remove created_at for updates
    const { created_at, ...updateData } = alarmData;

    const { error } = await supabase
      .from("allarme_entries")
      .update(updateData)
      .eq("id", currentAlarm.id);

    if (error) {
      toast.error("Errore durante l'aggiornamento dell'allarme: " + error.message);
    } else {
      toast.success("Allarme aggiornato con successo!");
      fetchCurrentAlarms();
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

  const handleFormSubmit = currentAlarm ? handleUpdateAlarmEntry : handleNewAlarmEntry;

  if (isSessionLoading) {
    return null;
  }

  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full text-center">
          <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Accesso Negato</h2>
          <p className="text-sm text-muted-foreground">Non hai i permessi necessari per visualizzare questa pagina.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <CentraleOperativaLayout
        form={form}
        searchForm={searchForm}
        currentAlarm={currentAlarm}
        historicalAlarms={historicalAlarms}
        loading={loading}
        isSubmitting={isSubmitting}
        personaleOptions={personaleOptions}
        networkOperatorsOptions={networkOperatorsOptions}
        puntoServizioOptions={puntoServizioOptions}
        onSubmit={handleFormSubmit}
        onSearchSubmit={onSearchSubmit}
      />
    </DashboardLayout>
  );
}