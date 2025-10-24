"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTariffaData } from "@/hooks/use-tariffa-data";
import { TariffaForm, TariffaFormSchema } from "@/components/tariffa-form";
import { format } from "date-fns";

export default function NewTariffaPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Usiamo useTariffaData senza ID per ottenere solo le dipendenze
  const { clients, puntiServizio, fornitori, isLoading: areDependenciesLoading, error: dependenciesError } = useTariffaData();

  const defaultFormValues: TariffaFormSchema = {
    client_id: null,
    tipo_servizio: "",
    importo: 0,
    supplier_rate: null,
    unita_misura: null,
    punto_servizio_id: null,
    fornitore_id: null,
    data_inizio_validita: null,
    data_fine_validita: null,
    note: null,
  };

  async function onSubmit(values: TariffaFormSchema) {
    setIsSubmitting(true);
    const now = new Date().toISOString();
    const tariffaData = {
      ...values,
      client_id: values.client_id === "" ? null : values.client_id,
      punto_servizio_id: values.punto_servizio_id === "" ? null : values.punto_servizio_id,
      fornitore_id: values.fornitore_id === "" ? null : values.fornitore_id,
      unita_misura: values.unita_misura === "" ? null : values.unita_misura,
      note: values.note === "" ? null : values.note,
      data_inizio_validita: values.data_inizio_validita ? format(values.data_inizio_validita, "yyyy-MM-dd") : null,
      data_fine_validita: values.data_fine_validita ? format(values.data_fine_validita, "yyyy-MM-dd") : null,
    };

    const { error: insertError } = await supabase
      .from("tariffe")
      .insert({ ...tariffaData, created_at: now, updated_at: now });

    if (insertError) {
      toast.error("Errore durante il salvataggio della tariffa: " + insertError.message);
    } else {
      toast.success("Tariffa salvata con successo!");
      router.push("/anagrafiche/tariffe");
    }
    setIsSubmitting(false);
  }

  if (areDependenciesLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (dependenciesError) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h2 className="text-2xl font-bold mb-2">Errore</h2>
          <p className="text-muted-foreground">{dependenciesError}</p>
          <Button asChild className="mt-4">
            <Link href="/anagrafiche/tariffe">Torna alle Tariffe</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" asChild>
            <Link href="/anagrafiche/tariffe">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-4xl font-bold">Nuova Tariffa</h1>
        </div>
        <p className="text-lg text-muted-foreground mb-8">
          Aggiungi una nuova tariffa al sistema.
        </p>

        <TariffaForm
          defaultValues={defaultFormValues}
          onSubmit={onSubmit}
          isLoading={isSubmitting}
          clients={clients}
          puntiServizio={puntiServizio}
          fornitori={fornitori}
          buttonText="Salva Tariffa"
        />
      </div>
    </DashboardLayout>
  );
}