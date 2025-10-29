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
  INSPECTION_TYPES,
  APERTURA_CHIUSURA_TYPES,
  BONIFICA_TYPES,
  IspezioniFormSchema,
  AperturaChiusuraFormSchema,
  BonificaFormSchema,
} from "@/lib/richieste-servizio-utils";

interface ServiceSpecificFieldsProps {
  form: UseFormReturn<RichiestaServizioFormSchema>;
  selectedServiceType: RichiestaServizioFormSchema["tipo_servizio"];
}

export function ServiceSpecificFields({ form, selectedServiceType }: ServiceSpecificFieldsProps) {
  const shouldRender =
    selectedServiceType === "PIANTONAMENTO_ARMATO" ||
    selectedServiceType === "SERVIZIO_FIDUCIARIO" ||
    selectedServiceType === "ISPEZIONI" ||
    selectedServiceType === "APERTURA_CHIUSURA" ||
    selectedServiceType === "BONIFICA";

  if (!shouldRender) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="numero_agenti"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Numero Agenti</FormLabel>
            <FormControl>
              <Input
                type="number"
                {...field}
                value={field.value ?? ""}
                onChange={e => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

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
                    {...field}
                    value={field.value ?? ""}
                    onChange={e => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
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
        </>
      )}

      {selectedServiceType === "APERTURA_CHIUSURA" && (
        <FormField
          control={form.control}
          name="tipo_apertura_chiusura"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo Attività</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona tipo attività" />
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
              <FormLabel>Tipo Bonifica</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona tipo bonifica" />
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
    </div>
  );
}