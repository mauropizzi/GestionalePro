"use client";

import React from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useSession } from "@/components/session-context-provider";
import { ShieldAlert, Settings } from "lucide-react"; // Aggiunto Settings per coerenza

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
          <h2 className="text-2xl font-bold mb-2">Accesso Negato</h2>
          <p className="text-muted-foreground">Non hai i permessi necessari per visualizzare questa pagina.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Settings className="h-16 w-16 text-gray-500 mb-4" />
        <h1 className="text-4xl font-bold mb-4">Impostazioni Account</h1>
        <p className="text-lg text-muted-foreground">
          Qui potrai gestire le impostazioni del tuo profilo, le preferenze dell'applicazione e la sicurezza.
        </p>
        <p className="text-sm text-muted-foreground mt-4">
          (Questa pagina è in fase di sviluppo. Le funzionalità verranno aggiunte a breve.)
        </p>
      </div>
    </DashboardLayout>
  );
}