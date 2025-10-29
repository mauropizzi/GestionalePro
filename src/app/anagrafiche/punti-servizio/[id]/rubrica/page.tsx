"use client";

import React from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { ArrowLeft, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function PuntoServizioRubricaPage() {
  const params = useParams();
  const puntoServizioId = params.id as string;

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4 mb-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/anagrafiche/punti-servizio">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Rubrica Punto Servizio</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Gestisci i contatti della rubrica per il punto servizio con ID: <span className="font-semibold">{puntoServizioId}</span>.
        </p>

        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground">
          <Phone className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium">Questa sezione è in fase di sviluppo.</p>
          <p className="text-sm">Qui potrai aggiungere e gestire i contatti specifici per questo punto servizio.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}