"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Loader2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PuntoServizio } from "@/types/richieste-servizio";
import { useDebounce } from "@/hooks/use-debounce"; // Assuming this hook exists or will be created

interface SearchablePuntoServizioSelectProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function SearchablePuntoServizioSelect({
  value,
  onChange,
  disabled,
  placeholder = "Seleziona un punto servizio",
}: SearchablePuntoServizioSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<PuntoServizio[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPuntoServizioDisplayName, setSelectedPuntoServizioDisplayName] = useState<string | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch the selected punto servizio name when the component mounts or value changes
  useEffect(() => {
    async function fetchSelectedPuntoServizioName() {
      if (value) {
        const { data, error } = await supabase
          .from("punti_servizio")
          .select("nome_punto_servizio, codice_cliente_associato") // Select custom code
          .eq("id", value)
          .single();

        if (error) {
          console.error("Error fetching selected punto servizio name:", error.message);
          setSelectedPuntoServizioDisplayName(null);
        } else if (data) {
          setSelectedPuntoServizioDisplayName(data.nome_punto_servizio + (data.codice_cliente_associato ? ` (${data.codice_cliente_associato})` : ''));
        }
      } else {
        setSelectedPuntoServizioDisplayName(null);
      }
    }
    fetchSelectedPuntoServizioName();
  }, [value]);

  // Perform search when debouncedSearchTerm changes
  useEffect(() => {
    async function performSearch() {
      if (!debouncedSearchTerm) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      const searchColumns = [
        "nome_punto_servizio",
        "indirizzo",
        "citta",
        "referente",
        "codice_cliente",
        "codice_sicep",
        "codice_fatturazione",
        "codice_cliente_associato", // Include custom code in search
      ];

      const orConditions = searchColumns
        .map((col) => `${col}.ilike.%${debouncedSearchTerm}%`)
        .join(",");

      const { data, error } = await supabase
        .from("punti_servizio")
        .select(`
          *,
          clienti ( ragione_sociale )
        `)
        .or(orConditions)
        .limit(10); // Limit results for performance

      if (error) {
        toast.error("Errore durante la ricerca dei punti servizio: " + error.message);
        setSearchResults([]);
      } else {
        setSearchResults(data || []);
      }
      setLoading(false);
    }

    performSearch();
  }, [debouncedSearchTerm]);

  const handleSelectPuntoServizio = (punto: PuntoServizio) => {
    onChange(punto.id);
    setSelectedPuntoServizioDisplayName(punto.nome_punto_servizio + (punto.codice_cliente_associato ? ` (${punto.codice_cliente_associato})` : ''));
    setIsOpen(false);
    setSearchTerm(""); // Clear search term on selection
    setSearchResults([]); // Clear search results
  };

  const handleClearSelection = () => {
    onChange(null);
    setSelectedPuntoServizioDisplayName(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center space-x-2">
        <Input
          value={selectedPuntoServizioDisplayName || ""}
          readOnly
          placeholder={placeholder}
          className="flex-grow"
          disabled={disabled}
        />
        {selectedPuntoServizioDisplayName && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearSelection}
            disabled={disabled}
            title="Cancella selezione"
          >
            <XCircle className="h-4 w-4" />
          </Button>
        )}
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" disabled={disabled}>
            <Search className="h-4 w-4" />
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Cerca Punto Servizio</DialogTitle>
          <DialogDescription>
            Cerca per nome, indirizzo, città, referente, codici o codice cliente associato.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 mb-4">
          <Input
            placeholder="Cerca punto servizio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
        <div className="flex-grow overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Codice Cliente Associato</TableHead> {/* Nuova colonna */}
                <TableHead>Città</TableHead>
                <TableHead>Referente</TableHead>
                <TableHead>Codice Cliente</TableHead>
                <TableHead>Codice SICEP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchResults.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Nessun risultato trovato.
                  </TableCell>
                </TableRow>
              ) : (
                searchResults.map((punto) => (
                  <TableRow
                    key={punto.id}
                    onClick={() => handleSelectPuntoServizio(punto)}
                    className="cursor-pointer hover:bg-accent"
                  >
                    <TableCell className="font-medium">{punto.nome_punto_servizio}</TableCell>
                    <TableCell>{punto.clienti?.ragione_sociale || "N/A"}</TableCell>
                    <TableCell>{punto.codice_cliente_associato || "N/A"}</TableCell> {/* Mostra il nuovo campo */}
                    <TableCell>{punto.citta || "N/A"}</TableCell>
                    <TableCell>{punto.referente || "N/A"}</TableCell>
                    <TableCell>{punto.codice_cliente || "N/A"}</TableCell>
                    <TableCell>{punto.codice_sicep || "N/A"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}