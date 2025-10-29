"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
  RichiestaServizioFormSchema,
  richiestaServizioFormSchema,
  calculateTotalHours,
  calculateTotalInspections,
  calculateAperturaChiusuraCount,
  calculateBonificaCount,
  calculateGestioneChiaviCount, // Importa la nuova funzione
  defaultDailySchedules,
  ServiceType,
  InspectionType,
  INSPECTION_TYPES,
  AperturaChiusuraType,
  APERTURA_CHIUSURA_TYPES,
  BonificaType,
  BONIFICA_TYPES,
  GestioneChiaviType, // Importa il nuovo tipo
  GESTIONE_CHIAVI_TYPES, // Importa i nuovi tipi
} from "@/lib/richieste-servizio-utils";
import { Client, PuntoServizio, RichiestaServizio, DailySchedule, Fornitore } from "@/types/richieste-servizio";

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
      data_inizio_servizio: new Date(),
      data_fine_servizio: new Date(),
      numero_agenti: 1,
      daily_schedules: defaultDailySchedules,
      // ISPEZIONI specific fields are omitted here as default type is PIANTONAMENTO_ARMATO
      // These will be set by useEffect in RichiestaServizioForm if type changes to ISPEZIONI
    } as RichiestaServizioFormSchema, // Cast to ensure correct type for defaultValues
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

        const baseFormValues = {
          client_id: richiestaData.client_id || "",
          punto_servizio_id: richiestaData.punto_servizio_id === "" ? null : richiestaData.punto_servizio_id,
          fornitore_id: richiestaData.fornitore_id === "" ? null : richiestaData.fornitore_id,
          note: richiestaData.note || null,
          data_inizio_servizio: richiestaData.data_inizio_servizio ? parseISO(richiestaData.data_inizio_servizio) : new Date(),
          data_fine_servizio: richiestaData.data_fine_servizio ? parseISO(richiestaData.data_fine_servizio) : new Date(),
          numero_agenti: richiestaData.numero_agenti || 1,
          daily_schedules: mergedSchedules,
        };

        if (richiestaData.tipo_servizio === "ISPEZIONI" && richiestaData.inspection_details?.[0]) {
          const inspectionDetail = richiestaData.inspection_details[0];
          form.reset({
            ...baseFormValues,
            tipo_servizio: "ISPEZIONI",
            cadenza_ore: inspectionDetail.cadenza_ore,
            tipo_ispezione: inspectionDetail.tipo_ispezione as InspectionType,
          } as RichiestaServizioFormSchema);
        } else if (richiestaData.tipo_servizio === "APERTURA_CHIUSURA") {
          form.reset({
            ...baseFormValues,
            tipo_servizio: "APERTURA_CHIUSURA",
            tipo_apertura_chiusura: richiestaData.tipo_apertura_chiusura as AperturaChiusuraType,
          } as RichiestaServizioFormSchema);
        } else if (richiestaData.tipo_servizio === "BONIFICA") {
          form.reset({
            ...baseFormValues,
            tipo_servizio: "BONIFICA",
            tipo_bonifica: richiestaData.tipo_bonifica as BonificaType,
          } as RichiestaServizioFormSchema);
        } else if (richiestaData.tipo_servizio === "GESTIONE_CHIAVI") { // Nuova logica per GESTIONE_CHIAVI
          form.reset({
            ...baseFormValues,
            tipo_servizio: "GESTIONE_CHIAVI",
            tipo_gestione_chiavi: richiestaData.tipo_gestione_chiavi as GestioneChiaviType,
          } as RichiestaServizioFormSchema);
        }
        else {
          form.reset({
            ...baseFormValues,
            tipo_servizio: richiestaData.tipo_servizio as Exclude<ServiceType, "ISPEZIONI" | "APERTURA_CHIUSURA" | "BONIFICA" | "GESTIONE_CHIAVI">,
          } as RichiestaServizioFormSchema);
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

    const dataInizioServizio = values.data_inizio_servizio;
    const dataFineServizio = values.data_fine_servizio;

    if (values.tipo_servizio === "ISPEZIONI") {
      totalCalculatedValue = calculateTotalInspections(
        dataInizioServizio,
        dataFineServizio,
        values.daily_schedules,
        values.cadenza_ore,
        values.numero_agenti
      );
    } else if (values.tipo_servizio === "APERTURA_CHIUSURA") {
      totalCalculatedValue = calculateAperturaChiusuraCount(
        dataInizioServizio,
        dataFineServizio,
        values.daily_schedules,
        values.tipo_apertura_chiusura as AperturaChiusuraType,
        values.numero_agenti
      );
    } else if (values.tipo_servizio === "BONIFICA") {
      totalCalculatedValue = calculateBonificaCount(
        dataInizioServizio,
        dataFineServizio,
        values.daily_schedules,
        values.tipo_bonifica as BonificaType,
        values.numero_agenti
      );
    } else if (values.tipo_servizio === "GESTIONE_CHIAVI") { // Nuova logica per GESTIONE_CHIAVI
      totalCalculatedValue = calculateGestioneChiaviCount(
        dataInizioServizio,
        dataFineServizio,
        values.daily_schedules,
        values.tipo_gestione_chiavi as GestioneChiaviType,
        values.numero_agenti
      );
    }
    else {
      totalCalculatedValue = calculateTotalHours(
        dataInizioServizio,
        dataFineServizio,
        values.daily_schedules,
        values.numero_agenti
      );
    }

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
        data_servizio: format(values.data_inizio_servizio, "yyyy-MM-dd"),
        cadenza_ore: values.cadenza_ore,
        tipo_ispezione: values.tipo_ispezione,
        updated_at: now,
      };
    } else if (values.tipo_servizio === "APERTURA_CHIUSURA") {
      richiestaDataToUpdate.tipo_apertura_chiusura = values.tipo_apertura_chiusura;
      richiestaDataToUpdate.tipo_bonifica = null; // Clear bonifica type if changing to apertura/chiusura
      richiestaDataToUpdate.tipo_gestione_chiavi = null; // Clear gestione chiavi type
    } else if (values.tipo_servizio === "BONIFICA") {
      richiestaDataToUpdate.tipo_bonifica = values.tipo_bonifica;
      richiestaDataToUpdate.tipo_apertura_chiusura = null; // Clear apertura/chiusura type if changing to bonifica
      richiestaDataToUpdate.tipo_gestione_chiavi = null; // Clear gestione chiavi type
    } else if (values.tipo_servizio === "GESTIONE_CHIAVI") { // Aggiungi tipo_gestione_chiavi a richiestaDataToUpdate
      richiestaDataToUpdate.tipo_gestione_chiavi = values.tipo_gestione_chiavi;
      richiestaDataToUpdate.tipo_apertura_chiusura = null; // Clear apertura/chiusura type
      richiestaDataToUpdate.tipo_bonifica = null; // Clear bonifica type
    } else {
      richiestaDataToUpdate.tipo_apertura_chiusura = null; // Clear if changing to other types
      richiestaDataToUpdate.tipo_bonifica = null; // Clear if changing to other types
      richiestaDataToUpdate.tipo_gestione_chiavi = null; // Clear if changing to other types
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

    const isSingleTimeService = values.tipo_servizio === "BONIFICA" ||
      (values.tipo_servizio === "APERTURA_CHIUSURA" && (values.tipo_apertura_chiusura === "SOLO_APERTURA" || values.tipo_apertura_chiusura === "SOLO_CHIUSURA")) ||
      values.tipo_servizio === "GESTIONE_CHIAVI"; // Include new service type

    for (const schedule of values.daily_schedules) {
      const scheduleToSave = {
        richiesta_servizio_id: richiestaId,
        giorno_settimana: schedule.giorno_settimana,
        h24: schedule.h24,
        ora_inizio: schedule.h24 || !schedule.attivo ? null : schedule.ora_inizio,
        ora_fine: (isSingleTimeService || schedule.h24 || !schedule.attivo) ? null : schedule.ora_fine, // Explicitly set ora_fine to null for single time services
        updated_at: now,
      };

      if (schedule.id) {
        const { error } = await supabase
          .from("richieste_servizio_orari_giornalieri")
          .update(scheduleToSave)
          .eq("id", schedule.id);
        if (error) {
          toast.error(`Errore nell'aggiornamento orario per ${schedule.giorno_settimana}: ` + error.message);
        }
      } else {
        const { error } = await supabase
          .from("richieste_servizio_orari_giornalieri")
          .insert({ ...scheduleToSave, created_at: now });
        if (error) {
          toast.error(`Errore nell'inserimento orario per ${schedule.giorno_settimana}: ` + error.message);
        }
      }
    }

    if (values.tipo_servizio === "ISPEZIONI" && inspectionDetailsToSave) {
      if (richiesta?.inspection_details?.[0]?.id) {
        const { error: inspectionError } = await supabase
          .from("richieste_servizio_ispezioni")
          .update(inspectionDetailsToSave)
          .eq("id", richiesta.inspection_details[0].id);
        if (inspectionError) {
          toast.error("Errore nell'aggiornamento dei dettagli dell'ispezione: " + inspectionError.message);
        }
      } else {
        const { error: inspectionError } = await supabase
          .from("richieste_servizio_ispezioni")
          .insert({ ...inspectionDetailsToSave, richiesta_servizio_id: richiestaId, created_at: now });
        if (inspectionError) {
          toast.error("Errore nell'inserimento dei dettagli dell'ispezione: " + inspectionError.message);
        }
      }
    } else if (richiesta?.inspection_details?.[0]?.id) {
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