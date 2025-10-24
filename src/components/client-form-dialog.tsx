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
  FormDescription, // Import FormDescription
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
}

interface ClientFormDialogProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onClientSaved: () => void;
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
  attivo: z.boolean().optional().default(true),
  note: z.string().nullable(),
});

type ClientFormSchema = z.infer<typeof formSchema>; // Explicitly define the type

export function ClientFormDialog({ client, isOpen, onClose, onClientSaved }: ClientFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ClientFormSchema>({ // Use the explicit type here
    resolver: zodResolver(formSchema),
    defaultValues: {
      ragione_sociale: "",
      codice_fiscale: null, // Changed to null
      partita_iva: null,    // Changed to null
      indirizzo: null,      // Changed to null
      citta: null,          // Changed to null
      cap: null,            // Changed to null
      provincia: null,      // Changed to null
      telefono: null,       // Changed to null
      email: null,          // Changed to null
      pec: null,            // Changed to null
      sdi: null,            // Changed to null
      attivo: true,
      note: null,           // Changed to null
    },
  });

  useEffect(() => {
    if (isOpen && client) {
      form.reset({
        ragione_sociale: client.ragione_sociale || "",
        codice_fiscale: client.codice_fiscale || null, // Changed to null
        partita_iva: client.partita_iva || null,    // Changed to null
        indirizzo: client.indirizzo || null,      // Changed to null
        citta: client.citta || null,          // Changed to null
        cap: client.cap || null,            // Changed to null
        provincia: client.provincia || null,      // Changed to null
        telefono: client.telefono || null,       // Changed to null
        email: client.email || null,          // Changed to null
        pec: client.pec || null,            // Changed to null
        sdi: client.sdi || null,            // Changed to null
        attivo: client.attivo,
        note: client.note || null,           // Changed to null
      });
    } else if (isOpen && !client) {
      // Reset form for new client
      form.reset({
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
        attivo: true,
        note: null,
      });
    }
  }, [isOpen, client, form]);

  async function onSubmit(values: ClientFormSchema) { // Use the explicit type here
    setIsLoading(true);
    const now = new Date().toISOString();
    const clientData = {
      ...values,
      email: values.email === "" ? null : values.email, // Convert empty string to null for nullable fields
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
    };

    let error;
    if (client) {
      // Update existing client
      ({ error } = await supabase
        .from("clienti")
        .update({ ...clientData, updated_at: now })
        .eq("id", client.id));
    } else {
      // Add new client
      ({ error } = await supabase
        .from("clienti")
        .insert({ ...clientData, created_at: now, updated_at: now }));
    }

    if (error) {
      toast.error("Errore durante il salvataggio del cliente: " + error.message);
    } else {
      toast.success("Cliente salvato con successo!");
      onClientSaved();
    }
    setIsLoading(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{client ? "Modifica Cliente" : "Nuovo Cliente"}</DialogTitle>
          <DialogDescription>
            {client ? "Apporta modifiche ai dati del cliente." : "Aggiungi un nuovo cliente al sistema."} Clicca su salva quando hai finito.
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
                    <FormLabel>Cliente Attivo</FormLabel>
                    <FormDescription>
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
            <DialogFooter className="md:col-span-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Salva Cliente"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}