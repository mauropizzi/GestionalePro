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
import { Client } from "@/types/anagrafiche"; // Updated import
import { useDebounce } from "@/hooks/use-debounce";

interface SearchableClientSelectProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function SearchableClientSelect({
  value,
  onChange,
  disabled,
  placeholder = "Seleziona un cliente",
}: SearchableClientSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedClientName, setSelectedClientName] = useState<string | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch the selected client name when the component mounts or value changes
  useEffect(() => {
    async function fetchSelectedClientName() {
      if (value) {
        const { data, error } = await supabase
          .from("clienti")
          .select("ragione_sociale")
          .eq("id", value)
          .single();

        if (error) {
          console.error("Error fetching selected client name:", error.message);
          setSelectedClientName(null);
        } else if (data) {
          setSelectedClientName(data.ragione_sociale);
        }
      } else {
        setSelectedClientName(null);
      }
    }
    fetchSelectedClientName();
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
        "codice_fiscale",
        "partita_iva",
        "indirizzo",
        "citta",
        "email",
      ];

      const orConditions = searchColumns
        .map((col) => `${col}.ilike.%${debouncedSearchTerm}%`)
        .join(",");

      const { data, error } = await supabase
        .from("clienti")
        .select("*")
        .or(orConditions)
        .limit(10); // Limit results for performance

      if (error) {
        toast.error("Errore durante la ricerca dei clienti: " + error.message);
        setSearchResults([]);
      } else {
        setSearchResults(data || []);
      }
      setLoading(false);
    }

    performSearch();
  }, [debouncedSearchTerm]);

  const handleSelectClient = (client: Client) => {
    onChange(client.id);
    setSelectedClientName(client.ragione_sociale);
    setIsOpen(false);
    setSearchTerm(""); // Clear search term on selection
    setSearchResults([]); // Clear search results
  };

  const handleClearSelection = () => {
    onChange(null);
    setSelectedClientName(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center space-x-2">
        <Input
          value={selectedClientName || ""}
          readOnly
          placeholder={placeholder}
          className="flex-grow"
          disabled={disabled}
        />
        {selectedClientName && (
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
          <DialogTitle>Cerca Cliente</DialogTitle>
          <DialogDescription>
            Cerca per ragione sociale, codice fiscale, partita IVA, indirizzo, città o email.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 mb-4">
          <Input
            placeholder="Cerca cliente..."
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
                <TableHead>Codice Fiscale</TableHead>
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
                searchResults.map((client) => (
                  <TableRow
                    key={client.id}
                    onClick={() => handleSelectClient(client)}
                    className="cursor-pointer hover:bg-accent"
                  >
                    <TableCell className="font-medium">{client.ragione_sociale}</TableCell>
                    <TableCell>{client.partita_iva || "N/A"}</TableCell>
                    <TableCell>{client.codice_fiscale || "N/A"}</TableCell>
                    <TableCell>{client.citta || "N/A"}</TableCell>
                    <TableCell>{client.email || "N/A"}</TableCell>
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