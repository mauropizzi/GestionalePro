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
import { RichiestaServizioFormSchema, daysOfWeek, dailyScheduleSchema } from "@/lib/richieste-servizio-utils";
import { z } from "zod";
import { cn } from "@/lib/utils";

interface DailySchedulesFormFieldProps {
  value: z.infer<typeof dailyScheduleSchema>[];
  onChange: (value: z.infer<typeof dailyScheduleSchema>[]) => void;
  isBonificaService?: boolean; // New prop
}

export function DailySchedulesFormField({ value, onChange, isBonificaService = false }: DailySchedulesFormFieldProps) {
  const { control, getValues, setValue } = useFormContext<RichiestaServizioFormSchema>();
  const schedules = getValues("daily_schedules");

  const [groupWeekdays, setGroupWeekdays] = useState(false);

  // Effect to initialize groupWeekdays state based on current schedules
  useEffect(() => {
    if (isBonificaService) {
      // For Bonifica, we always treat it as a single schedule, so hide the toggle
      setGroupWeekdays(false); // Ensure it's off
      return;
    }
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
  }, [schedules, isBonificaService]);

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

  // New effect for Bonifica service: propagate changes from the first schedule to all others
  useEffect(() => {
    if (isBonificaService && schedules && schedules.length > 0) {
      const firstSchedule = schedules[0];
      let changed = false;
      const newSchedules = [...schedules];

      for (let i = 1; i < daysOfWeek.length; i++) {
        const currentDaySchedule = newSchedules[i];
        if (
          currentDaySchedule.h24 !== firstSchedule.h24 ||
          currentDaySchedule.ora_inizio !== firstSchedule.ora_inizio ||
          currentDaySchedule.ora_fine !== firstSchedule.ora_fine ||
          currentDaySchedule.attivo !== firstSchedule.attivo
        ) {
          newSchedules[i] = { ...firstSchedule, giorno_settimana: daysOfWeek[i] };
          changed = true;
        }
      }
      if (changed) {
        setValue("daily_schedules", newSchedules, { shouldDirty: true, shouldValidate: true });
      }
    }
  }, [isBonificaService, schedules[0]?.h24, schedules[0]?.ora_inizio, schedules[0]?.ora_fine, schedules[0]?.attivo, setValue, schedules]);


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

      {!isBonificaService && ( // Hide for Bonifica service
        <div className="flex items-center space-x-2 mb-4 p-2 border rounded-md bg-accent/20">
          <Switch
            id="group-weekdays"
            checked={groupWeekdays}
            onCheckedChange={handleGroupWeekdaysToggle}
          />
          <Label htmlFor="group-weekdays" className="text-sm font-medium">Raggruppa Giorni Feriali (Lunedì-Venerdì)</Label>
        </div>
      )}

      {isBonificaService ? (
        // Render single input for Bonifica service
        <FormField
          control={control}
          name={`daily_schedules.0`} // Bind to the first schedule, which will propagate
          render={({ field }) => (
            <FormItem className={cn(
              "flex flex-col space-y-0.5 mb-1 p-1 border rounded-md bg-blue-50/20"
            )}>
              <div className="flex items-center justify-between">
                <FormLabel className="text-sm">Orario Unico (Tutti i Giorni)</FormLabel>
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
                          ora_fine: checked ? field.value.ora_fine : null,
                        });
                      }}
                      id={`attivo-bonifica`}
                    />
                    <Label htmlFor={`attivo-bonifica`} className="text-xs">Attivo</Label>
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
                        id={`h24-bonifica`}
                      />
                      <Label htmlFor={`h24-bonifica`} className="text-xs">H24</Label>
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
                        onChange={(e) => {
                          field.onChange({ ...field.value, ora_inizio: e.target.value });
                        }}
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
                        onChange={(e) => {
                          field.onChange({ ...field.value, ora_fine: e.target.value });
                        }}
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
      ) : (
        <>
          {groupWeekdays ? (
            // Render single grouped row for weekdays
            <FormField
              control={control}
              name={`daily_schedules.0`} // Control Lunedì's schedule
              render={({ field }) => (
                <FormItem className={cn(
                  "flex flex-col space-y-0.5 mb-1 p-1 border rounded-md"
                )}>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-sm">Giorni Feriali</FormLabel> {/* New label */}
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
                              ora_fine: checked ? field.value.ora_fine : null,
                            });
                          }}
                          id={`attivo-feriali`}
                        />
                        <Label htmlFor={`attivo-feriali`} className="text-xs">Attivo</Label>
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
                            id={`h24-feriali`}
                          />
                          <Label htmlFor={`h24-feriali`} className="text-xs">H24</Label>
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
                            onChange={(e) => {
                              field.onChange({ ...field.value, ora_inizio: e.target.value });
                            }}
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
                            onChange={(e) => {
                              field.onChange({ ...field.value, ora_fine: e.target.value });
                            }}
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
          ) : (
            // Render individual rows for all weekdays
            daysOfWeek.slice(0, 5).map((day, index) => ( // Lunedì to Venerdì
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
                                ora_fine: checked ? field.value.ora_fine : null,
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
                              onChange={(e) => {
                                field.onChange({ ...field.value, ora_inizio: e.target.value });
                              }}
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
                              onChange={(e) => {
                                field.onChange({ ...field.value, ora_fine: e.target.value });
                              }}
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
            ))
          )}

          {/* Always render Sabato, Domenica, Festivo individually */}
          {daysOfWeek.slice(5).map((day, index) => ( // Sabato, Domenica, Festivo
            <FormField
              key={day}
              control={control}
              name={`daily_schedules.${index + 5}`} // Adjust index for these days
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
                              ora_fine: checked ? field.value.ora_fine : null,
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
                            onChange={(e) => {
                              field.onChange({ ...field.value, ora_inizio: e.target.value });
                            }}
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
                            onChange={(e) => {
                              field.onChange({ ...field.value, ora_fine: e.target.value });
                            }}
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
        </>
      )}
    </div>
  );
}