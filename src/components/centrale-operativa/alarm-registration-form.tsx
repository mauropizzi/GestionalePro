import React, { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { CalendarIcon } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { AlarmEntryFormSchema } from "@/lib/centrale-operativa-schemas";
import { Personale, NetworkOperator } from "@/types/anagrafiche";
import { SearchablePuntoServizioSelect } from "@/components/richieste-servizio/searchable-punto-servizio-select";
import { Loader2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AlarmRegistrationFormProps {
  form: UseFormReturn<AlarmEntryFormSchema>;
  isSubmitting: boolean;
  personaleOptions: Personale[];
  networkOperatorsOptions: NetworkOperator[];
  onSubmit: (data: AlarmEntryFormSchema) => void;
  submitButtonText: string;
}

export function AlarmRegistrationForm({
  form,
  isSubmitting,
  personaleOptions,
  networkOperatorsOptions,
  onSubmit,
  submitButtonText,
}: AlarmRegistrationFormProps) {
  // Handle punto servizio selection to update intervention_due_by (in minuti)
  const handlePuntoServizioChange = async (puntoServizioId: string | null) => {
    form.setValue("punto_servizio_id", puntoServizioId);

    if (puntoServizioId) {
      try {
        const { data, error } = await supabase
          .from("punti_servizio")
          .select("tempo_intervento")
          .eq("id", puntoServizioId)
          .single();

        if (!error && data?.tempo_intervento !== undefined && data?.tempo_intervento !== null) {
          // tempo_intervento è espresso in minuti: impostalo direttamente
          const minutes = Number(data.tempo_intervento);
          if (!isNaN(minutes) && minutes >= 0) {
            form.setValue("intervention_due_by", minutes);
          } else {
            // se il valore non è numerico, pulisci il campo
            form.setValue("intervention_due_by", null);
          }
        } else {
          form.setValue("intervention_due_by", null);
        }
      } catch (err) {
        console.error("Errore nel recupero del tempo di intervento:", err);
        form.setValue("intervention_due_by", null);
      }
    } else {
      // Clear the intervention_due_by when no punto servizio is selected
      form.setValue("intervention_due_by", null);
    }
  };

  const recordInterventionTime = (type: 'start' | 'end') => {
    const now = new Date();
    const timeString = format(now, "HH:mm");
    
    if (type === 'start') {
      form.setValue("intervention_start_time", timeString);
      form.setValue("intervention_start_full_timestamp", now);
    } else {
      form.setValue("intervention_end_time", timeString);
      form.setValue("intervention_end_full_timestamp", now);
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (type === 'start') {
            form.setValue("intervention_start_lat", latitude);
            form.setValue("intervention_start_long", longitude);
          } else {
            form.setValue("intervention_end_lat", latitude);
            form.setValue("intervention_end_long", longitude);
          }
          toast.success(`Posizione acquisita per ${type === 'start' ? 'inizio' : 'fine'} intervento.`);
        },
        (error) => {
          console.error("Errore geolocalizzazione:", error);
          toast.error("Impossibile acquisire la posizione. Assicurati che i permessi siano attivi.");
        }
      );
    } else {
      toast.error("Geolocalizzazione non supportata dal browser.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  onChange={handlePuntoServizioChange}
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
              <FormLabel>Intervento da effettuarsi ENTRO (minuti)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  placeholder="Minuti"
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(e.target.value === "" ? null : Number(e.target.value))
                  }
                />
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
              <FormLabel className="flex justify-between items-center">
                Inizio Intervento
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs" 
                  onClick={() => recordInterventionTime('start')}
                >
                  <MapPin className="h-3 w-3 mr-1" /> Registra
                </Button>
              </FormLabel>
              <FormControl>
                <Input type="time" {...field} value={field.value ?? ""} />
              </FormControl>
              {form.watch("intervention_start_lat") && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Pos: {form.watch("intervention_start_lat")?.toFixed(4)}, {form.watch("intervention_start_long")?.toFixed(4)} 
                  {form.watch("intervention_start_full_timestamp") && ` - ${format(form.watch("intervention_start_full_timestamp")!, "dd/MM HH:mm")}`}
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="intervention_end_time"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex justify-between items-center">
                Fine Intervento
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs" 
                  onClick={() => recordInterventionTime('end')}
                >
                  <MapPin className="h-3 w-3 mr-1" /> Registra
                </Button>
              </FormLabel>
              <FormControl>
                <Input type="time" {...field} value={field.value ?? ""} />
              </FormControl>
              {form.watch("intervention_end_lat") && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Pos: {form.watch("intervention_end_lat")?.toFixed(4)}, {form.watch("intervention_end_long")?.toFixed(4)}
                  {form.watch("intervention_end_full_timestamp") && ` - ${format(form.watch("intervention_end_full_timestamp")!, "dd/MM HH:mm")}`}
                </p>
              )}
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
              submitButtonText
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}