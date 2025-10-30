import { ServiceType, InspectionType, AperturaChiusuraType, BonificaType, GestioneChiaviType } from "@/lib/richieste-servizio-utils";

export interface Client {
  id: string;
  ragione_sociale: string;
}

export interface PuntoServizio {
  id: string;
  nome_punto_servizio: string; // Changed from 'nome' to 'nome_punto_servizio' to match DB schema
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
  created_at?: string; // Aggiunto per completezza
  updated_at?: string; // Aggiunto per completezza
  clienti?: { ragione_sociale: string } | null; // Per popolare il nome del cliente nella tabella di ricerca
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
  inspection_details?: InspectionDetails[] | null; // Corretto a array di oggetti o null
  tipo_apertura_chiusura?: AperturaChiusuraType | null; // Nuovo campo
  tipo_bonifica?: BonificaType | null; // Nuovo campo per Bonifica
  tipo_gestione_chiavi?: GestioneChiaviType | null; // Nuovo campo per Gestione Chiavi
}