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
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Loader2, ArrowLeft } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
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

interface Tariffa {
  id: string;
  client_id: string | null;
  tipo_servizio: string;
  importo: number;
  supplier_rate: number | null;
  unita_misura: string | null;
  punto_servizio_id: string | null;
  fornitore_id: string | null;
  data_inizio_validita: string | null;
  data_fine_validita: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

const formSchema = z.object({
  client_id: z.string().uuid("Seleziona un cliente valido.").nullable(),
  tipo_servizio: z.string().min(1, "Il tipo di servizio è richiesto."),
  importo: z.preprocess(
    (val) => {
      const processedVal = (typeof val === 'string' && val.trim() === '') || val === null || val === undefined
        ? 0
        : Number(val);
      return processedVal;
    },
    z.number({ invalid_type_error: "L'importo deve essere un numero." })
      .min(0, "L'importo non può essere negativo.")
  ),
  supplier_rate: z.preprocess(
    (val) => {
      const processedVal = (typeof val === 'string' && val.trim() === '') || val === null || val === undefined
        ? null
        : Number(val);
      return processedVal;
    },
    z.number({ invalid_type_error: "La tariffa fornitore deve essere un numero." })
      .min(0, "La tariffa fornitore non può essere negativa.")
      .nullable()
  ),
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

type TariffaFormSchema = z.infer<typeof formSchema>;

export default function EditTariffaPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tariffa, setTariffa] = useState<Tariffa | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [puntiServizio, setPuntiServizio] = useState<PuntoServizio[]>([]);
  const [fornitori, setFornitori] = useState<Fornitore[]>([]);
  const router = useRouter();
  const params = useParams();
  const tariffaId = params.id as string;

  const defaultValues: TariffaFormSchema = {
    client_id: null,
    tipo_servizio: "",
    importo: 0, // Modificato da null a 0
    supplier_rate: null,
    unita_misura: null,
    punto_servizio_id: null,
    fornitore_id: null,
    data_inizio_validita: null,
    data_fine_validita: null,
    note: null,
  };

  const form = useForm<TariffaFormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  });

  useEffect(() => {
    async function fetchData() {
      if (!tariffaId) return;

      // Fetch dependencies
      const { data: clientsData, error: clientsError } = await supabase
        .from("clienti")
        .select("id, ragione_sociale")
        .order("ragione_sociale", { ascending: true });

      if (clientsError) {
        toast.error("Errore nel recupero dei clienti: " + clientsError.message);
      } else {
        setClients(clientsData || []);
      }

      const { data: puntiServizioData, error: puntiServizioError } = await supabase
        .from("punti_servizio")
        .select("id, nome_punto_servizio")
        .order("nome_punto_servizio", { ascending: true });

      if (puntiServizioError) {
        toast.error("Errore nel recupero dei punti di servizio: " + puntiServizioError.message);
      } else {
        setPuntiServizio(puntiServizioData || []);
      }

      const { data: fornitoriData, error: fornitoriError } = await supabase
        .from("fornitori")
        .select("id, ragione_sociale")
        .order("ragione_sociale", { ascending: true });

      if (fornitoriError) {
        toast.error("Errore nel recupero dei fornitori: " + fornitoriError.message);
      } else {
        setFornitori(fornitoriData || []);
      }

      // Fetch tariffa data
      const { data: tariffaData, error: tariffaError } = await supabase
        .from("tariffe")
        .select("*")
        .eq("id", tariffaId)
        .single();

      if (tariffaError) {
        toast.error("Errore nel recupero della tariffa: " + tariffaError.message);
        router.push("/anagrafiche/tariffe");
      } else if (tariffaData) {
        setTariffa(tariffaData);
        form.reset({
          client_id: tariffaData.client_id || null,
          tipo_servizio: tariffaData.tipo_servizio || "",
          importo: tariffaData.importo ?? 0, // Utilizzato nullish coalescing per default a 0
          supplier_rate: tariffaData.supplier_rate || null,
          unita_misura: tariffaData.unita_misura || null,
          punto_servizio_id: tariffaData.punto_servizio_id || null,
          fornitore_id: tariffaData.fornitore_id || null,
          data_inizio_validita: tariffaData.data_inizio_validita ? parseISO(tariffaData.data_inizio_validita) : null,
          data_fine_validita: tariffaData.data_fine_validita ? parseISO(tariffaData.data_fine_validita) : null,
          note: tariffaData.note || null,
        });
      }
      setIsLoading(false);
    }

    fetchData();
  }, [tariffaId, form, router]);

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

    const { error } = await supabase
      .from("tariffe")
      .update({ ...tariffaData, updated_at: now })
      .eq("id", tariffaId);

    if (error) {
      toast.error("Errore durante l'aggiornamento della tariffa: " + error.message);
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
      </div>
    </DashboardLayout>
  );
}