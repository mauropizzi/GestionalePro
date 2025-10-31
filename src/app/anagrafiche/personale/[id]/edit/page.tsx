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

interface Personale {
  id: string;
  nome: string;
  cognome: string;
  codice_fiscale: string | null;
  ruolo: string | null;
  telefono: string | null;
  email: string | null;
  data_nascita: string | null; // ISO string for date
  luogo_nascita: string | null;
  indirizzo: string | null;
  cap: string | null;
  citta: string | null;
  provincia: string | null;
  data_assunzione: string | null; // ISO string for date
  data_cessazione: string | null; // ISO string for date
  attivo: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
}

const formSchema = z.object({
  nome: z.string().min(1, "Il nome è richiesto."),
  cognome: z.string().min(1, "Il cognome è richiesto."),
  codice_fiscale: z.string().nullable(),
  ruolo: z.string().nullable(),
  telefono: z.string().nullable(),
  email: z.string().email("Inserisci un indirizzo email valido.").nullable().or(z.literal("")),
  data_nascita: z.date().nullable(),
  luogo_nascita: z.string().nullable(),
  indirizzo: z.string().nullable(),
  cap: z.string().nullable(),
  citta: z.string().nullable(),
  provincia: z.string().nullable(),
  data_assunzione: z.date().nullable(),
  data_cessazione: z.date().nullable(),
  attivo: z.boolean(), // Changed to z.boolean()
  note: z.string().nullable(),
});

type PersonaleFormSchema = z.infer<typeof formSchema>;

export default function EditPersonalePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [personale, setPersonale] = useState<Personale | null>(null);
  const router = useRouter();
  const params = useParams();
  const personaleId = params.id as string;

  const form = useForm<PersonaleFormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      cognome: "",
      codice_fiscale: null,
      ruolo: null,
      telefono: null,
      email: null,
      data_nascita: null,
      luogo_nascita: null,
      indirizzo: null,
      cap: null,
      citta: null,
      provincia: null,
      data_assunzione: null,
      data_cessazione: null,
      attivo: true, // Ensure this is boolean
      note: null,
    },
  });

  useEffect(() => {
    async function fetchPersonaleData() {
      if (!personaleId) return;

      const { data, error } = await supabase
        .from("personale")
        .select("*")
        .eq("id", personaleId)
        .single();

      if (error) {
        console.error("Supabase fetch error:", error); // Added for debugging
        toast.error("Errore nel recupero del personale: " + error.message);
        router.push("/anagrafiche/personale");
      } else if (data) {
        setPersonale(data);
        form.reset({
          nome: data.nome || "",
          cognome: data.cognome || "",
          codice_fiscale: data.codice_fiscale || null,
          ruolo: data.ruolo || null,
          telefono: data.telefono || null,
          email: data.email || null,
          data_nascita: data.data_nascita ? parseISO(data.data_nascita) : null,
          luogo_nascita: data.luogo_nascita || null,
          indirizzo: data.indirizzo || null,
          cap: data.cap || null,
          citta: data.citta || null,
          provincia: data.provincia || null,
          data_assunzione: data.data_assunzione ? parseISO(data.data_assunzione) : null,
          data_cessazione: data.data_cessazione ? parseISO(data.data_cessazione) : null,
          attivo: data.attivo,
          note: data.note || null,
        });
      }
      setIsLoading(false);
    }

    fetchPersonaleData();
  }, [personaleId, form, router]);

  async function onSubmit(values: PersonaleFormSchema) {
    setIsSubmitting(true);
    const now = new Date().toISOString();
    const personaleData = {
      ...values,
      email: values.email === "" ? null : values.email,
      codice_fiscale: values.codice_fiscale === "" ? null : values.codice_fiscale,
      ruolo: values.ruolo === "" ? null : values.ruolo,
      telefono: values.telefono === "" ? null : values.telefono,
      data_nascita: values.data_nascita ? format(values.data_nascita, "yyyy-MM-dd") : null,
      luogo_nascita: values.luogo_nascita === "" ? null : values.luogo_nascita,
      indirizzo: values.indirizzo === "" ? null : values.indirizzo,
      cap: values.cap === "" ? null : values.cap,
      citta: values.citta === "" ? null : values.citta,
      provincia: values.provincia === "" ? null : values.provincia,
      data_assunzione: values.data_assunzione ? format(values.data_assunzione, "yyyy-MM-dd") : null,
      data_cessazione: values.data_cessazione ? format(values.data_cessazione, "yyyy-MM-dd") : null,
      note: values.note === "" ? null : values.note,
    };

    const { error } = await supabase
      .from("personale")
      .update({ ...personaleData, updated_at: now })
      .eq("id", personaleId);

    if (error) {
      console.error("Supabase update error:", error); // Added for debugging
      toast.error("Errore durante l'aggiornamento del personale: " + error.message);
    } else {
      toast.success("Personale aggiornato con successo!");
      router.push("/anagrafiche/personale");
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

  if (!personale) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h2 className="text-xl font-bold mb-2">Personale non trovato</h2>
          <p className="text-sm text-muted-foreground">Il membro del personale che stai cercando non esiste o non è accessibile.</p>
          <Button asChild className="mt-4">
            <Link href="/anagrafiche/personale">Torna all'Elenco Personale</Link>
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
            <Link href="/anagrafiche/personale">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Modifica Personale: {personale.nome} {personale.cognome}</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Apporta modifiche ai dati del membro del personale.
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2 max-w-3xl mx-auto">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cognome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cognome</FormLabel>
                  <FormControl>
                    <Input placeholder="Cognome" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="codice_fiscale"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Codice Fiscale</FormLabel>
                  <FormControl>
                    <Input placeholder="Codice Fiscale" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ruolo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ruolo</FormLabel>
                  <FormControl>
                    <Input placeholder="Es. Tecnico, Amministrativo" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefono</FormLabel>
                  <FormControl>
                    <Input placeholder="Numero di telefono" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Email" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="data_nascita"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data di Nascita</FormLabel>
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
              name="luogo_nascita"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Luogo di Nascita</FormLabel>
                  <FormControl>
                    <Input placeholder="Luogo di Nascita" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="indirizzo"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Indirizzo</FormLabel>
                  <FormControl>
                    <Input placeholder="Via, numero civico" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cap"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CAP</FormLabel>
                  <FormControl>
                    <Input placeholder="CAP" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="citta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Città</FormLabel>
                  <FormControl>
                    <Input placeholder="Città" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="provincia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provincia</FormLabel>
                  <FormControl>
                    <Input placeholder="Provincia (es. RM)" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="data_assunzione"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data di Assunzione</FormLabel>
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
              name="data_cessazione"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data di Cessazione</FormLabel>
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
              name="attivo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm md:col-span-2">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">Personale Attivo</FormLabel>
                    <FormDescription className="text-xs">
                      Indica se il membro del personale è attualmente attivo.
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
                    <Textarea placeholder="Aggiungi note sul personale..." {...field} value={field.value ?? ""} />
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
                  "Salva Personale"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}