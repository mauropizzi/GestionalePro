"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format, parseISO, setHours, setMinutes } from "date-fns";
import {
  RichiestaServizioFormSchema,
  richiestaServizioFormSchema,
  calculateTotalHours,
} from "@/lib/richieste-servizio-utils";
import { Client, PuntoServizio, RichiestaServizio, DailySchedule } from "@/types/richieste-servizio";

export function useRichiestaServizioEditForm(richiestaId: string) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [richiesta, setRichiesta] = useState<RichiestaServizio | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [puntiServizio, setPuntiServizio] = useState<PuntoServizio[]>([]);
  const router = useRouter();

  const form = useForm<RichiestaServizioFormSchema>({
    resolver: zodResolver(richiestaServizioFormSchema),
    defaultValues: {
      client_id: "",
      punto_servizio_id: null,
      tipo_servizio: "ORE",
      data_inizio_servizio: new Date(),
      ora_inizio_servizio: "09:00",
      data_fine_servizio: new Date(),
      ora_fine_servizio: "18:00",
      numero_agenti: 1,
      note: null,
      daily_schedules: [], // Inizialmente vuoto, verrà popolato dai dati esistenti
    },
  });

  useEffect(() => {
    async function fetchData() {
      if (!richiestaId) return;

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

      // Fetch punti_servizio
      const { data: puntiServizioData, error: puntiServizioError } = await supabase
        .from("punti_servizio")
        .select("id, nome_punto_servizio")
        .order("nome_punto_servizio", { ascending: true });

      if (puntiServizioError) {
        toast.error("Errore nel recupero dei punti di servizio: " + puntiServizioError.message);
      } else {
        setPuntiServizio(puntiServizioData || []);
      }

      // Fetch richiesta_servizio
      const { data: richiestaData, error: richiestaError } = await supabase
        .from("richieste_servizio")
        .select("*")
        .eq("id", richiestaId)
        .single();

      if (richiestaError) {
        toast.error("Errore nel recupero della richiesta di servizio: " + richiestaError.message);
        router.push("/richieste-servizio");
      } else if (richiestaData) {
        setRichiesta(richiestaData);

        // Fetch daily schedules
        const { data: schedulesData, error: schedulesError } = await supabase
          .from("richieste_servizio_orari_giornalieri")
          .select("*")
          .eq("richiesta_servizio_id", richiestaId)
          .order("giorno_settimana", { ascending: true });

        if (schedulesError) {
          toast.error("Errore nel recupero degli orari giornalieri: " + schedulesError.message);
        }

        form.reset({
          client_id: richiestaData.client_id || "",
          punto_servizio_id: richiestaData.punto_servizio_id || null,
          tipo_servizio: richiestaData.tipo_servizio as "ORE",
          data_inizio_servizio: parseISO(richiestaData.data_inizio_servizio),
          ora_inizio_servizio: format(parseISO(richiestaData.data_inizio_servizio), "HH:mm"),
          data_fine_servizio: parseISO(richiestaData.data_fine_servizio),
          ora_fine_servizio: format(parseISO(richiestaData.data_fine_servizio), "HH:mm"),
          numero_agenti: richiestaData.numero_agenti,
          note: richiestaData.note || null,
          daily_schedules: (schedulesData || []) as DailySchedule[],
        });
      }
      setIsLoading(false);
    }

    fetchData();
  }, [richiestaId, form, router]);

  async function onSubmit(values: RichiestaServizioFormSchema) {
    setIsSubmitting(true);
    const now = new Date().toISOString();

    const dataInizioServizio = setMinutes(setHours(values.data_inizio_servizio, parseInt(values.ora_inizio_servizio.split(':')[0])), parseInt(values.ora_inizio_servizio.split(':')[1]));
    const dataFineServizio = setMinutes(setHours(values.data_fine_servizio, parseInt(values.ora_fine_servizio.split(':')[0])), parseInt(values.ora_fine_servizio.split(':')[1]));

    const totalHours = calculateTotalHours(
      dataInizioServizio,
      dataFineServizio,
      values.daily_schedules,
      values.numero_agenti
    );

    const richiestaData = {
      client_id: values.client_id,
      punto_servizio_id: values.punto_servizio_id === "" ? null : values.punto_servizio_id,
      tipo_servizio: values.tipo_servizio,
      data_inizio_servizio: dataInizioServizio.toISOString(),
      data_fine_servizio: dataFineServizio.toISOString(),
      numero_agenti: values.numero_agenti,
      note: values.note === "" ? null : values.note,
      total_hours_calculated: totalHours,
      updated_at: now,
    };

    const { error: richiestaError } = await supabase
      .from("richieste_servizio")
      .update(richiestaData)
      .eq("id", richiestaId);

    if (richiestaError) {
      toast.error("Errore durante l'aggiornamento della richiesta di servizio: " + richiestaError.message);
      setIsSubmitting(false);
      return;
    }

    // Fetch current schedules to determine what to delete
    const { data: currentSchedules, error: fetchCurrentError } = await supabase
      .from("richieste_servizio_orari_giornalieri")
      .select("id")
      .eq("richiesta_servizio_id", richiestaId);

    if (fetchCurrentError) {
      toast.error("Errore nel recupero degli orari attuali per l'eliminazione: " + fetchCurrentError.message);
      setIsSubmitting(false);
      return;
    }

    const currentScheduleIds = new Set(currentSchedules?.map(s => s.id));
    const submittedScheduleIds = new Set(values.daily_schedules.filter(s => s.id).map(s => s.id));

    // Delete schedules that are no longer in the form
    for (const currentId of currentScheduleIds) {
      if (!submittedScheduleIds.has(currentId)) {
        const { error: deleteError } = await supabase
          .from("richieste_servizio_orari_giornalieri")
          .delete()
          .eq("id", currentId);
        if (deleteError) {
          toast.error(`Errore nell'eliminazione dell'orario con ID ${currentId}: ` + deleteError.message);
        }
      }
    }

    // Update or insert daily schedules
    for (const schedule of values.daily_schedules) {
      const scheduleToSave = {
        richiesta_servizio_id: richiestaId,
        giorno_settimana: schedule.giorno_settimana,
        h24: schedule.h24,
        ora_inizio: schedule.h24 ? null : schedule.ora_inizio,
        ora_fine: schedule.h24 ? null : schedule.ora_fine,
        updated_at: now,
      };

      if (schedule.id) {
        // Update existing schedule
        const { error } = await supabase
          .from("richieste_servizio_orari_giornalieri")
          .update(scheduleToSave)
          .eq("id", schedule.id);
        if (error) {
          toast.error(`Errore nell'aggiornamento orario per ${schedule.giorno_settimana}: ` + error.message);
        }
      } else {
        // Insert new schedule
        const { error } = await supabase
          .from("richieste_servizio_orari_giornalieri")
          .insert({ ...scheduleToSave, created_at: now });
        if (error) {
          toast.error(`Errore nell'inserimento orario per ${schedule.giorno_settimana}: ` + error.message);
        }
      }
    }

    toast.success("Richiesta di servizio aggiornata con successo!");
    router.push("/richieste-servizio");
    setIsSubmitting(false);
  }

  return {
    form,
    richiesta,
    clients,
    puntiServizio,
    isLoading,
    isSubmitting,
    onSubmit,
  };
}