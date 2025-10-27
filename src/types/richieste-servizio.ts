import { ServiceType, InspectionType } from "@/lib/richieste-servizio-utils";

export interface Client {
  id: string;
  ragione_sociale: string;
}

export interface PuntoServizio {
  id: string;
  nome_punto_servizio: string; // Changed from 'nome' to 'nome_punto_servizio' to match DB schema
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

export interface InspectionDetails {
  id?: string;
  richiesta_servizio_id?: string;
  data_servizio: string;
  ora_inizio_fascia: string;
  ora_fine_fascia: string;
  cadenza_ore: number;
  tipo_ispezione: InspectionType;
  created_at?: string;
  updated_at?: string;
}

export interface RichiestaServizio {
  id: string;
  client_id: string | null;
  punto_servizio_id: string | null;
  fornitore_id: string | null;
  tipo_servizio: ServiceType;
  data_inizio_servizio?: string; // Reso opzionale per ISPEZIONI
  data_fine_servizio?: string;   // Reso opzionale per ISPEZIONI
  numero_agenti?: number;        // Reso opzionale per ISPEZIONI
  note: string | null;
  status: string;
  total_hours_calculated?: number | null; // Reso opzionale per ISPEZIONI
  created_at: string;
  updated_at: string;
  inspection_details?: InspectionDetails | null; // Corretto a singolo oggetto o null
}