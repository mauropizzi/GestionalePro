"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useSession } from "@/components/session-context-provider";
import { ShieldAlert, Building2, Truck, Network, UserRound, MapPin, Euro, FileText, Phone } from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Import dei nuovi componenti modulari
import { TemplateDownloadSection } from "./components/template-download-section";
import { ImportSection } from "./components/import-section";
import { ExportSection } from "./components/export-section";

// Mappatura dei nomi delle colonne per una visualizzazione più leggibile
const columnHeaderMap: { [key: string]: string } = {
  // Campi comuni
  indirizzo: "Indirizzo",
  citta: "Città",
  cap: "CAP",
  provincia: "Provincia",
  telefono: "Telefono",
  email: "Email",
  note: "Note",
  created_at: "Data Creazione",
  updated_at: "Data Aggiornamento",
  attivo: "Attivo", // Comune a Clienti e Fornitori

  // Clienti
  ragione_sociale: "Ragione Sociale",
  codice_fiscale: "Codice Fiscale",
  partita_iva: "Partita IVA",
  pec: "PEC",
  sdi: "SDI",
  codice_cliente_custom: "Codice Cliente Manuale",

  // Punti Servizio
  nome_punto_servizio: "Nome Punto Servizio",
  id_cliente: "ID Cliente (UUID)",
  referente: "Referente",
  telefono_referente: "Telefono Referente",
  tempo_intervento: "Tempo Intervento",
  fornitore_id: "ID Fornitore (UUID)",
  codice_cliente: "Codice Cliente",
  codice_sicep: "Codice SICEP",
  codice_fatturazione: "Codice Fatturazione",
  latitude: "Latitudine",
  longitude: "Longitudine",
  nome_procedura: "Nome Procedura",
  // Nuovi campi per Punti Servizio
  'Codice Cliente Manuale': "Codice Cliente Manuale", // Mappatura per il campo usato nel template
  'Codice Fornitore Manuale': "Codice Fornitore Manuale", // Mappatura per il campo usato nel template

  // Rubrica Punti Servizio
  punto_servizio_id: "ID Punto Servizio (UUID)",
  tipo_recapito: "Tipo Recapito",
  nome_persona: "Nome Persona",
  telefono_fisso: "Telefono Fisso",
  telefono_cellulare: "Telefono Cellulare",
  email_recapito: "Email Recapito",

  // Rubrica Clienti
  client_id: "ID Cliente (UUID)",
  // tipo_recapito, nome_persona, telefono_fisso, telefono_cellulare, email_recapito, note sono gli stessi

  // Rubrica Fornitori
  fornitore_id: "ID Fornitore (UUID)",
  // tipo_recapito, nome_persona, telefono_fisso, telefono_cellulare, email_recapito, note sono gli stessi

  // Fornitori
  tipo_servizio: "Tipo Servizio",
  codice_cliente_associato: "Codice Fornitore Manuale",

  // Personale
  nome: "Nome",
  cognome: "Cognome",
  ruolo: "Ruolo",
  data_nascita: "Data Nascita (YYYY-MM-DD)",
  luogo_nascita: "Luogo Nascita",
  data_assunzione: "Data Assunzione (YYYY-MM-DD)",
  data_cessazione: "Data Cessazione (YYYY-MM-DD)",

  // Tariffe
  importo: "Importo",
  supplier_rate: "Costo Fornitore",
  unita_misura: "Unità di Misura",
  data_inizio_validita: "Data Inizio Validità (YYYY-MM-DD)",
  data_fine_validita: "Data Fine Validità (YYYY-MM-DD)",
};

