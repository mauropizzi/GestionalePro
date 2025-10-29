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
import { Textarea } from "@/components/ui/textarea";
import { RichiestaServizioFormSchema } from "@/lib/richieste-servizio-utils";

interface NotesSectionProps {
  form: UseFormReturn<RichiestaServizioFormSchema>;
}

export function NotesSection({ form }: NotesSectionProps) {
  return (
    <FormField
      control={form.control}
      name="note"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Note</FormLabel>
          <FormControl>
            <Textarea placeholder="Aggiungi note aggiuntive" {...field} value={field.value ?? ''} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}