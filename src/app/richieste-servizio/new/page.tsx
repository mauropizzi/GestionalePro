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
import { Label } from "@/components/ui/label"; // Import aggiunto

interface Client {
  id: string;
  ragione_sociale: string;
}

interface PuntoServizio {
  id: string;
  nome_punto_servizio: string;
}

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const dailyScheduleSchema = z.object({
  giorno_settimana: z.string(),
  h24: z.boolean(),
  ora_inizio: z.string().regex(timeRegex, "Formato ora non valido (HH:mm)").nullable(),
  ora_fine: z.string().regex(timeRegex, "Formato ora non valido (HH:mm)").nullable(),
}).refine(data => {
  if (data.h24) {
    return data.ora_inizio === null && data.ora_fine === null;
  } else {
    return data.ora_inizio !== null && data.ora_fine !== null;
  }
}, {
  message: "Specificare orari di inizio e fine o selezionare h24.",
  path: ["ora_inizio"],
}).refine(data => {
  if (!data.h24 && data.ora_inizio && data.ora_fine) {
    const [startH, startM] = data.ora_inizio.split(':').map(Number);
    const [endH, endM] = data.ora_fine.split(':').map(Number);
    const startTime = setMinutes(setHours(new Date(), startH), startM);
    const endTime = setMinutes(setHours(new Date(), endH), endM);
    return endTime > startTime;
  }
  return true;
}, {
  message: "L'ora di fine deve essere successiva all'ora di inizio.",
  path: ["ora_fine"],
});

const formSchema = z.object({
  client_id: z.string().uuid("Seleziona un cliente valido."),
  punto_servizio_id: z.string().uuid("Seleziona un punto servizio valido.").nullable(),
  tipo_servizio: z.literal("ORE"), // For now, only "ORE" is supported
  data_inizio_servizio: z.date({ required_error: "La data di inizio servizio è richiesta." }),
  ora_inizio_servizio: z.string().regex(timeRegex, "Formato ora non valido (HH:mm)"),
  data_fine_servizio: z.date({ required_error: "La data di fine servizio è richiesta." }),
  ora_fine_servizio: z.string().regex(timeRegex, "Formato ora non valido (HH:mm)"),
  numero_agenti: z.coerce.number().min(1, "Il numero di agenti deve essere almeno 1."),
  note: z.string().nullable(),
  daily_schedules: z.array(dailyScheduleSchema).min(8, "Devi definire gli orari per tutti i giorni della settimana."),
}).refine(data => {
  const startDateTime = setMinutes(setHours(data.data_inizio_servizio, parseInt(data.ora_inizio_servizio.split(':')[0]),), parseInt(data.ora_inizio_servizio.split(':')[1]));
  const endDateTime = setMinutes(setHours(data.data_fine_servizio, parseInt(data.ora_fine_servizio.split(':')[0]),), parseInt(data.ora_fine_servizio.split(':')[1]));
  return endDateTime > startDateTime;
}, {
  message: "La data e ora di fine servizio devono essere successive alla data e ora di inizio.",
  path: ["data_fine_servizio"],
});

type RichiestaServizioFormSchema = z.infer<typeof formSchema>;

