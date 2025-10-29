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
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  RichiestaServizioFormSchema,
  APERTURA_CHIUSURA_TYPES,
} from "@/lib/richieste-servizio-utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateAndAgentSectionProps {
  form: UseFormReturn<RichiestaServizioFormSchema>;
  selectedServiceType: RichiestaServizioFormSchema["tipo_servizio"];
}

export function DateAndAgentSection({ form, selectedServiceType }: DateAndAgentSectionProps) {
  const isServiceTypeWithDatesAndAgents =
    selectedServiceType === "PIANTONAMENTO_ARMATO" ||
    selectedServiceType === "SERVIZIO_FIDUCIARIO" ||
    selectedServiceType === "ISPEZIONI" ||
    selectedServiceType === "APERTURA_CHIUSURA" ||
    selectedServiceType === "BONIFICA";

  if (!isServiceTypeWithDatesAndAgents) {
    return null;
  }

  return (
    <>
      {/* Data Inizio Servizio */}
      <FormField
        control={form.control}
        name="data_inizio_servizio"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel className="mb-2">Data Inizio Servizio</FormLabel>
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

      {/* Data Fine Servizio */}
      <FormField
        control={form.control}
        name="data_fine_servizio"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel className="mb-2">Data Fine Servizio</FormLabel>
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

      {/* Numero Agenti and Cadenza Ore / Tipo Apertura/Chiusura (conditionally rendered and grouped) */}
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
      </div>
    </>
  );
}