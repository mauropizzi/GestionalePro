"use client";

import React, { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format, setHours, setMinutes } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Client, PuntoServizio, Fornitore } from "@/types/richieste-servizio";
import {
  RichiestaServizioFormSchema,
  SERVICE_TYPES,
  INSPECTION_TYPES,
  APERTURA_CHIUSURA_TYPES,
  calculateTotalHours,
  calculateTotalInspections,
  calculateAperturaChiusuraCount,
  calculateBonificaCount, // Importa la nuova funzione di calcolo
  IspezioniFormSchema,
  AperturaChiusuraFormSchema,
  AperturaChiusuraType,
  BonificaFormSchema, // Importa il nuovo tipo di schema
  dailyScheduleSchema, // Import dailyScheduleSchema for typing
} from "@/lib/richieste-servizio-utils";
import { DailySchedulesFormField } from "./daily-schedules-form-field";
import { z } from "zod"; // Import z for typing

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
        form.setValue("tipo_ispezione", INSPECTION_TYPES[0].value, { shouldDirty: true });
      }
      // Clear other specific fields
      form.setValue("tipo_apertura_chiusura", null, { shouldDirty: true });
    } else if (selectedServiceType === "APERTURA_CHIUSURA") {
      if (!form.getValues("tipo_apertura_chiusura")) {
        form.setValue("tipo_apertura_chiusura", APERTURA_CHIUSURA_TYPES[0].value, { shouldDirty: true });
      }
      // Clear other specific fields
      form.setValue("cadenza_ore", null, { shouldDirty: true });
      form.setValue("tipo_ispezione", null, { shouldDirty: true });
    } else if (selectedServiceType === "BONIFICA") {
      // For Bonifica, ensure h24 is false and ora_fine is null for all active schedules
      const currentSchedules = form.getValues("daily_schedules");
      const updatedSchedules = currentSchedules.map((schedule: z.infer<typeof dailyScheduleSchema>) => ({ // <-- Fixed: Added explicit type
        ...schedule,
        h24: false,
        ora_fine: null,
        ora_inizio: schedule.attivo && !schedule.ora_inizio ? "08:00" : schedule.ora_inizio, // Default to 08:00 if active and no start time
      }));
      form.setValue("daily_schedules", updatedSchedules, { shouldDirty: true });
      // Clear other specific fields
      form.setValue("cadenza_ore", null, { shouldDirty: true });
      form.setValue("tipo_ispezione", null, { shouldDirty: true });
      form.setValue("tipo_apertura_chiusura", null, { shouldDirty: true });
    } else {
      // Clear all specific fields if not ISPEZIONI, APERTURA_CHIUSURA, or BONIFICA
      form.setValue("cadenza_ore", null, { shouldDirty: true });
      form.setValue("tipo_ispezione", null, { shouldDirty: true });
      form.setValue("tipo_apertura_chiusura", null, { shouldDirty: true });
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
    const { data_inizio_servizio, data_fine_servizio, numero_agenti, daily_schedules } = formValues as BonificaFormSchema;

    if (data_inizio_servizio && data_fine_servizio && daily_schedules && numero_agenti !== undefined) {
      calculatedValue = calculateBonificaCount(
        data_inizio_servizio,
        data_fine_servizio,
        daily_schedules,
        numero_agenti
      );
      calculationLabel = "Numero totale bonifiche stimate:";
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Client ID */}
        <FormField
          control={form.control}
          name="client_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona un cliente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.ragione_sociale}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tipo Servizio */}
        <FormField
          control={form.control}
          name="tipo_servizio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo di Servizio</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value || ""}> {/* <-- Fixed: Added || "" */}
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona un tipo di servizio" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SERVICE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Punto Servizio ID (conditionally rendered) */}
        {(selectedServiceType === "PIANTONAMENTO_ARMATO" ||
          selectedServiceType === "SERVIZIO_FIDUCIARIO" ||
          selectedServiceType === "ISPEZIONI" ||
          selectedServiceType === "APERTURA_CHIUSURA" ||
          selectedServiceType === "BONIFICA") && (
          <FormField
            control={form.control}
            name="punto_servizio_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Punto Servizio</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona un punto servizio" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {puntiServizio.map((punto) => (
                      <SelectItem key={punto.id} value={punto.id}>
                        {punto.nome_punto_servizio}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        )}

        {/* Fornitore ID (conditionally rendered) */}
        {(selectedServiceType === "PIANTONAMENTO_ARMATO" ||
          selectedServiceType === "SERVIZIO_FIDUCIARIO" ||
          selectedServiceType === "ISPEZIONI" ||
          selectedServiceType === "APERTURA_CHIUSURA" ||
          selectedServiceType === "BONIFICA") && (
          <FormField
            control={form.control}
            name="fornitore_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fornitore</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona un fornitore" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {fornitori.map((fornitore) => (
                      <SelectItem key={fornitore.id} value={fornitore.id}>
                        {fornitore.ragione_sociale}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        )}

        {/* Data Inizio Servizio */}
        {(selectedServiceType === "PIANTONAMENTO_ARMATO" ||
          selectedServiceType === "SERVIZIO_FIDUCIARIO" ||
          selectedServiceType === "ISPEZIONI" ||
          selectedServiceType === "APERTURA_CHIUSURA" ||
          selectedServiceType === "BONIFICA") && (
          <FormField
            control={form.control}
            name="data_inizio_servizio"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="mb-2">Data Inizio Servizio</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: it })
                        ) : (
                          <span>Seleziona una data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      initialFocus
                      locale={it}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Data Fine Servizio */}
        {(selectedServiceType === "PIANTONAMENTO_ARMATO" ||
          selectedServiceType === "SERVIZIO_FIDUCIARIO" ||
          selectedServiceType === "ISPEZIONI" ||
          selectedServiceType === "APERTURA_CHIUSURA" ||
          selectedServiceType === "BONIFICA") && (
          <FormField
            control={form.control}
            name="data_fine_servizio"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="mb-2">Data Fine Servizio</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: it })
                        ) : (
                          <span>Seleziona una data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      initialFocus
                      locale={it}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Numero Agenti and Cadenza Ore / Tipo Apertura/Chiusura (conditionally rendered and grouped) */}
        {(selectedServiceType === "PIANTONAMENTO_ARMATO" ||
          selectedServiceType === "SERVIZIO_FIDUCIARIO" ||
          selectedServiceType === "ISPEZIONI" ||
          selectedServiceType === "APERTURA_CHIUSURA" ||
          selectedServiceType === "BONIFICA") && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="numero_agenti"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numero Agenti</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value ?? ""}
                      onChange={e => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedServiceType === "ISPEZIONI" && (
              <FormField
                control={form.control}
                name="cadenza_ore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cadenza (ore)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value ?? ""}
                        onChange={e => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedServiceType === "APERTURA_CHIUSURA" && (
              <FormField
                control={form.control}
                name="tipo_apertura_chiusura"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo Attività</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona tipo attività" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {APERTURA_CHIUSURA_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        )}

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
                    selectedServiceType={selectedServiceType} // Pass the service type
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

        {/* Tipo Ispezione (only for ISPEZIONI) */}
        {selectedServiceType === "ISPEZIONI" && (
          <FormField
            control={form.control}
            name="tipo_ispezione"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo di Ispezione</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona un tipo di ispezione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {INSPECTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Calculated Value Display */}
        {calculatedValue !== null && (
          <div className="flex items-center justify-between p-4 border rounded-md bg-gray-50">
            <span className="font-medium">{calculationLabel}</span>
            <span className="text-lg font-bold text-primary">{calculatedValue}</span>
          </div>
        )}

        {/* Note */}
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note</FormLabel>
              <FormControl>
                <Textarea placeholder="Aggiungi note aggiuntive" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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