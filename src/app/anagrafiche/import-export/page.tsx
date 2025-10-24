"use client";

import React from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useSession } from "@/components/session-context-provider";
import { ShieldAlert, Upload } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataImportExportTab } from "@/components/data-import-export-tab";

export default function ImportExportPage() {
  const { profile, isLoading } = useSession();

  if (isLoading) {
    return null;
  }

  const hasAccess =
    profile?.role === "super_admin" ||
    profile?.role === "amministrazione";

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

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-4 mb-6">
          <Upload className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Importa/Esporta Dati Anagrafici</h1>
        </div>
        <p className="text-lg text-muted-foreground mb-8">
          Gestisci l'importazione e l'esportazione delle anagrafiche in formato Excel.
        </p>

        <Tabs defaultValue="clienti" className="w-full">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
            <TabsTrigger value="clienti">Clienti</TabsTrigger>
            <TabsTrigger value="fornitori" disabled>Fornitori (Prossimamente)</TabsTrigger>
            <TabsTrigger value="operatori-network" disabled>Operatori Network (Prossimamente)</TabsTrigger>
            <TabsTrigger value="personale" disabled>Personale (Prossimamente)</TabsTrigger>
            <TabsTrigger value="procedure" disabled>Procedure (Prossimamente)</TabsTrigger>
            <TabsTrigger value="punti-servizio" disabled>Punti Servizio (Prossimamente)</TabsTrigger>
            <TabsTrigger value="tariffe" disabled>Tariffe (Prossimamente)</TabsTrigger>
          </TabsList>
          <TabsContent value="clienti" className="mt-6">
            <DataImportExportTab
              entityName="Clienti"
              tableName="clienti"
              uniqueKey="ragione_sociale"
              columns={[
                { header: "Ragione Sociale", accessor: "ragione_sociale" },
                { header: "Codice Fiscale", accessor: "codice_fiscale" },
                { header: "Partita IVA", accessor: "partita_iva" },
                { header: "Indirizzo", accessor: "indirizzo" },
                { header: "Città", accessor: "citta" },
                { header: "CAP", accessor: "cap" },
                { header: "Provincia", accessor: "provincia" },
                { header: "Telefono", accessor: "telefono" },
                { header: "Email", accessor: "email" },
                { header: "PEC", accessor: "pec" },
                { header: "SDI", accessor: "sdi" },
                { header: "Attivo", accessor: "attivo" },
                { header: "Note", accessor: "note" },
              ]}
            />
          </TabsContent>
          {/* Altre TabsContent per le altre anagrafiche andranno qui, usando lo stesso componente DataImportExportTab */}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}