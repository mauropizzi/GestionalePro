"use client";

import React, { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { format } from "date-fns";
import { MapPin } from "lucide-react";
import { AlarmEntryFormSchema } from "@/lib/centrale-operativa-schemas";
import { useInterventionRecorder } from "@/hooks/use-intervention-recorder";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SearchablePersonaleSelect } from "@/components/anagrafiche/searchable-personale-select";

interface InterventionDetailsProps {
  form: UseFormReturn<AlarmEntryFormSchema>;
}

function toHHmm(value: string | null | undefined) {
  if (!value) return "";
  return value.trim().slice(0, 5);
}

export const InterventionDetails: React.FC<InterventionDetailsProps> = ({ form }) => {
  const { recordStart, recordEnd } = useInterventionRecorder(form);

  // Mantieni coerente il booleano DB con la selezione della Pattuglia
  const gpgPersonaleId = form.watch("gpg_personale_id");
  useEffect(() => {
    form.setValue("gpg_intervention_made", Boolean(gpgPersonaleId), {
      shouldDirty: true,
      shouldValidate: false,
    });
  }, [gpgPersonaleId, form]);

  return (
    <>
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
                onClick={recordStart}
              >
                <MapPin className="h-3 w-3 mr-1" /> Registra
              </Button>
            </FormLabel>
            <FormControl>
              <Input
                type="time"
                value={toHHmm(field.value)}
                onChange={(e) => field.onChange(e.target.value)}
              />
            </FormControl>
            {form.watch("intervention_start_lat") && (
              <p className="text-[10px] text-muted-foreground mt-1">
                Pos: {form.watch("intervention_start_lat")?.toFixed(4)},{" "}
                {form.watch("intervention_start_long")?.toFixed(4)}
                {form.watch("intervention_start_full_timestamp") &&
                  ` - ${format(
                    form.watch("intervention_start_full_timestamp")!,
                    "dd/MM HH:mm"
                  )}`}
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
                onClick={recordEnd}
              >
                <MapPin className="h-3 w-3 mr-1" /> Registra
              </Button>
            </FormLabel>
            <FormControl>
              <Input
                type="time"
                value={toHHmm(field.value)}
                onChange={(e) => field.onChange(e.target.value)}
              />
            </FormControl>
            {form.watch("intervention_end_lat") && (
              <p className="text-[10px] text-muted-foreground mt-1">
                Pos: {form.watch("intervention_end_lat")?.toFixed(4)},{" "}
                {form.watch("intervention_end_long")?.toFixed(4)}
                {form.watch("intervention_end_full_timestamp") &&
                  ` - ${format(
                    form.watch("intervention_end_full_timestamp")!,
                    "dd/MM HH:mm"
                  )}`
                }
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
        name="gpg_personale_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Intervento effettuato dalla GPG (Pattuglia)</FormLabel>
            <FormControl>
              <SearchablePersonaleSelect
                value={field.value}
                onChange={field.onChange}
                placeholder="Cerca Pattuglia..."
                ruolo="Pattuglia"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};

export default InterventionDetails;