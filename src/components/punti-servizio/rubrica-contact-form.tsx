"use client";

import React, { useState } from "react";
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
import { Loader2 } from "lucide-react";

const rubricaContactFormSchema = z.object({
  nome_contatto: z.string().min(1, "Il nome del contatto è richiesto."),
  ruolo_contatto: z.string().nullable(),
  telefono: z.string().nullable(),
  email: z.string().email("Inserisci un indirizzo email valido.").nullable().or(z.literal("")),
  note: z.string().nullable(),
});

export type RubricaContactFormSchema = z.infer<typeof rubricaContactFormSchema>;

interface RubricaContactFormProps {
  onSubmit: (values: RubricaContactFormSchema) => Promise<void>;
  isLoading: boolean;
  defaultValues?: Partial<RubricaContactFormSchema>;
}

export function RubricaContactForm({ onSubmit, isLoading, defaultValues }: RubricaContactFormProps) {
  const form = useForm<RubricaContactFormSchema>({
    resolver: zodResolver(rubricaContactFormSchema),
    defaultValues: {
      nome_contatto: defaultValues?.nome_contatto || "",
      ruolo_contatto: defaultValues?.ruolo_contatto || null,
      telefono: defaultValues?.telefono || null,
      email: defaultValues?.email || null,
      note: defaultValues?.note || null,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
        <FormField
          control={form.control}
          name="nome_contatto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Contatto</FormLabel>
              <FormControl>
                <Input placeholder="Nome del contatto" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="ruolo_contatto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ruolo Contatto</FormLabel>
              <FormControl>
                <Input placeholder="Es. Responsabile, Tecnico" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="telefono"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefono</FormLabel>
              <FormControl>
                <Input placeholder="Numero di telefono" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Email del contatto" {...field} value={field.value ?? ""} />
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
                <Textarea placeholder="Aggiungi note sul contatto..." {...field} value={field.value ?? ""} />
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
              "Salva Contatto"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}