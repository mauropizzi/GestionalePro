import { PuntoServizio } from "./richieste-servizio";
import { Personale, NetworkOperator } from "@/types/anagrafiche";

export type AccessType = "Completo" | "Parziale" | "Nessuno";
export type InterventionOutcome = "Risolto" | "Non Risolto" | "Falso Allarme" | "Annullato";

export interface AlarmEntry {
  id: string;
  registration_date: string;
  punto_servizio_id: string | null;
  // intervention_due_by è il timestamp di scadenza in DB
  intervention_due_by: string | null;
  // minuti entro i quali effettuare l'intervento (UI)
  intervention_due_minutes: number | null;
  service_type_requested: string;
  operator_co_id: string | null;
  request_time_co: string;
  intervention_start_time: string | null;
  intervention_end_time: string | null;

  // Selezione Pattuglia (GPG)
  gpg_personale_id?: string | null;

  full_site_access: boolean;
  caveau_access: boolean;
  network_operator_id: string | null;

  // Rimane in tabella: true/false (derivato da gpg_personale_id)
  gpg_intervention_made: boolean;

  anomalies_found: string | null;
  delay_minutes: number | null;
  service_outcome: InterventionOutcome | null;
  client_request_barcode: string | null;
  created_at: string;
  updated_at: string;

  punti_servizio?: PuntoServizio | null;

  // embed lato Supabase
  personale?: Personale | null; // operatore C.O. (nelle query storiche)
  pattuglia?: Pick<Personale, "id" | "nome" | "cognome" | "telefono"> | null; // usato per WhatsApp in Gestione Allarmi

  operatori_network?: NetworkOperator | null;
}

export interface HistoricalSearchFilters {
  from_date: Date | null;
  to_date: Date | null;
  punto_servizio_id: string | null;
}