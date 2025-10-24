"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Interfacce per le dipendenze
interface Client {
  id: string;
  ragione_sociale: string;
}

interface PuntoServizio {
  id: string;
  nome_punto_servizio: string;
}

interface Fornitore {
  id: string;
  ragione_sociale: string;
}

// Schema di validazione Zod per il form della tariffa
export const tariffaFormSchema = z.object({
  client_id: z.string().uuid("Seleziona un cliente valido.").nullable(),
  tipo_servizio: z.string().min(1, "Il tipo di servizio è richiesto."),
  importo: z.union([z.number(), z.string().transform((val) => (val === "" ? 0 : Number(val)))])
    .pipe(
      z.number({ invalid_type_error: "L'importo deve essere un numero." })
        .min(0, "L'importo non può essere negativo.")
    )
    .default(0), // Default to 0 if empty/null/undefined after transformation
  supplier_rate: z.union([z.number(), z.string().transform((val) => (val === "" ? null : Number(val))), z.literal(null)])
    .pipe(
      z.number({ invalid_type_error: "La tariffa fornitore deve essere un numero." })
        .min(0, "La tariffa fornitore non può essere negativa.")
        .nullable()
    )
    .default(null), // Default to null if empty/null/undefined after transformation
  unita_misura: z.string().nullable(),
  punto_servizio_id: z.string().uuid("Seleziona un punto di servizio valido.").nullable(),
  fornitore_id: z.string().uuid("Seleziona un fornitore valido.").nullable(),
  data_inizio_validita: z.date().nullable(),
  data_fine_validita: z.date().nullable(),
  note: z.string().nullable(),
}).refine((data) => {
  if (data.data_inizio_validita && data.data_fine_validita) {
    return data.data_fine_validita >= data.data_inizio_validita;
  }
  return true;
}, {
  message: "La data di fine validità non può essere precedente alla data di inizio.",
  path: ["data_fine_validita"],
});

export type TariffaFormSchema = z.infer<typeof tariffaFormSchema>;
// Define the input type for the form, which zodResolver uses for TTransformedValues
export type TariffaFormInput = z.input<typeof tariffaFormSchema>;

interface TariffaFormProps {
  defaultValues?: TariffaFormSchema;
  onSubmit: (values: TariffaFormSchema) => void;
  isLoading: boolean;
  clients: Client[];
  puntiServizio: PuntoServizio[];
  fornitori: Fornitore[];
  buttonText: string;
}

export function TariffaForm({
  defaultValues: propDefaultValues, // Renamed to avoid conflict with internal defaultValues
  onSubmit,
  isLoading,
  clients,
  puntiServizio,
  fornitori,
  buttonText,
}: TariffaFormProps) {
  // Define a fallback for defaultValues to ensure useForm always gets a complete object
  const fallbackDefaultValues: TariffaFormSchema = {
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

  // Explicitly define TFieldValues and TTransformedValues
  const form = useForm<TariffaFormSchema, any, TariffaFormInput>({
    resolver: zodResolver(tariffaFormSchema),
    defaultValues: fallbackDefaultValues, // Always initialize with a fully defined fallback
  });

  React.useEffect(() => {
    if (propDefaultValues) {
      form.reset(propDefaultValues);
    } else {
      // If propDefaultValues become undefined (e.g., when navigating from edit to new), reset to fallback
      form.reset(fallbackDefaultValues);
    }
  }, [propDefaultValues, form, fallbackDefaultValues]); // Added fallbackDefaultValues to dependency array

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-w-3xl mx-auto">
        <FormField
          control={form.control}
          name="tipo_servizio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo Servizio</FormLabel>
              <FormControl>
                <Input placeholder="Es. Manutenzione, Installazione" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="unita_misura"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unità di Misura</FormLabel>
              <FormControl>
                <Input placeholder="Es. Ora, Pezzo, Km" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="importo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Importo (€)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="supplier_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tariffa Fornitore (€)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="client_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente Associato</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
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
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fornitore_id"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Fornitore Associato</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
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
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="data_inizio_validita"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data Inizio Validità</FormLabel>
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
          name="data_fine_validita"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data Fine Validità</FormLabel>
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
          name="note"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Note</FormLabel>
              <FormControl>
                <Textarea placeholder="Aggiungi note sulla tariffa..." {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              buttonText
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}