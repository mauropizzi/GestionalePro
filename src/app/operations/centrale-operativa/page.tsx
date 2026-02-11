"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useSession } from "@/components/session-context-provider";
import { ShieldAlert, CalendarIcon, Search, Loader2, PlusCircle, BellRing, History, MapPin, UserRound, Clock, CheckCircle, XCircle, Barcode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AlarmEntry, AccessType, InterventionOutcome, HistoricalSearchFilters } from "@/types/centrale-operativa";
import { PuntoServizio } from "@/types/richieste-servizio";
import { Personale, NetworkOperator } from "@/types/anagrafiche";
import { SearchablePuntoServizioSelect } from "@/components/richieste-servizio/searchable-punto-servizio-select";

// Schemi di validazione
const alarmEntryFormSchema = z.object({
  registration_date: z.date({ required_error: "La data di registrazione è richiesta." }),
  punto_servizio_id: z.string().uuid("Seleziona un punto servizio valido.").nullable(),
  intervention_due_by: z.date().nullable(),
  service_type_requested: z.string().min(1, "La tipologia di servizio è richiesta."),
  operator_co_id: z.string().uuid("Seleziona un operatore valido.").nullable(),
  request_time_co: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato orario non valido (HH:mm)"),
  intervention_start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato orario non valido (HH:mm)").nullable(),
  intervention_end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato orario non valido (HH:mm)").nullable(),
  full_site_access: z.boolean(), // Changed from .default(false)
  caveau_access: z.boolean(),    // Changed from .default(false)
  network_operator_id: z.string().uuid("Seleziona un operatore network valido.").nullable(),
  gpg_intervention_made: z.boolean(), // Changed from .default(false)
  anomalies_found: z.string().nullable(),
  delay_minutes: z.coerce.number().int().min(0, "Il ritardo non può essere negativo.").nullable(),
  service_outcome: z.enum(["Risolto", "Non Risolto", "Falso Allarme", "Annullato"]).nullable(),
  client_request_barcode: z.string().nullable(),
});

type AlarmEntryFormSchema = z.infer<typeof alarmEntryFormSchema>;

const historicalSearchSchema = z.object({
  from_date: z.date().nullable(),
  to_date: z.date().nullable(),
  punto_servizio_id: z.string().uuid("Seleziona un punto servizio valido.").nullable(),
});

