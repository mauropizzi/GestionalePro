import React from "react";
import { UseFormReturn } from "react-hook-form";
import { CalendarIcon, Search, Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { HistoricalSearchSchema } from "@/lib/centrale-operativa-schemas";
import { PuntoServizio } from "@/types/richieste-servizio";
import { useMemo } from "react";

interface HistoricalSearchFormProps {
  form: UseFormReturn<HistoricalSearchSchema>;
  puntoServizioOptions: PuntoServizio[];
  onSubmit: (data: HistoricalSearchSchema) => void;
  loading: boolean;
}

export function HistoricalSearchForm({
  form,
  puntoServizioOptions,
  onSubmit,
  loading,
}: HistoricalSearchFormProps) {
  // Memoize the options to prevent unnecessary re-renders
  const memoizedOptions = useMemo(() => puntoServizioOptions, [puntoServizioOptions]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <FormField
          control={form.control}
          name="from_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Da Data</FormLabel>
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
        <FormField
          control={form.control}
          name="to_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>A Data</FormLabel>
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
        <FormField
          control={form.control}
          name="punto_servizio_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Punto Servizio</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Tutti i punti servizio" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  {memoizedOptions.map((ps) => (
                    <SelectItem key={ps.id} value={ps.id}>
                      {ps.nome_punto_servizio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="md:col-span-3 flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Cerca Storico
          </Button>
        </div>
      </form>
    </Form>
  );
}