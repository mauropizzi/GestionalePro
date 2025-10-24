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
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Client {
  id: string;
  ragione_sociale: string;
}

interface Fornitore {
  id: string;
  ragione_sociale: string;
}

interface PuntoServizio {
  id: string;
  nome_punto_servizio: string;
  id_cliente: string | null;
  indirizzo: string | null;
  citta: string | null;
  cap: string | null;
  provincia: string | null;
  referente: string | null;
  telefono_referente: string | null;
  telefono: string | null;
  email: string | null;
  note: string | null;
  tempo_intervento: string | null;
  fornitore_id: string | null;
  codice_cliente: string | null;
  codice_sicep: string | null;
  codice_fatturazione: string | null;
  latitude: number | null;
  longitude: number | null;
  nome_procedura: string | null;
  created_at: string;
  updated_at: string;
}

const formSchema = z.object({
  nome_punto_servizio: z.string().min(1, "Il nome del punto servizio è richiesto."),
  id_cliente: z.string().uuid("Seleziona un cliente valido.").nullable(),
  indirizzo: z.string().nullable(),
  citta: z.string().nullable(),
  cap: z.string().nullable(),
  provincia: z.string().nullable(),
  referente: z.string().nullable(),
  telefono_referente: z.string().nullable(),
  telefono: z.string().nullable(),
  email: z.string().email("Inserisci un indirizzo email valido.").nullable().or(z.literal("")),
  note: z.string().nullable(),
  tempo_intervento: z.string().nullable(),
  fornitore_id: z.string().uuid("Seleziona un fornitore valido.").nullable(),
  codice_cliente: z.string().nullable(),
  codice_sicep: z.string().nullable(),
  codice_fatturazione: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  nome_procedura: z.string().nullable(),
});

type PuntoServizioFormSchema = z.infer<typeof formSchema>;

