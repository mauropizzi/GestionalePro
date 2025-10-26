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
  defaultDailySchedules,
  ServiceType,
} from "@/lib/richieste-servizio-utils";
import { Client, PuntoServizio, RichiestaServizio, DailySchedule, Fornitore } from "@/types/richieste-servizio"; // Importa Fornitore

export function useRichiestaServizioEditForm(richiestaId: string) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [richiesta, setRichiesta] = useState<RichiestaServizio | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [puntiServizio, setPuntiServizio] = useState<PuntoServizio[]>([]);
  const [fornitori, setFornitori] = useState<Fornitore[]>([]); // Nuovo stato per i fornitori
  const router = useRouter();

  const form = useForm<RichiestaServizioFormSchema>({
    resolver: zodResolver(richiestaServizioFormSchema),
    defaultValues: {
      client_id: "",
      punto_servizio_id: null,
      fornitore_id: null, // Valore predefinito per il nuovo campo
      tipo_servizio: "PIANTONAMENTO_ARMATO",
      data_inizio_servizio: new Date(),
      ora_inizio_servizio: "09:00",
      data_fine_servizio: new Date(),
      ora_fine_servizio: "18:00",
      numero_agenti: 1,
      note: null,
      daily_schedules: defaultDailySchedules,
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

      // Recupera i fornitori
      const { data: fornitoriData, error: fornitoriError } = await supabase
        .from("fornitori")
        .select("id, ragione_sociale")
        .order("ragione_sociale", { ascending: true });

      if (fornitoriError) {
        toast.error("Errore nel recupero dei fornitori: " + fornitoriError.message);
      } else {
        setFornitori(fornitoriData || []);
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

        const mergedSchedules = defaultDailySchedules.map(defaultSchedule => {
          const existingSchedule = schedulesData?.find(s => s.giorno_settimana === defaultSchedule.giorno_settimana);
          return existingSchedule ? {
            id: existingSchedule.id,
            richiesta_servizio_id: existingSchedule.richiesta_servizio_id,
            giorno_settimana: existingSchedule.giorno_settimana,
            h24: existingSchedule.h24,
            ora_inizio: existingSchedule.ora_inizio,
            ora_fine: existingSchedule.ora_fine,
            attivo: existingSchedule.attivo,
          } : {
            ...defaultSchedule,
            richiesta_servizio_id: richiestaId,
          };
        });

        form.reset({
          client_id: richiestaData.client_id || "",
          punto_servizio_id: richiestaData.punto_servizio_id || null,
          fornitore_id: richiestaData.fornitore_id || null, // Includi il fornitore_id
          tipo_servizio: richiestaData.tipo_servizio as ServiceType,
          data_inizio_servizio: parseISO(richiestaData.data_inizio_servizio),
          ora_inizio_servizio: format(parseISO(richiestaData.data_inizio_servizio), "HH:mm"),
          data_fine_servizio: parseISO(richiestaData.data_fine_servizio),
          ora_fine_servizio: format(parseISO(richiestaData.data_fine_servizio), "HH:mm"),
          numero_agenti: richiestaData.numero_agenti,
          note: richiestaData.note || null,
          daily_schedules: mergedSchedules,
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
      fornitore_id: values.fornitore_id === "" ? null : values.fornitore_id, // Includi il fornitore_id
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

    // Update or insert daily schedules
    for (const schedule of values.daily_schedules) {
      const scheduleToSave = {
        richiesta_servizio_id: richiestaId,
        giorno_settimana: schedule.giorno_settimana,
        h24: schedule.h24,
        ora_inizio: schedule.h24 ? null : schedule.ora_inizio,
        ora_fine: schedule.h24 ? null : schedule.ora_fine,
        attivo: schedule.attivo,
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
    fornitori, // Ritorna i fornitori
    isLoading,
    isSubmitting,
    onSubmit,
  };
}