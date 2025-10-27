"use client";

import React from "react";
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
import { CalendarIcon, Clock, Loader2 } from "lucide-react";
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
  calculateTotalHours,
  calculateNumberOfInspections,
  IspezioniFormSchema, // Import IspezioniFormSchema
} from "@/lib/richieste-servizio-utils";
import { DailySchedulesFormField } from "./daily-schedules-form-field";

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

  if (selectedServiceType === "PIANTONAMENTO_ARMATO" || selectedServiceType === "SERVIZIO_FIDUCIARIO" || selectedServiceType === "ISPEZIONI") {
    const { data_inizio_servizio, ora_inizio_servizio, data_fine_servizio, ora_fine_servizio, numero_agenti, daily_schedules } = formValues;

    if (data_inizio_servizio && ora_inizio_servizio && data_fine_servizio && ora_fine_servizio && daily_schedules && numero_agenti !== undefined) {
      // Combine date and time into full Date objects
      const [startHour, startMinute] = ora_inizio_servizio.split(':').map(Number);
      const fullStartDateTime = setMinutes(setHours(data_inizio_servizio, startHour), startMinute);

      const [endHour, endMinute] = ora_fine_servizio.split(':').map(Number);
      const fullEndDateTime = setMinutes(setHours(data_fine_servizio, endHour), endMinute);

      calculatedValue = calculateTotalHours(
        fullStartDateTime,
        fullEndDateTime,
        daily_schedules,
        numero_agenti
      );
      calculationLabel = "Ore totali stimate:";
    }
  } else if (selectedServiceType === "ISPEZIONI") {
    // Narrow the type of formValues for ISPEZIONI
    const ispezioniValues = formValues as IspezioniFormSchema;
    const { ora_inizio_fascia, ora_fine_fascia, cadenza_ore } = ispezioniValues;

    if (ora_inizio_fascia && ora_fine_fascia && cadenza_ore !== undefined) {
      calculatedValue = calculateNumberOfInspections(
        ora_inizio_fascia,
        ora_fine_fascia,
        cadenza_ore
      );
      calculationLabel = "Numero di ispezioni stimate:";
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
          selectedServiceType === "ISPEZIONI") && (
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
                        {punto.nome_punto_servizio} {/* Corrected to nome_punto_servizio */}
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
          selectedServiceType === "ISPEZIONI") && (
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

        {/* Data Inizio Servizio & Ora Inizio Servizio */}
        {(selectedServiceType === "PIANTONAMENTO_ARMATO" ||
          selectedServiceType === "SERVIZIO_FIDUCIARIO" ||
          selectedServiceType === "ISPEZIONI") && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <FormField
              control={form.control}
              name="ora_inizio_servizio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ora Inizio Servizio</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Data Fine Servizio & Ora Fine Servizio */}
        {(selectedServiceType === "PIANTONAMENTO_ARMATO" ||
          selectedServiceType === "SERVIZIO_FIDUCIARIO" ||
          selectedServiceType === "ISPEZIONI") && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <FormField
              control={form.control}
              name="ora_fine_servizio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ora Fine Servizio</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Numero Agenti */}
        {(selectedServiceType === "PIANTONAMENTO_ARMATO" ||
          selectedServiceType === "SERVIZIO_FIDUCIARIO" || // Also show for ISPEZIONI as per schema
          selectedServiceType === "ISPEZIONI") && (
          <FormField
            control={form.control}
            name="numero_agenti"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Numero Agenti</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Daily Schedules */}
        {(selectedServiceType === "PIANTONAMENTO_ARMATO" ||
          selectedServiceType === "SERVIZIO_FIDUCIARIO" ||
          selectedServiceType === "ISPEZIONI") && (
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

        {/* Ora Inizio Fascia, Ora Fine Fascia, Cadenza Ore (only for ISPEZIONI) */}
        {selectedServiceType === "ISPEZIONI" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="ora_inizio_fascia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ora Inizio Fascia</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ora_fine_fascia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ora Fine Fascia</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cadenza_ore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cadenza (ore)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
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