export default function EditPuntoServizioPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [puntoServizio, setPuntoServizio] = useState<PuntoServizio | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [fornitori, setFornitori] = useState<Fornitore[]>([]);
  const router = useRouter();
  const params = useParams();
  const puntoServizioId = params.id as string;

  const form = useForm<PuntoServizioFormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome_punto_servizio: "",
      id_cliente: null,
      indirizzo: null,
      citta: null,
      cap: null,
      provincia: null,
      referente: null,
      telefono_referente: null,
      telefono: null,
      email: null,
      note: null,
      tempo_intervento: null,
      fornitore_id: null,
      codice_cliente: null,
      codice_sicep: null,
      codice_fatturazione: null,
      latitude: null,
      longitude: null,
      nome_procedura: null,
    },
  });

  useEffect(() => {
    async function fetchData() {
      if (!puntoServizioId) return;

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

      // Fetch punto_servizio
      const { data: puntoData, error: puntoError } = await supabase
        .from("punti_servizio")
        .select("*")
        .eq("id", puntoServizioId)
        .single();

      if (puntoError) {
        toast.error("Errore nel recupero del punto di servizio: " + puntoError.message);
        router.push("/anagrafiche/punti-servizio");
      } else if (puntoData) {
        setPuntoServizio(puntoData);
        form.reset({
          nome_punto_servizio: puntoData.nome_punto_servizio || "",
          id_cliente: puntoData.id_cliente || null,
          indirizzo: puntoData.indirizzo || null,
          citta: puntoData.citta || null,
          cap: puntoData.cap || null,
          provincia: puntoData.provincia || null,
          referente: puntoData.referente || null,
          telefono_referente: puntoData.telefono_referente || null,
          telefono: puntoData.telefono || null,
          email: puntoData.email || null,
          note: puntoData.note || null,
          tempo_intervento: puntoData.tempo_intervento || null,
          fornitore_id: puntoData.fornitore_id || null,
          codice_cliente: puntoData.codice_cliente || null,
          codice_sicep: puntoData.codice_sicep || null,
          codice_fatturazione: puntoData.codice_fatturazione || null,
          latitude: puntoData.latitude || null,
          longitude: puntoData.longitude || null,
          nome_procedura: puntoData.nome_procedura || null,
        });
      }
      setIsLoading(false);
    }

    fetchData();
  }, [puntoServizioId, form, router]);

  async function onSubmit(values: PuntoServizioFormSchema) {
    setIsSubmitting(true);
    const now = new Date().toISOString();
    const puntoServizioData = {
      ...values,
      id_cliente: values.id_cliente === "" ? null : values.id_cliente,
      indirizzo: values.indirizzo === "" ? null : values.indirizzo,
      citta: values.citta === "" ? null : values.citta,
      cap: values.cap === "" ? null : values.cap,
      provincia: values.provincia === "" ? null : values.provincia,
      referente: values.referente === "" ? null : values.referente,
      telefono_referente: values.telefono_referente === "" ? null : values.telefono_referente,
      telefono: values.telefono === "" ? null : values.telefono,
      email: values.email === "" ? null : values.email,
      note: values.note === "" ? null : values.note,
      tempo_intervento: values.tempo_intervento === "" ? null : values.tempo_intervento,
      fornitore_id: values.fornitore_id === "" ? null : values.fornitore_id,
      codice_cliente: values.codice_cliente === "" ? null : values.codice_cliente,
      codice_sicep: values.codice_sicep === "" ? null : values.codice_sicep,
      codice_fatturazione: values.codice_fatturazione === "" ? null : values.codice_fatturazione,
      nome_procedura: values.nome_procedura === "" ? null : values.nome_procedura,
    };

    const { error } = await supabase
      .from("punti_servizio")
      .update({ ...puntoServizioData, updated_at: now })
      .eq("id", puntoServizioId);

    if (error) {
      toast.error("Errore durante l'aggiornamento del punto di servizio: " + error.message);
    } else {
      toast.success("Punto di servizio aggiornato con successo!");
      router.push("/anagrafiche/punti-servizio");
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

  if (!puntoServizio) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h2 className="text-2xl font-bold mb-2">Punto Servizio non trovato</h2>
          <p className="text-muted-foreground">Il punto di servizio che stai cercando non esiste o non è accessibile.</p>
          <Button asChild className="mt-4">
            <Link href="/anagrafiche/punti-servizio">Torna ai Punti Servizio</Link>
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
            <Link href="/anagrafiche/punti-servizio">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-4xl font-bold">Modifica Punto Servizio: {puntoServizio.nome_punto_servizio}</h1>
        </div>
        <p className="text-lg text-muted-foreground mb-8">
          Apporta modifiche ai dati del punto di servizio.
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-w-3xl mx-auto">
            <FormField
              control={form.control}
              name="nome_punto_servizio"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Nome Punto Servizio</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome del punto servizio" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="id_cliente"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
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
              name="referente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referente</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome del referente" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="telefono_referente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefono Referente</FormLabel>
                  <FormControl>
                    <Input placeholder="Telefono del referente" {...field} value={field.value ?? ""} />
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
                    <Input placeholder="Telefono del punto servizio" {...field} value={field.value ?? ""} />
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
                    <Input type="email" placeholder="Email del punto servizio" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tempo_intervento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tempo Intervento</FormLabel>
                  <FormControl>
                    <Input placeholder="Es. 24h, 48h" {...field} value={field.value ?? ""} />
                  </FormControl>
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
              name="codice_cliente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Codice Cliente</FormLabel>
                  <FormControl>
                    <Input placeholder="Codice Cliente" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="codice_sicep"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Codice SICEP</FormLabel>
                  <FormControl>
                    <Input placeholder="Codice SICEP" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="codice_fatturazione"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Codice Fatturazione</FormLabel>
                  <FormControl>
                    <Input placeholder="Codice Fatturazione" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="latitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Latitudine</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      placeholder="Latitudine"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="longitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Longitudine</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      placeholder="Longitudine"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nome_procedura"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Procedura</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome della procedura associata" {...field} value={field.value ?? ""} />
                  </FormControl>
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
                    <Textarea placeholder="Aggiungi note sul punto servizio..." {...field} value={field.value ?? ""} />
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