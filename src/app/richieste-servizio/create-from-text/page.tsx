"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { ArrowLeft, FileText, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { parse, addDays, isPast, startOfDay, format as formatDate } from "date-fns";
import { it } from "date-fns/locale";
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
  timeRegex,
  dailyScheduleSchema,
  INSPECTION_TYPES,
  APERTURA_CHIUSURA_TYPES,
  BONIFICA_TYPES,
  GESTIONE_CHIAVI_TYPES,
} from "@/lib/richieste-servizio-utils";
import { RichiestaServizioForm } from "@/components/richieste-servizio/richiesta-servizio-form";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { z } from "zod";

export default function CreateRichiestaFromTextPage() {
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

  const handleProcessText = async () => {
    if (!inputText.trim()) {
      toast.error("Inserisci una descrizione per elaborare.");
      return;
    }

    setIsProcessing(true);
    setShowForm(false);

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1500));

    let simulatedServiceType: ServiceType = "PIANTONAMENTO_ARMATO";
    let simulatedNotes = inputText; // Keep original text in notes
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

    console.log("[handleProcessText] Input Text:", inputText);
    console.log("[handleProcessText] Lowercase Text:", lowerCaseText);

    // --- 1. Parse Dates ---
    const dateRegexFull = /(\d{2})[./](\d{2})[./](\d{4})/g; // DD.MM.YYYY or DD/MM/YYYY
    const dateRegexPartial = /(\d{2})[./](\d{2})/g; // DD.MM or DD/MM

    let allParsedDates: Date[] = [];

    // Check for "oggi"
    if (lowerCaseText.includes("oggi")) {
      allParsedDates.push(today);
      console.log("[handleProcessText] Found 'oggi', added:", today);
    }

    // Check for full dates (DD.MM.YYYY or DD/MM/YYYY)
    const fullDateMatches = [...inputText.matchAll(dateRegexFull)];
    console.log("[handleProcessText] Full Date Matches:", fullDateMatches);
    for (const match of fullDateMatches) {
      const [day, month, year] = match.slice(1).map(Number);
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        allParsedDates.push(startOfDay(date));
        console.log("[handleProcessText] Found full date, added:", startOfDay(date));
      }
    }

    // Check for partial dates (DD.MM or DD/MM)
    const partialDateMatches = [...inputText.matchAll(dateRegexPartial)];
    console.log("[handleProcessText] Partial Date Matches:", partialDateMatches);
    for (const match of partialDateMatches) {
      const [day, month] = match.slice(1).map(Number);
      let year = today.getFullYear();
      let tempDate = new Date(year, month - 1, day);
      // If the parsed date is in the past relative to today, assume next year
      if (startOfDay(tempDate) < today) {
        year++;
        tempDate = new Date(year, month - 1, day);
        console.log(`[handleProcessText] Adjusted year for partial date ${match[0]} to ${year}`);
      }
      if (!isNaN(tempDate.getTime())) {
        allParsedDates.push(startOfDay(tempDate));
        console.log("[handleProcessText] Found partial date, added:", startOfDay(tempDate));
      }
    }

    if (allParsedDates.length > 0) {
      allParsedDates.sort((a, b) => a.getTime() - b.getTime());
      parsedStartDate = allParsedDates[0];
      parsedEndDate = allParsedDates[allParsedDates.length - 1];
    } else {
      // Default to today if no dates found
      parsedStartDate = today;
      parsedEndDate = today;
    }

    console.log("[handleProcessText] Final Parsed Dates:", { parsedStartDate, parsedEndDate });

    // --- 2. Parse Times (HH.mm, HH:mm, or just HH) ---
    const timeRegexFlexible = /(\d{1,2})[.:]?(\d{2})?/g; // Matches HH.mm, HH:mm, or just HH
    const allTimeMatches = [...inputText.matchAll(timeRegexFlexible)];
    const extractedTimes: string[] = [];

    for (const match of allTimeMatches) {
      const hour = match[1];
      const minute = match[2] || '00'; // Default to '00' if minutes are not specified
      extractedTimes.push(`${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`);
    }

    // Try to find "dalle X alle Y" pattern
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
      // If only one time is found, use it for both start and end (e.g., "alle 18")
      parsedOraInizio = extractedTimes[0];
      parsedOraFine = extractedTimes[0];
    }
    console.log("[handleProcessText] Parsed Times:", { parsedOraInizio, parsedOraFine });


    // --- 3. Parse Cadenza (e.g., "ogni 3 ore") ---
    const cadenzaRegex = /ogni (\d+(\.\d+)?) ore/i;
    const cadenzaMatch = inputText.match(cadenzaRegex);
    if (cadenzaMatch && cadenzaMatch[1]) {
      simulatedCadenzaOre = parseFloat(cadenzaMatch[1]);
      console.log("[handleProcessText] Parsed Cadenza:", simulatedCadenzaOre);
    } else {
      console.log("[handleProcessText] No Cadenza found.");
    }

    // --- 4. Parse Numero Agenti (e.g., "con 2 agenti") ---
    const numAgentsRegex = /(\d+) agenti/i;
    const numAgentsMatch = inputText.match(numAgentsRegex);
    if (numAgentsMatch && numAgentsMatch[1]) {
      simulatedNumAgents = parseInt(numAgentsMatch[1]);
      console.log("[handleProcessText] Parsed Num Agents:", simulatedNumAgents);
    } else {
      console.log("[handleProcessText] No Num Agents found, defaulting to 1.");
    }

    // --- 5. Determine service type and specific fields ---
    if (lowerCaseText.includes("ispezione")) {
      simulatedServiceType = "ISPEZIONI";
      simulatedCadenzaOre = simulatedCadenzaOre || 1; // Default to 1 hour if not specified
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
    console.log("[handleProcessText] Simulated Service Type:", simulatedServiceType);

    // --- 6. Update daily schedules based on parsed times ---
    const hasParsedTimes = !!(parsedOraInizio && parsedOraFine);
    const updatedDailySchedules: z.infer<typeof dailyScheduleSchema>[] = defaultDailySchedules.map((schedule) => ({
      ...schedule,
      h24: false, // Explicitly set to false if specific times are parsed
      ora_inizio: parsedOraInizio, // Apply parsed start time to all days
      ora_fine: parsedOraFine,     // Apply parsed end time to all days
      attivo: hasParsedTimes, // Set active if times are parsed
    }));
    console.log("[handleProcessText] Updated Daily Schedules:", updatedDailySchedules);

    // --- 7. Attempt to find a client and punto servizio based on keywords (very basic example) ---
    let foundClientId: string | null = null;
    let foundPuntoServizioId: string | null = null;

    // Example: Search for client by name in the text
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
        console.log("[handleProcessText] Found Client ID:", foundClientId);
      } else {
        console.log("[handleProcessText] No Client found for name:", clientName);
      }
    }

    // Example: Search for punto servizio by name in the text
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
        console.log("[handleProcessText] Found Punto Servizio ID:", foundPuntoServizioId);
      } else {
        console.log("[handleProcessText] No Punto Servizio found for name:", puntoServizioName);
      }
    }

    // Construct the object for form.reset based on the discriminated union
    let finalFormValues: RichiestaServizioFormSchema;

    const commonBaseValues = {
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
          ...commonBaseValues,
          tipo_servizio: "PIANTONAMENTO_ARMATO",
        };
        break;
      case "SERVIZIO_FIDUCIARIO":
        finalFormValues = {
          ...commonBaseValues,
          tipo_servizio: "SERVIZIO_FIDUCIARIO",
        };
        break;
      case "ISPEZIONI":
        finalFormValues = {
          ...commonBaseValues,
          tipo_servizio: "ISPEZIONI",
          cadenza_ore: simulatedCadenzaOre || 1,
          tipo_ispezione: simulatedTipoIspezione as (typeof INSPECTION_TYPES)[number]["value"] || "PERIMETRALE",
        };
        break;
      case "APERTURA_CHIUSURA":
        finalFormValues = {
          ...commonBaseValues,
          tipo_servizio: "APERTURA_CHIUSURA",
          tipo_apertura_chiusura: simulatedTipoAperturaChiusura || "APERTURA_E_CHIUSURA",
        };
        break;
      case "BONIFICA":
        finalFormValues = {
          ...commonBaseValues,
          tipo_servizio: "BONIFICA",
          tipo_bonifica: simulatedTipoBonifica || "BONIFICA_STANDARD",
        };
        break;
      case "GESTIONE_CHIAVI":
        finalFormValues = {
          ...commonBaseValues,
          tipo_servizio: "GESTIONE_CHIAVI",
          tipo_gestione_chiavi: simulatedTipoGestioneChiavi as (typeof GESTIONE_CHIAVI_TYPES)[number]["value"] || "RITIRO_CHIAVI",
        };
        break;
      default:
        finalFormValues = {
          ...commonBaseValues,
          tipo_servizio: "PIANTONAMENTO_ARMATO",
        };
        break;
    }

    form.reset(finalFormValues);

    console.log("[handleProcessText] Form values after form.reset:", form.getValues());

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
        data_servizio: format(values.data_inizio_servizio, "yyyy-MM-dd"),
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

  return (
    <DashboardLayout>
      <div className="container mx-auto py-4">
        <div className="flex items-center gap-4 mb-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/richieste-servizio">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Crea Richiesta da Testo</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Incolla o digita una descrizione del servizio per generare una bozza di richiesta.
        </p>

        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-4">
            <Label htmlFor="service-description">Descrizione del Servizio</Label>
            <Textarea
              id="service-description"
              placeholder="Es: 'Richiesta di piantonamento armato per il cliente XYZ presso il punto servizio principale dal 10/07/2024 al 15/07/2024 con 2 agenti, dalle 08:00 alle 18:00 tutti i giorni feriali.'"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={8}
              disabled={isProcessing}
            />
            <Button onClick={handleProcessText} disabled={isProcessing || !inputText.trim()}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Elaborazione...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Elabora Testo
                </>
              )}
            </Button>
          </div>

          {showForm && (
            <div className="mt-6 p-6 border rounded-lg bg-card shadow-sm">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <FileText className="mr-2 h-5 w-5" /> Anteprima Richiesta di Servizio
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Rivedi e modifica i dettagli della richiesta generata.
              </p>
              <RichiestaServizioForm
                form={form}
                clients={[]}
                puntiServizio={[]}
                fornitori={[]}
                onSubmit={onSubmit}
                isSubmitting={isProcessing}
              />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}