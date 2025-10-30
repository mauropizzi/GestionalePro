import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, FileText, Upload, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

interface ParsedDataRow {
  [key: string]: any;
}

interface AnagraficaOption {
  value: string;
  label: string;
  icon: React.ReactNode;
}

type ImportStep = 'select_file' | 'preview_data' | 'importing' | 'completed';

interface ImportSectionProps {
  anagraficaOptions: AnagraficaOption[];
  columnHeaderMap: { [key: string]: string };
}

export function ImportSection({ anagraficaOptions, columnHeaderMap }: ImportSectionProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedDataRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnagrafica, setSelectedAnagrafica] = useState<string>("");
  const [importStep, setImportStep] = useState<ImportStep>('select_file');
  const [previewReport, setPreviewReport] = useState<any[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setParsedData([]);
      setPreviewReport([]);
      setImportStep('select_file'); // Reset step if file changes
    }
  };

  const handleParseAndPreview = async () => {
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

    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        setParsedData(json as ParsedDataRow[]);

        // --- Send to Edge Function for Preview/Validation ---
        const response = await fetch(
          "https://mlkahaedxpwkhheqwsjc.supabase.co/functions/v1/import-data", // Use the same Edge Function
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sa2FoYWVkeHB3a2hoZXF3c2pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNzgyNTU5LCJleHAiOjIwNzY4NTQyNTl9._QR-tTUw-NPhCcv9boDDQAsewgyDzMhwiXNIlxIBCjQ",
            },
            body: JSON.stringify({
              anagraficaType: selectedAnagrafica,
              data: json,
              mode: 'preview', // Indicate preview mode
            }),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Errore durante la fase di anteprima.");
        }

        setPreviewReport(result.report);
        setImportStep('preview_data');
        toast.success("Anteprima generata con successo! Controlla i dettagli prima di importare.");

      } catch (error: any) {
        toast.error("Errore durante il parsing o l'anteprima: " + error.message);
        setImportStep('select_file'); // Go back to select file on error
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = (error) => {
      toast.error("Errore durante la lettura del file: " + error.type);
      setLoading(false);
      setImportStep('select_file');
    };

    reader.readAsBinaryString(file);
  };

  const handleImportData = async () => {
    if (parsedData.length === 0 || previewReport.length === 0) {
      toast.error("Nessun dato da importare o anteprima non generata.");
      return;
    }
    if (!selectedAnagrafica) {
      toast.error("Seleziona il tipo di anagrafica per l'importazione.");
      return;
    }

    setLoading(true);
    setImportStep('importing');

    try {
      const response = await fetch(
        "https://mlkahaedxpwkhheqwsjc.supabase.co/functions/v1/import-data",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sa2FoYWVkeHB3a2hoZXF3c2pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNzgyNTU5LCJleHAiOjIwNzY4NTQyNTl9._QR-tTUw-NPhCcv9boDDQAsewgyDzMhwiXNIlxIBCjQ",
          },
          body: JSON.stringify({
            anagraficaType: selectedAnagrafica,
            data: parsedData, // Send the original parsed data
            mode: 'import', // Indicate import mode
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 207 && result.errors && Array.isArray(result.errors)) {
          const errorSummary = `Importazione completata con ${result.successCount || 0} successi e ${result.errorCount || result.errors.length} errori.`;
          const firstFewErrors = result.errors.slice(0, 3).map((err: string) => `- ${err}`).join('\n');
          const moreErrorsMessage = result.errors.length > 3 ? `\n...e altri ${result.errors.length - 3} errori. Controlla la console per i dettagli completi.` : '';
          toast.error(
            <div>
              <p className="font-semibold">{errorSummary}</p>
              <pre className="mt-2 whitespace-pre-wrap text-xs">{firstFewErrors}{moreErrorsMessage}</pre>
            </div>,
            { duration: 10000 }
          );
        } else {
          throw new Error(result.error || "Errore durante l'importazione dei dati.");
        }
      } else {
        toast.success(result.message);
        setParsedData([]);
        setFile(null);
        setPreviewReport([]);
        setImportStep('completed');
      }
    } catch (error: any) {
      toast.error("Errore nell'importazione: " + error.message);
      setImportStep('preview_data'); // Go back to preview on import error
    } finally {
      setLoading(false);
    }
  };

  const resetImportProcess = () => {
    setImportStep('select_file');
    setFile(null);
    setParsedData([]);
    setPreviewReport([]);
    setSelectedAnagrafica("");
    setLoading(false);
  };

  const hasErrorsInPreview = previewReport.some(row => row.status === 'ERROR' || row.status === 'INVALID_FK');

  return (
    <div className="mb-8 p-6 border rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Upload className="h-5 w-5 mr-2" /> Importa Dati
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Utilizza il template per preparare i tuoi dati. Il sistema ti guiderà attraverso la validazione prima dell'importazione.
      </p>

      {/* Import Steps */}
      {importStep === 'select_file' && (
        <div>
          <h3 className="text-lg font-medium mb-2 flex items-center">
            <Upload className="h-4 w-4 mr-2" /> Carica e Prepara
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <Label htmlFor="anagrafica-type-import" className="mb-2 block">Tipo di Anagrafica</Label>
              <Select value={selectedAnagrafica} onValueChange={setSelectedAnagrafica} disabled={loading}>
                <SelectTrigger id="anagrafica-type-import">
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
              <Label htmlFor="excel-file-import" className="mb-2 block">Carica File Excel</Label>
              <Input
                id="excel-file-import"
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                disabled={loading}
              />
            </div>
          </div>
          <div className="flex space-x-2 mt-4">
            <Button onClick={handleParseAndPreview} disabled={loading || !file || !selectedAnagrafica}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              Parsa File e Anteprima
            </Button>
          </div>
        </div>
      )}

      {importStep === 'preview_data' && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Anteprima e Validazione Dati ({selectedAnagrafica})</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Rivedi i dati e le segnalazioni prima di procedere con l'importazione.
          </p>
          <div className="rounded-md border max-h-96 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {Object.keys(parsedData[0]).map((key) => (
                    <TableHead key={key}>{columnHeaderMap[key] || key}</TableHead>
                  ))}
                  <TableHead className="font-bold text-center">Stato Importazione</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewReport.slice(0, 10).map((rowReport, rowIndex) => (
                  <TableRow key={rowIndex} className={
                    rowReport.status === 'ERROR' || rowReport.status === 'INVALID_FK' ? 'bg-red-50' :
                    rowReport.status === 'DUPLICATE' ? 'bg-yellow-50' :
                    rowReport.status === 'UPDATE' ? 'bg-blue-50' : ''
                  }>
                    {Object.keys(parsedData[0]).map((key, colIndex) => (
                      <TableCell key={colIndex}>{String(parsedData[rowIndex][key] || '')}</TableCell>
                    ))}
                    <TableCell className="text-center text-xs">
                      <span className={`px-2 py-1 rounded-full text-white ${
                        rowReport.status === 'NEW' ? 'bg-green-500' :
                        rowReport.status === 'UPDATE' ? 'bg-blue-500' :
                        rowReport.status === 'DUPLICATE' ? 'bg-yellow-500' :
                        rowReport.status === 'ERROR' || rowReport.status === 'INVALID_FK' ? 'bg-red-500' : 'bg-gray-500'
                      }`}>
                        {rowReport.status}
                      </span>
                      {rowReport.message && <p className="mt-1 text-muted-foreground">{rowReport.message}</p>}
                      {rowReport.updatedFields && rowReport.updatedFields.length > 0 && (
                        <p className="mt-1 text-muted-foreground text-xs">Aggiornerà: {rowReport.updatedFields.join(', ')}</p>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {previewReport.length > 10 && (
                  <TableRow>
                    <TableCell colSpan={Object.keys(parsedData[0]).length + 1} className="text-center text-muted-foreground">
                      ... e altri {previewReport.length - 10} record.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex space-x-2 mt-4">
            <Button onClick={handleImportData} disabled={loading || hasErrorsInPreview} variant="blue-accent">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Conferma Importazione
            </Button>
            <Button onClick={resetImportProcess} variant="outline" disabled={loading}>
              Annulla e Ricarica File
            </Button>
          </div>
          {hasErrorsInPreview && (
            <p className="text-sm text-red-500 mt-3 flex items-center">
              <ShieldAlert className="h-4 w-4 mr-2" /> Ci sono errori critici. Correggi il file o annulla l'importazione.
            </p>
          )}
        </div>
      )}

      {importStep === 'importing' && (
        <div className="mt-6 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
          <p className="text-lg font-medium">Importazione in corso...</p>
          <p className="text-sm text-muted-foreground">Non chiudere questa pagina.</p>
        </div>
      )}

      {importStep === 'completed' && (
        <div className="mt-6 flex flex-col items-center justify-center text-center">
          <p className="text-lg font-medium text-green-600">Importazione completata con successo!</p>
          <Button onClick={resetImportProcess} className="mt-4">
            Nuova Importazione
          </Button>
        </div>
      )}
    </div>
  );
}