export default function CentraleOperativaPage() {
  const { profile: currentUserProfile, isLoading: isSessionLoading } = useSession();
  const [currentAlarm, setCurrentAlarm] = useState<AlarmEntry | null>(null);
  const [historicalAlarms, setHistoricalAlarms] = useState<AlarmEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [personaleOptions, setPersonaleOptions] = useState<Personale[]>([]);
  const [networkOperatorsOptions, setNetworkOperatorsOptions] = useState<NetworkOperator[]>([]);
  const [puntoServizioOptions, setPuntoServizioOptions] = useState<PuntoServizio[]>([]); // For historical search select

  const hasAccess =
    currentUserProfile?.role === "super_admin" ||
    currentUserProfile?.role === "amministrazione" ||
    currentUserProfile?.role === "responsabile_operativo" ||
    currentUserProfile?.role === "operativo";

  const defaultAlarmFormValues: AlarmEntryFormSchema = {
    registration_date: new Date(),
    punto_servizio_id: null,
    intervention_due_by: null,
    service_type_requested: "",
    operator_co_id: null,
    request_time_co: format(new Date(), "HH:mm"),
    intervention_start_time: null,
    intervention_end_time: null,
    full_site_access: false,
    caveau_access: false,
    network_operator_id: null,
    gpg_intervention_made: false,
    anomalies_found: null,
    delay_minutes: null,
    service_outcome: null,
    client_request_barcode: null,
  };

  const form = useForm<AlarmEntryFormSchema>({
    resolver: zodResolver(alarmEntryFormSchema),
    defaultValues: defaultAlarmFormValues,
  });

  const searchForm = useForm<z.infer<typeof historicalSearchSchema>>({
    resolver: zodResolver(historicalSearchSchema),
    defaultValues: {
      from_date: null,
      to_date: null,
      punto_servizio_id: null,
    },
  });

  useEffect(() => {
    if (!isSessionLoading && hasAccess) {
      fetchDependencies();
      fetchCurrentAlarms();
      fetchHistoricalAlarms(); // Fetch initial historical data
    }
  }, [isSessionLoading, hasAccess]);

  const fetchDependencies = async () => {
    // Fetch Personale (for Operatore C.O. Security Service)
    const { data: personaleData, error: personaleError } = await supabase
      .from("personale")
      .select("*")
      .eq("attivo", true)
      .order("cognome", { ascending: true });

    if (personaleError) {
      toast.error("Errore nel recupero del personale: " + personaleError.message);
    } else {
      setPersonaleOptions(personaleData || []);
    }

    // Fetch Operatori Network
    const { data: networkData, error: networkError } = await supabase
      .from("operatori_network")
      .select("*")
      .order("cognome", { ascending: true });

    if (networkError) {
      toast.error("Errore nel recupero degli operatori network: " + networkError.message);
    } else {
      setNetworkOperatorsOptions(networkData || []);
    }

    // Fetch Punti Servizio (for historical search filter)
    const { data: puntiServizioData, error: psError } = await supabase
      .from("punti_servizio")
      .select("*")
      .order("nome_punto_servizio", { ascending: true });

    if (psError) {
      toast.error("Errore nel recupero dei punti servizio: " + psError.message);
    } else {
      setPuntoServizioOptions(puntiServizioData || []);
    }
  };

  const fetchCurrentAlarms = async () => {
    setLoading(true);
    // Fetch alarms that are not yet resolved/cancelled
    const { data, error } = await supabase
      .from("allarme_entries")
      .select(`
        *,
        punti_servizio(nome_punto_servizio),
        personale(nome, cognome),
        operatori_network(nome, cognome)
      `)
      .is("service_outcome", null) // Assuming null means not yet resolved
      .order("registration_date", { ascending: false })
      .limit(10); // Limit to recent active alarms

    if (error) {
      toast.error("Errore nel recupero degli allarmi attivi: " + error.message);
    } else {
      setCurrentAlarm(data?.[0] || null); // Display the most recent active alarm
    }
    setLoading(false);
  };

  const fetchHistoricalAlarms = async (filters?: HistoricalSearchFilters) => {
    setLoading(true);
    let query = supabase
      .from("allarme_entries")
      .select(`
        *,
        punti_servizio(nome_punto_servizio),
        personale(nome, cognome),
        operatori_network(nome, cognome)
      `)
      .not("service_outcome", "is", null) // Only resolved/cancelled alarms
      .order("registration_date", { ascending: false });

    if (filters?.from_date) {
      query = query.gte("registration_date", format(filters.from_date, "yyyy-MM-dd"));
    }
    if (filters?.to_date) {
      query = query.lte("registration_date", format(filters.to_date, "yyyy-MM-dd"));
    }
    if (filters?.punto_servizio_id) {
      query = query.eq("punto_servizio_id", filters.punto_servizio_id);
    }

    const { data, error } = await query.limit(50); // Limit historical results

    if (error) {
      toast.error("Errore nel recupero dello storico allarmi: " + error.message);
    } else {
      setHistoricalAlarms(data || []);
    }
    setLoading(false);
  };

  const handleNewAlarmEntry = async (values: AlarmEntryFormSchema) => {
    setIsSubmitting(true);
    const now = new Date().toISOString();
    const alarmData = {
      ...values,
      registration_date: format(values.registration_date, "yyyy-MM-dd"),
      intervention_due_by: values.intervention_due_by ? values.intervention_due_by.toISOString() : null,
      operator_co_id: values.operator_co_id === "" ? null : values.operator_co_id,
      network_operator_id: values.network_operator_id === "" ? null : values.network_operator_id,
      anomalies_found: values.anomalies_found === "" ? null : values.anomalies_found,
      client_request_barcode: values.client_request_barcode === "" ? null : values.client_request_barcode,
      created_at: now,
      updated_at: now,
    };

    const { error } = await supabase
      .from("allarme_entries")
      .insert(alarmData);

    if (error) {
      toast.error("Errore durante la registrazione dell'allarme: " + error.message);
    } else {
      toast.success("Allarme registrato con successo!");
      form.reset(defaultAlarmFormValues); // Use the explicitly typed default values
      fetchCurrentAlarms();
      fetchHistoricalAlarms();
    }
    setIsSubmitting(false);
  };

  const handleUpdateAlarmEntry = async (values: AlarmEntryFormSchema) => {
    if (!currentAlarm) return;

    setIsSubmitting(true);
    const now = new Date().toISOString();
    const alarmData = {
      ...values,
      registration_date: format(values.registration_date, "yyyy-MM-dd"),
      intervention_due_by: values.intervention_due_by ? values.intervention_due_by.toISOString() : null,
      operator_co_id: values.operator_co_id === "" ? null : values.operator_co_id,
      network_operator_id: values.network_operator_id === "" ? null : values.network_operator_id,
      anomalies_found: values.anomalies_found === "" ? null : values.anomalies_found,
      client_request_barcode: values.client_request_barcode === "" ? null : values.client_request_barcode,
      updated_at: now,
    };

    const { error } = await supabase
      .from("allarme_entries")
      .update(alarmData)
      .eq("id", currentAlarm.id);

    if (error) {
      toast.error("Errore durante l'aggiornamento dell'allarme: " + error.message);
    } else {
      toast.success("Allarme aggiornato con successo!");
      fetchCurrentAlarms();
      fetchHistoricalAlarms();
    }
    setIsSubmitting(false);
  };

  const onSearchSubmit = (values: z.infer<typeof historicalSearchSchema>) => {
    const filters: HistoricalSearchFilters = {
      ...values,
      punto_servizio_id: values.punto_servizio_id === "all" ? null : values.punto_servizio_id,
    };
    fetchHistoricalAlarms(filters);
  };

  if (isSessionLoading) {
    return null;
  }

  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full text-center">
          <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Accesso Negato</h2>
          <p className="text-sm text-muted-foreground">Non hai i permessi necessari per visualizzare questa pagina.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-4">Centrale Operativa</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Gestione delle ispezioni e degli allarmi in tempo reale e storico.
        </p>

        {/* Sezione Registrazione Servizi */}
        <div className="p-6 border rounded-lg shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <BellRing className="h-5 w-5 mr-2" /> Registrazione Servizi
          </h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(currentAlarm ? handleUpdateAlarmEntry : handleNewAlarmEntry)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="registration_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data Registrazione</FormLabel>
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
                          selected={field.value || undefined}
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
                name="punto_servizio_id"
                render={({ field }) => (
                  <FormItem className="lg:col-span-2">
                    <FormLabel>Punto Servizio</FormLabel>
                    <FormControl>
                      <SearchablePuntoServizioSelect
                        value={field.value}
                        onChange={field.onChange}
                        disabled={field.disabled}
                        placeholder="Cerca e seleziona un punto servizio"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="intervention_due_by"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Intervento da effettuarsi ENTRO</FormLabel>
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
                              format(field.value, "PPP HH:mm", { locale: it })
                            ) : (
                              <span>Seleziona data e ora</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={(date) => {
                            if (date) {
                              const now = new Date();
                              const newDateWithTime = new Date(date.setHours(now.getHours(), now.getMinutes()));
                              field.onChange(newDateWithTime);
                            } else {
                              field.onChange(null);
                            }
                          }}
                          initialFocus
                          locale={it}
                        />
                        {field.value && (
                          <Input
                            type="time"
                            value={format(field.value, "HH:mm")}
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value.split(':').map(Number);
                              const newDate = new Date(field.value!);
                              newDate.setHours(hours, minutes);
                              field.onChange(newDate);
                            }}
                            className="mt-2"
                          />
                        )}
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="service_type_requested"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipologia Servizio Richiesto</FormLabel>
                    <FormControl>
                      <Input placeholder="Es. Ispezione, Ronda, Intervento Allarme" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="operator_co_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operatore C.O. Security Service</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona operatore" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {personaleOptions.map((op) => (
                          <SelectItem key={op.id} value={op.id}>
                            {op.nome} {op.cognome}
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
                name="request_time_co"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orario Richiesta C.O. Security Service</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="intervention_start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inizio Intervento</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="intervention_end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fine Intervento</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="full_site_access"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Accesso Completo Sito</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="caveau_access"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Accesso Caveau</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="network_operator_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operatore/Network</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona operatore network" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {networkOperatorsOptions.map((op) => (
                          <SelectItem key={op.id} value={op.id}>
                            {op.nome} {op.cognome}
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
                name="gpg_intervention_made"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Intervento Effettuato dalla GPG</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="anomalies_found"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Anomalie Riscontrate</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descrivi eventuali anomalie..." {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="delay_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ritardo (minuti)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="service_outcome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Esito Servizio</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona esito" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Risolto">Risolto</SelectItem>
                        <SelectItem value="Non Risolto">Non Risolto</SelectItem>
                        <SelectItem value="Falso Allarme">Falso Allarme</SelectItem>
                        <SelectItem value="Annullato">Annullato</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="client_request_barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Codice a Barre Richiesta Cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="Codice a barre" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-3 flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    currentAlarm ? "Aggiorna Allarme" : "Registra Allarme"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {/* Sezione Storico Servizi */}
        <div className="p-6 border rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <History className="h-5 w-5 mr-2" /> Storico Servizi
          </h2>
          <Form {...searchForm}>
            <form onSubmit={searchForm.handleSubmit(onSearchSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <FormField
                control={searchForm.control}
                name="from_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Da Data</FormLabel>
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
                          selected={field.value || undefined}
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
                control={searchForm.control}
                name="to_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>A Data</FormLabel>
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
                          selected={field.value || undefined}
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
                control={searchForm.control}
                name="punto_servizio_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Punto Servizio</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Tutti i punti servizio" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Tutti</SelectItem>
                        {puntoServizioOptions.map((ps) => (
                          <SelectItem key={ps.id} value={ps.id}>
                            {ps.nome_punto_servizio}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-3 flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  Cerca Storico
                </Button>
              </div>
            </form>
          </Form>

          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : historicalAlarms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
              <History className="h-10 w-10 mb-3" />
              <p className="text-sm">Nessun allarme storico trovato con i filtri selezionati.</p>
            </div>
          ) : (
            <div className="rounded-md border mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data Reg.</TableHead>
                    <TableHead>Punto Servizio</TableHead>
                    <TableHead>Tipo Servizio</TableHead>
                    <TableHead>Operatore C.O.</TableHead>
                    <TableHead>Inizio Intervento</TableHead>
                    <TableHead>Fine Intervento</TableHead>
                    <TableHead>Esito</TableHead>
                    <TableHead>Ritardo</TableHead>
                    <TableHead>Anomalie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historicalAlarms.map((alarm) => (
                    <TableRow key={alarm.id}>
                      <TableCell>{format(parseISO(alarm.registration_date), "dd/MM/yyyy", { locale: it })}</TableCell>
                      <TableCell>{alarm.punti_servizio?.nome_punto_servizio || "N/A"}</TableCell>
                      <TableCell>{alarm.service_type_requested}</TableCell>
                      <TableCell>{alarm.personale ? `${alarm.personale.nome} ${alarm.personale.cognome}` : "N/A"}</TableCell>
                      <TableCell>{alarm.intervention_start_time || "N/A"}</TableCell>
                      <TableCell>{alarm.intervention_end_time || "N/A"}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          alarm.service_outcome === 'Risolto' ? 'bg-green-100 text-green-800' :
                          alarm.service_outcome === 'Non Risolto' ? 'bg-red-100 text-red-800' :
                          alarm.service_outcome === 'Falso Allarme' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {alarm.service_outcome || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>{alarm.delay_minutes !== null ? `${alarm.delay_minutes} min` : "N/A"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{alarm.anomalies_found || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}