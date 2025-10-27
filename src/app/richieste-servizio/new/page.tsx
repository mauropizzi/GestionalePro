"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { format, setHours, setMinutes } from "date-fns";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  RichiestaServizioFormSchema,
  richiestaServizioFormSchema,
  calculateTotalHours,
  calculateNumberOfInspections,
  defaultDailySchedules,
} from "@/lib/richieste-servizio-utils";
import { DailySchedule } from "@/types/richieste-servizio"; // Importa DailySchedule
import { RichiestaServizioForm } from "@/components/richieste-servizio/richiesta-servizio-form";

interface Client {
  id: string;
  ragione_sociale: string;
}

interface PuntoServizio {
  id: string;
  nome_punto_servizio: string;
}

interface Fornitore {
  id: string;
  ragione_sociale: string;
}

export default function NewRichiestaServizioPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [puntiServizio, setPuntiServizio] = useState<PuntoServizio[]>([]);
  const [fornitori, setFornitori] = useState<Fornitore[]>([]);
  const router = useRouter();

  const form = useForm<RichiestaServizioFormSchema>({
    resolver: zodResolver(richiestaServizioFormSchema),
    defaultValues: {
      client_id: "",
      punto_servizio_id: null,
      fornitore_id: null,
      tipo_servizio: "PIANTONAMENTO_ARMATO", // Initial default service type
      note: null,
      // Common scheduling fields for PIANTONAMENTO_ARMATO / SERVIZIO_FIDUCIARIO
      data_inizio_servizio: new Date(),
      ora_inizio_servizio: "09:00",
      data_fine_servizio: new Date(),
      ora_fine_servizio: "18:00",
      numero_agenti: 1,
      daily_schedules: defaultDailySchedules,
      // ISPEZIONI specific fields are omitted here as default type is PIANTONAMENTO_ARMATO
    } as RichiestaServizioFormSchema, // Cast to ensure correct type for defaultValues
  });

  useEffect(() => {
    async function fetchDependencies() {
      const { data: clientsData, error: clientsError } = await supabase
        .from("clienti")
        .select("id, ragione_sociale")
        .order("ragione_sociale", { ascending: true });

      if (clientsError) {
        toast.error("Errore nel recupero dei clienti: " + clientsError.message);
      } else {
        setClients(clientsData || []);
      }

      const { data: puntiServizioData, error: puntiServizioError } = await supabase
        .from("punti_servizio")
        .select("id, nome_punto_servizio")
        .order("nome_punto_servizio", { ascending: true });

      if (puntiServizioError) {
        toast.error("Errore nel recupero dei punti di servizio: " + puntiServizioError.message);
      } else {
        setPuntiServizio(puntiServizioData || []);
      }

      const { data: fornitoriData, error: fornitoriError } = await supabase
        .from("fornitori")
        .select("id, ragione_sociale")
        .order("ragione_sociale", { ascending: true });

      if (fornitoriError) {
        toast.error("Errore nel recupero dei fornitori: " + fornitoriError.message);
      } else {
        setFornitori(fornitoriData || []);
      }
    }
    fetchDependencies();
  }, []);

  async function onSubmit(values: RichiestaServizioFormSchema) {
    setIsLoading(true);
    const now = new Date().toISOString();
    let totalCalculatedValue: number | null = null;
    let richiestaData: any;
    let inspectionDetailsToInsert: any = null;

    const dataInizioServizio = setMinutes(setHours(values.data_inizio_servizio, parseInt(values.ora_inizio_servizio.split(':')[0])), parseInt(values.ora_inizio_servizio.split(':')[1]));
    const dataFineServizio = setMinutes(setHours(values.data_fine_servizio, parseInt(values.ora_fine_servizio.split(':')[0])), parseInt(values.ora_fine_servizio.split(':')[1]));

    totalCalculatedValue = calculateTotalHours(
      dataInizioServizio,
      dataFineServizio,
      values.daily_schedules,
      values.numero_agenti
    );

    richiestaData = {
      client_id: values.client_id,
      punto_servizio_id: values.punto_servizio_id === "" ? null : values.punto_servizio_id,
      fornitore_id: values.fornitore_id === "" ? null : values.fornitore_id,
      tipo_servizio: values.tipo_servizio,
      data_inizio_servizio: dataInizioServizio.toISOString(),
      data_fine_servizio: dataFineServizio.toISOString(),
      numero_agenti: values.numero_agenti,
      note: values.note === "" ? null : values.note,
      status: "pending",
      total_hours_calculated: totalCalculatedValue,
      created_at: now,
      updated_at: now,
    };

    if (values.tipo_servizio === "ISPEZIONI") {
      inspectionDetailsToInsert = {
        data_servizio: format(values.data_inizio_servizio, "yyyy-MM-dd"), // Use data_inizio_servizio for inspection date
        ora_inizio_fascia: values.ora_inizio_fascia,
        ora_fine_fascia: values.ora_fine_fascia,
        cadenza_ore: values.cadenza_ore,
        tipo_ispezione: values.tipo_ispezione,
        created_at: now,
        updated_at: now,
      };
    }

    const { data: newRichiesta, error: richiestaError } = await supabase
      .from("richieste_servizio")
      .insert(richiestaData)
      .select()
      .single();

    if (richiestaError) {
      toast.error("Errore durante il salvataggio della richiesta di servizio: " + richiestaError.message);
      setIsLoading(false);
      return;
    }

    // Insert daily schedules for all service types now
    const schedulesToInsert = values.daily_schedules.map((schedule: DailySchedule) => ({
      ...schedule,
      richiesta_servizio_id: newRichiesta.id,
      ora_inizio: schedule.h24 || !schedule.attivo ? null : schedule.ora_inizio,
      ora_fine: schedule.h24 || !schedule.attivo ? null : schedule.ora_fine,
      created_at: now,
      updated_at: now,
    }));

    const { error: schedulesError } = await supabase
      .from("richieste_servizio_orari_giornalieri")
      .insert(schedulesToInsert);

    if (schedulesError) {
      toast.error("Errore durante il salvataggio degli orari giornalieri: " + schedulesError.message);
      // Consider rolling back the main request if this fails
    }

    if (values.tipo_servizio === "ISPEZIONI" && inspectionDetailsToInsert) {
      const { error: inspectionError } = await supabase
        .from("richieste_servizio_ispezioni")
        .insert({ ...inspectionDetailsToInsert, richiesta_servizio_id: newRichiesta.id });

      if (inspectionError) {
        toast.error("Errore durante il salvataggio dei dettagli dell'ispezione: " + inspectionError.message);
        // Consider rolling back the main request if this fails
      }
    }

    toast.success("Richiesta di servizio salvata con successo!");
    router.push("/richieste-servizio");
    setIsLoading(false);
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-4">
        <div className="flex items-center gap-4 mb-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/richieste-servizio">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Nuova Richiesta di Servizio</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Crea una nuova richiesta di servizio per un cliente.
        </p>

        <RichiestaServizioForm
          form={form}
          clients={clients}
          puntiServizio={puntiServizio}
          fornitori={fornitori}
          onSubmit={onSubmit}
          isSubmitting={isLoading}
        />
      </div>
    </DashboardLayout>
  );
}