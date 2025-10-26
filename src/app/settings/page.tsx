"use client";

import React from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useSession } from "@/components/session-context-provider";
import { ShieldAlert, Settings, User, Lock, BellRing, Palette } from "lucide-react"; // Aggiunte nuove icone
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SettingsPage() {
  const { profile, isLoading } = useSession();

  if (isLoading) {
    return null; // Il layout gestisce già lo stato di caricamento
  }

  // Verifica se l'utente ha il ruolo appropriato per accedere a questa pagina
  // Le impostazioni sono accessibili a tutti i ruoli, inclusi quelli in attesa di approvazione
  const hasAccess =
    profile?.role === "super_admin" ||
    profile?.role === "amministrazione" ||
    profile?.role === "responsabile_operativo" ||
    profile?.role === "operativo" ||
    profile?.role === "pending_approval";

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
          <h1 className="text-2xl font-bold">Impostazioni Account</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Gestisci le informazioni del tuo profilo, la sicurezza e le preferenze dell'applicazione.
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">
                <User className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
              <CardTitle className="text-base font-bold">Informazioni Profilo</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs text-muted-foreground">
                Aggiorna il tuo nome, cognome e altre informazioni personali.
              </CardDescription>
              <Button variant="link" className="px-0 mt-1 text-xs" asChild>
                <Link href="/settings/profile">Modifica Profilo</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">
                <Lock className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
              <CardTitle className="text-base font-bold">Sicurezza Account</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs text-muted-foreground">
                Cambia la tua password o configura l'autenticazione a due fattori.
              </CardDescription>
              <Button variant="link" className="px-0 mt-1 text-xs" asChild>
                <Link href="/settings/security">Gestisci Sicurezza</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">
                <BellRing className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
              <CardTitle className="text-base font-bold">Preferenze Notifiche</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs text-muted-foreground">
                Configura come e quando ricevere le notifiche dall'applicazione.
              </CardDescription>
              <Button variant="link" className="px-0 mt-1 text-xs" asChild>
                <Link href="/settings/notifications">Gestisci Notifiche</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">
                <Palette className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
              <CardTitle className="text-base font-bold">Aspetto</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs text-muted-foreground">
                Personalizza il tema e l'aspetto dell'interfaccia utente.
              </CardDescription>
              <Button variant="link" className="px-0 mt-1 text-xs" asChild>
                <Link href="/settings/appearance">Personalizza Aspetto</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}