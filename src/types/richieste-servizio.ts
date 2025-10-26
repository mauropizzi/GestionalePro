import { ServiceType } from "@/lib/richieste-servizio-utils";

export interface Client {
  id: string;
  ragione_sociale: string;
}

export interface PuntoServizio {
  id: string;
  nome_punto_servizio: string;
}

export interface Fornitore {
  id: string;
  ragione_sociale: string;
}

export interface DailySchedule {
  id?: string;
  richiesta_servizio_id?: string; // Reso opzionale
  giorno_settimana: string;
  h24: boolean;
  ora_inizio: string | null;
  ora_fine: string | null;
  attivo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RichiestaServizio {
  id: string;
  client_id: string | null;
  punto_servizio_id: string | null;
  fornitore_id: string | null; // Nuovo campo
  tipo_servizio: ServiceType; // Aggiornato per usare ServiceType
  data_inizio_servizio: string;
  data_fine_servizio: string;
  numero_agenti: number;
  note: string | null;
  status: string;
  total_hours_calculated: number | null;
  created_at: string;
  updated_at: string;
}