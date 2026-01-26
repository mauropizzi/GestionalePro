"use client";

import React from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useSession } from "@/components/session-context-provider";
import { ShieldAlert, BellRing, ListChecks, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CentraleOperativaPage() {
  const { profile, isLoading } = useSession();

  if (isLoading) {
    return null; // Il layout gestisce già lo stato di caricamento
  }

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
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Centrale Operativa</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Benvenuto nella Centrale Operativa. Qui puoi monitorare e gestire le ispezioni e gli allarmi in tempo reale.
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">
                <ListChecks className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
              <CardTitle className="text-base font-bold">Gestione Ispezioni</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs text-muted-foreground">
                Visualizza, pianifica e gestisci tutte le ispezioni attive e passate.
              </CardDescription>
              <Button variant="link" className="px-0 mt-1 text-xs" asChild>
                <Link href="/richieste-servizio?type=ISPEZIONI">Vai alle Ispezioni</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">
                <BellRing className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
              <CardTitle className="text-base font-bold">Gestione Allarmi</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs text-muted-foreground">
                Monitora e rispondi agli allarmi in arrivo.
              </CardDescription>
              <Button variant="link" className="px-0 mt-1 text-xs">Vai agli Allarmi</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
              <CardTitle className="text-base font-bold">Report Operativi</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs text-muted-foreground">
                Accedi ai report dettagliati sulle attività operative.
              </CardDescription>
              <Button variant="link" className="px-0 mt-1 text-xs">Vedi Report</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}