// Definizione delle intestazioni per i template di esportazione
const templateHeaders: { [key: string]: string[] } = {
  clienti: [
    "Ragione Sociale", "Codice Cliente Manuale", "Codice Fiscale", "Partita IVA", "Indirizzo", "Città", "CAP",
    "Provincia", "Telefono", "Email", "PEC", "SDI", "Attivo (TRUE/FALSE)", "Note"
  ],
  punti_servizio: [
    "Nome Punto Servizio", "ID Cliente (UUID)", "Codice Cliente Manuale", "Indirizzo", "Città", "CAP", "Provincia",
    "Referente", "Telefono Referente", "Telefono", "Email", "Note", "Tempo Intervento",
    "ID Fornitore (UUID)", "Codice Fornitore Manuale", "Codice Cliente", "Codice SICEP", "Codice Fatturazione",
    "Latitudine", "Longitudine", "Nome Procedura"
  ],
  fornitori: [
    "Ragione Sociale", "Codice Fornitore Manuale", "Codice Fiscale", "Partita IVA", "Indirizzo", "Città", "CAP",
    "Provincia", "Telefono", "Email", "PEC", "Tipo Servizio", "Attivo (TRUE/FALSE)", "Note"
  ],
  personale: [
    "Nome", "Cognome", "Ruolo", "Email", "Telefono", "Codice Fiscale", "Data Nascita (YYYY-MM-DD)",
    "Luogo Nascita", "Indirizzo", "Città", "CAP", "Provincia", "Data Assunzione (YYYY-MM-DD)",
    "Data Cessazione (YYYY-MM-DD)", "Note"
  ],
  operatori_network: [
    "Nome", "Cognome", "Email", "Telefono", "ID Cliente (UUID)", "Note"
  ],
  procedure: [
    "Nome Procedura", "Descrizione", "Versione", "Data Ultima Revisione (YYYY-MM-DD)",
    "Responsabile", "URL Documento", "Note"
  ],
  tariffe: [
    "ID Cliente (UUID)", "Tipo Servizio", "Importo", "Costo Fornitore", "Unità di Misura",
    "ID Punto Servizio (UUID)", "ID Fornitore (UUID)", "Data Inizio Validità (YYYY-MM-DD)",
    "Data Fine Validità (YYYY-MM-DD)", "Note"
  ],
  rubrica_punti_servizio: [
    "ID Punto Servizio (UUID)", "Tipo Recapito", "Nome Persona", "Telefono Fisso",
    "Telefono Cellulare", "Email Recapito", "Note"
  ],
  rubrica_clienti: [
    "ID Cliente (UUID)", "Tipo Recapito", "Nome Persona", "Telefono Fisso",
    "Telefono Cellulare", "Email Recapito", "Note"
  ],
  rubrica_fornitori: [
    "ID Fornitore (UUID)", "Tipo Recapito", "Nome Persona", "Telefono Fisso",
    "Telefono Cellulare", "Email Recapito", "Note"
  ],
};

export default function ImportExportPage() {
  const { profile: currentUserProfile, isLoading: isSessionLoading } = useSession();
  const [globalLoading, setGlobalLoading] = useState(false); // This state is not directly used by children, but can be for overall page loading

  const hasAccess =
    currentUserProfile?.role === "super_admin" ||
    currentUserProfile?.role === "amministrazione";

  useEffect(() => {
    if (!isSessionLoading && !hasAccess) {
      // Redirect or show access denied message if user doesn't have access
    }
  }, [isSessionLoading, hasAccess]);

  if (isSessionLoading) {
    return null;
  }

  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full text-center">
          <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Accesso Negato</h2>
          <p className="text-muted-foreground">Non hai i permessi necessari per visualizzare questa pagina.</p>
        </div>
      </DashboardLayout>
    );
  }

  const anagraficaOptions = [
    { value: "clienti", label: "Clienti", icon: <Building2 className="h-4 w-4 mr-2" /> },
    { value: "fornitori", label: "Fornitori", icon: <Truck className="h-4 w-4 mr-2" /> },
    { value: "punti_servizio", label: "Punti Servizio", icon: <MapPin className="h-4 w-4 mr-2" /> },
    { value: "personale", label: "Personale", icon: <UserRound className="h-4 w-4 mr-2" /> },
    { value: "operatori_network", label: "Operatori Network", icon: <Network className="h-4 w-4 mr-2" /> },
    { value: "procedure", label: "Procedure", icon: <FileText className="h-4 w-4 mr-2" /> },
    { value: "tariffe", label: "Tariffe", icon: <Euro className="h-4 w-4 mr-2" /> },
    { value: "rubrica_punti_servizio", label: "Rubrica Punti Servizio", icon: <Phone className="h-4 w-4 mr-2" /> },
    { value: "rubrica_clienti", label: "Rubrica Clienti", icon: <Phone className="h-4 w-4 mr-2" /> },
    { value: "rubrica_fornitori", label: "Rubrica Fornitori", icon: <Phone className="h-4 w-4 mr-2" /> },
  ];

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-4">Importa/Esporta Dati Anagrafici</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Gestisci l'importazione e l'esportazione dei dati anagrafici tramite file Excel.
        </p>

        {/* Sezione Importa */}
        <ImportSection
          anagraficaOptions={anagraficaOptions}
          columnHeaderMap={columnHeaderMap}
        />

        <Separator className="my-6" />

        {/* Sezione Esporta */}
        <ExportSection
          anagraficaOptions={anagraficaOptions}
          loading={globalLoading}
        />

        <Separator className="my-6" />

        {/* Sezione Scarica Template (spostata alla fine) */}
        <div className="p-6 border rounded-lg shadow-sm">
          <TemplateDownloadSection
            anagraficaOptions={anagraficaOptions}
            templateHeaders={templateHeaders}
            loading={globalLoading}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}