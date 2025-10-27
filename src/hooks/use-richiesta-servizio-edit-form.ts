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
  calculateNumberOfInspections,
  defaultDailySchedules,
  ServiceType,
  InspectionType,
} from "@/lib/richieste-servizio-utils";
import { Client, PuntoServizio, RichiestaServizio, DailySchedule, Fornitore, InspectionDetails } from "@/types/richieste-servizio";

export function useRichiestaServizioEditForm(richiestaId: string) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [richiesta, setRichiesta] = useState<RichiestaServizio | null>(null);
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
      tipo_servizio: "PIANTONAMENTO_ARMATO",
      note: null,
      // Default values for PIANTONAMENTO_ARMATO / SERVIZIO_FIDUCIARIO
      data_inizio_servizio: new Date(),
      ora_inizio_servizio: "09:00",
      data_fine_servizio: new Date(),
      ora_fine_servizio: "18:00",
      numero_agenti: 1,
      daily_schedules: defaultDailySchedules,
      // Default values for ISPEZIONI
      data_servizio: new Date(),
      ora_inizio_fascia: "00:00",
      ora_fine_fascia: "00:00",
      cadenza_ore: 1,
      tipo_ispezione: "PERIMETRALE",
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

      // Fetch richiesta_servizio
      const { data: richiestaData, error: richiestaError } = await supabase
        .from("richieste_servizio")
        .select(`
          *,
          inspection_details:richieste_servizio_ispezioni(*)
        `)
        .eq("id", richiestaId)
        .single();

      if (richiestaError) {
        toast.error("Errore nel recupero della richiesta di servizio: " + richiestaError.message);
        router.push("/richieste-servizio");
      } else if (richiestaData) {
        setRichiesta(richiestaData);

        const baseFormValues: Partial<RichiestaServizioFormSchema> = {
          client_id: richiestaData.client_id || "",
          punto_servizio_id: richiestaData.punto_servizio_id || null,
          fornitore_id: richiestaData.fornitore_id || null,
          tipo_servizio: richiestaData.tipo_servizio as ServiceType,
          note: richiestaData.note || null,
        };

        if (richiestaData.tipo_servizio === "ISPEZIONI" && richiestaData.inspection_details) { // Accesso diretto
          const inspectionDetail = richiestaData.inspection_details;
          form.reset({
            ...baseFormValues,
            tipo_servizio: "ISPEZIONI",
            data_servizio: parseISO(inspectionDetail.data_servizio),
            ora_inizio_fascia: inspectionDetail.ora_inizio_fascia,
            ora_fine_fascia: inspectionDetail.ora_fine_fascia,
            cadenza_ore: inspectionDetail.cadenza_ore,
            tipo_ispezione: inspectionDetail.tipo_ispezione as InspectionType,
          });
        } else {
          // Fetch daily schedules for PIANTONAMENTO_ARMATO and SERVIZIO_FIDUCIARIO
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
            ...baseFormValues,
            tipo_servizio: richiestaData.tipo_servizio as ServiceType,
            data_inizio_servizio: parseISO(richiestaData.data_inizio_servizio),
            ora_inizio_servizio: format(parseISO(richiestaData.data_inizio_servizio), "HH:mm"),
            data_fine_servizio: parseISO(richiestaData.data_fine_servizio),
            ora_fine_servizio: format(parseISO(richiestaData.data_fine_servizio), "HH:mm"),
            numero_agenti: richiestaData.numero_agenti,
            daily_schedules: mergedSchedules,
          });
        }
      }
      setIsLoading(false);
    }

    fetchData();
  }, [richiestaId, form, router]);

  async function onSubmit(values: RichiestaServizioFormSchema) {
    setIsSubmitting(true);
    const now = new Date().toISOString();
    let totalCalculatedValue: number | null = null;
    let richiestaDataToUpdate: any;
    let inspectionDetailsToSave: any = null;

    if (values.tipo_servizio === "ISPEZIONI") {
      totalCalculatedValue = calculateNumberOfInspections(
        values.ora_inizio_fascia,
        values.ora_fine_fascia,
        values.cadenza_ore
      );

      richiestaDataToUpdate = {
        client_id: values.client_id,
        punto_servizio_id: values.punto_servizio_id === "" ? null : values.punto_servizio_id,
        fornitore_id: values.fornitore_id === "" ? null : values.fornitore_id,
        tipo_servizio: values.tipo_servizio,
        note: values.note === "" ? null : values.note,
        total_hours_calculated: totalCalculatedValue,
        data_inizio_servizio: null, // Clear fields not relevant to ISPEZIONI
        data_fine_servizio: null,
        numero_agenti: null,
        updated_at: now,
      };

      inspectionDetailsToSave = {
        data_servizio: format(values.data_servizio, "yyyy-MM-dd"),
        ora_inizio_fascia: values.ora_inizio_fascia,
        ora_fine_fascia: values.ora_fine_fascia,
        cadenza_ore: values.cadenza_ore,
        tipo_ispezione: values.tipo_ispezione,
        updated_at: now,
      };

    } else { // PIANTONAMENTO_ARMATO or SERVIZIO_FIDUCIARIO
      const dataInizioServizio = setMinutes(setHours(values.data_inizio_servizio, parseInt(values.ora_inizio_servizio.split(':')[0])), parseInt(values.ora_inizio_servizio.split(':')[1]));
      const dataFineServizio = setMinutes(setHours(values.data_fine_servizio, parseInt(values.ora_fine_servizio.split(':')[0])), parseInt(values.ora_fine_servizio.split(':')[1]));

      totalCalculatedValue = calculateTotalHours(
        dataInizioServizio,
        dataFineServizio,
        values.daily_schedules,
        values.numero_agenti
      );

      richiestaDataToUpdate = {
        client_id: values.client_id,
        punto_servizio_id: values.punto_servizio_id === "" ? null : values.punto_servizio_id,
        fornitore_id: values.fornitore_id === "" ? null : values.fornitore_id,
        tipo_servizio: values.tipo_servizio,
        data_inizio_servizio: dataInizioServizio.toISOString(),
        data_fine_servizio: dataFineServizio.toISOString(),
        numero_agenti: values.numero_agenti,
        note: values.note === "" ? null : values.note,
        total_hours_calculated: totalCalculatedValue,
        updated_at: now,
      };
    }

    const { error: richiestaError } = await supabase
      .from("richieste_servizio")
      .update(richiestaDataToUpdate)
      .eq("id", richiestaId);

    if (richiestaError) {
      toast.error("Errore durante l'aggiornamento della richiesta di servizio: " + richiestaError.message);
      setIsSubmitting(false);
      return;
    }

    if (values.tipo_servizio === "ISPEZIONI" && inspectionDetailsToSave) {
      if (richiesta?.inspection_details?.id) { // Accesso diretto
        // Update existing inspection details
        const { error: inspectionError } = await supabase
          .from("richieste_servizio_ispezioni")
          .update(inspectionDetailsToSave)
          .eq("id", richiesta.inspection_details.id); // Accesso diretto
        if (inspectionError) {
          toast.error("Errore nell'aggiornamento dei dettagli dell'ispezione: " + inspectionError.message);
        }
      } else {
        // Insert new inspection details
        const { error: inspectionError } = await supabase
          .from("richieste_servizio_ispezioni")
          .insert({ ...inspectionDetailsToSave, richiesta_servizio_id: richiestaId, created_at: now });
        if (inspectionError) {
          toast.error("Errore nell'inserimento dei dettagli dell'ispezione: " + inspectionError.message);
        }
      }
      // Delete daily schedules if switching from hourly to inspection
      await supabase.from("richieste_servizio_orari_giornalieri").delete().eq("richiesta_servizio_id", richiestaId);

    } else if (values.tipo_servizio !== "ISPEZIONI") {
      // Delete inspection details if switching from inspection to hourly
      await supabase.from("richieste_servizio_ispezioni").delete().eq("richiesta_servizio_id", richiestaId);

      // Update or insert daily schedules for PIANTONAMENTO_ARMATO and SERVIZIO_FIDUCIARIO
      for (const schedule of values.daily_schedules) {
        const scheduleToSave = {
          richiesta_servizio_id: richiestaId,
          giorno_settimana: schedule.giorno_settimana,
          h24: schedule.h24,
          ora_inizio: schedule.h24 || !schedule.attivo ? null : schedule.ora_inizio,
          ora_fine: schedule.h24 || !schedule.attivo ? null : schedule.ora_fine,
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
    fornitori,
    isLoading,
    isSubmitting,
    onSubmit,
  };
}