"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RichiestaServizioFormSchema, daysOfWeek, dailyScheduleSchema } from "@/lib/richieste-servizio-utils";
import { z } from "zod"; // Import z

interface DailySchedulesFormFieldProps {
  value: z.infer<typeof dailyScheduleSchema>[];
  onChange: (value: z.infer<typeof dailyScheduleSchema>[]) => void;
}

export function DailySchedulesFormField({ value, onChange }: DailySchedulesFormFieldProps) {
  const form = useFormContext<RichiestaServizioFormSchema>(); // Keep useFormContext for other form interactions if needed

  return (
    <div className="md:col-span-2 mt-2">
      <h3 className="text-base font-semibold mb-1">Orari Giornalieri</h3>
      <p className="text-xs text-muted-foreground mb-1">
        Definisci gli orari di servizio per ogni giorno della settimana e per i giorni festivi.
      </p>
      {daysOfWeek.map((day, index) => (
        <FormField
          key={day}
          control={form.control}
          name={`daily_schedules.${index}`}
          render={({ field }) => (
            <FormItem className="flex flex-col space-y-0.5 mb-1 p-1 border rounded-md">
              <div className="flex items-center justify-between">
                <FormLabel className="text-sm">{day}</FormLabel>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <Switch
                      checked={field.value.attivo}
                      onCheckedChange={(checked) => {
                        field.onChange({
                          ...field.value,
                          attivo: checked,
                          h24: checked ? field.value.h24 : false, // Reset h24 if not active
                          ora_inizio: checked ? field.value.ora_inizio : null, // Reset times if not active
                          ora_fine: checked ? field.value.ora_fine : null,     // Reset times if not active
                        });
                      }}
                      id={`attivo-${day}`}
                    />
                    <Label htmlFor={`attivo-${day}`} className="text-xs">Attivo</Label>
                  </div>
                  {field.value.attivo && (
                    <div className="flex items-center space-x-1">
                      <Switch
                        checked={field.value.h24}
                        onCheckedChange={(checked) => {
                          field.onChange({
                            ...field.value,
                            h24: checked,
                            ora_inizio: checked ? null : "09:00",
                            ora_fine: checked ? null : "18:00",
                          });
                        }}
                        id={`h24-${day}`}
                      />
                      <Label htmlFor={`h24-${day}`} className="text-xs">H24</Label>
                    </div>
                  )}
                </div>
              </div>
              {field.value.attivo && !field.value.h24 && (
                <div className="grid grid-cols-2 gap-1 mt-0.5">
                  <FormItem>
                    <FormLabel className="text-xs">Ora Inizio</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        value={field.value.ora_inizio ?? ""}
                        onChange={(e) => field.onChange({ ...field.value, ora_inizio: e.target.value })}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                  <FormItem>
                    <FormLabel className="text-xs">Ora Fine</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        value={field.value.ora_fine ?? ""}
                        onChange={(e) => field.onChange({ ...field.value, ora_fine: e.target.value })}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
    </div>
  );
}