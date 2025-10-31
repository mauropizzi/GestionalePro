"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
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
import { PuntoServizioFormSchema, puntoServizioFormSchema } from "@/lib/punti-servizio-utils";

interface Client {
  id: string;
  ragione_sociale: string;
}

interface Fornitore {
  id: string;
  ragione_sociale: string;
}

interface PuntoServizioFormProps {
  onSubmit: (values: PuntoServizioFormSchema) => void;
  isSubmitting: boolean;
  clients: Client[];
  fornitori: Fornitore[];
}

export function PuntoServizioForm({
  onSubmit,
  isSubmitting,
  clients,
  fornitori,
}: PuntoServizioFormProps) {
  const form = useFormContext<PuntoServizioFormSchema>();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2 max-w-3xl mx-auto">
        <FormField
          control={form.control}
          name="nome_punto_servizio"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Nome Punto Servizio</FormLabel>
              <FormControl>
                <Input placeholder="Nome del punto servizio" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="id_cliente"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Cliente Associato</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
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
        <FormField
          control={form.control}
          name="indirizzo"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Indirizzo</FormLabel>
              <FormControl>
                <Input placeholder="Via, numero civico" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="citta"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Città</FormLabel>
              <FormControl>
                <Input placeholder="Città" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cap"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CAP</FormLabel>
              <FormControl>
                <Input placeholder="CAP" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="provincia"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Provincia</FormLabel>
              <FormControl>
                <Input placeholder="Provincia (es. RM)" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="referente"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Referente</FormLabel>
              <FormControl>
                <Input placeholder="Nome del referente" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="telefono_referente"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefono Referente</FormLabel>
              <FormControl>
                <Input placeholder="Telefono del referente" {...field} value={field.value ?? ""} />
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
                <Input placeholder="Telefono del punto servizio" {...field} value={field.value ?? ""} />
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
                <Input type="email" placeholder="Email del punto servizio" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tempo_intervento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tempo Intervento</FormLabel>
              <FormControl>
                <Input placeholder="Es. 24h, 48h" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fornitore_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fornitore Associato</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
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
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="codice_cliente"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Codice Cliente Punto Servizio</FormLabel>
              <FormControl>
                <Input placeholder="Codice Cliente" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="codice_fornitore_punto_servizio" // Nuovo campo
          render={({ field }) => (
            <FormItem>
              <FormLabel>Codice Fornitore Punto Servizio</FormLabel>
              <FormControl>
                <Input placeholder="Codice Fornitore per questo punto servizio" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="codice_sicep"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Codice SICEP</FormLabel>
              <FormControl>
                <Input placeholder="Codice SICEP" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="codice_fatturazione"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Codice Fatturazione</FormLabel>
              <FormControl>
                <Input placeholder="Codice Fatturazione" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="latitude"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Latitudine</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="any"
                  placeholder="Latitudine"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="longitude"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Longitudine</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="any"
                  placeholder="Longitudine"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="nome_procedura"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Procedura</FormLabel>
              <FormControl>
                <Input placeholder="Nome della procedura associata" {...field} value={field.value ?? ""} />
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
                <Textarea placeholder="Aggiungi note sul punto servizio..." {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Salva modifiche"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}