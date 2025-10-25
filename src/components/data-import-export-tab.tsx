"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, FileUp, FileDown, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface ColumnDefinition {
  header: string;
  accessor: string;
}

interface DataImportExportTabProps {
  entityName: string;
  tableName: string;
  uniqueKey: string;
  columns: ColumnDefinition[];
}

interface RowData {
  [key: string]: any;
  _status?: 'new' | 'duplicate' | 'modified'; // Internal status for preview
}

export function DataImportExportTab({ entityName, tableName, uniqueKey, columns }: DataImportExportTabProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<RowData[]>([]);
  const [existingData, setExistingData] = useState<RowData[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setParsedData([]);
      setExistingData([]);
    }
  };

  const parseExcel = (file: File): Promise<RowData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json: RowData[] = XLSX.utils.sheet_to_json(worksheet);
          resolve(json);
        } catch (error) {
          reject(new Error("Errore durante la lettura del file Excel. Assicurati che sia un formato valido."));
        }
      };
      reader.onerror = (error) => reject(new Error("Errore nella lettura del file: " + error));
      reader.readAsArrayBuffer(file);
    });
  };

  const fetchExistingData = async (): Promise<RowData[]> => {
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) {
      toast.error(`Errore nel recupero dei dati esistenti: ${error.message}`);
      return [];
    }
    return data || [];
  };

  const handlePreview = async () => {
    if (!file) {
      toast.warning("Seleziona un file Excel prima di visualizzare l'anteprima.");
      return;
    }

    setLoading(true);
    try {
      const excelData = await parseExcel(file);
      const dbData = await fetchExistingData();

      const processedData = excelData.map(row => {
        const isDuplicate = dbData.some(dbRow => dbRow[uniqueKey] === row[uniqueKey]);
        return {
          ...row,
          _status: isDuplicate ? 'duplicate' : 'new',
        };
      });

      setParsedData(processedData);
      setExistingData(dbData); // Store existing data for potential future use (e.g., updates)
      toast.success("Anteprima caricata con successo!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast.warning("Nessun dato da importare. Carica un file e visualizza l'anteprima.");
      return;
    }

    const newRecords = parsedData.filter(row => row._status === 'new');

    if (newRecords.length === 0) {
      toast.info("Nessun nuovo record da importare.");
      return;
    }

    setImporting(true);
    try {
      const recordsToInsert = newRecords.map(record => {
        const newRecord: { [key: string]: any } = {};
        columns.forEach(col => {
          let value = record[col.accessor];
          // Handle boolean conversion for 'attivo'
          if (col.accessor === 'attivo' && typeof value === 'string') {
            value = value.toLowerCase() === 'true' || value.toLowerCase() === 'sì' || value === '1';
          }
          // Convert empty strings to null for database insertion
          newRecord[col.accessor] = value === "" ? null : value;
        });
        return { ...newRecord, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      });

      const { error } = await supabase.from(tableName).insert(recordsToInsert);

      if (error) {
        toast.error(`Errore durante l'importazione: ${error.message}`);
      } else {
        toast.success(`${newRecords.length} nuovi record importati con successo!`);
        setFile(null);
        setParsedData([]);
        setExistingData([]);
      }
    } catch (error: any) {
      toast.error(`Errore inaspettato durante l'importazione: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const dataToExport = await fetchExistingData();

      if (dataToExport.length === 0) {
        toast.info(`Nessun ${entityName} da esportare.`);
        setLoading(false);
        return;
      }

      const worksheetData = dataToExport.map(row => {
        const exportRow: { [key: string]: any } = {};
        columns.forEach(col => {
          let value = row[col.accessor];
          // Convert boolean 'attivo' to 'Sì'/'No' for export
          if (col.accessor === 'attivo' && typeof value === 'boolean') {
            value = value ? 'Sì' : 'No';
          }
          exportRow[col.header] = value; // Use header for Excel column name
        });
        return exportRow;
      });

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, entityName);
      XLSX.writeFile(workbook, `${entityName}_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success(`${entityName} esportati con successo!`);
    } catch (error: any) {
      toast.error(`Errore durante l'esportazione: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestione {entityName}</CardTitle>
        <CardDescription>
          Importa nuovi {entityName.toLowerCase()} da un file Excel o esporta quelli esistenti.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <Input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="flex-1"
            disabled={loading || importing}
          />
          <Button onClick={handlePreview} disabled={!file || loading || importing}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileUp className="mr-2 h-4 w-4" />
            )}
            Anteprima Importazione
          </Button>
          <Button onClick={handleExport} disabled={loading || importing} variant="outline">
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            Esporta {entityName}
          </Button>
        </div>

        {parsedData.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Anteprima Dati da Importare ({parsedData.length} righe)</h3>
            <p className="text-sm text-muted-foreground">
              I record contrassegnati con <span className="text-green-600 font-medium">Nuovo</span> verranno importati.
              I record contrassegnati con <span className="text-yellow-600 font-medium">Duplicato</span> non verranno importati.
              La rilevazione delle modifiche per i record esistenti non è ancora supportata.
            </p>
            <div className="max-h-96 overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Stato</TableHead>
                    {columns.map((col) => (
                      <TableHead key={col.accessor}>{col.header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((row, index) => (
                    <TableRow key={index} className={row._status === 'duplicate' ? 'bg-yellow-50/50' : ''}>
                      <TableCell>
                        {row._status === 'new' && <span className="flex items-center text-green-600"><CheckCircle className="h-4 w-4 mr-1" /> Nuovo</span>}
                        {row._status === 'duplicate' && <span className="flex items-center text-yellow-600"><AlertTriangle className="h-4 w-4 mr-1" /> Duplicato</span>}
                      </TableCell>
                      {columns.map((col) => (
                        <TableCell key={col.accessor}>
                          {col.accessor === 'attivo' ? (
                            (typeof row[col.accessor] === 'boolean' ? (row[col.accessor] ? 'Sì' : 'No') : String(row[col.accessor]))
                          ) : (
                            String(row[col.accessor] ?? '')
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Button onClick={handleImport} disabled={importing || parsedData.filter(row => row._status === 'new').length === 0}>
              {importing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Conferma Importazione ({parsedData.filter(row => row._status === 'new').length} nuovi record)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}