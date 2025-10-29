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
  calculateGestioneChiaviCount,
  IspezioniFormSchema,
  AperturaChiusuraFormSchema,
  BonificaFormSchema,
  GestioneChiaviFormSchema,
  AperturaChiusuraType,
  BonificaType,
  GestioneChiaviType,
  APERTURA_CHIUSURA_TYPES, // Importa i tipi letterali
  GESTIONE_CHIAVI_TYPES, // Importa i tipi letterali
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

  let tipoAperturaChiusura: AperturaChiusuraType | null | undefined;
  if (selectedServiceType === "APERTURA_CHIUSURA") {
    const rawValue = (form.getValues() as AperturaChiusuraFormSchema).tipo_apertura_chiusura;
    if (rawValue === "" || rawValue === null) {
      tipoAperturaChiusura = null;
    } else if (APERTURA_CHIUSURA_TYPES.some(type => type.value === rawValue)) {
      tipoAperturaChiusura = rawValue as AperturaChiusuraType;
    } else {
      tipoAperturaChiusura = undefined; // Fallback for unexpected string values
    }
  }

  let tipoGestioneChiavi: GestioneChiaviType | null | undefined;
  if (selectedServiceType === "GESTIONE_CHIAVI") {
    const rawValue = (form.getValues() as GestioneChiaviFormSchema).tipo_gestione_chiavi;
    if (rawValue === "" || rawValue === null) {
      tipoGestioneChiavi = null;
    } else if (GESTIONE_CHIAVI_TYPES.some(type => type.value === rawValue)) {
      tipoGestioneChiavi = rawValue as GestioneChiaviType;
    } else {
      tipoGestioneChiavi = undefined; // Fallback for unexpected string values
    }
  }

  const formValues = form.watch();

  let calculatedValue: number | null = null;
  let calculationLabel: string = "";

  // Effect to set default values for ISPEZIONI, APERTURA_CHIUSURA, BONIFICA, GESTIONE_CHIAVI when service type changes
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
    } else if (selectedServiceType === "GESTIONE_CHIAVI") { // New logic for GESTIONE_CHIAVI
      if (!form.getValues("tipo_gestione_chiavi")) {
        form.setValue("tipo_gestione_chiavi", "RITIRO_CHIAVI", { shouldDirty: true });
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
  } else if (selectedServiceType === "GESTIONE_CHIAVI") { // New logic for GESTIONE_CHIAVI
    const { data_inizio_servizio, data_fine_servizio, numero_agenti, daily_schedules, tipo_gestione_chiavi } = formValues as GestioneChiaviFormSchema;

    if (data_inizio_servizio && data_fine_servizio && daily_schedules && tipo_gestione_chiavi && numero_agenti !== undefined) {
      calculatedValue = calculateGestioneChiaviCount(
        data_inizio_servizio,
        data_fine_servizio,
        daily_schedules,
        tipo_gestione_chiavi as GestioneChiaviType,
        numero_agenti
      );
      calculationLabel = "Numero totale attività gestione chiavi stimate:";
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Service Details, Date Range, Service Specific Fields */}
          <div className="space-y-8">
            <ServiceDetailsSection
              form={form}
              clients={clients}
              puntiServizio={puntiServizio}
              fornitori={fornitori}
              selectedServiceType={selectedServiceType}
            />

            <DateRangeSection form={form} selectedServiceType={selectedServiceType} />

            <ServiceSpecificFields form={form} selectedServiceType={selectedServiceType} />
          </div>

          {/* Right Column: Daily Schedules */}
          {(selectedServiceType === "PIANTONAMENTO_ARMATO" ||
            selectedServiceType === "SERVIZIO_FIDUCIARIO" ||
            selectedServiceType === "ISPEZIONI" ||
            selectedServiceType === "APERTURA_CHIUSURA" ||
            selectedServiceType === "BONIFICA" ||
            selectedServiceType === "GESTIONE_CHIAVI") && ( // Include new service type
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
                    selectedServiceType={selectedServiceType}
                    tipoAperturaChiusura={tipoAperturaChiusura}
                    tipoGestioneChiavi={tipoGestioneChiavi}
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
        </div>

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