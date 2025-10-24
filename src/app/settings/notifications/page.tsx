"use client";

import React from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useSession } from "@/components/session-context-provider";
import { ShieldAlert, BellRing } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

export default function NotificationsSettingsPage() {
  const { profile, isLoading } = useSession();

  if (isLoading) {
    return null;
  }

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
          <h2 className="text-2xl font-bold mb-2">Accesso Negato</h2>
          <p className="text-muted-foreground">Non hai i permessi necessari per visualizzare questa pagina.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold">Preferenze Notifiche</h1>
        </div>
        <p className="text-lg text-muted-foreground mb-8">
          Configura come e quando ricevere le notifiche dall'applicazione.
        </p>

        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="h-5 w-5 text-muted-foreground" /> Gestisci Notifiche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Qui potrai configurare le tue preferenze di notifica. Questa sezione è in fase di sviluppo.
            </CardDescription>
            {/* Future notification settings will go here */}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}