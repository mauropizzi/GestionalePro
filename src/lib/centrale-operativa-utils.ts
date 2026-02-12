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

    gpg_personale_id: null,
    gpg_intervention_made: false,

    anomalies_found: null,
    delay_minutes: null,
    service_outcome: null,
    client_request_barcode: null,
  };
}

export function formatAlarmDataForSubmission(values: AlarmEntryFormSchema) {
  const now = new Date().toISOString();

  // Nel form `intervention_due_by` rappresenta i minuti (numero) richiesti dalla UI.
  const minutes = values.intervention_due_by;
  const registrationDateTime = values.registration_date; // contiene sia data che ora

  const deadlineTs =
    minutes != null
      ? new Date(registrationDateTime.getTime() + minutes * 60000).toISOString()
      : null;

  const gpgInterventionMade = Boolean(values.gpg_personale_id);

  return {
    registration_date: format(values.registration_date, "yyyy-MM-dd"),
    punto_servizio_id: values.punto_servizio_id,
    intervention_due_by: deadlineTs,
    intervention_due_minutes: minutes,

    service_type_requested: "Allarme",

    operator_co_id: values.operator_co_id,
    request_time_co: values.request_time_co,
    intervention_start_time: values.intervention_start_time,
    intervention_end_time: values.intervention_end_time,

    full_site_access: values.full_site_access,
    caveau_access: values.caveau_access,

    network_operator_id: values.network_operator_id,

    // Nuovi/derivati
    gpg_personale_id: values.gpg_personale_id,
    gpg_intervention_made: gpgInterventionMade,

    anomalies_found: values.anomalies_found,
    delay_minutes: values.delay_minutes,
    service_outcome: values.service_outcome,
    client_request_barcode: values.client_request_barcode,

    created_at: now,
    updated_at: now,
  };
}

export function getOutcomeBadgeVariant(outcome: string | null) {
  switch (outcome) {
    case "Risolto":
      return "bg-green-100 text-green-800";
    case "Non Risolto":
      return "bg-red-100 text-red-800";
    case "Falso Allarme":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}