"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { Personale } from "@/types/anagrafiche";

interface SearchablePersonaleSelectProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  ruolo?: string;
}

export function SearchablePersonaleSelect({
  value,
  onChange,
  disabled = false,
  placeholder = "Cerca personale...",
  ruolo,
}: SearchablePersonaleSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Personale[]>([]);
  const [selectedItem, setSelectedItem] = useState<Personale | null>(null);

  const performSearch = useCallback(
    async (query: string) => {
      setLoading(true);
      try {
        let q = supabase
          .from("personale")
          .select("*")
          .eq("attivo", true)
          .order("cognome", { ascending: true })
          .limit(50);

        if (ruolo) {
          q = q.eq("ruolo", ruolo);
        }

        // Se query vuota, carica una lista iniziale (es. primi 20)
        if (!query) {
          const { data, error } = await q.limit(20);
          if (error) {
            setResults([]);
          } else {
            setResults(data || []);
          }
          return;
        }

        // Ricerca semplice su nome/cognome/cf
        const orConditions = [
          `nome.ilike.%${query}%`,
          `cognome.ilike.%${query}%`,
          `codice_fiscale.ilike.%${query}%`,
        ].join(",");

        const { data, error } = await q.or(orConditions);
        if (error) {
          setResults([]);
        } else {
          setResults(data || []);
        }
      } finally {
        setLoading(false);
      }
    },
    [ruolo]
  );

  // quando apro il popover, carico dati iniziali o l'elemento selezionato
  useEffect(() => {
    if (!open) return;

    // se c'è un valore selezionato e non abbiamo cache, lo recupero
    if (value && (!selectedItem || selectedItem.id !== value)) {
      let q = supabase.from("personale").select("*").eq("id", value);
      if (ruolo) q = q.eq("ruolo", ruolo);

      q.single().then(({ data, error }) => {
        if (!error && data) {
          setSelectedItem(data);
          setResults((prev) => {
            const exists = prev.some((p) => p.id === data.id);
            return exists ? prev : [data, ...prev];
          });
        }
      });

      return;
    }

    // altrimenti carico lista iniziale
    performSearch("");
  }, [open, value, selectedItem, ruolo, performSearch]);

  // debounce leggero
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => {
      performSearch(searchTerm.trim());
    }, 250);
    return () => clearTimeout(id);
  }, [searchTerm, open, performSearch]);

  const selected = useMemo(() => {
    if (selectedItem && selectedItem.id === value) return selectedItem;
    return results.find((r) => r.id === value) || null;
  }, [selectedItem, results, value]);

  const handleSelect = useCallback(
    (selectedValue: string) => {
      const item = results.find((r) => r.id === selectedValue) || null;
      if (item) setSelectedItem(item);
      onChange(selectedValue);
      setOpen(false);
      setSearchTerm("");
    },
    [results, onChange]
  );

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
          {selected ? `${selected.cognome} ${selected.nome}` : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {loading && (
              <div className="py-6 text-center text-sm text-muted-foreground">Caricamento...</div>
            )}
            {!loading && results.length === 0 && (
              <CommandEmpty>Nessun personale trovato</CommandEmpty>
            )}
            {!loading && (
              <CommandGroup>
                {results.map((p) => (
                  <CommandItem key={p.id} value={p.id} onSelect={handleSelect}>
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === p.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {p.cognome} {p.nome}
                    {p.codice_fiscale && (
                      <span className="ml-2 text-sm text-muted-foreground">({p.codice_fiscale})</span>
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