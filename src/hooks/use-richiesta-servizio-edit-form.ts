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
      tipo_servizio: "PIANTONAMENTO_ARMATO", // Initial default service type
      note: null,
      // Common scheduling fields
      data_inizio_servizio: new Date(),
      ora_inizio_servizio: "09:00",
      data_fine_servizio: new Date(),
      ora_fine_servizio: "18:00",
      numero_agenti: 1,
      daily_schedules: defaultDailySchedules,
      // ISPEZIONI specific fields (set to undefined as they are not applicable for PIANTONAMENTO_ARMATO)
      ora_inizio_fascia: undefined,
      ora_fine_fascia: undefined,
      cadenza_ore: undefined,
      tipo_ispezione: undefined,
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

      // Fetch richiesta_servizio and daily schedules
      const { data: richiestaData, error: richiestaError } = await supabase
        .from("richieste_servizio")
        .select(`
          *,
          inspection_details:richieste_servizio_ispezioni(*),
          daily_schedules:richieste_servizio_orari_giornalieri(*)
        `)
        .eq("id", richiestaId)
        .single();

      if (richiestaError) {
        toast.error("Errore nel recupero della richiesta di servizio: " + richiestaError.message);
        router.push("/richieste-servizio");
      } else if (richiestaData) {
        setRichiesta(richiestaData);

        const mergedSchedules = defaultDailySchedules.map(defaultSchedule => {
          const existingSchedule = richiestaData.daily_schedules?.find((s: DailySchedule) => s.giorno_settimana === defaultSchedule.giorno_settimana);
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

        const baseFormValues: Partial<RichiestaServizioFormSchema> = {
          client_id: richiestaData.client_id || "",
          punto_servizio_id: richiestaData.punto_servizio_id || null,
          fornitore_id: richiestaData.fornitore_id || null,
          tipo_servizio: richiestaData.tipo_servizio as ServiceType,
          note: richiestaData.note || null,
          data_inizio_servizio: richiestaData.data_inizio_servizio ? parseISO(richiestaData.data_inizio_servizio) : new Date(),
          ora_inizio_servizio: richiestaData.data_inizio_servizio ? format(parseISO(richiestaData.data_inizio_servizio), "HH:mm") : "09:00",
          data_fine_servizio: richiestaData.data_fine_servizio ? parseISO(richiestaData.data_fine_servizio) : new Date(),
          ora_fine_servizio: richiestaData.data_fine_servizio ? format(parseISO(richiestaData.data_fine_servizio), "HH:mm") : "18:00",
          numero_agenti: richiestaData.numero_agenti || 1,
          daily_schedules: mergedSchedules,
        };

        if (richiestaData.tipo_servizio === "ISPEZIONI" && richiestaData.inspection_details) {
          const inspectionDetail = richiestaData.inspection_details;
          form.reset({
            ...baseFormValues,
            tipo_servizio: "ISPEZIONI",
            ora_inizio_fascia: inspectionDetail.ora_inizio_fascia,
            ora_fine_fascia: inspectionDetail.ora_fine_fascia,
            cadenza_ore: inspectionDetail.cadenza_ore,
            tipo_ispezione: inspectionDetail.tipo_ispezione as InspectionType,
          } as RichiestaServizioFormSchema); // Cast to ensure correct type for reset
        } else {
          form.reset({
            ...baseFormValues,
            // Ensure inspection-specific fields are reset/defaulted if not ISPEZIONI
            ora_inizio_fascia: undefined,
            ora_fine_fascia: undefined,
            cadenza_ore: undefined,
            tipo_ispezione: undefined,
          } as RichiestaServizioFormSchema); // Cast to ensure correct type for reset
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

    if (values.tipo_servizio === "ISPEZIONI") {
      inspectionDetailsToSave = {
        data_servizio: format(values.data_inizio_servizio, "yyyy-MM-dd"), // Use data_inizio_servizio for inspection date
        ora_inizio_fascia: values.ora_inizio_fascia,
        ora_fine_fascia: values.ora_fine_fascia,
        cadenza_ore: values.cadenza_ore,
        tipo_ispezione: values.tipo_ispezione,
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

    // Update or insert daily schedules for all service types
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

    if (values.tipo_servizio === "ISPEZIONI" && inspectionDetailsToSave) {
      if (richiesta?.inspection_details?.id) {
        // Update existing inspection details
        const { error: inspectionError } = await supabase
          .from("richieste_servizio_ispezioni")
          .update(inspectionDetailsToSave)
          .eq("id", richiesta.inspection_details.id);
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
    } else if (richiesta?.inspection_details?.id) {
      // If service type changed from ISPEZIONI to something else, delete old inspection details
      await supabase.from("richieste_servizio_ispezioni").delete().eq("richiesta_servizio_id", richiestaId);
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