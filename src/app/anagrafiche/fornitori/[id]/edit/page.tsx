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
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Supplier {
  id: string;
  ragione_sociale: string;
  partita_iva: string | null;
  codice_fiscale: string | null;
  indirizzo: string | null;
  cap: string | null;
  citta: string | null;
  provincia: string | null;
  telefono: string | null;
  email: string | null;
  pec: string | null;
  tipo_servizio: string | null;
  attivo: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
  codice_cliente_associato: string | null; // Aggiunto
}

const formSchema = z.object({
  ragione_sociale: z.string().min(1, "La ragione sociale è richiesta."),
  partita_iva: z.string().nullable(),
  codice_fiscale: z.string().nullable(),
  indirizzo: z.string().nullable(),
  cap: z.string().nullable(),
  citta: z.string().nullable(),
  provincia: z.string().nullable(),
  telefono: z.string().nullable(),
  email: z.string().email("Inserisci un indirizzo email valido.").nullable().or(z.literal("")),
  pec: z.string().email("Inserisci un indirizzo PEC valido.").nullable().or(z.literal("")),
  tipo_servizio: z.string().nullable(),
  attivo: z.boolean(), // Changed to z.boolean()
  note: z.string().nullable(),
  codice_cliente_associato: z.string().nullable(), // Nuovo campo
});

type SupplierFormSchema = z.infer<typeof formSchema>;

export default function EditSupplierPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const router = useRouter();
  const params = useParams();
  const supplierId = params.id as string;

  const form = useForm<SupplierFormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ragione_sociale: "",
      partita_iva: null,
      codice_fiscale: null,
      indirizzo: null,
      cap: null,
      citta: null,
      provincia: null,
      telefono: null,
      email: null,
      pec: null,
      tipo_servizio: null,
      attivo: true, // Ensure this is boolean
      note: null,
      codice_cliente_associato: null, // Default value for new field
    },
  });

  useEffect(() => {
    async function fetchSupplier() {
      if (!supplierId) return;

      const { data, error } = await supabase
        .from("fornitori")
        .select("*")
        .eq("id", supplierId)
        .single();

      if (error) {
        console.error("Supabase fetch error:", error); // Added for debugging
        toast.error("Errore nel recupero del fornitore: " + error.message);
        router.push("/anagrafiche/fornitori");
      } else if (data) {
        setSupplier(data);
        form.reset({
          ragione_sociale: data.ragione_sociale || "",
          partita_iva: data.partita_iva || null,
          codice_fiscale: data.codice_fiscale || null,
          indirizzo: data.indirizzo || null,
          cap: data.cap || null,
          citta: data.citta || null,
          provincia: data.provincia || null,
          telefono: data.telefono || null,
          email: data.email || null,
          pec: data.pec || null,
          tipo_servizio: data.tipo_servizio || null,
          attivo: data.attivo,
          note: data.note || null,
          codice_cliente_associato: data.codice_cliente_associato || null, // Set value for new field
        });
      }
      setIsLoading(false);
    }

    fetchSupplier();
  }, [supplierId, form, router]);

  async function onSubmit(values: SupplierFormSchema) {
    setIsSubmitting(true);
    const now = new Date().toISOString();
    const supplierData = {
      ...values,
      partita_iva: values.partita_iva === "" ? null : values.partita_iva,
      codice_fiscale: values.codice_fiscale === "" ? null : values.codice_fiscale,
      indirizzo: values.indirizzo === "" ? null : values.indirizzo,
      cap: values.cap === "" ? null : values.cap,
      citta: values.citta === "" ? null : values.citta,
      provincia: values.provincia === "" ? null : values.provincia,
      telefono: values.telefono === "" ? null : values.telefono,
      email: values.email === "" ? null : values.email,
      pec: values.pec === "" ? null : values.pec,
      tipo_servizio: values.tipo_servizio === "" ? null : values.tipo_servizio,
      note: values.note === "" ? null : values.note,
      codice_cliente_associato: values.codice_cliente_associato === "" ? null : values.codice_cliente_associato, // Handle new field
    };

    const { error } = await supabase
      .from("fornitori")
      .update({ ...supplierData, updated_at: now })
      .eq("id", supplierId);

    if (error) {
      console.error("Supabase update error:", error); // Added for debugging
      toast.error("Errore durante l'aggiornamento del fornitore: " + error.message);
    } else {
      toast.success("Fornitore aggiornato con successo!");
      router.push("/anagrafiche/fornitori");
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

  if (!supplier) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h2 className="text-xl font-bold mb-2">Fornitore non trovato</h2>
          <p className="text-sm text-muted-foreground">Il fornitore che stai cercando non esiste o non è accessibile.</p>
          <Button asChild className="mt-4">
            <Link href="/anagrafiche/fornitori">Torna ai Fornitori</Link>
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
            <Link href="/anagrafiche/fornitori">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Modifica Fornitore: {supplier.ragione_sociale}</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Apporta modifiche ai dati del fornitore.
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
              name="codice_cliente_associato" // Nuovo campo
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Codice Fornitore Manuale</FormLabel>
                  <FormControl>
                    <Input placeholder="Codice Fornitore Personalizzato" {...field} value={field.value ?? ""} />
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
              name="tipo_servizio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo Servizio</FormLabel>
                  <FormControl>
                    <Input placeholder="Es. Logistica, Consulenza" {...field} value={field.value ?? ""} />
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
                    <FormLabel className="text-sm">Fornitore Attivo</FormLabel>
                    <FormDescription className="text-xs">
                      Indica se il fornitore è attualmente attivo.
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
                    <Textarea placeholder="Aggiungi note sul fornitore..." {...field} value={field.value ?? ""} />
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