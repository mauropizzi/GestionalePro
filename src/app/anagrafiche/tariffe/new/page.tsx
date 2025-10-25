"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

const formSchema = z.object({
  client_id: z.string().uuid("Seleziona un cliente valido.").nullable(),
  tipo_servizio: z.string().min(1, "Il tipo di servizio è richiesto."),
  importo: z.coerce.number().min(0, "L'importo deve essere un numero positivo."),
  supplier_rate: z.coerce.number().min(0, "Il costo fornitore deve essere un numero positivo.").nullable(),
  unita_misura: z.string().nullable(),
  punto_servizio_id: z.string().uuid("Seleziona un punto servizio valido.").nullable(),
  fornitore_id: z.string().uuid("Seleziona un fornitore valido.").nullable(),
  data_inizio_validita: z.date().nullable(),
  data_fine_validita: z.date().nullable(),
  note: z.string().nullable(),
});

type TariffaFormSchema = z.infer<typeof formSchema>;

export default function NewTariffaPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [puntiServizio, setPuntiServizio] = useState<PuntoServizio[]>([]);
  const [fornitori, setFornitori] = useState<Fornitore[]>([]);
  const router = useRouter();

  const form = useForm<TariffaFormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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
    },
  });

  useEffect(() => {
    async function fetchDependencies() {
      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from("clienti")
        .select("id, ragione_sociale")
        .order("ragione_sociale", { ascending: true });

      if (clientsError) {
        toast.error("Errore nel recupero dei clienti: " + clientsError.message);
      } else {
        setClients(clientsData || []);
      }

      // Fetch punti_servizio
      const { data: puntiServizioData, error: puntiServizioError } = await supabase
        .from("punti_servizio")
        .select("id, nome_punto_servizio")
        .order("nome_punto_servizio", { ascending: true });

      if (puntiServizioError) {
        toast.error("Errore nel recupero dei punti di servizio: " + puntiServizioError.message);
      } else {
        setPuntiServizio(puntiServizioData || []);
      }

      // Fetch fornitori
      const { data: fornitoriData, error: fornitoriError } = await supabase
        .from("fornitori")
        .select("id, ragione_sociale")
        .order("ragione_sociale", { ascending: true });

      if (fornitoriError) {
        toast.error("Errore nel recupero dei fornitori: " + fornitoriError.message);
      } else {
        setFornitori(fornitoriData || []);
      }
    }
    fetchDependencies();
  }, []);

  async function onSubmit(values: TariffaFormSchema) {
    setIsLoading(true);
    const now = new Date().toISOString();
    const tariffaData = {
      ...values,
      client_id: values.client_id === "" ? null : values.client_id,
      supplier_rate: values.supplier_rate === 0 ? null : values.supplier_rate,
      unita_misura: values.unita_misura === "" ? null : values.unita_misura,
      punto_servizio_id: values.punto_servizio_id === "" ? null : values.punto_servizio_id,
      fornitore_id: values.fornitore_id === "" ? null : values.fornitore_id,
      data_inizio_validita: values.data_inizio_validita ? format(values.data_inizio_validita, "yyyy-MM-dd") : null,
      data_fine_validita: values.data_fine_validita ? format(values.data_fine_validita, "yyyy-MM-dd") : null,
      note: values.note === "" ? null : values.note,
    };

    const { error } = await supabase
      .from("tariffe")
      .insert({ ...tariffaData, created_at: now, updated_at: now });

    if (error) {
      toast.error("Errore durante il salvataggio della tariffa: " + error.message);
    } else {
      toast.success("Tariffa salvata con successo!");
      router.push("/anagrafiche/tariffe");
    }
    setIsLoading(false);
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
              name="importo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Importo</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
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
                  <FormLabel>Costo Fornitore</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value ?? ""} />
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
                    <Input placeholder="Es. €/ora, €/intervento" {...field} value={field.value ?? ""} />
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
                <FormItem>
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
                  "Salva Tariffa"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}