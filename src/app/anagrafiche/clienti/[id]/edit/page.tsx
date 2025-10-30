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
import { Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Client {
  id: string;
  ragione_sociale: string;
  codice_fiscale: string | null;
  partita_iva: string | null;
  indirizzo: string | null;
  citta: string | null;
  cap: string | null;
  provincia: string | null;
  telefono: string | null;
  email: string | null;
  pec: string | null;
  sdi: string | null;
  attivo: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
  codice_cliente_custom: string | null; // Nuovo campo
}

const formSchema = z.object({
  ragione_sociale: z.string().min(1, "La ragione sociale è richiesta."),
  codice_fiscale: z.string().nullable(),
  partita_iva: z.string().nullable(),
  indirizzo: z.string().nullable(),
  citta: z.string().nullable(),
  cap: z.string().nullable(),
  provincia: z.string().nullable(),
  telefono: z.string().nullable(),
  email: z.string().email("Inserisci un indirizzo email valido.").nullable().or(z.literal("")),
  pec: z.string().email("Inserisci un indirizzo PEC valido.").nullable().or(z.literal("")),
  sdi: z.string().nullable(),
  attivo: z.boolean(), // Changed to z.boolean()
  note: z.string().nullable(),
  codice_cliente_custom: z.string().nullable(), // Nuovo campo
});

type ClientFormSchema = z.infer<typeof formSchema>;

export default function EditClientPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const form = useForm<ClientFormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ragione_sociale: "",
      codice_fiscale: null,
      partita_iva: null,
      indirizzo: null,
      citta: null,
      cap: null,
      provincia: null,
      telefono: null,
      email: null,
      pec: null,
      sdi: null,
      attivo: true, // Ensure this is boolean
      note: null,
      codice_cliente_custom: null, // Default value for new field
    },
  });

  useEffect(() => {
    async function fetchClient() {
      if (!clientId) return;

      const { data, error } = await supabase
        .from("clienti")
        .select("*")
        .eq("id", clientId)
        .single();

      if (error) {
        console.error("Supabase fetch error:", error); // Added for debugging
        toast.error("Errore nel recupero del cliente: " + error.message);
        router.push("/anagrafiche/clienti");
      } else if (data) {
        setClient(data);
        form.reset({
          ragione_sociale: data.ragione_sociale || "",
          codice_fiscale: data.codice_fiscale || null,
          partita_iva: data.partita_iva || null,
          indirizzo: data.indirizzo || null,
          citta: data.citta || null,
          cap: data.cap || null,
          provincia: data.provincia || null,
          telefono: data.telefono || null,
          email: data.email || null,
          pec: data.pec || null,
          sdi: data.sdi || null,
          attivo: data.attivo,
          note: data.note || null,
          codice_cliente_custom: data.codice_cliente_custom || null, // Populate new field
        });
      }
      setIsLoading(false);
    }

    fetchClient();
  }, [clientId, form, router]);

  async function onSubmit(values: ClientFormSchema) {
    setIsSubmitting(true);
    const now = new Date().toISOString();
    const clientData = {
      ...values,
      email: values.email === "" ? null : values.email,
      pec: values.pec === "" ? null : values.pec,
      codice_fiscale: values.codice_fiscale === "" ? null : values.codice_fiscale,
      partita_iva: values.partita_iva === "" ? null : values.partita_iva,
      indirizzo: values.indirizzo === "" ? null : values.indirizzo,
      citta: values.citta === "" ? null : values.citta,
      cap: values.cap === "" ? null : values.cap,
      provincia: values.provincia === "" ? null : values.provincia,
      telefono: values.telefono === "" ? null : values.telefono,
      sdi: values.sdi === "" ? null : values.sdi,
      note: values.note === "" ? null : values.note,
      codice_cliente_custom: values.codice_cliente_custom === "" ? null : values.codice_cliente_custom, // Save new field
    };

    const { error } = await supabase
      .from("clienti")
      .update({ ...clientData, updated_at: now })
      .eq("id", clientId);

    if (error) {
      console.error("Supabase update error:", error); // Added for debugging
      toast.error("Errore durante l'aggiornamento del cliente: " + error.message);
    } else {
      toast.success("Cliente aggiornato con successo!");
      router.push("/anagrafiche/clienti");
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

  if (!client) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h2 className="text-xl font-bold mb-2">Cliente non trovato</h2>
          <p className="text-sm text-muted-foreground">Il cliente che stai cercando non esiste o non è accessibile.</p>
          <Button asChild className="mt-4">
            <Link href="/anagrafiche/clienti">Torna ai Clienti</Link>
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
            <Link href="/anagrafiche/clienti">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Modifica Cliente: {client.ragione_sociale}</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Apporta modifiche ai dati del cliente.
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2 max-w-3xl mx-auto">
            <FormField
              control={form.control}
              name="ragione_sociale"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Ragione Sociale</FormLabel>
                  <FormControl>
                    <Input placeholder="Ragione Sociale" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="codice_cliente_custom"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Codice Cliente Personalizzato (Opzionale)</FormLabel>
                  <FormControl>
                    <Input placeholder="Codice univoco per il cliente" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Un codice identificativo che puoi creare e modificare a piacimento. Deve essere unico.
                  </FormDescription>
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
              name="partita_iva"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Partita IVA</FormLabel>
                  <FormControl>
                    <Input placeholder="Partita IVA" {...field} value={field.value ?? ""} />
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
              name="pec"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PEC</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="PEC" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sdi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Codice SDI</FormLabel>
                  <FormControl>
                    <Input placeholder="Codice SDI" {...field} value={field.value ?? ""} />
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
                    <FormLabel className="text-sm">Cliente Attivo</FormLabel>
                    <FormDescription className="text-xs">
                      Indica se il cliente è attualmente attivo.
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
                    <Textarea placeholder="Aggiungi note sul cliente..." {...field} value={field.value ?? ""} />
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