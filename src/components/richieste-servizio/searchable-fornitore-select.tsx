"use client";

import React, { useState, useEffect } from "react";
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
import { Fornitore } from "@/types/richieste-servizio";
import { useDebounce } from "@/hooks/use-debounce";

interface SearchableFornitoreSelectProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function SearchableFornitoreSelect({
  value,
  onChange,
  disabled,
  placeholder = "Seleziona un fornitore",
}: SearchableFornitoreSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Fornitore[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFornitoreName, setSelectedFornitoreName] = useState<string | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch the selected fornitore name when the component mounts or value changes
  useEffect(() => {
    async function fetchSelectedFornitoreName() {
      if (value) {
        const { data, error } = await supabase
          .from("fornitori")
          .select("ragione_sociale")
          .eq("id", value)
          .single();

        if (error) {
          console.error("Error fetching selected fornitore name:", error.message);
          setSelectedFornitoreName(null);
        } else if (data) {
          setSelectedFornitoreName(data.ragione_sociale);
        }
      } else {
        setSelectedFornitoreName(null);
      }
    }
    fetchSelectedFornitoreName();
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
        "ragione_sociale",
        "partita_iva",
        "codice_fiscale",
        "indirizzo",
        "citta",
        "email",
        "tipo_servizio",
      ];

      const orConditions = searchColumns
        .map((col) => `${col}.ilike.%${debouncedSearchTerm}%`)
        .join(",");

      const { data, error } = await supabase
        .from("fornitori")
        .select("*")
        .or(orConditions)
        .limit(10); // Limit results for performance

      if (error) {
        toast.error("Errore durante la ricerca dei fornitori: " + error.message);
        setSearchResults([]);
      } else {
        setSearchResults(data || []);
      }
      setLoading(false);
    }

    performSearch();
  }, [debouncedSearchTerm]);

  const handleSelectFornitore = (fornitore: Fornitore) => {
    onChange(fornitore.id);
    setSelectedFornitoreName(fornitore.ragione_sociale);
    setIsOpen(false);
    setSearchTerm(""); // Clear search term on selection
    setSearchResults([]); // Clear search results
  };

  const handleClearSelection = () => {
    onChange(null);
    setSelectedFornitoreName(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center space-x-2">
        <Input
          value={selectedFornitoreName || ""}
          readOnly
          placeholder={placeholder}
          className="flex-grow"
          disabled={disabled}
        />
        {selectedFornitoreName && (
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
          <DialogTitle>Cerca Fornitore</DialogTitle>
          <DialogDescription>
            Cerca per ragione sociale, partita IVA, tipo servizio, città o email.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 mb-4">
          <Input
            placeholder="Cerca fornitore..."
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
                <TableHead>Ragione Sociale</TableHead>
                <TableHead>Partita IVA</TableHead>
                <TableHead>Tipo Servizio</TableHead>
                <TableHead>Città</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchResults.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Nessun risultato trovato.
                  </TableCell>
                </TableRow>
              ) : (
                searchResults.map((fornitore) => (
                  <TableRow
                    key={fornitore.id}
                    onClick={() => handleSelectFornitore(fornitore)}
                    className="cursor-pointer hover:bg-accent"
                  >
                    <TableCell className="font-medium">{fornitore.ragione_sociale}</TableCell>
                    <TableCell>{fornitore.partita_iva || "N/A"}</TableCell>
                    <TableCell>{fornitore.tipo_servizio || "N/A"}</TableCell>
                    <TableCell>{fornitore.citta || "N/A"}</TableCell>
                    <TableCell>{fornitore.email || "N/A"}</TableCell>
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