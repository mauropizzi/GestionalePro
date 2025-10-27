"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useSession } from "@/components/session-context-provider";
import { ShieldAlert, Upload, Download, Loader2, FileText, Users, Building2, Truck, Network, UserRound, MapPin, Euro } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import * as XLSX from 'xlsx'; // Mantenuto per il parsing lato client
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ParsedDataRow {
  [key: string]: any;
}

export default function ImportExportPage() {
  const { profile: currentUserProfile, isLoading: isSessionLoading } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedDataRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnagrafica, setSelectedAnagrafica] = useState<string>(""); // Per specificare il tipo di anagrafica

  const hasAccess =
    currentUserProfile?.role === "super_admin" ||
    currentUserProfile?.role === "amministrazione";

  useEffect(() => {
    if (!isSessionLoading && !hasAccess) {
      // Reindirizza o mostra un messaggio di accesso negato se l'utente non ha i permessi
      // Per ora, il DashboardLayout gestisce il messaggio di accesso negato.
    }
  }, [isSessionLoading, hasAccess]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setParsedData([]); // Cancella i dati precedenti
    }
  };

  const handleParseExcel = () => {
    if (!file) {
      toast.error("Seleziona un file Excel da importare.");
      return;
    }
    if (!selectedAnagrafica) {
      toast.error("Seleziona il tipo di anagrafica per l'importazione.");
      return;
    }

    setLoading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        setParsedData(json as ParsedDataRow[]);
        toast.success("File Excel parsato con successo! Controlla l'anteprima.");
      } catch (error: any) {
        toast.error("Errore durante il parsing del file Excel: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = (error) => {
      toast.error("Errore durante la lettura del file: " + error.type);
      setLoading(false);
    };

    reader.readAsBinaryString(file);
  };

  const handleImportData = async () => {
    if (parsedData.length === 0) {
      toast.error("Nessun dato parsato da importare.");
      return;
    }
    if (!selectedAnagrafica) {
      toast.error("Seleziona il tipo di anagrafica per l'importazione.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/import-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ anagraficaType: selectedAnagrafica, data: parsedData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore durante l\'importazione dei dati.');
      }

      const result = await response.json();
      toast.success(result.message || "Dati importati con successo!");
      setParsedData([]); // Cancella i dati parsati dopo l'importazione
      setFile(null); // Cancella il file selezionato
      // Opzionalmente, resetta selectedAnagrafica se desiderato
    } catch (error: any) {
      toast.error("Errore di importazione: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async (anagraficaType: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/export-data?type=${anagraficaType}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore durante l\'esportazione dei dati.');
      }

      // Recupera il nome del file dall'header Content-Disposition, o usa un default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${anagraficaType}_export.xlsx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Dati ${anagraficaType} esportati con successo!`);
    } catch (error: any) {
      toast.error("Errore di esportazione: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (isSessionLoading) {
    return null;
  }

  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full text-center">
          <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Accesso Negato</h2>
          <p className="text-muted-foreground">Non hai i permessi necessari per visualizzare questa pagina.</p>
        </div>
      </DashboardLayout>
    );
  }

  const anagraficaOptions = [
    { value: "clienti", label: "Clienti", icon: <Building2 className="h-4 w-4 mr-2" /> },
    { value: "fornitori", label: "Fornitori", icon: <Truck className="h-4 w-4 mr-2" /> },
    { value: "punti_servizio", label: "Punti Servizio", icon: <MapPin className="h-4 w-4 mr-2" /> },
    { value: "personale", label: "Personale", icon: <UserRound className="h-4 w-4 mr-2" /> },
    { value: "operatori_network", label: "Operatori Network", icon: <Network className="h-4 w-4 mr-2" /> },
    { value: "procedure", label: "Procedure", icon: <FileText className="h-4 w-4 mr-2" /> },
    { value: "tariffe", label: "Tariffe", icon: <Euro className="h-4 w-4 mr-2" /> },
  ];

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-4">Importa/Esporta Dati Anagrafici</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Gestisci l'importazione e l'esportazione dei dati anagrafici tramite file Excel.
        </p>

        {/* Sezione Importa */}
        <div className="mb-8 p-6 border rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Upload className="h-5 w-5 mr-2" /> Importa Dati
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <Label htmlFor="anagrafica-type" className="mb-2 block">Tipo di Anagrafica</Label>
              <Select value={selectedAnagrafica} onValueChange={setSelectedAnagrafica} disabled={loading}>
                <SelectTrigger id="anagrafica-type">
                  <SelectValue placeholder="Seleziona tipo di anagrafica" />
                </SelectTrigger>
                <SelectContent>
                  {anagraficaOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center">
                        {option.icon} {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="excel-file" className="mb-2 block">Carica File Excel</Label>
              <Input
                id="excel-file"
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                disabled={loading}
              />
            </div>
          </div>
          <div className="flex space-x-2 mt-4">
            <Button onClick={handleParseExcel} disabled={loading || !file || !selectedAnagrafica}>
              {loading && file && parsedData.length === 0 ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              Verifica File
            </Button>
            <Button onClick={handleImportData} disabled={loading || parsedData.length === 0} variant="blue-accent">
              {loading && parsedData.length > 0 ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Importa nel Database
            </Button>
          </div>

          {parsedData.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Anteprima Dati Parsati ({selectedAnagrafica})</h3>
              <div className="rounded-md border max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(parsedData[0]).map((key) => (
                        <TableHead key={key}>{key}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 10).map((row, rowIndex) => ( // Mostra le prime 10 righe come anteprima
                      <TableRow key={rowIndex}>
                        {Object.values(row).map((value, colIndex) => (
                          <TableCell key={colIndex}>{String(value)}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                    {parsedData.length > 10 && (
                      <TableRow>
                        <TableCell colSpan={Object.keys(parsedData[0]).length} className="text-center text-muted-foreground">
                          ... e altri {parsedData.length - 10} record.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Questa è un'anteprima dei primi 10 record del file Excel. La logica per la gestione di modifiche, duplicati e nuovi record verrà implementata in un secondo momento.
              </p>
            </div>
          )}
        </div>

        {/* Sezione Esporta */}
        <div className="p-6 border rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Download className="h-5 w-5 mr-2" /> Esporta Dati
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Esporta i dati delle anagrafiche selezionate in formato Excel.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {anagraficaOptions.map((option) => (
              <Button
                key={`export-${option.value}`}
                onClick={() => handleExportData(option.value)}
                disabled={loading}
                variant="outline"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  option.icon
                )}
                Esporta {option.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}