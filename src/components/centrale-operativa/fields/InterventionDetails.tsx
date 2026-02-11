"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { format } from "date-fns";
import { MapPin } from "lucide-react";
import { AlarmEntryFormSchema } from "@/lib/centrale-operativa-schemas";
import { useInterventionRecorder } from "@/hooks/use-intervention-recorder";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface InterventionDetailsProps {
  form: UseFormReturn<AlarmEntryFormSchema>;
}

export const InterventionDetails: React.FC<InterventionDetailsProps> = ({ form }) => {
  const { recordStart, recordEnd } = useInterventionRecorder(form);

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
              <Input type="time" {...field} value={field.value ?? ""} />
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
              <Input type="time" {...field} value={field.value ?? ""} />
            </FormControl>
            {form.watch("intervention_end_lat") && (
              <p className="text-[10px] text-muted-foreground mt-1">
                Pos: {form.watch("intervention_end_lat")?.toFixed(4)},{" "}
                {form.watch("intervention_end_long")?.toFixed(4)}
                {form.watch("intervention_end_full_timestamp") &&
                  ` - ${format(
                    form.watch("intervention_end_full_timestamp")!,
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
    </>
  );
};

export default InterventionDetails;