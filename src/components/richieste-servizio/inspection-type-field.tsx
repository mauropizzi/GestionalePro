"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import {
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
import { RichiestaServizioFormSchema, INSPECTION_TYPES } from "@/lib/richieste-servizio-utils";

interface InspectionTypeFieldProps {
  form: UseFormReturn<RichiestaServizioFormSchema>;
  selectedServiceType: RichiestaServizioFormSchema["tipo_servizio"];
}

export function InspectionTypeField({ form, selectedServiceType }: InspectionTypeFieldProps) {
  if (selectedServiceType !== "ISPEZIONI") {
    return null;
  }

  return (
    <FormField
      control={form.control}
      name="tipo_ispezione"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Tipo di Ispezione</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona un tipo di ispezione" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {INSPECTION_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}