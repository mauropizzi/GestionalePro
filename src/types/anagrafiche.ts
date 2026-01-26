export interface Client {
  id: string;
  ragione_sociale: string;
  codice_fiscale: string | null;
  partita_iva: string | null;
  indirizzo: string | null;
  citta: string | null;
  cap: string | null;
  provincia: string | null;
  telefono: string | null;
  email: string | null;
  pec: string | null;
  sdi: string | null;
  attivo: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
  codice_cliente_custom: string | null;
}

export interface Fornitore {
  id: string;
  ragione_sociale: string;
  partita_iva: string | null;
  codice_fiscale: string | null;
  indirizzo: string | null;
  cap: string | null;
  citta: string | null;
  provincia: string | null;
  telefono: string | null;
  email: string | null;
  pec: string | null;
  tipo_servizio: string | null;
  attivo: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
  codice_cliente_associato: string | null;
}

export interface NetworkOperator {
  id: string;
  nome: string;
  cognome: string;
  cliente_id: string | null;
  telefono: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
  clienti?: { ragione_sociale: string }[] | null;
}

export interface Personale {
  id: string;
  nome: string;
  cognome: string;
  codice_fiscale: string | null;
  ruolo: string | null;
  telefono: string | null;
  email: string | null;
  data_nascita: string | null;
  luogo_nascita: string | null;
  indirizzo: string | null;
  cap: string | null;
  citta: string | null;
  provincia: string | null;
  data_assunzione: string | null;
  data_cessazione: string | null;
  attivo: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Procedura {
  id: string;
  nome_procedura: string;
  descrizione: string | null;
  versione: string | null;
  data_ultima_revisione: string | null;
  responsabile: string | null;
  documento_url: string | null;
  attivo: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tariffa {
  id: string;
  client_id: string | null;
  tipo_servizio: string;
  importo: number;
  supplier_rate: number | null;
  unita_misura: string | null;
  punto_servizio_id: string | null;
  fornitore_id: string | null;
  data_inizio_validita: string | null;
  data_fine_validita: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  clienti?: { ragione_sociale: string } | null;
  punti_servizio?: { nome_punto_servizio: string } | null;
  fornitori?: { ragione_sociale: string } | null;
}