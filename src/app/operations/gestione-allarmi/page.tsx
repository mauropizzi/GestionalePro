"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useSession } from "@/components/session-context-provider";
import { ShieldAlert, Siren } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { alarmEntryFormSchema, AlarmEntryFormSchema } from "@/lib/centrale-operativa-schemas";
import {
  formatAlarmDataForSubmission,
  getDefaultAlarmFormValues,
} from "@/lib/centrale-operativa-utils";
import { AlarmDetailForm } from "@/components/gestione-allarmi/alarm-detail-form";
import { OpenAlarmsTable } from "@/components/gestione-allarmi/open-alarms-table";
import { useCentraleOperativaData } from "@/hooks/use-centrale-operativa-data";
import { AlarmEntry } from "@/types/centrale-operativa";

function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`timeout_${ms}ms`)), ms)
    ),
  ]);
}

export default function GestioneAllarmiPage() {
  const { profile: currentUserProfile, isLoading: isSessionLoading } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // loading = solo per il primo caricamento (schermata vuota)
  const [loading, setLoading] = useState(true);
  // refreshing = refetch non bloccante (la tabella resta visibile)
  const [refreshing, setRefreshing] = useState(false);

  const [openAlarms, setOpenAlarms] = useState<AlarmEntry[]>([]);
  const [selectedAlarm, setSelectedAlarm] = useState<AlarmEntry | null>(null);

  const openAlarmsRef = useRef<AlarmEntry[]>([]);
  useEffect(() => {
    openAlarmsRef.current = openAlarms;
  }, [openAlarms]);

  const fetchSeq = useRef(0);

  const { personaleOptions, networkOperatorsOptions, fetchDependencies } = useCentraleOperativaData();

  const hasAccess =
    currentUserProfile?.role === "super_admin" ||
    currentUserProfile?.role === "amministrazione" ||
    currentUserProfile?.role === "responsabile_operativo" ||
    currentUserProfile?.role === "operativo";

  const form = useForm<AlarmEntryFormSchema>({
    resolver: zodResolver(alarmEntryFormSchema),
    defaultValues: getDefaultAlarmFormValues(),
  });

  // FIX: reset del form DOPO che il dettaglio è montato (evita campi che si aggiornano solo al focus)
  useEffect(() => {
    if (!selectedAlarm) return;

    const alarm = selectedAlarm;

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
  }, [selectedAlarm?.id, form]);

  const fetchOpenAlarms = useCallback(async () => {
    const seq = ++fetchSeq.current;

    // Non bloccare la tabella durante i refetch (es. dopo ritorno da WhatsApp)
    const shouldBlockUi = openAlarmsRef.current.length === 0;
    if (shouldBlockUi) setLoading(true);
    else setRefreshing(true);

    try {
      const query = supabase
        .from("allarme_entries")
        .select(`
          *,
          punti_servizio(nome_punto_servizio),
          pattuglia:personale!gpg_personale_id(nome, cognome, telefono)
        `)
        .is("service_outcome", null)
        .order("registration_date", { ascending: false })
        .limit(100);

      // Evita spinner infinito: se la fetch rimane appesa (capita dopo aperture esterne tipo WhatsApp)
      const result = (await withTimeout(query as any, 12000)) as any;
      const { data, error } = result;

      if (error) {
        console.error("[gestione-allarmi] fetchOpenAlarms error", error);
        toast.error("Errore nel recupero degli allarmi aperti: " + error.message);
        // Mantieni i dati già presenti (non svuotare la tabella)
      } else {
        console.debug("[gestione-allarmi] fetchOpenAlarms result", { count: (data || []).length });
        if (fetchSeq.current === seq) setOpenAlarms((data || []) as any);
      }
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (msg.startsWith("timeout_")) {
        toast.error("Caricamento allarmi troppo lento. Riprova tra qualche secondo.");
      } else {
        console.error("[gestione-allarmi] fetchOpenAlarms unexpected", err);
        toast.error("Errore nel recupero degli allarmi aperti");
      }
    } finally {
      if (fetchSeq.current === seq) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!isSessionLoading && hasAccess) {
      fetchDependencies();
      fetchOpenAlarms();

      // Re-fetch when window/tab regains focus (helps after navigation)
      const onFocus = () => {
        if (hasAccess) fetchOpenAlarms();
      };
      window.addEventListener("focus", onFocus);
      return () => window.removeEventListener("focus", onFocus);
    }
  }, [isSessionLoading, hasAccess, fetchDependencies, fetchOpenAlarms]);

  const selectAlarm = useCallback((alarm: AlarmEntry) => {
    // FIX: niente reset qui (prima il dettaglio non è montato)
    setSelectedAlarm(alarm);
  }, []);

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
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Allarmi aperti</h2>
              {refreshing && (
                <div className="text-xs text-muted-foreground">Aggiornamento…</div>
              )}
            </div>

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
                <AlarmDetailForm
                  key={selectedAlarm.id}
                  selectedAlarm={selectedAlarm}
                  isSubmitting={isSubmitting}
                  personaleOptions={personaleOptions}
                  networkOperatorsOptions={networkOperatorsOptions}
                  onSubmit={handleUpdateAlarm}
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