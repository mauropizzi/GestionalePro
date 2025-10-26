"use client";

import React, { useState } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
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
import { RichiestaServizioFormSchema, daysOfWeek, defaultDailySchedules } from "@/lib/richieste-servizio-utils";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DailySchedulesFormField() {
  const form = useFormContext<RichiestaServizioFormSchema>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "daily_schedules",
  });

  const [selectedDayToAdd, setSelectedDayToAdd] = useState<string>("");

  const availableDays = daysOfWeek.filter(
    (day) => !fields.some((field) => field.giorno_settimana === day)
  );

  const handleAddDay = () => {
    if (selectedDayToAdd) {
      const defaultScheduleForDay = defaultDailySchedules.find(
        (s) => s.giorno_settimana === selectedDayToAdd
      );
      append({
        giorno_settimana: selectedDayToAdd,
        h24: defaultScheduleForDay?.h24 || false,
        ora_inizio: defaultScheduleForDay?.ora_inizio || "09:00",
        ora_fine: defaultScheduleForDay?.ora_fine || "18:00",
      });
      setSelectedDayToAdd(""); // Reset select
    }
  };

  return (
    <div className="md:col-span-2 mt-6">
      <h3 className="text-xl font-semibold mb-4">Orari Giornalieri</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Definisci gli orari di servizio per i giorni selezionati.
      </p>

      <div className="flex items-center space-x-2 mb-6">
        <Select value={selectedDayToAdd} onValueChange={setSelectedDayToAdd}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Aggiungi giorno" />
          </SelectTrigger>
          <SelectContent>
            {availableDays.map((day) => (
              <SelectItem key={day} value={day}>
                {day}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" onClick={handleAddDay} disabled={!selectedDayToAdd}>
          <PlusCircle className="h-4 w-4 mr-2" /> Aggiungi Giorno
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-muted-foreground text-center py-4">Nessun orario giornaliero aggiunto. Usa il selettore sopra per aggiungerne uno.</p>
      )}

      {fields.map((field, index) => (
        <div key={field.id} className="flex flex-col space-y-2 mb-4 p-3 border rounded-md">
          <div className="flex items-center justify-between">
            <FormLabel className="text-base">{field.giorno_settimana}</FormLabel>
            <div className="flex items-center space-x-2">
              <FormField
                control={form.control}
                name={`daily_schedules.${index}.h24`}
                render={({ field: h24Field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Switch
                        checked={h24Field.value}
                        onCheckedChange={(checked) => {
                          h24Field.onChange(checked);
                          form.setValue(`daily_schedules.${index}.ora_inizio`, checked ? null : "09:00");
                          form.setValue(`daily_schedules.${index}.ora_fine`, checked ? null : "18:00");
                        }}
                        id={`h24-${field.giorno_settimana}-${index}`}
                      />
                    </FormControl>
                    <Label htmlFor={`h24-${field.giorno_settimana}-${index}`}>H24</Label>
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => remove(index)}
                title="Rimuovi giorno"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {!field.h24 && (
            <div className="grid grid-cols-2 gap-4 mt-2">
              <FormField
                control={form.control}
                name={`daily_schedules.${index}.ora_inizio`}
                render={({ field: oraInizioField }) => (
                  <FormItem>
                    <FormLabel>Ora Inizio</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        value={oraInizioField.value ?? ""}
                        onChange={oraInizioField.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`daily_schedules.${index}.ora_fine`}
                render={({ field: oraFineField }) => (
                  <FormItem>
                    <FormLabel>Ora Fine</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        value={oraFineField.value ?? ""}
                        onChange={oraFineField.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
          <FormMessage />
        </div>
      ))}
      {/* Correzione: Utilizzo di FormField per visualizzare gli errori a livello di array */}
      <FormField
        control={form.control}
        name="daily_schedules"
        render={({ fieldState }) => (
          <FormItem>
            <FormMessage>{fieldState.error?.message}</FormMessage>
          </FormItem>
        )}
      />
    </div>
  );
}