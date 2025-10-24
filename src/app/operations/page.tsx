"use client";

import React from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useSession } from "@/components/session-context-provider";
import { ShieldAlert } from "lucide-react";

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
          <h2 className="text-2xl font-bold mb-2">Accesso Negato</h2>
          <p className="text-muted-foreground">Non hai i permessi necessari per visualizzare questa pagina.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-4xl font-bold mb-4">Sezione Operazioni</h1>
        <p className="text-lg text-muted-foreground">
          Qui verranno gestite le operazioni quotidiane e le attività specifiche del tuo ruolo.
        </p>
        <p className="text-sm text-muted-foreground mt-4">
          (Questa pagina è in fase di sviluppo. Le funzionalità verranno aggiunte a breve.)
        </p>
      </div>
    </DashboardLayout>
  );
}