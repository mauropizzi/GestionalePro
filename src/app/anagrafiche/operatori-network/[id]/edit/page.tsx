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
import { Loader2, ArrowLeft } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Client, NetworkOperator } from "@/types/anagrafiche"; // Updated import

const formSchema = z.object({
  nome: z.string().min(1, "Il nome è richiesto."),
  cognome: z.string().min(1, "Il cognome è richiesto."),
  cliente_id: z.string().uuid("Seleziona un cliente valido.").nullable(),
  telefono: z.string().nullable(),
  email: z.string().email("Inserisci un indirizzo email valido.").nullable().or(z.literal("")),
});

type NetworkOperatorFormSchema = z.infer<typeof formSchema>;

export default function EditNetworkOperatorPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [operator, setOperator] = useState<NetworkOperator | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const router = useRouter();
  const params = useParams();
  const operatorId = params.id as string;

  const form = useForm<NetworkOperatorFormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      cognome: "",
      cliente_id: null,
      telefono: null,
      email: null,
    },
  });

  useEffect(() => {
    async function fetchData() {
      if (!operatorId) return;

      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from("clienti")
        .select("*") // Select all fields to match Client type
        .order("ragione_sociale", { ascending: true });

      if (clientsError) {
        console.error("Supabase fetch clients error:", clientsError);
        toast.error("Errore nel recupero dei clienti: " + clientsError.message);
      } else {
        setClients(clientsData || []);
      }

      // Fetch operator
      const { data: operatorData, error: operatorError } = await supabase
        .from("operatori_network")
        .select("*")
        .eq("id", operatorId)
        .single();

      if (operatorError) {
        console.error("Supabase fetch operator error:", operatorError);
        toast.error("Errore nel recupero dell'operatore network: " + operatorError.message);
        router.push("/anagrafiche/operatori-network");
      } else if (operatorData) {
        setOperator(operatorData);
        form.reset({
          nome: operatorData.nome || "",
          cognome: operatorData.cognome || "",
          cliente_id: operatorData.cliente_id || null,
          telefono: operatorData.telefono || null,
          email: operatorData.email || null,
        });
      }
      setIsLoading(false);
    }

    fetchData();
  }, [operatorId, form, router]);

  async function onSubmit(values: NetworkOperatorFormSchema) {
    setIsSubmitting(true);
    const now = new Date().toISOString();
    const operatorData = {
      ...values,
      cliente_id: values.cliente_id === "" ? null : values.cliente_id,
      telefono: values.telefono === "" ? null : values.telefono,
      email: values.email === "" ? null : values.email,
    };

    const { error } = await supabase
      .from("operatori_network")
      .update({ ...operatorData, updated_at: now })
      .eq("id", operatorId);

    if (error) {
      console.error("Supabase update error:", error);
      toast.error("Errore durante l'aggiornamento dell'operatore network: " + error.message);
    } else {
      toast.success("Operatore network aggiornato con successo!");
      router.push("/anagrafiche/operatori-network");
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

  if (!operator) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h2 className="text-xl font-bold mb-2">Operatore Network non trovato</h2>
          <p className="text-sm text-muted-foreground">L'operatore network che stai cercando non esiste o non è accessibile.</p>
          <Button asChild className="mt-4">
            <Link href="/anagrafiche/operatori-network">Torna agli Operatori Network</Link>
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
            <Link href="/anagrafiche/operatori-network">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Modifica Operatore Network: {operator.nome} {operator.cognome}</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Apporta modifiche ai dati dell'operatore network.
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
              name="cliente_id"
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