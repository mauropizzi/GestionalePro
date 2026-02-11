"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { AlarmEntryFormSchema } from "@/lib/centrale-operativa-schemas";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { SearchablePuntoServizioSelect } from "@/components/richieste-servizio/searchable-punto-servizio-select";

interface RegistrationInfoProps {
  form: UseFormReturn<AlarmEntryFormSchema>;
}

export const RegistrationInfo: React.FC<RegistrationInfoProps> = ({ form }) => {
  const handlePuntoServizioChange = async (puntoServizioId: string | null) => {
    form.setValue("punto_servizio_id", puntoServizioId);

    if (!puntoServizioId) {
      form.setValue("intervention_due_by", null);
      return;
    }

    const { data, error } = await supabase
      .from("punti_servizio")
      .select("tempo_intervento")
      .eq("id", puntoServizioId)
      .single();

    if (error) {
      toast.error("Errore nel recupero del tempo di intervento");
      form.setValue("intervention_due_by", null);
      return;
    }

    if (data?.tempo_intervento !== undefined && data?.tempo_intervento !== null) {
      const minutes = Number(data.tempo_intervento);
      form.setValue("intervention_due_by", !isNaN(minutes) && minutes >= 0 ? minutes : null);
    } else {
      form.setValue("intervention_due_by", null);
    }
  };

  return (
    <>
      <FormField
        control={form.control}
        name="registration_date"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel className="flex items-center justify-between">
              <span>Data e Ora di Registrazione</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => {
                  const now = new Date();
                  field.onChange(now);
                  toast.success("Data e ora di registrazione impostate.");
                }}
              >
                Registra
              </Button>
            </FormLabel>
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
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
              <FormControl>
                <Input
                  type="time"
                  value={field.value ? format(field.value, "HH:mm") : ""}
                  onChange={(e) => {
                    const currentDate = field.value || new Date();
                    const [hours, minutes] = e.target.value.split(":").map(Number);
                    const updated = new Date(currentDate);
                    if (!isNaN(hours) && !isNaN(minutes)) {
                      updated.setHours(hours, minutes, 0, 0);
                      field.onChange(updated);
                    }
                  }}
                  placeholder="HH:mm"
                />
              </FormControl>
            </div>
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
        name="service_type_requested"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Tipo servizio richiesto</FormLabel>
            <FormControl>
              <Input
                placeholder="Es. Ispezione, Intervento, Pattuglia..."
                {...field}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};

export default RegistrationInfo;