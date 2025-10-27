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
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Client, PuntoServizio, Fornitore } from "@/types/richieste-servizio";
import { RichiestaServizioFormSchema, SERVICE_TYPES, INSPECTION_TYPES } from "@/lib/richieste-servizio-utils";
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2 max-w-4xl mx-auto">
        {/* Left Column for main fields */}
        <div className="grid grid-cols-1 gap-3">
          <FormField
            control={form.control}
            name="client_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente Associato</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
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
          <FormField
            control={form.control}
            name="punto_servizio_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Punto Servizio Associato</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona un punto servizio (opzionale)" />
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
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fornitore_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fornitore del Servizio</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona un fornitore (opzionale)" />
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
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tipo_servizio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo di Servizio</FormLabel>
                <Select onValueChange={field.onChange} value={typeof field.value === 'string' ? field.value : ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona il tipo di servizio" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SERVICE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs">
                  Seleziona la tipologia di servizio richiesta.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Campi specifici per PIANTONAMENTO_ARMATO e SERVIZIO_FIDUCIARIO */}
          {(selectedServiceType === "PIANTONAMENTO_ARMATO" || selectedServiceType === "SERVIZIO_FIDUCIARIO") && (
            <>
              <FormField
                control={form.control}
                name="data_inizio_servizio"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data Inizio Servizio</FormLabel>
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
                          selected={field.value}
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
                  <FormItem className="flex flex-col">
                    <FormLabel>Ora Inizio Servizio</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type="time" {...field} className="pr-8" />
                        <Clock className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="data_fine_servizio"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data Fine Servizio</FormLabel>
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
                          selected={field.value}
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
                  <FormItem className="flex flex-col">
                    <FormLabel>Ora Fine Servizio</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type="time" {...field} className="pr-8" />
                        <Clock className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numero_agenti"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numero di Agenti</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} min={1} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          {/* Campi specifici per ISPEZIONI */}
          {selectedServiceType === "ISPEZIONI" && (
            <>
              <FormField
                control={form.control}
                name="data_servizio"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data del Servizio</FormLabel>
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
                          selected={field.value}
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
                name="ora_inizio_fascia"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Ora Inizio Fascia</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type="time" {...field} className="pr-8" />
                        <Clock className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ora_fine_fascia"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Ora Fine Fascia</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type="time" {...field} className="pr-8" />
                        <Clock className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
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
                    <FormLabel>Cadenza Oraria (ore)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.5" {...field} min={0.5} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Es. 2 per un'ispezione ogni 2 ore.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tipo_ispezione"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo di Ispezione</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona il tipo di ispezione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INSPECTION_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Note</FormLabel>
                <FormControl>
                  <Textarea placeholder="Aggiungi note sulla richiesta di servizio..." {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Right Column for Daily Schedules (only for PIANTONAMENTO_ARMATO and SERVIZIO_FIDUCIARIO) */}
        {(selectedServiceType === "PIANTONAMENTO_ARMATO" || selectedServiceType === "SERVIZIO_FIDUCIARIO") && (
          <div>
            <DailySchedulesFormField />
          </div>
        )}

        <div className="md:col-span-2 flex justify-end mt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Salva modifiche"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}