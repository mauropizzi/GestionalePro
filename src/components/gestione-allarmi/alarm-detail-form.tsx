"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlarmRegistrationForm } from "@/components/centrale-operativa/alarm-registration-form";
import { alarmEntryFormSchema, AlarmEntryFormSchema } from "@/lib/centrale-operativa-schemas";
import { getDefaultAlarmFormValues } from "@/lib/centrale-operativa-utils";
import { Personale, NetworkOperator } from "@/types/anagrafiche";
import { AlarmEntry } from "@/types/centrale-operativa";

interface AlarmDetailFormProps {
  selectedAlarm: AlarmEntry;
  isSubmitting: boolean;
  personaleOptions: Personale[];
  networkOperatorsOptions: NetworkOperator[];
  onSubmit: (values: AlarmEntryFormSchema) => void;
}

export function AlarmDetailForm({
  selectedAlarm,
  isSubmitting,
  personaleOptions,
  networkOperatorsOptions,
  onSubmit,
}: AlarmDetailFormProps) {
  // Create a dedicated form instance per mounted detail (isolates state)
  const form = useForm<AlarmEntryFormSchema>({
    resolver: zodResolver(alarmEntryFormSchema),
    defaultValues: getDefaultAlarmFormValues(),
    mode: "onChange",
  });

  useEffect(() => {
    if (!selectedAlarm) return;

    form.reset({
      registration_date: new Date(selectedAlarm.registration_date),
      punto_servizio_id: selectedAlarm.punto_servizio_id,
      intervention_due_by: (selectedAlarm as any).intervention_due_minutes ?? null,
      operator_co_id: selectedAlarm.operator_co_id,
      request_time_co: selectedAlarm.request_time_co,
      intervention_start_time: selectedAlarm.intervention_start_time,
      intervention_end_time: selectedAlarm.intervention_end_time,

      // UI-only fields
      intervention_start_lat: null,
      intervention_start_long: null,
      intervention_start_full_timestamp: null,
      intervention_end_lat: null,
      intervention_end_long: null,
      intervention_end_full_timestamp: null,

      full_site_access: selectedAlarm.full_site_access,
      caveau_access: selectedAlarm.caveau_access,
      network_operator_id: selectedAlarm.network_operator_id,

      gpg_personale_id: (selectedAlarm as any).gpg_personale_id ?? null,
      gpg_intervention_made: Boolean((selectedAlarm as any).gpg_personale_id),

      anomalies_found: selectedAlarm.anomalies_found,
      delay_minutes: selectedAlarm.delay_minutes,
      service_outcome: selectedAlarm.service_outcome,
      client_request_barcode: selectedAlarm.client_request_barcode,
    });
  }, [selectedAlarm.id]);

  return (
    <AlarmRegistrationForm
      form={form}
      isSubmitting={isSubmitting}
      personaleOptions={personaleOptions}
      networkOperatorsOptions={networkOperatorsOptions}
      onSubmit={onSubmit}
      submitButtonText="Aggiorna Allarme"
    />
  );
}

export default AlarmDetailForm;