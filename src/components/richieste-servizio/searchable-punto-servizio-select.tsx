"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { PuntoServizio } from "@/types/richieste-servizio";

interface SearchablePuntoServizioSelectProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function SearchablePuntoServizioSelect({
  value,
  onChange,
  disabled = false,
  placeholder = "Cerca punto servizio...",
}: SearchablePuntoServizioSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [puntiServizio, setPuntiServizio] = useState<PuntoServizio[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PuntoServizio | null>(null);

  // Debounced search function
  const debouncedSearch = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (query: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        performSearch(query);
      }, 300); // 300ms delay
    };
  }, []);

  const performSearch = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setPuntiServizio([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("punti_servizio")
        .select("*")
        .or(`nome_punto_servizio.ilike.%${query}%,codice_cliente.ilike.%${query}%,codice_sicep.ilike.%${query}%`)
        .order("nome_punto_servizio")
        .limit(50); // Limit results to improve performance

      if (error) {
        console.error("Errore nella ricerca:", error);
        setPuntiServizio([]);
      } else {
        setPuntiServizio(data || []);
      }
    } catch (err) {
      console.error("Errore nella ricerca:", err);
      setPuntiServizio([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // FIX: sincronizza subito la label quando value cambia (anche se il popover è chiuso)
  useEffect(() => {
    if (!value) {
      setSelectedItem(null);
      return;
    }

    if (selectedItem?.id === value) return;

    let cancelled = false;
    supabase
      .from("punti_servizio")
      .select("*")
      .eq("id", value)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) {
          setSelectedItem(data);
          setPuntiServizio((prev) => {
            const exists = prev.some((ps) => ps.id === data.id);
            return exists ? prev : [data, ...prev];
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [value, selectedItem?.id]);

  useEffect(() => {
    if (open) {
      // Load initial data when popover opens
      if (value && !selectedItem) {
        // If there's a selected value and we don't have it cached, fetch it
        supabase
          .from("punti_servizio")
          .select("*")
          .eq("id", value)
          .single()
          .then(({ data, error }) => {
            if (!error && data) {
              setSelectedItem(data);
              setPuntiServizio([data]);
            }
          });
      } else if (!value) {
        // Load first 20 items for initial display
        supabase
          .from("punti_servizio")
          .select("*")
          .order("nome_punto_servizio")
          .limit(20)
          .then(({ data, error }) => {
            if (!error && data) {
              setPuntiServizio(data);
            }
          });
      }
    }
  }, [open, value, selectedItem]);

  useEffect(() => {
    debouncedSearch(searchTerm);
    return () => {
      // Cleanup timeout on unmount
    };
  }, [searchTerm, debouncedSearch]);

  const selectedPuntoServizio = useMemo(() => {
    // First check if we have the selected item cached
    if (selectedItem && selectedItem.id === value) {
      return selectedItem;
    }
    // Then check in the search results
    return puntiServizio.find((ps) => ps.id === value);
  }, [puntiServizio, value, selectedItem]);

  const handleSelect = useCallback((selectedValue: string) => {
    const selected = puntiServizio.find((ps) => ps.id === selectedValue);
    if (selected) {
      setSelectedItem(selected);
    }
    onChange(selectedValue);
    setOpen(false);
    setSearchTerm("");
  }, [onChange, puntiServizio]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedPuntoServizio
            ? selectedPuntoServizio.nome_punto_servizio
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Cerca per nome o codice..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {loading && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Caricamento...
              </div>
            )}
            {!loading && puntiServizio.length === 0 && (
              <CommandEmpty>Nessun punto servizio trovato</CommandEmpty>
            )}
            {!loading && (
              <CommandGroup>
                {puntiServizio.map((ps) => (
                  <CommandItem
                    key={ps.id}
                    value={ps.id}
                    onSelect={handleSelect}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === ps.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {ps.nome_punto_servizio}
                    {ps.codice_cliente && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        ({ps.codice_cliente})
                      </span>
                    )}
                    {ps.codice_sicep && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        (SICEP: {ps.codice_sicep})
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}