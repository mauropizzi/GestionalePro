"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useSession } from "@/components/session-context-provider";
import { ShieldAlert, Building2, Truck, Network, UserRound, MapPin, Euro, FileText, Phone, Bug } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Import dei nuovi componenti modulari
import { TemplateDownloadSection } from "./components/template-download-section";
import { ImportSection } from "./components/import-section";
import { ExportSection } from "./components/export-section";
import { testOperatoriNetworkNoteColumn, testInsertOperatoriNetworkWithNote } from "@/utils/test-schema-cache";

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
  codice_cliente: "Codice Cliente Punto Servizio", // Reso più specifico
  codice_sicep: "Codice SICEP",
  codice_fatturazione: "Codice Fatturazione",
  latitude: "Latitudine",
  longitude: "Longitudine",
  nome_procedura: "Nome Procedura",

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
  // fornitore_id: "ID Fornitore (UUID)", // Rimosso duplicato
  // tipo_recapito, nome_persona, telefono_fisso, telefono_cellulare, email_recapito, note sono gli stessi

  // Fornitori
  tipo_servizio: "Tipo Servizio",
  codice_cliente_associato: "Codice Fornitore Manuale", // Questo è il codice manuale del fornitore stesso

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
    "ID Fornitore (UUID)", "Codice Fornitore Manuale", "Codice Cliente Punto Servizio", "Codice SICEP", "Codice Fatturazione",
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

  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [schemaDiagnostics, setSchemaDiagnostics] = useState<any>(null);

  const runSchemaDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    setSchemaDiagnostics(null);
    
    try {
      const selectTest = await testOperatoriNetworkNoteColumn();
      const insertTest = await testInsertOperatoriNetworkWithNote();
      
      setSchemaDiagnostics({
        selectTest,
        insertTest,
        timestamp: new Date().toISOString()
      });
      
      if (selectTest.success && insertTest.success) {
        toast.success("Diagnostica schema completata: tutto OK!");
      } else {
        toast.error("Problemi rilevati nello schema della cache. Controlla i risultati.");
      }
      
    } catch (error: any) {
      toast.error("Errore durante la diagnostica: " + error.message);
      console.error("[import-export] Diagnostics error:", error);
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  const refreshSchemaCache = async () => {
    setIsRunningDiagnostics(true);
    
    try {
      const response = await fetch(
        "https://mlkahaedxpwkhheqwsjc.supabase.co/functions/v1/refresh-schema",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sa2FoYWVkeHB3a2hoZXF3c2pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNzgyNTU5LCJleHAiOjIwNzY4NTQyNTl9._QR-tTUw-NPhCcv9boDDQAsewgyDzMhwiXNIlxIBCjQ",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Errore durante l'aggiornamento della cache schema.");
      }

      if (result.success) {
        toast.success("Cache schema aggiornata con successo! Esegui nuovamente la diagnostica.");
      } else {
        toast.error("Problemi durante l'aggiornamento della cache: " + result.error);
      }
      
      // Wait a moment and then run diagnostics
      setTimeout(() => {
        runSchemaDiagnostics();
      }, 2000);
      
    } catch (error: any) {
      toast.error("Errore durante l'aggiornamento della cache: " + error.message);
      console.error("[import-export] Schema refresh error:", error);
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

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

        {/* Diagnostica Schema */}
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium flex items-center">
              <Bug className="h-4 w-4 mr-2" /> Diagnostica Cache Schema
            </h3>
            <div className="flex space-x-2">
              <Button 
                onClick={refreshSchemaCache} 
                disabled={isRunningDiagnostics}
                variant="outline"
                size="sm"
              >
                {isRunningDiagnostics ? "Aggiornando..." : "Aggiorna Cache Schema"}
              </Button>
              <Button 
                onClick={runSchemaDiagnostics} 
                disabled={isRunningDiagnostics}
                variant="outline"
                size="sm"
              >
                {isRunningDiagnostics ? "Eseguendo..." : "Esegui Diagnostica"}
              </Button>
            </div>
          </div>
          
          {schemaDiagnostics ? (
            <div className="space-y-3">
              <div className="p-3 bg-white rounded border">
                <h4 className="font-medium text-sm mb-2">Test Select (Ricerca)</h4>
                <p className="text-xs text-gray-600">
                  {schemaDiagnostics.selectTest.success ? "✅ Successo" : "❌ Errore"}
                </p>
                {schemaDiagnostics.selectTest.message && (
                  <p className="text-xs text-gray-500 mt-1">{schemaDiagnostics.selectTest.message}</p>
                )}
              </div>
              
              <div className="p-3 bg-white rounded border">
                <h4 className="font-medium text-sm mb-2">Test Insert (Inserimento)</h4>
                <p className="text-xs text-gray-600">
                  {schemaDiagnostics.insertTest.success ? "✅ Successo" : "❌ Errore"}
                </p>
                {schemaDiagnostics.insertTest.message && (
                  <p className="text-xs text-gray-500 mt-1">{schemaDiagnostics.insertTest.message}</p>
                )}
              </div>
              
              <p className="text-xs text-gray-600 mt-3">
                Usa questa diagnostica per verificare se la cache di PostgREST riconosce correttamente la colonna 'note' nella tabella operatori_network.
                Se vedi errori, clicca su "Aggiorna Cache Schema" per forzare un aggiornamento.
              </p>
            </div>
          ) : (
            <p className="text-xs text-gray-600">Nessun test eseguito. Clicca su "Esegui Diagnostica" per iniziare.</p>
          )}
        </div>

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