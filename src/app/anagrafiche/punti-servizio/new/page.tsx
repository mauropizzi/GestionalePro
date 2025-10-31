"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PuntoServizioFormSchema, puntoServizioFormSchema } from "@/lib/punti-servizio-utils";
import { PuntoServizioForm } from "@/components/punti-servizio/punto-servizio-form";
import { Form } from "@/components/ui/form"; // Import Form

interface Client {
  id: string;
  ragione_sociale: string;
}

interface Fornitore {
  id: string;
  ragione_sociale: string;
}

export default function NewPuntoServizioPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [fornitori, setFornitori] = useState<Fornitore[]>([]);
  const router = useRouter();

  const form = useForm<PuntoServizioFormSchema>({
    resolver: zodResolver(puntoServizioFormSchema),
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
      // codice_fornitore_punto_servizio: null, // Rimosso
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
        console.error("Supabase fetch clients error:", clientsError); // Added for debugging
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
        console.error("Supabase fetch fornitori error:", fornitoriError); // Added for debugging
        toast.error("Errore nel recupero dei fornitori: " + fornitoriError.message);
      } else {
        setFornitori(fornitoriData || []);
      }
    }
    fetchDependencies();
  }, []);

  async function onSubmit(values: PuntoServizioFormSchema) {
    setIsLoading(true);
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
      // codice_fornitore_punto_servizio: values.codice_fornitore_punto_servizio === "" ? null : values.codice_fornitore_punto_servizio, // Rimosso
    };

    const { error } = await supabase
      .from("punti_servizio")
      .insert({ ...puntoServizioData, created_at: now, updated_at: now });

    if (error) {
      console.error("Supabase insert error:", error); // Added for debugging
      toast.error("Errore durante il salvataggio del punto di servizio: " + error.message);
    } else {
      toast.success("Punto di servizio salvato con successo!");
      router.push("/anagrafiche/punti-servizio");
    }
    setIsLoading(false);
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4 mb-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/anagrafiche/punti-servizio">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Nuovo Punto Servizio</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Aggiungi un nuovo punto di servizio al sistema.
        </p>

        <Form {...form}>
          <PuntoServizioForm
            onSubmit={onSubmit}
            isSubmitting={isLoading}
            clients={clients}
            fornitori={fornitori}
          />
        </Form>
      </div>
    </DashboardLayout>
  );
}