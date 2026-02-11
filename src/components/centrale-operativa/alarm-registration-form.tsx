"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { AlarmEntryFormSchema } from "@/lib/centrale-operativa-schemas";
import { Personale, NetworkOperator } from "@/types/anagrafiche";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { RegistrationInfo } from "@/components/centrale-operativa/fields/RegistrationInfo";
import { OperatorInfo } from "@/components/centrale-operativa/fields/OperatorInfo";
import { InterventionDetails } from "@/components/centrale-operativa/fields/InterventionDetails";
import { OutcomeDetails } from "@/components/centrale-operativa/fields/OutcomeDetails";
import { useAutoDelay } from "@/hooks/use-auto-delay";

interface AlarmRegistrationFormProps {
  form: UseFormReturn<AlarmEntryFormSchema>;
  isSubmitting: boolean;
  personaleOptions: Personale[];
  networkOperatorsOptions: NetworkOperator[];
  onSubmit: (data: AlarmEntryFormSchema) => void;
  submitButtonText: string;
}

export function AlarmRegistrationForm({
  form,
  isSubmitting,
  personaleOptions,
  networkOperatorsOptions,
  onSubmit,
  submitButtonText,
}: AlarmRegistrationFormProps) {
  // Calcolo automatico del ritardo basato su registration_date, start e due_by
  useAutoDelay(form);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {/* Sezione: Registrazione, PS e tempo intervento */}
        <RegistrationInfo form={form} />

        {/* Sezione: Operatore CO, orario CO e Operatore Network */}
        <OperatorInfo
          form={form}
          personaleOptions={personaleOptions}
          networkOperatorsOptions={networkOperatorsOptions}
        />

        {/* Sezione: dettagli intervento (start/end, accessi, GPG) */}
        <InterventionDetails form={form} />

        {/* Sezione: esito, anomalie, ritardo e barcode */}
        <OutcomeDetails form={form} />

        <div className="md:col-span-3 flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : submitButtonText}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default AlarmRegistrationForm;