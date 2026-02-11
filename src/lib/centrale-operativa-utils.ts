import { format } from "date-fns";
import { it } from "date-fns/locale";
import { AlarmEntryFormSchema } from "./centrale-operativa-schemas";

export function getDefaultAlarmFormValues(): AlarmEntryFormSchema {
  return {
    registration_date: new Date(),
    punto_servizio_id: null,
    intervention_due_by: null,
    operator_co_id: null,
    request_time_co: format(new Date(), "HH:mm"),
    intervention_start_time: null,
    intervention_end_time: null,
    intervention_start_lat: null,
    intervention_start_long: null,
    intervention_start_full_timestamp: null,
    intervention_end_lat: null,
    intervention_end_long: null,
    intervention_end_full_timestamp: null,
    full_site_access: false,
    caveau_access: false,
    network_operator_id: null,
    gpg_intervention_made: false,
    anomalies_found: null,
    delay_minutes: null,
    service_outcome: null,
    client_request_barcode: null,
  };
}

export function formatAlarmDataForSubmission(values: AlarmEntryFormSchema) {
  const now = new Date().toISOString();
  return {
    ...values,
    registration_date: format(values.registration_date, "yyyy-MM-dd"),
    // Imposta automaticamente il tipo servizio richiesto per la tabella (NOT NULL)
    service_type_requested: "Allarme",
    // intervention_due_by è un numero di minuti (o null)
    intervention_due_by: values.intervention_due_by === null ? null : values.intervention_due_by,
    intervention_start_full_timestamp: values.intervention_start_full_timestamp?.toISOString() || null,
    intervention_end_full_timestamp: values.intervention_end_full_timestamp?.toISOString() || null,
    operator_co_id: values.operator_co_id === "" ? null : values.operator_co_id,
    network_operator_id: values.network_operator_id === "" ? null : values.network_operator_id,
    anomalies_found: values.anomalies_found === "" ? null : values.anomalies_found,
    client_request_barcode: values.client_request_barcode === "" ? null : values.client_request_barcode,
    created_at: now,
    updated_at: now,
  };
}

export function getOutcomeBadgeVariant(outcome: string | null) {
  switch (outcome) {
    case 'Risolto':
      return 'bg-green-100 text-green-800';
    case 'Non Risolto':
      return 'bg-red-100 text-red-800';
    case 'Falso Allarme':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}