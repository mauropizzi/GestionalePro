"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { AlarmEntryFormSchema } from "@/lib/centrale-operativa-schemas";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface OutcomeDetailsProps {
  form: UseFormReturn<AlarmEntryFormSchema>;
}

export const OutcomeDetails: React.FC<OutcomeDetailsProps> = ({ form }) => {
  return (
    <>
      <FormField
        control={form.control}
        name="anomalies_found"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Anomalie Riscontrate</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Descrivi eventuali anomalie..."
                {...field}
                value={field.value ?? ""}
              />
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
              <Input
                type="number"
                placeholder="0"
                {...field}
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
    </>
  );
};

export default OutcomeDetails;