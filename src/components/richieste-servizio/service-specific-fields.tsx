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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RichiestaServizioFormSchema,
  ServiceType,
  INSPECTION_TYPES,
  APERTURA_CHIUSURA_TYPES,
  BONIFICA_TYPES,
  GESTIONE_CHIAVI_TYPES, // New import
} from "@/lib/richieste-servizio-utils";

interface ServiceSpecificFieldsProps {
  form: UseFormReturn<RichiestaServizioFormSchema>;
  selectedServiceType: ServiceType;
}

export function ServiceSpecificFields({ form, selectedServiceType }: ServiceSpecificFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {selectedServiceType === "ISPEZIONI" && (
        <>
          <FormField
            control={form.control}
            name="cadenza_ore"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cadenza (ore)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.5"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tipo_ispezione"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo di Ispezione</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona il tipo di ispezione" />
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
        </>
      )}

      {selectedServiceType === "APERTURA_CHIUSURA" && (
        <FormField
          control={form.control}
          name="tipo_apertura_chiusura"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo di Attività</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona il tipo di attività" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {APERTURA_CHIUSURA_TYPES.map((type) => (
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
      )}

      {selectedServiceType === "BONIFICA" && (
        <FormField
          control={form.control}
          name="tipo_bonifica"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo di Bonifica</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona il tipo di bonifica" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {BONIFICA_TYPES.map((type) => (
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
      )}

      {selectedServiceType === "GESTIONE_CHIAVI" && ( // New conditional rendering for GESTIONE_CHIAVI
        <FormField
          control={form.control}
          name="tipo_gestione_chiavi"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo di Attività Chiavi</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona il tipo di attività chiavi" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {GESTIONE_CHIAVI_TYPES.map((type) => (
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
      )}
    </div>
  );
}