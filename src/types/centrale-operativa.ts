import { PuntoServizio } from "./richieste-servizio";
import { Personale, NetworkOperator } from "@/types/anagrafiche"; // Updated import

export type AccessType = "Completo" | "Parziale" | "Nessuno";
export type InterventionOutcome = "Risolto" | "Non Risolto" | "Falso Allarme" | "Annullato";

export interface AlarmEntry {
  id: string;
  registration_date: string;
  punto_servizio_id: string | null;
  // intervention_due_by è il timestamp di scadenza in DB
  intervention_due_by: string | null;
  // nuova colonna: minuti entro i quali effettuare l'intervento
  intervention_due_minutes: number | null;
  service_type_requested: string;
  operator_co_id: string | null;
  request_time_co: string;
  intervention_start_time: string | null;
  intervention_end_time: string | null;
  intervention_start_lat: number | null;
  intervention_start_long: number | null;
  intervention_start_full_timestamp: string | null;
  intervention_end_lat: number | null;
  intervention_end_long: number | null;
  intervention_end_full_timestamp: string | null;
  full_site_access: boolean;
  caveau_access: boolean;
  network_operator_id: string | null;
  gpg_intervention_made: boolean;
  anomalies_found: string | null;
  delay_minutes: number | null;
  service_outcome: InterventionOutcome | null;
  client_request_barcode: string | null;
  created_at: string;
  updated_at: string;
  punti_servizio?: PuntoServizio | null;
  personale?: Personale | null;
  operatori_network?: NetworkOperator | null;
}

export interface HistoricalSearchFilters {
  from_date: Date | null;
  to_date: Date | null;
  punto_servizio_id: string | null;
}