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
import { Client } from "@/types/richieste-servizio";
import { useDebounce } from "@/hooks/use-debounce";

interface SearchableClientSelectProps {
  value: string | null | undefined; // This value is the UUID
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
  const [selectedClientDisplayName, setSelectedClientDisplayName] = useState<string | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch the selected client name when the component mounts or value changes
  useEffect(() => {
    async function fetchSelectedClientName() {
      if (value) {
        const { data, error } = await supabase
          .from("clienti")
          .select("ragione_sociale, codice_cliente_custom")
          .eq("id", value)
          .single();

        if (error) {
          console.error("Error fetching selected client name:", error.message);
          setSelectedClientDisplayName(null);
        } else if (data) {
          setSelectedClientDisplayName(data.ragione_sociale + (data.codice_cliente_custom ? ` (${data.codice_cliente_custom})` : ''));
        }
      } else {
        setSelectedClientDisplayName(null);
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
        "codice_cliente_custom", // Include custom code in search
      ];

      const orConditions = searchColumns
        .map((col) => `${col}.ilike.%${debouncedSearchTerm}%`)
        .join(",");

      const { data, error } = await supabase
        .from("clienti")
        .select("id, ragione_sociale, codice_cliente_custom, partita_iva, codice_fiscale, citta, email, indirizzo, telefono, referente, note") // Select ALL fields required by Client interface
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
    onChange(client.id); // Always return the UUID
    setSelectedClientDisplayName(client.ragione_sociale + (client.codice_cliente_custom ? ` (${client.codice_cliente_custom})` : ''));
    setIsOpen(false);
    setSearchTerm(""); // Clear search term on selection
    setSearchResults([]); // Clear search results
  };

  const handleClearSelection = () => {
    onChange(null);
    setSelectedClientDisplayName(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center space-x-2">
        <Input
          value={selectedClientDisplayName || ""}
          readOnly
          placeholder={placeholder}
          className="flex-grow"
          disabled={disabled}
        />
        {selectedClientDisplayName && (
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
            Cerca per ragione sociale, codice fiscale, partita IVA, indirizzo, città, email o codice personalizzato.
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
                <TableHead>Codice Personalizzato</TableHead> {/* Nuova colonna */}
                <TableHead>Partita IVA</TableHead>
                <TableHead>Codice Fiscale</TableHead>
                <TableHead>Città</TableHead>
                <TableHead>Email</TableHead>
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
                searchResults.map((client) => (
                  <TableRow
                    key={client.id}
                    onClick={() => handleSelectClient(client)}
                    className="cursor-pointer hover:bg-accent"
                  >
                    <TableCell className="font-medium">{client.ragione_sociale}</TableCell>
                    <TableCell>{client.codice_cliente_custom || "N/A"}</TableCell> {/* Mostra il nuovo campo */}
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