"use client";

import React from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useSession } from "@/components/session-context-provider";
import { ShieldAlert, Briefcase, ListChecks, TrendingUp, Users, Settings } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function OperationsPage() {
  const { profile, isLoading } = useSession();

  if (isLoading) {
    return null; // Il layout gestisce già lo stato di caricamento
  }

  // Verifica se l'utente ha il ruolo appropriato per accedere a questa pagina
  const hasAccess =
    profile?.role === "super_admin" ||
    profile?.role === "amministrazione" ||
    profile?.role === "responsabile_operativo" ||
    profile?.role === "operativo";

  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full text-center">
          <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Accesso Negato</h2>
          <p className="text-sm text-muted-foreground">Non hai i permessi necessari per visualizzare questa pagina.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Sezione Operazioni</h1>
          <Button>Nuova Operazione</Button>
        </div>
        <p className="text-base text-muted-foreground mb-8">
          Benvenuto nella sezione dedicata alle attività operative. Qui puoi gestire i tuoi compiti, monitorare i progressi e accedere agli strumenti specifici del tuo ruolo.
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">
                <ListChecks className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
              <CardTitle className="text-xl font-bold">I Miei Compiti</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs text-muted-foreground">
                Visualizza e gestisci i compiti assegnati a te o al tuo team.
              </CardDescription>
              <Button variant="link" className="px-0 mt-2">Vai ai Compiti</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
              <CardTitle className="text-xl font-bold">Monitoraggio Progetti</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs text-muted-foreground">
                Tieni traccia dello stato di avanzamento dei progetti e delle scadenze.
              </CardDescription>
              <Button variant="link" className="px-0 mt-2">Vedi Progetti</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">
                <Users className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
              <CardTitle className="text-xl font-bold">Gestione Risorse</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs text-muted-foreground">
                Assegna e gestisci le risorse disponibili per le operazioni.
              </CardDescription>
              <Button variant="link" className="px-0 mt-2">Gestisci Risorse</Button>
            </CardContent>
          </Card>

          {/* Aggiungi altre card o sezioni qui in base alle esigenze future */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">
                <Settings className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
              <CardTitle className="text-xl font-bold">Configurazione Operativa</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs text-muted-foreground">
                Configura le impostazioni specifiche per le tue operazioni.
              </CardDescription>
              <Button variant="link" className="px-0 mt-2">Configura</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}