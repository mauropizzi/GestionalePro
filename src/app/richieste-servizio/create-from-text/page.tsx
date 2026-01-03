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
import { parse, addDays } from "date-fns"; // Import parse and addDays
import { it } from "date-fns/locale"; // Import locale for date parsing
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
  timeRegex, // Import timeRegex
} from "@/lib/richieste-servizio-utils";
import { RichiestaServizioForm } from "@/components/richieste-servizio/richiesta-servizio-form";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export default function CreateRichiestaFromTextPage() {
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  const form = useForm<RichiestaServizioFormSchema>({
    resolver: zodResolver(richiestaServizioFormSchema),
    defaultValues: {
      client_id: "", // Will be filled by processing or user
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
    } as RichiestaServizioFormSchema,
  });

  const handleProcessText = async () => {
    if (!inputText.trim()) {
      toast.error("Inserisci una descrizione per elaborare.");
      return;
    }

    setIsProcessing(true);
    setShowForm(false); // Hide form while processing

    // Simulate AI processing and data extraction
    // In a real application, this would involve an API call to an NLP service
    // For now, we'll use simple keyword matching and dummy data.
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate network delay

    let simulatedServiceType: ServiceType = "PIANTONAMENTO_ARMATO";
    let simulatedNotes = inputText;
    let simulatedNumAgents = 1;
    let simulatedCadenzaOre: number | undefined = undefined;
    let simulatedTipoIspezione: string | undefined = undefined;
    let simulatedTipoAperturaChiusura: AperturaChiusuraType | undefined = undefined;
    let simulatedTipoBonifica: BonificaType | undefined = undefined;
    let simulatedTipoGestioneChiavi: GestioneChiaviType | undefined = undefined;

    let parsedStartDate: Date = new Date();
    let parsedEndDate: Date = new Date();
    let parsedOraInizio: string | null = null;
    let parsedOraFine: string | null = null;

    const lowerCaseText = inputText.toLowerCase();

    // 1. Parse Dates (DD.MM.YYYY)
    const dateRegex = /(\d{2})\.(\d{2})\.(\d{4})/g; // Corrected: escaped dots
    const datesFound = [...inputText.matchAll(dateRegex)];
    console.log("Raw Dates Found:", datesFound);

    if (datesFound.length >= 2) {
      const [day1, month1, year1] = datesFound[0].slice(1).map(Number);
      const [day2, month2, year2] = datesFound[1].slice(1).map(Number);
      parsedStartDate = new Date(year1, month1 - 1, day1);
      parsedEndDate = new Date(year2, month2 - 1, day2);
    } else if (datesFound.length === 1) {
      const [day1, month1, year1] = datesFound[0].slice(1).map(Number);
      parsedStartDate = new Date(year1, month1 - 1, day1);
      parsedEndDate = new Date(year1, month1 - 1, day1); // If only one date, assume it's for a single day
    }
    console.log("Parsed Dates:", { parsedStartDate, parsedEndDate });


    // 2. Parse Times (HH.mm or HH:mm)
    const localTimeRegex = /(\d{2})[.:](\d{2})/g; // Use the imported timeRegex pattern
    const timesFound = [...inputText.matchAll(localTimeRegex)];
    console.log("Raw Times Found:", timesFound);
    if (timesFound.length >= 2) {
      parsedOraInizio = `${timesFound[0][1]}:${timesFound[0][2]}`;
      parsedOraFine = `${timesFound[1][1]}:${timesFound[1][2]}`;
    }
    console.log("Parsed Times:", { parsedOraInizio, parsedOraFine });


    // 3. Parse Cadenza (e.g., "ogni 3 ore")
    const cadenzaRegex = /ogni (\d+(\.\d+)?) ore/i;
    const cadenzaMatch = inputText.match(cadenzaRegex);
    if (cadenzaMatch && cadenzaMatch[1]) {
      simulatedCadenzaOre = parseFloat(cadenzaMatch[1]);
    }
    console.log("Parsed Cadenza:", simulatedCadenzaOre);

    // 4. Parse Numero Agenti (e.g., "con 2 agenti")
    const numAgentsRegex = /(\d+) agenti/i;
    const numAgentsMatch = inputText.match(numAgentsRegex);
    if (numAgentsMatch && numAgentsMatch[1]) {
      simulatedNumAgents = parseInt(numAgentsMatch[1]);
    }
    console.log("Parsed Num Agents:", simulatedNumAgents);


    // Determine service type and specific fields
    if (lowerCaseText.includes("ispezione")) {
      simulatedServiceType = "ISPEZIONI";
      simulatedCadenzaOre = simulatedCadenzaOre || 1; // Default to 1 if not found
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
    }
    console.log("Simulated Service Type:", simulatedServiceType);


    // Update daily schedules based on parsed times
    const updatedDailySchedules = defaultDailySchedules.map(schedule => {
      if (parsedOraInizio && parsedOraFine) {
        // If times are parsed from text, apply them to all days and set active
        return {
          ...schedule,
          attivo: true, // Set to active if times are provided
          h24: false,
          ora_inizio: parsedOraInizio,
          ora_fine: parsedOraFine,
        };
      } else {
        // If no times are parsed, set to inactive and null times
        return {
          ...schedule,
          attivo: false,
          h24: false,
          ora_inizio: null,
          ora_fine: null,
        };
      }
    });
    console.log("Updated Daily Schedules:", updatedDailySchedules);


    // Attempt to find a client and punto servizio based on keywords (very basic example)
    let foundClientId: string | null = null;
    let foundPuntoServizioId: string | null = null;

    // In a real scenario, you'd query your DB or use AI to find these IDs
    // For this example, we'll just set dummy values if the text contains "cliente test"
    if (lowerCaseText.includes("cliente test")) {
      // Replace with actual client ID from your DB for testing
      foundClientId = "a1b2c3d4-e5f6-7890-1234-567890abcdef"; // Dummy UUID
    }
    if (lowerCaseText.includes("punto servizio centrale")) {
      // Replace with actual punto servizio ID from your DB for testing
      foundPuntoServizioId = "b1c2d3e4-f5a6-7890-1234-567890abcdef"; // Dummy UUID
    }

    // Reset form with processed data
    form.reset({
      client_id: foundClientId || "",
      punto_servizio_id: foundPuntoServizioId,
      fornitore_id: null, // No automatic detection for now
      tipo_servizio: simulatedServiceType,
      note: simulatedNotes,
      data_inizio_servizio: parsedStartDate,
      data_fine_servizio: parsedEndDate,
      numero_agenti: simulatedNumAgents,
      daily_schedules: updatedDailySchedules,
      // Service-specific fields
      ...(simulatedServiceType === "ISPEZIONI" && {
        cadenza_ore: simulatedCadenzaOre,
        tipo_ispezione: simulatedTipoIspezione,
      }),
      ...(simulatedServiceType === "APERTURA_CHIUSURA" && {
        tipo_apertura_chiusura: simulatedTipoAperturaChiusura,
      }),
      ...(simulatedServiceType === "BONIFICA" && {
        tipo_bonifica: simulatedTipoBonifica,
      }),
      ...(simulatedServiceType === "GESTIONE_CHIAVI" && {
        tipo_gestione_chiavi: simulatedTipoGestioneChiavi,
      }),
    } as RichiestaServizioFormSchema); // Cast to ensure correct type

    console.log("Form values after processing text:", form.getValues());

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

    // Recalculate total based on the final form values
    if (values.tipo_servizio === "ISPEZIONI") {
      totalCalculatedValue = calculateTotalInspections(
        dataInizioServizio,
        dataFineServizio,
        values.daily_schedules,
        values.cadenza_ore!, // Assert non-null as it's required for ISPEZIONI
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
                clients={[]} // Handled by searchable select
                puntiServizio={[]} // Handled by searchable select
                fornitori={[]} // Handled by searchable select
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