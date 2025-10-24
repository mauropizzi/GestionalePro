"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useTariffaData } from "@/hooks/use-tariffa-data";
import { TariffaForm, TariffaFormSchema, tariffaFormSchema } from "@/components/tariffa-form";
import { format, parseISO } from "date-fns";

export default function EditTariffaPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const params = useParams();
  const tariffaId = params.id as string;

  const { tariffa, clients, puntiServizio, fornitori, isLoading, error } = useTariffaData(tariffaId);

  const defaultFormValues: TariffaFormSchema | undefined = tariffa ? {
    client_id: tariffa.client_id || null,
    tipo_servizio: tariffa.tipo_servizio || "",
    importo: tariffa.importo ?? 0,
    supplier_rate: tariffa.supplier_rate || null,
    unita_misura: tariffa.unita_misura || null,
    punto_servizio_id: tariffa.punto_servizio_id || null,
    fornitore_id: tariffa.fornitore_id || null,
    data_inizio_validita: tariffa.data_inizio_validita ? parseISO(tariffa.data_inizio_validita) : null,
    data_fine_validita: tariffa.data_fine_validita ? parseISO(tariffa.data_fine_validita) : null,
    note: tariffa.note || null,
  } : undefined;

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

    const { error: updateError } = await supabase
      .from("tariffe")
      .update({ ...tariffaData, updated_at: now })
      .eq("id", tariffaId);

    if (updateError) {
      toast.error("Errore durante l'aggiornamento della tariffa: " + updateError.message);
    } else {
      toast.success("Tariffa aggiornata con successo!");
      router.push("/anagrafiche/tariffe");
    }
    setIsSubmitting(false);
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h2 className="text-2xl font-bold mb-2">Errore</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button asChild className="mt-4">
            <Link href="/anagrafiche/tariffe">Torna alle Tariffe</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!tariffa) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h2 className="text-2xl font-bold mb-2">Tariffa non trovata</h2>
          <p className="text-muted-foreground">La tariffa che stai cercando non esiste o non è accessibile.</p>
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
          <h1 className="text-4xl font-bold">Modifica Tariffa: {tariffa.tipo_servizio}</h1>
        </div>
        <p className="text-lg text-muted-foreground mb-8">
          Apporta modifiche ai dati della tariffa.
        </p>

        <TariffaForm
          defaultValues={defaultFormValues}
          onSubmit={onSubmit}
          isLoading={isSubmitting}
          clients={clients}
          puntiServizio={puntiServizio}
          fornitori={fornitori}
          buttonText="Salva modifiche"
        />
      </div>
    </DashboardLayout>
  );
}