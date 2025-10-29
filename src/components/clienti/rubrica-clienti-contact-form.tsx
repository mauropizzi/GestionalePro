"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
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
import { Loader2 } from "lucide-react";
import { RUBRICA_CLIENTI_RECAPITO_TYPES } from "@/lib/constants";

const rubricaClientiContactFormSchema = z.object({
  tipo_recapito: z.enum(RUBRICA_CLIENTI_RECAPITO_TYPES as [string, ...string[]], {
    required_error: "Il tipo di recapito è richiesto.",
  }),
  nome_persona: z.string().nullable(),
  telefono_fisso: z.string().nullable(),
  telefono_cellulare: z.string().nullable(),
  email_recapito: z.string().email("Inserisci un indirizzo email valido.").nullable().or(z.literal("")),
  note: z.string().nullable(),
});

export type RubricaClientiContactFormSchema = z.infer<typeof rubricaClientiContactFormSchema>;

interface RubricaClientiContactFormProps {
  onSubmit: (values: RubricaClientiContactFormSchema) => Promise<void>;
  isLoading: boolean;
  defaultValues?: Partial<RubricaClientiContactFormSchema>;
}

export function RubricaClientiContactForm({ onSubmit, isLoading, defaultValues }: RubricaClientiContactFormProps) {
  const form = useForm<RubricaClientiContactFormSchema>({
    resolver: zodResolver(rubricaClientiContactFormSchema),
    defaultValues: {
      tipo_recapito: defaultValues?.tipo_recapito || RUBRICA_CLIENTI_RECAPITO_TYPES[0],
      nome_persona: defaultValues?.nome_persona || null,
      telefono_fisso: defaultValues?.telefono_fisso || null,
      telefono_cellulare: defaultValues?.telefono_cellulare || null,
      email_recapito: defaultValues?.email_recapito || null,
      note: defaultValues?.note || null,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
        <FormField
          control={form.control}
          name="tipo_recapito"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Tipo di Recapito</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona un tipo di recapito" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {RUBRICA_CLIENTI_RECAPITO_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="nome_persona"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Nome Persona (Opzionale)</FormLabel>
              <FormControl>
                <Input placeholder="Nome della persona associata" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="telefono_fisso"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefono Fisso</FormLabel>
              <FormControl>
                <Input placeholder="Numero di telefono fisso" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="telefono_cellulare"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefono Cellulare</FormLabel>
              <FormControl>
                <Input placeholder="Numero di telefono cellulare" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email_recapito"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Email Recapito</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Email del recapito" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Note</FormLabel>
              <FormControl>
                <Textarea placeholder="Aggiungi note sul recapito..." {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Salva Recapito"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}