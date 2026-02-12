"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useSession } from "@/components/session-context-provider";
import { ShieldAlert, Siren } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  alarmEntryFormSchema,
  AlarmEntryFormSchema,
} from "@/lib/centrale-operativa-schemas";
import {
  formatAlarmDataForSubmission,
  getDefaultAlarmFormValues,
} from "@/lib/centrale-operativa-utils";
import { AlarmRegistrationForm } from "@/components/centrale-operativa/alarm-registration-form";
import { OpenAlarmsTable } from "@/components/gestione-allarmi/open-alarms-table";
import { useCentraleOperativaData } from "@/hooks/use-centrale-operativa-data";
import { AlarmEntry } from "@/types/centrale-operativa";

export default function GestioneAllarmiPage() {
  const { profile: currentUserProfile, isLoading: isSessionLoading } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openAlarms, setOpenAlarms] = useState<AlarmEntry[]>([]);
  const [selectedAlarm, setSelectedAlarm] = useState<AlarmEntry | null>(null);

  const {
    personaleOptions,
    networkOperatorsOptions,
    fetchDependencies,
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

  const fetchOpenAlarms = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("allarme_entries")
      .select(`
        *,
        punti_servizio(nome_punto_servizio),
        personale!allarme_entries_operator_co_id_fkey(nome, cognome),
        operatori_network(nome, cognome)
      `)
      .is("service_outcome", null)
      .order("registration_date", { ascending: false })
      .limit(100);

    if (error) {
      toast.error("Errore nel recupero degli allarmi aperti: " + error.message);
      setOpenAlarms([]);
    } else {
      setOpenAlarms(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isSessionLoading && hasAccess) {
      fetchDependencies();
      fetchOpenAlarms();
    }
  }, [isSessionLoading, hasAccess, fetchDependencies, fetchOpenAlarms]);

  const selectAlarm = useCallback(
    (alarm: AlarmEntry) => {
      setSelectedAlarm(alarm);

      form.reset({
        registration_date: new Date(alarm.registration_date),
        punto_servizio_id: alarm.punto_servizio_id,
        // UI minutes stored in intervention_due_minutes
        intervention_due_by: (alarm as any).intervention_due_minutes ?? null,
        operator_co_id: alarm.operator_co_id,
        request_time_co: alarm.request_time_co,
        intervention_start_time: alarm.intervention_start_time,
        intervention_end_time: alarm.intervention_end_time,

        // UI-only fields
        intervention_start_lat: null,
        intervention_start_long: null,
        intervention_start_full_timestamp: null,
        intervention_end_lat: null,
        intervention_end_long: null,
        intervention_end_full_timestamp: null,

        full_site_access: alarm.full_site_access,
        caveau_access: alarm.caveau_access,
        network_operator_id: alarm.network_operator_id,

        gpg_personale_id: (alarm as any).gpg_personale_id ?? null,
        gpg_intervention_made: Boolean((alarm as any).gpg_personale_id),

        anomalies_found: alarm.anomalies_found,
        delay_minutes: alarm.delay_minutes,
        service_outcome: alarm.service_outcome,
        client_request_barcode: alarm.client_request_barcode,
      });
    },
    [form]
  );

  const handleUpdateAlarm = async (values: AlarmEntryFormSchema) => {
    if (!selectedAlarm) {
      toast.error("Seleziona un allarme da gestire.");
      return;
    }

    setIsSubmitting(true);
    const alarmData = formatAlarmDataForSubmission(values);

    // In aggiornamento non vogliamo sovrascrivere created_at
    const { created_at, ...updateData } = alarmData as any;

    const { error } = await supabase
      .from("allarme_entries")
      .update(updateData)
      .eq("id", selectedAlarm.id);

    if (error) {
      toast.error("Errore durante l'aggiornamento dell'allarme: " + error.message);
    } else {
      toast.success("Allarme aggiornato!");
      // Se è stato impostato un esito, l'allarme esce dalla lista degli aperti
      await fetchOpenAlarms();
      setSelectedAlarm(null);
      form.reset(getDefaultAlarmFormValues());
    }

    setIsSubmitting(false);
  };

  const selectedId = selectedAlarm?.id ?? null;

  if (isSessionLoading) return null;

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
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Siren className="h-6 w-6" /> Gestione Allarmi
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Qui trovi gli allarmi registrati senza esito (allarmi aperti) e puoi completarli.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Allarmi aperti</h2>
            {loading ? (
              <div className="rounded-md border p-6 text-sm text-muted-foreground">Caricamento...</div>
            ) : (
              <OpenAlarmsTable alarms={openAlarms} selectedId={selectedId} onSelect={selectAlarm} />
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Dettaglio / aggiornamento</h2>
            <div className="rounded-md border p-4">
              {selectedAlarm ? (
                <AlarmRegistrationForm
                  form={form}
                  isSubmitting={isSubmitting}
                  personaleOptions={personaleOptions}
                  networkOperatorsOptions={networkOperatorsOptions}
                  onSubmit={handleUpdateAlarm}
                  submitButtonText="Aggiorna Allarme"
                />
              ) : (
                <div className="text-sm text-muted-foreground">
                  Seleziona un allarme dalla lista per gestirlo.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
