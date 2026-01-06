"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { FileText } from "lucide-react";
import { RichiestaServizioForm } from "@/components/richieste-servizio/richiesta-servizio-form";
import { RichiestaServizioFormSchema } from "@/lib/richieste-servizio-utils";

interface GeneratedRequestFormSectionProps {
  form: UseFormReturn<RichiestaServizioFormSchema>;
  onSubmit: (values: RichiestaServizioFormSchema) => Promise<void>;
  isSubmitting: boolean;
}

export function GeneratedRequestFormSection({
  form,
  onSubmit,
  isSubmitting,
}: GeneratedRequestFormSectionProps) {
  return (
    <div className="mt-6 p-6 border rounded-lg bg-card shadow-sm">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <FileText className="mr-2 h-5 w-5" /> Anteprima Richiesta di Servizio
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Rivedi e modifica i dettagli della richiesta generata.
      </p>
      <RichiestaServizioForm
        form={form}
        clients={[]}
        puntiServizio={[]}
        fornitori={[]}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}