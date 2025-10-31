import { ServiceType, InspectionType, AperturaChiusuraType, BonificaType, GestioneChiaviType } from "@/lib/richieste-servizio-utils";

export interface Client {
  id: string;
  ragione_sociale: string;
  partita_iva: string | null; // Aggiunto
  codice_fiscale: string | null; // Aggiunto
  indirizzo: string | null; // Aggiunto per ricerca
  citta: string | null; // Aggiunto
  email: string | null; // Aggiunto
  telefono: string | null;
  referente: string | null;
  note: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PuntoServizio {
  id: string;
  nome_punto_servizio: string;
  id_cliente: string | null;
  indirizzo: string | null;
  citta: string | null;
  cap: string | null;
  provincia: string | null;
  referente: string | null;
  telefono_referente: string | null;
  telefono: string | null;
  email: string | null;
  note: string | null;
  tempo_intervento: string | null;
  fornitore_id: string | null;
  codice_cliente: string | null;
  codice_sicep: string | null;
  codice_fatturazione: string | null;
  latitude: number | null;
  longitude: number | null;
  nome_procedura: string | null;
  created_at?: string;
  updated_at?: string;
  clienti?: { ragione_sociale: string } | null;
}

export interface Fornitore {
  id: string;
  ragione_sociale: string;
  partita_iva: string | null; // Aggiunto
  codice_fiscale: string | null; // Aggiunto per ricerca
  indirizzo: string | null; // Aggiunto per ricerca
  citta: string | null; // Aggiunto
  email: string | null; // Aggiunto
  telefono: string | null;
  referente: string | null;
  tipo_servizio: string | null; // Aggiunto (presumendo che sia una stringa per ora)
  note: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DailySchedule {
  id?: string;
  richiesta_servizio_id?: string;
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
  data_inizio_servizio?: string;
  data_fine_servizio?: string;
  numero_agenti?: number;
  note: string | null;
  status: string;
  total_hours_calculated?: number | null;
  created_at: string;
  updated_at: string;
  inspection_details?: InspectionDetails[] | null;
  tipo_apertura_chiusura?: AperturaChiusuraType | null;
  tipo_bonifica?: BonificaType | null;
  tipo_gestione_chiavi?: GestioneChiaviType | null;
}