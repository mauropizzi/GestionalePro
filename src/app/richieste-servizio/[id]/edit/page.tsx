"use client";

import React from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRichiestaServizioEditForm } from "@/hooks/use-richiesta-servizio-edit-form";
import { RichiestaServizioForm } from "@/components/richieste-servizio/richiesta-servizio-form";

export default function EditRichiestaServizioPage() {
  const params = useParams();
  const richiestaId = params.id as string;

  const {
    form,
    richiesta,
    clients,
    puntiServizio,
    fornitori, // Recupera i fornitori dal hook
    isLoading,
    isSubmitting,
    onSubmit,
  } = useRichiestaServizioEditForm(richiestaId);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!richiesta) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h2 className="text-2xl font-bold mb-2">Richiesta di Servizio non trovata</h2>
          <p className="text-muted-foreground">La richiesta di servizio che stai cercando non esiste o non è accessibile.</p>
          <Button asChild className="mt-4">
            <Link href="/richieste-servizio">Torna alle Richieste di Servizio</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-4">
        <div className="flex items-center gap-4 mb-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/richieste-servizio">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Modifica Richiesta di Servizio: {richiesta.tipo_servizio}</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Apporta modifiche ai dati della richiesta di servizio.
        </p>

        <RichiestaServizioForm
          form={form}
          clients={clients}
          puntiServizio={puntiServizio}
          fornitori={fornitori} // Passa i fornitori al componente form
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </DashboardLayout>
  );
}