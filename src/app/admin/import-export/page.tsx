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
  createdAt: "Data Creazione",
  updatedAt: "Data Aggiornamento",
  attivo: "Attivo", // Comune a Clienti e Fornitori

  // Clienti
  ragioneSociale: "Ragione Sociale",
  codiceFiscale: "Codice Fiscale",
  partitaIva: "Partita IVA",
  pec: "PEC",
  sdi: "SDI",

  // Punti Servizio
  nomePuntoServizio: "Nome Punto Servizio",
  idCliente: "ID Cliente",
  referente: "Referente",
  telefonoReferente: "Telefono Referente",
  tempoIntervento: "Tempo Intervento",
  fornitoreId: "ID Fornitore",
  codiceCliente: "Codice Cliente",
  codiceSicep: "Codice SICEP",
  codiceFatturazione: "Codice Fatturazione",
  latitude: "Latitudine",
  longitude: "Longitudine",
  nomeProcedura: "Nome Procedura",

  // Rubrica Punti Servizio (nuovi campi)
  tipoRecapito: "Tipo Recapito",
  nomePersona: "Nome Persona",
  telefonoFisso: "Telefono Fisso",
  telefonoCellulare: "Telefono Cellulare",
  emailRecapito: "Email Recapito",

  // Rubrica Clienti (nuovi campi)
  clientiTipoRecapito: "Tipo Recapito Cliente",
  clientiNomePersona: "Nome Persona Cliente",
  clientiTelefonoFisso: "Telefono Fisso Cliente",
  clientiTelefonoCellulare: "Telefono Cellulare Cliente",
  clientiEmailRecapito: "Email Recapito Cliente",


  // Fornitori
  tipoServizio: "Tipo Servizio",

  // Personale
  nome: "Nome",
  cognome: "Cognome",
  ruolo: "Ruolo",
  dataNascita: "Data Nascita",
  luogoNascita: "Luogo Nascita",
  dataAssunzione: "Data Assunzione",
  dataCessazione: "Data Cessazione",

  // Tariffe
  clientId: "ID Cliente",
  importo: "Importo",
  supplierRate: "Costo Fornitore",
  unitaMisura: "Unità di Misura",
  puntoServizioId: "ID Punto Servizio",
  dataInizioValidita: "Data Inizio Validità",
  dataFineValidita: "Data Fine Validita",
};

// Definizione delle intestazioni per i template di esportazione
const templateHeaders: { [key: string]: string[] } = {
  clienti: [
    "Ragione Sociale", "Codice Fiscale", "Partita IVA", "Indirizzo", "Città", "CAP",
    "Provincia", "Telefono", "Email", "PEC", "SDI", "Attivo (TRUE/FALSE)", "Note"
  ],
  punti_servizio: [
    "Nome Punto Servizio", "ID Cliente (UUID)", "Indirizzo", "Città", "CAP", "Provincia",
    "Referente", "Telefono Referente", "Telefono", "Email", "Note", "Tempo Intervento",
    "ID Fornitore (UUID)", "Codice Cliente", "Codice SICEP", "Codice Fatturazione",
    "Latitudine", "Longitudine", "Nome Procedura"
  ],
  fornitori: [
    "Ragione Sociale", "Codice Fiscale", "Partita IVA", "Indirizzo", "Città", "CAP",
    "Provincia", "Telefono", "Email", "PEC", "SDI", "Tipo Servizio", "Attivo (TRUE/FALSE)", "Note"
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
  rubrica_clienti: [ // Nuovo template per la rubrica clienti
    "ID Cliente (UUID)", "Tipo Recapito", "Nome Persona", "Telefono Fisso",
    "Telefono Cellulare", "Email Recapito", "Note"
  ],
};

export default function ImportExportPage() {
  const { profile: currentUserProfile, isLoading: isSessionLoading } = useSession();
  const [globalLoading, setGlobalLoading] = useState(false);

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
    { value: "rubrica_clienti", label: "Rubrica Clienti", icon: <Phone className="h-4 w-4 mr-2" /> }, // Aggiunto
  ];

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-4">Importa/Esporta Dati Anagrafici</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Gestisci l'importazione e l'esportazione dei dati anagrafici tramite file Excel.
        </p>

        {/* Sezione Importa */}
        <div className="mb-8 p-6 border rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            Importa Dati
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Utilizza il template per preparare i tuoi dati. Il sistema ti guiderà attraverso la validazione prima dell'importazione.
          </p>

          <TemplateDownloadSection
            anagraficaOptions={anagraficaOptions}
            templateHeaders={templateHeaders}
            loading={globalLoading}
          />

          <Separator className="my-6" />

          <ImportSection
            anagraficaOptions={anagraficaOptions}
            columnHeaderMap={columnHeaderMap}
          />
        </div>

        {/* Sezione Esporta */}
        <ExportSection
          anagraficaOptions={anagraficaOptions}
          loading={globalLoading}
        />
      </div>
    </DashboardLayout>
  );
}