export default function NewRichiestaServizioPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [puntiServizio, setPuntiServizio] = useState<PuntoServizio[]>([]);
  const router = useRouter();

  const form = useForm<RichiestaServizioFormSchema>({
    resolver: zodResolver(formSchema),
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
      daily_schedules: [
        { giorno_settimana: "Lunedì", h24: false, ora_inizio: "09:00", ora_fine: "18:00" },
        { giorno_settimana: "Martedì", h24: false, ora_inizio: "09:00", ora_fine: "18:00" },
        { giorno_settimana: "Mercoledì", h24: false, ora_inizio: "09:00", ora_fine: "18:00" },
        { giorno_settimana: "Giovedì", h24: false, ora_inizio: "09:00", ora_fine: "18:00" },
        { giorno_settimana: "Venerdì", h24: false, ora_inizio: "09:00", ora_fine: "18:00" },
        { giorno_settimana: "Sabato", h24: false, ora_inizio: "09:00", ora_fine: "13:00" },
        { giorno_settimana: "Domenica", h24: false, ora_inizio: null, ora_fine: null },
        { giorno_settimana: "Festivo", h24: false, ora_inizio: null, ora_fine: null },
      ],
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
    }
    fetchDependencies();
  }, []);

  const calculateTotalHours = (
    startDate: Date,
    endDate: Date,
    dailySchedules: typeof formSchema._type.daily_schedules,
    numAgents: number
  ): number => {
    let totalHours = 0;
    let currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0); // Normalize to start of day

    const endDateTime = new Date(endDate);

    while (currentDate <= endDateTime) {
      const dayOfWeek = format(currentDate, 'EEEE', { locale: it }); // e.g., "lunedì"
      const schedule = dailySchedules.find(s => s.giorno_settimana.toLowerCase() === dayOfWeek.toLowerCase());

      if (schedule) {
        if (schedule.h24) {
          totalHours += 24;
        } else if (schedule.ora_inizio && schedule.ora_fine) {
          const [startH, startM] = schedule.ora_inizio.split(':').map(Number);
          const [endH, endM] = schedule.ora_fine.split(':').map(Number);

          let dayStart = setMinutes(setHours(new Date(currentDate), startH), startM);
          let dayEnd = setMinutes(setHours(new Date(currentDate), endH), endM);

          // Adjust for start/end service times on the first/last day
          if (currentDate.toDateString() === startDate.toDateString()) {
            const serviceStartHour = startDate.getHours();
            const serviceStartMinute = startDate.getMinutes();
            const serviceStartTime = setMinutes(setHours(new Date(currentDate), serviceStartHour), serviceStartMinute);
            if (serviceStartTime > dayStart) {
              dayStart = serviceStartTime;
            }
          }
          if (currentDate.toDateString() === endDate.toDateString()) {
            const serviceEndHour = endDate.getHours();
            const serviceEndMinute = endDate.getMinutes();
            const serviceEndTime = setMinutes(setHours(new Date(currentDate), serviceEndHour), serviceEndMinute);
            if (serviceEndTime < dayEnd) {
              dayEnd = serviceEndTime;
            }
          }

          if (dayEnd > dayStart) {
            totalHours += (dayEnd.getTime() - dayStart.getTime()) / (1000 * 60 * 60);
          }
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return totalHours * numAgents;
  };

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
      ora_inizio: schedule.h24 ? null : schedule.ora_inizio,
      ora_fine: schedule.h24 ? null : schedule.ora_fine,
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

  const daysOfWeek = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica", "Festivo"];

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" asChild>
            <Link href="/richieste-servizio">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-4xl font-bold">Nuova Richiesta di Servizio</h1>
        </div>
        <p className="text-lg text-muted-foreground mb-8">
          Crea una nuova richiesta di servizio per un cliente.
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-w-3xl mx-auto">
            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Cliente Associato</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona un cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.ragione_sociale}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="punto_servizio_id"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Punto Servizio Associato</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona un punto servizio (opzionale)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {puntiServizio.map((punto) => (
                        <SelectItem key={punto.id} value={punto.id}>
                          {punto.nome_punto_servizio}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tipo_servizio"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Tipo di Servizio</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly className="bg-muted" />
                  </FormControl>
                  <FormDescription>
                    Attualmente è supportato solo il tipo "ORE".
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campi specifici per tipo_servizio "ORE" */}
            <>
              <FormField
                control={form.control}
                name="data_inizio_servizio"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data Inizio Servizio</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: it })
                            ) : (
                              <span>Seleziona una data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          locale={it}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ora_inizio_servizio"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Ora Inizio Servizio</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type="time" {...field} className="pr-8" />
                        <Clock className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="data_fine_servizio"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data Fine Servizio</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: it })
                            ) : (
                              <span>Seleziona una data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          locale={it}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ora_fine_servizio"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Ora Fine Servizio</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type="time" {...field} className="pr-8" />
                        <Clock className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numero_agenti"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Numero di Agenti</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} min={1} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2 mt-6">
                <h3 className="text-xl font-semibold mb-4">Orari Giornalieri</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Definisci gli orari di servizio per ogni giorno della settimana e per i giorni festivi.
                </p>
                {daysOfWeek.map((day, index) => (
                  <FormField
                    key={day}
                    control={form.control}
                    name={`daily_schedules.${index}`}
                    render={({ field }) => (
                      <FormItem className="flex flex-col space-y-2 mb-4 p-3 border rounded-md">
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-base">{day}</FormLabel>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={field.value.h24}
                              onCheckedChange={(checked) => {
                                field.onChange({
                                  ...field.value,
                                  h24: checked,
                                  ora_inizio: checked ? null : "09:00", // Reset or set default
                                  ora_fine: checked ? null : "18:00",   // Reset or set default
                                });
                              }}
                              id={`h24-${day}`}
                            />
                            <Label htmlFor={`h24-${day}`}>H24</Label>
                          </div>
                        </div>
                        {!field.value.h24 && (
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <FormItem>
                              <FormLabel>Ora Inizio</FormLabel>
                              <FormControl>
                                <Input
                                  type="time"
                                  value={field.value.ora_inizio ?? ""}
                                  onChange={(e) => field.onChange({ ...field.value, ora_inizio: e.target.value })}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                            <FormItem>
                              <FormLabel>Ora Fine</FormLabel>
                              <FormControl>
                                <Input
                                  type="time"
                                  value={field.value.ora_fine ?? ""}
                                  onChange={(e) => field.onChange({ ...field.value, ora_fine: e.target.value })}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </>

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Aggiungi note sulla richiesta di servizio..." {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Salva Richiesta"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}