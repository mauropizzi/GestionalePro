"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { useSession } from "@/components/session-context-provider";
import { ShieldAlert, Loader2 } from "lucide-react";

export default function OperationsPage() {
  const { profile, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && profile) {
      const hasAccess =
        profile.role === "super_admin" ||
        profile.role === "amministrazione" ||
        profile.role === "responsabile_operativo" ||
        profile.role === "operativo";

      if (hasAccess) {
        // Reindirizza alla pagina della Centrale Operativa se l'utente ha accesso
        router.replace("/operations/centrale-operativa");
      }
    }
  }, [profile, isLoading, router]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Se l'utente non ha accesso e non è in caricamento, mostra il messaggio di accesso negato
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

  // Questo non dovrebbe essere raggiunto se il reindirizzamento funziona
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Reindirizzamento in corso...</p>
      </div>
    </DashboardLayout>
  );
}