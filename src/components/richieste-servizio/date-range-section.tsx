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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RichiestaServizioFormSchema } from "@/lib/richieste-servizio-utils";

interface DateRangeSectionProps {
  form: UseFormReturn<RichiestaServizioFormSchema>;
  selectedServiceType: RichiestaServizioFormSchema["tipo_servizio"];
}

export function DateRangeSection({ form, selectedServiceType }: DateRangeSectionProps) {
  // Conditionally render based on service type
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
    </>
  );
}