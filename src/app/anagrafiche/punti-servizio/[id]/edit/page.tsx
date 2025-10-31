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
import { useRouter, useParams } from "next/navigation";
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
  // codice_fornitore_punto_servizio: string | null; // Rimosso
}

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
    async function fetchData() {
      if (!puntoServizioId) return;

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

      // Fetch punto_servizio
      const { data: puntoData, error: puntoError } = await supabase
        .from("punti_servizio")
        .select("*")
        .eq("id", puntoServizioId)
        .single();

      if (puntoError) {
        console.error("Supabase fetch punto_servizio error:", puntoError); // Added for debugging
        toast.error("Errore nel recupero del punto di servizio: " + puntoError.message);
        router.push("/anagrafiche/punti-servizio");
      } else if (puntoData) { // Corrected: changed 'data' to 'puntoData'
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
          // codice_fornitore_punto_servizio: puntoData.codice_fornitore_punto_servizio || null, // Rimosso
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
      // codice_fornitore_punto_servizio: values.codice_fornitore_punto_servizio === "" ? null : values.codice_fornitore_punto_servizio, // Rimosso
    };

    const { error } = await supabase
      .from("punti_servizio")
      .update({ ...puntoServizioData, updated_at: now })
      .eq("id", puntoServizioId);

    if (error) {
      console.error("Supabase update error:", error); // Added for debugging
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
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4 mb-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/anagrafiche/punti-servizio">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Modifica Punto Servizio: {puntoServizio.nome_punto_servizio}</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Apporta modifiche ai dati del punto di servizio.
        </p>

        <Form {...form}>
          <PuntoServizioForm
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            clients={clients}
            fornitori={fornitori}
          />
        </Form>
      </div>
    </DashboardLayout>
  );
}