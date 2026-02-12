"use client";

import React, { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { AlarmEntry } from "@/types/centrale-operativa";
import { Personale, NetworkOperator } from "@/types/anagrafiche";
import {
  alarmEntryFormSchema,
  AlarmEntryFormSchema,
} from "@/lib/centrale-operativa-schemas";
import {
  formatAlarmDataForSubmission,
  getDefaultAlarmFormValues,
} from "@/lib/centrale-operativa-utils";
import { AlarmRegistrationForm } from "@/components/centrale-operativa/alarm-registration-form";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";

type Mode = "view" | "edit";

interface HistoricalAlarmDialogProps {
  alarm: AlarmEntry | null;
  mode: Mode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personaleOptions: Personale[];
  networkOperatorsOptions: NetworkOperator[];
  onUpdated: () => void;
}

export function HistoricalAlarmDialog({
  alarm,
  mode,
  open,
  onOpenChange,
  personaleOptions,
  networkOperatorsOptions,
  onUpdated,
}: HistoricalAlarmDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AlarmEntryFormSchema>({
    resolver: zodResolver(alarmEntryFormSchema),
    defaultValues: getDefaultAlarmFormValues(),
  });

  // reset form when alarm changes
  React.useEffect(() => {
    if (!alarm) return;

    form.reset({
      registration_date: new Date(alarm.registration_date),
      punto_servizio_id: alarm.punto_servizio_id,
      // UI minutes stored in intervention_due_minutes
      intervention_due_by: (alarm as any).intervention_due_minutes ?? null,
      operator_co_id: alarm.operator_co_id,
      request_time_co: alarm.request_time_co,
      intervention_start_time: alarm.intervention_start_time,
      intervention_end_time: alarm.intervention_end_time,

      // UI-only fields (non in DB)
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
  }, [alarm, form]);

  const title = mode === "edit" ? "Modifica allarme" : "Visualizza allarme";

  const handleUpdate = async (values: AlarmEntryFormSchema) => {
    if (!alarm) return;

    setIsSubmitting(true);
    const payload = formatAlarmDataForSubmission(values) as any;
    const { created_at, ...updateData } = payload;

    const { error } = await supabase
      .from("allarme_entries")
      .update(updateData)
      .eq("id", alarm.id);

    if (error) {
      toast.error("Errore durante la modifica: " + error.message);
    } else {
      toast.success("Allarme modificato.");
      onOpenChange(false);
      onUpdated();
    }
    setIsSubmitting(false);
  };

  const viewRows = useMemo(() => {
    if (!alarm) return [];
    return [
      {
        label: "Data registrazione",
        value: format(parseISO(alarm.registration_date), "dd/MM/yyyy", { locale: it }),
      },
      {
        label: "Punto servizio",
        value: alarm.punti_servizio?.nome_punto_servizio || "N/A",
      },
      {
        label: "Operatore C.O.",
        value: alarm.personale ? `${alarm.personale.nome} ${alarm.personale.cognome}` : "N/A",
      },
      { label: "Orario richiesta C.O.", value: alarm.request_time_co },
      { label: "Inizio intervento", value: alarm.intervention_start_time || "N/A" },
      { label: "Fine intervento", value: alarm.intervention_end_time || "N/A" },
      {
        label: "Ritardo (min)",
        value: alarm.delay_minutes !== null ? String(alarm.delay_minutes) : "N/A",
      },
      { label: "Esito", value: alarm.service_outcome || "N/A" },
      { label: "Anomalie", value: alarm.anomalies_found || "N/A" },
      { label: "Barcode", value: alarm.client_request_barcode || "N/A" },
    ];
  }, [alarm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {!alarm ? (
          <div className="text-sm text-muted-foreground">Nessun allarme selezionato.</div>
        ) : mode === "view" ? (
          <ScrollArea className="max-h-[75vh] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {viewRows.map((r) => (
                <div key={r.label} className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">{r.label}</div>
                  <div className="text-sm font-medium break-words">{r.value}</div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <ScrollArea className="max-h-[75vh] pr-4">
            <AlarmRegistrationForm
              form={form}
              isSubmitting={isSubmitting}
              personaleOptions={personaleOptions}
              networkOperatorsOptions={networkOperatorsOptions}
              onSubmit={handleUpdate}
              submitButtonText="Salva modifiche"
            />
            <div className="mt-3 flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Chiudi
              </Button>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
