"use client";

import React, { useEffect, useState } from "react";
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
import { RichiestaServizioFormSchema, daysOfWeek, dailyScheduleSchema, bonificaDailyScheduleSchema } from "@/lib/richieste-servizio-utils";
import { z } from "zod";
import { cn } from "@/lib/utils";

interface DailySchedulesFormFieldProps {
  value: (z.infer<typeof dailyScheduleSchema> | z.infer<typeof bonificaDailyScheduleSchema>)[];
  onChange: (value: (z.infer<typeof dailyScheduleSchema> | z.infer<typeof bonificaDailyScheduleSchema>)[]) => void;
  isBonificaService?: boolean; // New prop
}

export function DailySchedulesFormField({ value, onChange, isBonificaService = false }: DailySchedulesFormFieldProps) {
  const { control, getValues, setValue } = useFormContext<RichiestaServizioFormSchema>();
  const schedules = getValues("daily_schedules");

  const [groupWeekdays, setGroupWeekdays] = useState(false);

  // Effect to initialize groupWeekdays state based on current schedules
  useEffect(() => {
    if (schedules && schedules.length >= 5) {
      const firstWeekday = schedules[0]; // Lunedì
      const allWeekdaysMatch = schedules.slice(1, 5).every( // Martedì to Venerdì
        (daySchedule) =>
          daySchedule.h24 === firstWeekday.h24 &&
          daySchedule.ora_inizio === firstWeekday.ora_inizio &&
          daySchedule.ora_fine === firstWeekday.ora_fine &&
          daySchedule.attivo === firstWeekday.attivo
      );
      setGroupWeekdays(allWeekdaysMatch);
    }
  }, [schedules]); // Removed isBonificaService from dependencies as it no longer forces grouping

  // Effect to propagate changes from Lunedì to other grouped weekdays
  useEffect(() => {
    if (groupWeekdays && schedules && schedules.length >= 5) {
      const lunediSchedule = schedules[0];
      let changed = false;
      const newSchedules = [...schedules];

      for (let i = 1; i < 5; i++) { // Martedì to Venerdì
        const currentDaySchedule = newSchedules[i];
        if (
          currentDaySchedule.h24 !== lunediSchedule.h24 ||
          currentDaySchedule.ora_inizio !== lunediSchedule.ora_inizio ||
          currentDaySchedule.ora_fine !== lunediSchedule.ora_fine ||
          currentDaySchedule.attivo !== lunediSchedule.attivo
        ) {
          newSchedules[i] = { ...lunediSchedule, giorno_settimana: daysOfWeek[i] };
          changed = true;
        }
      }
      if (changed) {
        setValue("daily_schedules", newSchedules, { shouldDirty: true, shouldValidate: true });
      }
    }
  }, [groupWeekdays, schedules[0]?.h24, schedules[0]?.ora_inizio, schedules[0]?.ora_fine, schedules[0]?.attivo, setValue, schedules]);

  // Removed the useEffect that propagated changes for isBonificaService to all others

  const handleGroupWeekdaysToggle = (checked: boolean) => {
    setGroupWeekdays(checked);
    if (checked && schedules && schedules.length >= 5) {
      const lunediSchedule = schedules[0];
      const newSchedules = [...schedules];
      for (let i = 1; i < 5; i++) { // Martedì to Venerdì
        newSchedules[i] = { ...lunediSchedule, giorno_settimana: daysOfWeek[i] };
      }
      setValue("daily_schedules", newSchedules, { shouldDirty: true, shouldValidate: true });
    }
  };

  return (
    <div className="md:col-span-2 mt-2">
      <h3 className="text-base font-semibold mb-1">Orari Giornalieri</h3>
      <p className="text-xs text-muted-foreground mb-1">
        Definisci gli orari di servizio per ogni giorno della settimana e per i giorni festivi.
      </p>

      <div className="flex items-center space-x-2 mb-4 p-2 border rounded-md bg-accent/20">
        <Switch
          id="group-weekdays"
          checked={groupWeekdays}
          onCheckedChange={handleGroupWeekdaysToggle}
        />
        <Label htmlFor="group-weekdays" className="text-sm font-medium">Raggruppa Giorni Feriali (Lunedì-Venerdì)</Label>
      </div>

      {/* Render individual rows for all days, with conditional Ora Fine */}
      {daysOfWeek.map((day, index) => (
        <FormField
          key={day}
          control={control}
          name={`daily_schedules.${index}`}
          render={({ field }) => (
            <FormItem className={cn(
              "flex flex-col space-y-0.5 mb-1 p-1 border rounded-md"
            )}>
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
                          h24: checked ? field.value.h24 : false,
                          ora_inizio: checked ? field.value.ora_inizio : null,
                          ora_fine: (checked && !isBonificaService) ? field.value.ora_fine : null, // Set ora_fine to null if not active or if Bonifica
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
                            ora_fine: checked ? null : (isBonificaService ? null : "18:00"), // Set ora_fine to null if Bonifica
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
                <div className={cn("grid gap-1 mt-0.5", isBonificaService ? "grid-cols-1" : "grid-cols-2")}>
                  <FormItem>
                    <FormLabel className="text-xs">Ora Inizio</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        value={field.value.ora_inizio ?? ""}
                        onChange={(e) => {
                          field.onChange({ ...field.value, ora_inizio: e.target.value });
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                  {!isBonificaService && ( // Hide Ora Fine for Bonifica
                    <FormItem>
                      <FormLabel className="text-xs">Ora Fine</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          value={field.value.ora_fine ?? ""}
                          onChange={(e) => {
                            field.onChange({ ...field.value, ora_fine: e.target.value });
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
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