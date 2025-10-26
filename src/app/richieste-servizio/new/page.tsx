"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, ArrowLeft, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format, setHours, setMinutes, parseISO, isValid } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  RichiestaServizioFormSchema,
  richiestaServizioFormSchema,
  calculateTotalHours,
  defaultDailySchedules,
  daysOfWeek,
  SERVICE_TYPES,
} from "@/lib/richieste-servizio-utils";
import { DailySchedulesFormField } from "@/components/richieste-servizio/daily-schedules-form-field";
import { RichiestaServizioForm } from "@/components/richieste-servizio/richiesta-servizio-form"; // Importa il componente form

interface Client {
  id: string;
  ragione_sociale: string;
}

interface PuntoServizio {
  id: string;
  nome_punto_servizio: string;
}

interface Fornitore { // Definizione dell'interfaccia Fornitore
  id: string;
  ragione_sociale: string;
}

export default function NewRichiestaServizioPage() {
  const [isLoading, setIsLoading] = useState(false);
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
    }
    fetchDependencies();
  }, []);

  async function onSubmit(values: RichiestaServizioFormSchema) {
    setIsLoading(true);
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
      status: "pending", // Default status
      total_hours_calculated: totalHours,
      created_at: now,
      updated_at: now,
    };

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

    // Insert daily schedules
    const schedulesToInsert = values.daily_schedules.map(schedule => ({
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
    } else {
      toast.success("Richiesta di servizio salvata con successo!");
      router.push("/richieste-servizio");
    }
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
          fornitori={fornitori} // Passa i fornitori al componente form
          onSubmit={onSubmit}
          isSubmitting={isLoading}
        />
      </div>
    </DashboardLayout>
  );
}