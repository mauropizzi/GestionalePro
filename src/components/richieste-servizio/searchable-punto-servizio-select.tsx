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
  const [selectedPuntoServizioName, setSelectedPuntoServizioName] = useState<string | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch the selected punto servizio name when the component mounts or value changes
  useEffect(() => {
    async function fetchSelectedPuntoServizioName() {
      if (value) {
        const { data, error } = await supabase
          .from("punti_servizio")
          .select("nome_punto_servizio")
          .eq("id", value)
          .single();

        if (error) {
          console.error("Error fetching selected punto servizio name:", error.message);
          setSelectedPuntoServizioName(null);
        } else if (data) {
          setSelectedPuntoServizioName(data.nome_punto_servizio);
        }
      } else {
        setSelectedPuntoServizioName(null);
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
        // "codice_fornitore_punto_servizio", // Rimosso
      ];

      const orConditions = searchColumns
        .map((col) => `${col}.ilike.%${debouncedSearchTerm}%`)
        .join(",");

      const { data, error } = await supabase
        .from("punti_servizio")
        .select(`
          *,
          clienti!id_cliente( ragione_sociale )
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
    setSelectedPuntoServizioName(punto.nome_punto_servizio);
    setIsOpen(false);
    setSearchTerm(""); // Clear search term on selection
    setSearchResults([]); // Clear search results
  };

  const handleClearSelection = () => {
    onChange(null);
    setSelectedPuntoServizioName(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center space-x-2">
        <Input
          value={selectedPuntoServizioName || ""}
          readOnly
          placeholder={placeholder}
          className="flex-grow"
          disabled={disabled}
        />
        {selectedPuntoServizioName && (
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
            Cerca per nome, indirizzo, città, referente o codici.
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
                <TableHead>Città</TableHead>
                <TableHead>Referente</TableHead>
                <TableHead>Codice Cliente PS</TableHead>
                {/* <TableHead>Codice Fornitore PS</TableHead> */} {/* Rimosso */}
                <TableHead>Codice SICEP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchResults.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
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
                    <TableCell>{punto.citta || "N/A"}</TableCell>
                    <TableCell>{punto.referente || "N/A"}</TableCell>
                    <TableCell>{punto.codice_cliente || "N/A"}</TableCell>
                    {/* <TableCell>{punto.codice_fornitore_punto_servizio || "N/A"}</TableCell> */} {/* Rimosso */}
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