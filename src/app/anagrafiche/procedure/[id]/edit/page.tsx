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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Loader2, ArrowLeft } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Procedura {
  id: string;
  nome_procedura: string;
  descrizione: string | null;
  versione: string | null;
  data_ultima_revisione: string | null; // ISO string for date
  responsabile: string | null;
  documento_url: string | null;
  attivo: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
}

const formSchema = z.object({
  nome_procedura: z.string().min(1, "Il nome della procedura è richiesto."),
  descrizione: z.string().nullable(),
  versione: z.string().nullable(),
  data_ultima_revisione: z.date().nullable(),
  responsabile: z.string().nullable(),
  documento_url: z.string().url("Inserisci un URL valido.").nullable().or(z.literal("")),
  attivo: z.boolean(),
  note: z.string().nullable(),
});

type ProceduraFormSchema = z.infer<typeof formSchema>;

export default function EditProceduraPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [procedura, setProcedura] = useState<Procedura | null>(null);
  const router = useRouter();
  const params = useParams();
  const proceduraId = params.id as string;

  const form = useForm<ProceduraFormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome_procedura: "",
      descrizione: null,
      versione: null,
      data_ultima_revisione: null,
      responsabile: null,
      documento_url: null,
      attivo: true,
      note: null,
    },
  });

  useEffect(() => {
    async function fetchProceduraData() {
      if (!proceduraId) return;

      const { data, error } = await supabase
        .from("procedure")
        .select("*")
        .eq("id", proceduraId)
        .single();

      if (error) {
        toast.error("Errore nel recupero della procedura: " + error.message);
        router.push("/anagrafiche/procedure");
      } else if (data) {
        setProcedura(data);
        form.reset({
          nome_procedura: data.nome_procedura || "",
          descrizione: data.descrizione || null,
          versione: data.versione || null,
          data_ultima_revisione: data.data_ultima_revisione ? parseISO(data.data_ultima_revisione) : null,
          responsabile: data.responsabile || null,
          documento_url: data.documento_url || null,
          attivo: data.attivo,
          note: data.note || null,
        });
      }
      setIsLoading(false);
    }

    fetchProceduraData();
  }, [proceduraId, form, router]);

  async function onSubmit(values: ProceduraFormSchema) {
    setIsSubmitting(true);
    const now = new Date().toISOString();
    const proceduraData = {
      ...values,
      descrizione: values.descrizione === "" ? null : values.descrizione,
      versione: values.versione === "" ? null : values.versione,
      data_ultima_revisione: values.data_ultima_revisione ? format(values.data_ultima_revisione, "yyyy-MM-dd") : null,
      responsabile: values.responsabile === "" ? null : values.responsabile,
      documento_url: values.documento_url === "" ? null : values.documento_url,
      note: values.note === "" ? null : values.note,
    };

    const { error } = await supabase
      .from("procedure")
      .update({ ...proceduraData, updated_at: now })
      .eq("id", proceduraId);

    if (error) {
      toast.error("Errore durante l'aggiornamento della procedura: " + error.message);
    } else {
      toast.success("Procedura aggiornata con successo!");
      router.push("/anagrafiche/procedure");
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

  if (!procedura) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h2 className="text-xl font-bold mb-2">Procedura non trovata</h2>
          <p className="text-sm text-muted-foreground">La procedura che stai cercando non esiste o non è accessibile.</p>
          <Button asChild className="mt-4">
            <Link href="/anagrafiche/procedure">Torna alle Procedure</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4 mb-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/anagrafiche/procedure">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Modifica Procedura: {procedura.nome_procedura}</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Apporta modifiche ai dati della procedura.
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2 max-w-3xl mx-auto">
            <FormField
              control={form.control}
              name="nome_procedura"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Nome Procedura</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome della procedura" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="descrizione"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Descrizione</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descrizione dettagliata della procedura" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="versione"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Versione</FormLabel>
                  <FormControl>
                    <Input placeholder="Es. 1.0, 2.1" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="data_ultima_revisione"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data Ultima Revisione</FormLabel>
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
              name="responsabile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsabile</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome del responsabile" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="documento_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Documento</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://esempio.com/documento.pdf" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="attivo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm md:col-span-2">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">Procedura Attiva</FormLabel>
                    <FormDescription className="text-xs">
                      Indica se la procedura è attualmente in uso.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
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
                    <Textarea placeholder="Aggiungi note sulla procedura..." {...field} value={field.value ?? ""} />
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
                  "Salva Procedura"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}