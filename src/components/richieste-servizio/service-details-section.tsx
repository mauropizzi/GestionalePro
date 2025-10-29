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
import { Client, PuntoServizio, Fornitore } from "@/types/richieste-servizio";
import { RichiestaServizioFormSchema, SERVICE_TYPES } from "@/lib/richieste-servizio-utils";

interface ServiceDetailsSectionProps {
  form: UseFormReturn<RichiestaServizioFormSchema>;
  clients: Client[];
  puntiServizio: PuntoServizio[];
  fornitori: Fornitore[];
  selectedServiceType: RichiestaServizioFormSchema["tipo_servizio"];
}

export function ServiceDetailsSection({
  form,
  clients,
  puntiServizio,
  fornitori,
  selectedServiceType,
}: ServiceDetailsSectionProps) {
  return (
    <>
      {/* Client ID */}
      <FormField
        control={form.control}
        name="client_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cliente</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona un cliente" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.ragione_sociale}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Tipo Servizio */}
      <FormField
        control={form.control}
        name="tipo_servizio"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo di Servizio</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona un tipo di servizio" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {SERVICE_TYPES.map((type) => (
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

      {/* Punto Servizio ID (conditionally rendered) */}
      {(selectedServiceType === "PIANTONAMENTO_ARMATO" ||
        selectedServiceType === "SERVIZIO_FIDUCIARIO" ||
        selectedServiceType === "ISPEZIONI" ||
        selectedServiceType === "APERTURA_CHIUSURA" ||
        selectedServiceType === "BONIFICA") && (
        <FormField
          control={form.control}
          name="punto_servizio_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Punto Servizio</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona un punto servizio" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {puntiServizio.map((punto) => (
                    <SelectItem key={punto.id} value={punto.id}>
                      {punto.nome_punto_servizio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      )}

      {/* Fornitore ID (conditionally rendered) */}
      {(selectedServiceType === "PIANTONAMENTO_ARMATO" ||
        selectedServiceType === "SERVIZIO_FIDUCIARIO" ||
        selectedServiceType === "ISPEZIONI" ||
        selectedServiceType === "APERTURA_CHIUSURA" ||
        selectedServiceType === "BONIFICA") && (
        <FormField
          control={form.control}
          name="fornitore_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fornitore</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona un fornitore" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {fornitori.map((fornitore) => (
                    <SelectItem key={fornitore.id} value={fornitore.id}>
                      {fornitore.ragione_sociale}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      )}
    </>
  );
}