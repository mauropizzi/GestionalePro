"use client";

import React, { useState, useEffect } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

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
}

interface SupplierFormDialogProps {
  supplier: Supplier | null;
  isOpen: boolean;
  onClose: () => void;
  onSupplierSaved: () => void;
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
  attivo: z.boolean().default(true), // Changed from optional().default(true) to default(true)
  note: z.string().nullable(),
});

type SupplierFormSchema = z.infer<typeof formSchema>;

export function SupplierFormDialog({ supplier, isOpen, onClose, onSupplierSaved }: SupplierFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

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
    },
  });

  useEffect(() => {
    if (isOpen && supplier) {
      form.reset({
        ragione_sociale: supplier.ragione_sociale || "",
        partita_iva: supplier.partita_iva || null,
        codice_fiscale: supplier.codice_fiscale || null,
        indirizzo: supplier.indirizzo || null,
        cap: supplier.cap || null,
        citta: supplier.citta || null,
        provincia: supplier.provincia || null,
        telefono: supplier.telefono || null,
        email: supplier.email || null,
        pec: supplier.pec || null,
        tipo_servizio: supplier.tipo_servizio || null,
        attivo: supplier.attivo,
        note: supplier.note || null,
      });
    } else if (isOpen && !supplier) {
      // Reset form for new supplier
      form.reset({
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
        attivo: true,
        note: null,
      });
    }
  }, [isOpen, supplier, form]);

  async function onSubmit(values: SupplierFormSchema) {
    setIsLoading(true);
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
    };

    let error;
    if (supplier) {
      // Update existing supplier
      ({ error } = await supabase
        .from("fornitori")
        .update({ ...supplierData, updated_at: now })
        .eq("id", supplier.id));
    } else {
      // Add new supplier
      ({ error } = await supabase
        .from("fornitori")
        .insert({ ...supplierData, created_at: now, updated_at: now }));
    }

    if (error) {
      toast.error("Errore durante il salvataggio del fornitore: " + error.message);
    } else {
      toast.success("Fornitore salvato con successo!");
      onSupplierSaved();
    }
    setIsLoading(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{supplier ? "Modifica Fornitore" : "Nuovo Fornitore"}</DialogTitle>
          <DialogDescription>
            {supplier ? "Apporta modifiche ai dati del fornitore." : "Aggiungi un nuovo fornitore al sistema."} Clicca su salva quando hai finito.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
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
                    <FormLabel>Fornitore Attivo</FormLabel>
                    <FormDescription>
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
            <DialogFooter className="md:col-span-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Salva Fornitore"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}