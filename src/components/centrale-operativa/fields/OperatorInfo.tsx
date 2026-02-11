"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { AlarmEntryFormSchema } from "@/lib/centrale-operativa-schemas";
import { Personale, NetworkOperator } from "@/types/anagrafiche";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface OperatorInfoProps {
  form: UseFormReturn<AlarmEntryFormSchema>;
  personaleOptions: Personale[];
  networkOperatorsOptions: NetworkOperator[];
}

export const OperatorInfo: React.FC<OperatorInfoProps> = ({
  form,
  personaleOptions,
  networkOperatorsOptions,
}) => {
  return (
    <>
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
    </>
  );
};

export default OperatorInfo;