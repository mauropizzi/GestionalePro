"use client";

import React, { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Client, PuntoServizio, Fornitore } from "@/types/richieste-servizio";
import {
  RichiestaServizioFormSchema,
  calculateTotalHours,
  calculateTotalInspections,
  calculateAperturaChiusuraCount,
  calculateBonificaCount,
  IspezioniFormSchema,
  AperturaChiusuraFormSchema,
  BonificaFormSchema,
  AperturaChiusuraType,
  BonificaType,
} from "@/lib/richieste-servizio-utils";
import { DailySchedulesFormField } from "./daily-schedules-form-field";
import { ServiceDetailsSection } from "./service-details-section";
import { DateRangeSection } from "./date-range-section";
import { ServiceSpecificFields } from "./service-specific-fields";
import { CalculatedValueDisplay } from "./calculated-value-display";
import { NotesSection } from "./notes-section";

interface RichiestaServizioFormProps {
  form: UseFormReturn<RichiestaServizioFormSchema>;
  clients: Client[];
  puntiServizio: PuntoServizio[];
  fornitori: Fornitore[];
  onSubmit: (values: RichiestaServizioFormSchema) => void;
  isSubmitting: boolean;
}

export function RichiestaServizioForm({
  form,
  clients,
  puntiServizio,
  fornitori,
  onSubmit,
  isSubmitting,
}: RichiestaServizioFormProps) {
  const selectedServiceType = form.watch("tipo_servizio");
  const formValues = form.watch();

  let calculatedValue: number | null = null;
  let calculationLabel: string = "";

  // Effect to set default values for ISPEZIONI, APERTURA_CHIUSURA, BONIFICA when service type changes
  useEffect(() => {
    if (selectedServiceType === "ISPEZIONI") {
      if (form.getValues("cadenza_ore") === undefined || form.getValues("cadenza_ore") === null || form.getValues("cadenza_ore") <= 0) {
        form.setValue("cadenza_ore", 1, { shouldDirty: true });
      }
      if (!form.getValues("tipo_ispezione")) {
        form.setValue("tipo_ispezione", "PERIMETRALE", { shouldDirty: true });
      }
    } else if (selectedServiceType === "APERTURA_CHIUSURA") {
      if (!form.getValues("tipo_apertura_chiusura")) {
        form.setValue("tipo_apertura_chiusura", "APERTURA_E_CHIUSURA", { shouldDirty: true });
      }
    } else if (selectedServiceType === "BONIFICA") {
      if (!form.getValues("tipo_bonifica")) {
        form.setValue("tipo_bonifica", "BONIFICA_STANDARD", { shouldDirty: true });
      }
    }
  }, [selectedServiceType, form]);

  if (selectedServiceType === "PIANTONAMENTO_ARMATO" || selectedServiceType === "SERVIZIO_FIDUCIARIO") {
    const { data_inizio_servizio, data_fine_servizio, numero_agenti, daily_schedules } = formValues;

    if (data_inizio_servizio && data_fine_servizio && daily_schedules && numero_agenti !== undefined) {
      calculatedValue = calculateTotalHours(
        data_inizio_servizio,
        data_fine_servizio,
        daily_schedules,
        numero_agenti
      );
      calculationLabel = "Ore totali stimate:";
    }
  } else if (selectedServiceType === "ISPEZIONI") {
    const { data_inizio_servizio, data_fine_servizio, numero_agenti, daily_schedules, cadenza_ore } = formValues as IspezioniFormSchema;

    if (data_inizio_servizio && data_fine_servizio && daily_schedules && cadenza_ore !== undefined && numero_agenti !== undefined) {
      calculatedValue = calculateTotalInspections(
        data_inizio_servizio,
        data_fine_servizio,
        daily_schedules,
        cadenza_ore,
        numero_agenti
      );
      calculationLabel = "Numero totale ispezioni stimate:";
    }
  } else if (selectedServiceType === "APERTURA_CHIUSURA") {
    const { data_inizio_servizio, data_fine_servizio, numero_agenti, daily_schedules, tipo_apertura_chiusura } = formValues as AperturaChiusuraFormSchema;

    if (data_inizio_servizio && data_fine_servizio && daily_schedules && tipo_apertura_chiusura && numero_agenti !== undefined) {
      calculatedValue = calculateAperturaChiusuraCount(
        data_inizio_servizio,
        data_fine_servizio,
        daily_schedules,
        tipo_apertura_chiusura as AperturaChiusuraType,
        numero_agenti
      );
      calculationLabel = "Numero totale attività stimate:";
    }
  } else if (selectedServiceType === "BONIFICA") {
    const { data_inizio_servizio, data_fine_servizio, numero_agenti, daily_schedules, tipo_bonifica } = formValues as BonificaFormSchema;

    if (data_inizio_servizio && data_fine_servizio && daily_schedules && tipo_bonifica && numero_agenti !== undefined) {
      calculatedValue = calculateBonificaCount(
        data_inizio_servizio,
        data_fine_servizio,
        daily_schedules,
        tipo_bonifica as BonificaType,
        numero_agenti
      );
      calculationLabel = "Numero totale bonifiche stimate:";
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <ServiceDetailsSection
          form={form}
          clients={clients}
          puntiServizio={puntiServizio}
          fornitori={fornitori}
          selectedServiceType={selectedServiceType}
        />

        <DateRangeSection form={form} selectedServiceType={selectedServiceType} />

        <ServiceSpecificFields form={form} selectedServiceType={selectedServiceType} />

        {/* Daily Schedules */}
        {(selectedServiceType === "PIANTONAMENTO_ARMATO" ||
          selectedServiceType === "SERVIZIO_FIDUCIARIO" ||
          selectedServiceType === "ISPEZIONI" ||
          selectedServiceType === "APERTURA_CHIUSURA" ||
          selectedServiceType === "BONIFICA") && (
          <FormField
            control={form.control}
            name="daily_schedules"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Programmazione Giornaliera</FormLabel>
                <FormControl>
                  <DailySchedulesFormField
                    value={field.value}
                    onChange={field.onChange}
                    selectedServiceType={selectedServiceType} // Passa il tipo di servizio
                  />
                </FormControl>
                <FormDescription>
                  Definisci gli orari di servizio per ogni giorno della settimana.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <CalculatedValueDisplay
          calculatedValue={calculatedValue}
          calculationLabel={calculationLabel}
        />

        <NotesSection form={form} />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Invio...
            </>
          ) : (
            "Invia Richiesta"
          )}
        </Button>
      </form>
    </Form>
  );
}