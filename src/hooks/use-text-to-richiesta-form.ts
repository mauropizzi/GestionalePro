"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { isPast, startOfDay, format as formatDate } from "date-fns";
import {
  RichiestaServizioFormSchema,
  richiestaServizioFormSchema,
  calculateTotalHours,
  calculateTotalInspections,
  calculateAperturaChiusuraCount,
  calculateBonificaCount,
  calculateGestioneChiaviCount,
  defaultDailySchedules,
  ServiceType,
  AperturaChiusuraType,
  BonificaType,
  GestioneChiaviType,
  INSPECTION_TYPES,
  APERTURA_CHIUSURA_TYPES,
  BONIFICA_TYPES,
  GESTIONE_CHIAVI_TYPES,
  dailyScheduleSchema,
} from "@/lib/richieste-servizio-utils";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export function useTextToRichiestaForm() {
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  const form = useForm<RichiestaServizioFormSchema>({
    resolver: zodResolver(richiestaServizioFormSchema),
    defaultValues: {
      client_id: "",
      punto_servizio_id: null,
      fornitore_id: null,
      tipo_servizio: "PIANTONAMENTO_ARMATO",
      note: null,
      data_inizio_servizio: startOfDay(new Date()),
      data_fine_servizio: startOfDay(new Date()),
      numero_agenti: 1,
      daily_schedules: defaultDailySchedules,
    } as RichiestaServizioFormSchema,
  });

  const handleProcessText = async () => {
    if (!inputText.trim()) {
      toast.error("Inserisci una descrizione per elaborare.");
      return;
    }

    setIsProcessing(true);
    setShowForm(false);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    let simulatedServiceType: ServiceType = "PIANTONAMENTO_ARMATO";
    let simulatedNotes = inputText;
    let simulatedNumAgents = 1;
    let simulatedCadenzaOre: number | undefined = undefined;
    let simulatedTipoIspezione: string | undefined = undefined;
    let simulatedTipoAperturaChiusura: AperturaChiusuraType | undefined = undefined;
    let simulatedTipoBonifica: BonificaType | undefined = undefined;
    let simulatedTipoGestioneChiavi: GestioneChiaviType | undefined = undefined;

    let parsedStartDate: Date = startOfDay(new Date());
    let parsedEndDate: Date = startOfDay(new Date());
    let parsedOraInizio: string | null = null;
    let parsedOraFine: string | null = null;

    const lowerCaseText = inputText.toLowerCase();
    const today = startOfDay(new Date());

    // --- 1. Parse Dates ---
    const dateRegexFull = /(\d{2})[./](\d{2})[./](\d{4})/g; // DD.MM.YYYY or DD/MM/YYYY
    const dateRegexPartial = /(\d{2})[./](\d{2})/g; // DD.MM or DD/MM
    const monthNames = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];

    let allParsedDates: Date[] = [];

    if (lowerCaseText.includes("oggi")) {
      allParsedDates.push(today);
    }

    const fullDateMatches = [...inputText.matchAll(dateRegexFull)];
    for (const match of fullDateMatches) {
      const [day, month, year] = match.slice(1).map(Number);
      allParsedDates.push(new Date(year, month - 1, day));
    }

    const partialDateMatches = [...inputText.matchAll(dateRegexPartial)];
    for (const match of partialDateMatches) {
      const [day, month] = match.slice(1).map(Number);
      let year = today.getFullYear();
      let tempDate = new Date(year, month - 1, day);
      if (isPast(tempDate) && tempDate.getMonth() < today.getMonth()) {
        year++;
        tempDate = new Date(year, month - 1, day);
      }
      allParsedDates.push(tempDate);
    }
    
    // Parse dates like "31.01" or "31 gennaio"
    const dayMonthRegex = /(\d{1,2})[.\s]+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|\d{1,2})/gi;
    const dayMonthMatches = [...inputText.matchAll(dayMonthRegex)];
    for (const match of dayMonthMatches) {
        const day = parseInt(match[1]);
        let monthIndex;
        if (isNaN(parseInt(match[2]))) { // Month name
            monthIndex = monthNames.findIndex(name => name === match[2].toLowerCase());
        } else { // Month number
            monthIndex = parseInt(match[2]) - 1;
        }

        if (monthIndex !== -1) {
            let year = today.getFullYear();
            let tempDate = new Date(year, monthIndex, day);
            if (isPast(tempDate) && tempDate.getMonth() < today.getMonth()) {
                year++;
                tempDate = new Date(year, monthIndex, day);
            }
            if (!isNaN(tempDate.getTime())) {
                allParsedDates.push(startOfDay(tempDate));
            }
        }
    }


    if (allParsedDates.length > 0) {
      allParsedDates.sort((a, b) => a.getTime() - b.getTime());
      parsedStartDate = startOfDay(allParsedDates[0]);
      parsedEndDate = startOfDay(allParsedDates[allParsedDates.length - 1]);
    } else {
      parsedStartDate = today;
      parsedEndDate = today;
    }

    // --- 2. Parse Times (HH.mm, HH:mm, or just HH) ---
    const timeRegexFlexible = /(\d{1,2})[.:]?(\d{2})?/g;
    const allTimeMatches = [...inputText.matchAll(timeRegexFlexible)];
    const extractedTimes: string[] = [];

    for (const match of allTimeMatches) {
      const hour = match[1];
      const minute = match[2] || '00';
      extractedTimes.push(`${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`);
    }

    const dalleAlleRegex = /(dalle|da)\s+(\d{1,2}(?:[.:]\d{2})?)\s+(alle|a)\s+(\d{1,2}(?:[.:]\d{2})?)/i;
    const dalleAlleMatch = inputText.match(dalleAlleRegex);

    if (dalleAlleMatch) {
      const startTimeRaw = dalleAlleMatch[2];
      const endTimeRaw = dalleAlleMatch[4];

      const parseTime = (timeStr: string) => {
        const parts = timeStr.split(/[.:]/);
        const hour = parts[0].padStart(2, '0');
        const minute = parts[1] ? parts[1].padStart(2, '0') : '00';
        return `${hour}:${minute}`;
      };

      parsedOraInizio = parseTime(startTimeRaw);
      parsedOraFine = parseTime(endTimeRaw);

    } else if (extractedTimes.length >= 2) {
      parsedOraInizio = extractedTimes[0];
      parsedOraFine = extractedTimes[1];
    } else if (extractedTimes.length === 1) {
      parsedOraInizio = extractedTimes[0];
      parsedOraFine = extractedTimes[0];
    }

    // --- 3. Parse Cadenza (e.g., "ogni 3 ore") ---
    const cadenzaRegex = /ogni (\d+(\.\d+)?) ore/i;
    const cadenzaMatch = inputText.match(cadenzaRegex);
    if (cadenzaMatch && cadenzaMatch[1]) {
      simulatedCadenzaOre = parseFloat(cadenzaMatch[1]);
    }

    // --- 4. Parse Numero Agenti (e.g., "con 2 agenti") ---
    const numAgentsRegex = /(\d+) agenti/i;
    const numAgentsMatch = inputText.match(numAgentsRegex);
    if (numAgentsMatch && numAgentsMatch[1]) {
      simulatedNumAgents = parseInt(numAgentsMatch[1]);
    }

    // --- 5. Determine service type and specific fields ---
    if (lowerCaseText.includes("ispezione")) {
      simulatedServiceType = "ISPEZIONI";
      simulatedCadenzaOre = simulatedCadenzaOre || 1;
      if (lowerCaseText.includes("perimetrale")) simulatedTipoIspezione = "PERIMETRALE";
      else if (lowerCaseText.includes("interna")) simulatedTipoIspezione = "INTERNA";
      else simulatedTipoIspezione = "COMPLETA";
    } else if (lowerCaseText.includes("apertura") || lowerCaseText.includes("chiusura")) {
      simulatedServiceType = "APERTURA_CHIUSURA";
      if (lowerCaseText.includes("solo apertura")) simulatedTipoAperturaChiusura = "SOLO_APERTURA";
      else if (lowerCaseText.includes("solo chiusura")) simulatedTipoAperturaChiusura = "SOLO_CHIUSURA";
      else simulatedTipoAperturaChiusura = "APERTURA_E_CHIUSURA";
    } else if (lowerCaseText.includes("bonifica")) {
      simulatedServiceType = "BONIFICA";
      if (lowerCaseText.includes("urgente")) simulatedTipoBonifica = "BONIFICA_URGENTE";
      else simulatedTipoBonifica = "BONIFICA_STANDARD";
    } else if (lowerCaseText.includes("chiavi") || lowerCaseText.includes("gestione chiavi")) {
      simulatedServiceType = "GESTIONE_CHIAVI";
      if (lowerCaseText.includes("ritiro")) simulatedTipoGestioneChiavi = "RITIRO_CHIAVI";
      else if (lowerCaseText.includes("consegna")) simulatedTipoGestioneChiavi = "CONSEGNA_CHIAVI";
      else simulatedTipoGestioneChiavi = "VERIFICA_CHIAVI";
    } else if (lowerCaseText.includes("servizio fiduciario")) {
      simulatedServiceType = "SERVIZIO_FIDUCIARIO";
    }

    // --- 6. Update daily schedules based on parsed times ---
    const hasParsedTimes = !!(parsedOraInizio && parsedOraFine);
    const updatedDailySchedules: z.infer<typeof dailyScheduleSchema>[] = defaultDailySchedules.map((schedule) => ({
      ...schedule,
      h24: false,
      ora_inizio: hasParsedTimes ? parsedOraInizio : null,
      ora_fine: hasParsedTimes ? parsedOraFine : null,
      attivo: hasParsedTimes,
    }));

    // --- 7. Attempt to find a client and punto servizio based on keywords (very basic example) ---
    let foundClientId: string | null = null;
    let foundPuntoServizioId: string | null = null;

    const clientSearchMatch = lowerCaseText.match(/cliente\s+([a-z0-9\s]+?)(?:\s+presso|\s+dal|\s+con|$)/);
    if (clientSearchMatch && clientSearchMatch[1]) {
      const clientName = clientSearchMatch[1].trim();
      const { data: clientsData, error: clientsError } = await supabase
        .from("clienti")
        .select("id")
        .ilike("ragione_sociale", `%${clientName}%`)
        .limit(1);
      if (!clientsError && clientsData && clientsData.length > 0) {
        foundClientId = clientsData[0].id;
      }
    }

    const puntoServizioSearchMatch = lowerCaseText.match(/punto servizio\s+([a-z0-9\s]+?)(?:\s+dal|\s+con|$)/);
    if (puntoServizioSearchMatch && puntoServizioSearchMatch[1]) {
      const puntoServizioName = puntoServizioSearchMatch[1].trim();
      const { data: puntiServizioData, error: puntiServizioError } = await supabase
        .from("punti_servizio")
        .select("id")
        .ilike("nome_punto_servizio", `%${puntoServizioName}%`)
        .limit(1);
      if (!puntiServizioError && puntiServizioData && puntiServizioData.length > 0) {
        foundPuntoServizioId = puntiServizioData[0].id;
      }
    }

    let finalFormValues: RichiestaServizioFormSchema;

    const baseValues = {
      client_id: foundClientId || "",
      punto_servizio_id: foundPuntoServizioId,
      fornitore_id: null,
      note: simulatedNotes,
      data_inizio_servizio: parsedStartDate,
      data_fine_servizio: parsedEndDate,
      numero_agenti: simulatedNumAgents,
      daily_schedules: updatedDailySchedules,
    };

    switch (simulatedServiceType) {
      case "PIANTONAMENTO_ARMATO":
        finalFormValues = {
          ...baseValues,
          tipo_servizio: "PIANTONAMENTO_ARMATO",
        } as RichiestaServizioFormSchema;
        break;
      case "SERVIZIO_FIDUCIARIO":
        finalFormValues = {
          ...baseValues,
          tipo_servizio: "SERVIZIO_FIDUCIARIO",
        } as RichiestaServizioFormSchema;
        break;
      case "ISPEZIONI":
        finalFormValues = {
          ...baseValues,
          tipo_servizio: "ISPEZIONI",
          cadenza_ore: simulatedCadenzaOre || 1,
          tipo_ispezione: simulatedTipoIspezione as (typeof INSPECTION_TYPES)[number]["value"] || "PERIMETRALE",
        } as RichiestaServizioFormSchema;
        break;
      case "APERTURA_CHIUSURA":
        finalFormValues = {
          ...baseValues,
          tipo_servizio: "APERTURA_CHIUSURA",
          tipo_apertura_chiusura: simulatedTipoAperturaChiusura || "APERTURA_E_CHIUSURA",
        } as RichiestaServizioFormSchema;
        break;
      case "BONIFICA":
        finalFormValues = {
          ...baseValues,
          tipo_servizio: "BONIFICA",
          tipo_bonifica: simulatedTipoBonifica || "BONIFICA_STANDARD",
        } as RichiestaServizioFormSchema;
        break;
      case "GESTIONE_CHIAVI":
        finalFormValues = {
          ...baseValues,
          tipo_servizio: "GESTIONE_CHIAVI",
          tipo_gestione_chiavi: simulatedTipoGestioneChiavi as (typeof GESTIONE_CHIAVI_TYPES)[number]["value"] || "RITIRO_CHIAVI",
        } as RichiestaServizioFormSchema;
        break;
      default:
        finalFormValues = {
          ...baseValues,
          tipo_servizio: "PIANTONAMENTO_ARMATO",
        } as RichiestaServizioFormSchema;
        break;
    }

    form.reset(finalFormValues);

    setIsProcessing(false);
    setShowForm(true);
    toast.success("Testo elaborato! Rivedi i dettagli della richiesta.");
  };

  async function onSubmit(values: RichiestaServizioFormSchema) {
    setIsProcessing(true);
    const now = new Date().toISOString();
    let totalCalculatedValue: number | null = null;
    let richiestaData: any;
    let inspectionDetailsToInsert: any = null;

    const dataInizioServizio = values.data_inizio_servizio;
    const dataFineServizio = values.data_fine_servizio;

    if (values.tipo_servizio === "ISPEZIONI") {
      totalCalculatedValue = calculateTotalInspections(
        dataInizioServizio,
        dataFineServizio,
        values.daily_schedules,
        values.cadenza_ore!,
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
    } else if (values.tipo_servizio === "GESTIONE_CHIAVI") {
      totalCalculatedValue = calculateGestioneChiaviCount(
        dataInizioServizio,
        dataFineServizio,
        values.daily_schedules,
        values.tipo_gestione_chiavi as GestioneChiaviType,
        values.numero_agenti
      );
    } else {
      totalCalculatedValue = calculateTotalHours(
        dataInizioServizio,
        dataFineServizio,
        values.daily_schedules,
        values.numero_agenti
      );
    }

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
        data_servizio: formatDate(values.data_inizio_servizio, "yyyy-MM-dd"),
        cadenza_ore: values.cadenza_ore,
        tipo_ispezione: values.tipo_ispezione,
        created_at: now,
        updated_at: now,
      };
    } else if (values.tipo_servizio === "APERTURA_CHIUSURA") {
      richiestaData.tipo_apertura_chiusura = values.tipo_apertura_chiusura;
    } else if (values.tipo_servizio === "BONIFICA") {
      richiestaData.tipo_bonifica = values.tipo_bonifica;
    } else if (values.tipo_servizio === "GESTIONE_CHIAVI") {
      richiestaData.tipo_gestione_chiavi = values.tipo_gestione_chiavi;
    }

    const { data: newRichiesta, error: richiestaError } = await supabase
      .from("richieste_servizio")
      .insert(richiestaData)
      .select()
      .single();

    if (richiestaError) {
      toast.error("Errore durante il salvataggio della richiesta di servizio: " + richiestaError.message);
      setIsProcessing(false);
      return;
    }

    const isSingleTimeService = values.tipo_servizio === "BONIFICA" ||
      (values.tipo_servizio === "APERTURA_CHIUSURA" && (values.tipo_apertura_chiusura === "SOLO_APERTURA" || values.tipo_apertura_chiusura === "SOLO_CHIUSURA")) ||
      values.tipo_servizio === "GESTIONE_CHIAVI";

    const schedulesToInsert = values.daily_schedules.map((schedule) => ({
      ...schedule,
      richiesta_servizio_id: newRichiesta.id,
      ora_inizio: schedule.h24 || !schedule.attivo ? null : schedule.ora_inizio,
      ora_fine: (isSingleTimeService || schedule.h24 || !schedule.attivo) ? null : schedule.ora_fine,
      created_at: now,
      updated_at: now,
    }));

    const { error: schedulesError } = await supabase
      .from("richieste_servizio_orari_giornalieri")
      .insert(schedulesToInsert);

    if (schedulesError) {
      toast.error("Errore durante il salvataggio degli orari giornalieri: " + schedulesError.message);
    }

    if (values.tipo_servizio === "ISPEZIONI" && inspectionDetailsToInsert) {
      const { error: inspectionError } = await supabase
        .from("richieste_servizio_ispezioni")
        .insert({ ...inspectionDetailsToInsert, richiesta_servizio_id: newRichiesta.id });

      if (inspectionError) {
        toast.error("Errore durante il salvataggio dei dettagli dell'ispezione: " + inspectionError.message);
      }
    }

    toast.success("Richiesta di servizio salvata con successo!");
    router.push("/richieste-servizio");
    setIsProcessing(false);
  }

  return {
    form,
    inputText,
    setInputText,
    isProcessing,
    showForm,
    handleProcessText,
    onSubmit,
  };
}