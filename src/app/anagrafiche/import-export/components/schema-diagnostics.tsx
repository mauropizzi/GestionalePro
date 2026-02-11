import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, RefreshCw, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  ANAGRAFICA_TABLE_OPTIONS,
  type AnagraficaTable,
  runInsertTest,
  runSelectTest,
} from "@/utils/postgrest-diagnostics";

interface SchemaDiagnosticsProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

type TestState = {
  selectTest: { success: boolean; error?: string; data?: any } | null;
  insertTest: { success: boolean; error?: string; data?: any } | null;
  refreshResult: { success: boolean; error?: string; message?: string } | null;
};

export function SchemaDiagnostics({ loading, setLoading }: SchemaDiagnosticsProps) {
  const [table, setTable] = useState<AnagraficaTable>("operatori_network");
  const [selectColumns, setSelectColumns] = useState("id, note");
  const [insertColumns, setInsertColumns] = useState("note");

  const [testResults, setTestResults] = useState<TestState>({
    selectTest: null,
    insertTest: null,
    refreshResult: null,
  });

  const tableLabel = useMemo(
    () => ANAGRAFICA_TABLE_OPTIONS.find((t) => t.value === table)?.label ?? table,
    [table]
  );

  const runDiagnostics = async () => {
    setLoading(true);
    setTestResults({ selectTest: null, insertTest: null, refreshResult: null });

    try {
      const selectRes = await runSelectTest(table, selectColumns);
      setTestResults((prev) => ({ ...prev, selectTest: selectRes }));

      const insertRes = await runInsertTest(table, insertColumns);
      setTestResults((prev) => ({ ...prev, insertTest: insertRes }));

      if (selectRes.success && insertRes.success) {
        toast.success("Diagnostica completata: tutto OK");
      } else {
        toast.error("Diagnostica completata con errori");
      }
    } catch (error: any) {
      toast.error("Errore durante la diagnostica: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshSchemaCache = async () => {
    setLoading(true);
    setTestResults((prev) => ({ ...prev, refreshResult: null }));

    try {
      const response = await fetch(
        "https://mlkahaedxpwkhheqwsjc.supabase.co/functions/v1/refresh-schema",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey:
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sa2FoYWVkeHB3a2hoZXF3c2pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNzgyNTksImV4cCI6MjA3Njg1NDI1OX0._QR-tTUw-NPhjCv9boDDQAsewgyDzMhwiXNIlxIBCjQ",
          },
          body: JSON.stringify({ tableName: table }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        setTestResults((prev) => ({
          ...prev,
          refreshResult: { success: true, message: result.message },
        }));
        toast.success("Cache dello schema aggiornata con successo");

        // Auto-run diagnostics after refresh
        setTimeout(() => runDiagnostics(), 800);
      } else {
        setTestResults((prev) => ({
          ...prev,
          refreshResult: { success: false, error: result.error || "Errore sconosciuto" },
        }));
        toast.error("Errore nell'aggiornare la cache dello schema");
      }
    } catch (error: any) {
      setTestResults((prev) => ({
        ...prev,
        refreshResult: { success: false, error: error.message },
      }));
      toast.error("Errore nell'aggiornare la cache dello schema: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getTestStatusIcon = (test: { success: boolean; error?: string } | null) => {
    if (!test) return null;
    if (test.success) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getTestStatusBadge = (test: { success: boolean; error?: string } | null) => {
    if (!test) return <Badge variant="outline">Non testato</Badge>;
    if (test.success) return <Badge className="bg-green-100 text-green-800">Successo</Badge>;
    return <Badge variant="destructive">Errore</Badge>;
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <RefreshCw className="h-5 w-5 mr-2" />
          Diagnostica Cache Schema PostgREST (Generica)
        </CardTitle>
        <CardDescription>
          Seleziona l'anagrafica e le colonne da testare con SELECT/INSERT. Utile per verificare che la cache dello schema di PostgREST sia aggiornata.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Tipo anagrafica</div>
            <Select value={table} onValueChange={(v) => setTable(v as AnagraficaTable)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona..." />
              </SelectTrigger>
              <SelectContent>
                {ANAGRAFICA_TABLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Colonne SELECT</div>
            <Input
              value={selectColumns}
              onChange={(e) => setSelectColumns(e.target.value)}
              placeholder="es: id, note"
            />
          </div>

          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Colonne INSERT (test)</div>
            <Input
              value={insertColumns}
              onChange={(e) => setInsertColumns(e.target.value)}
              placeholder="es: note"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={runDiagnostics} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Esegui Diagnostica
          </Button>
          <Button onClick={refreshSchemaCache} disabled={loading} variant="outline">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Aggiorna Cache Schema
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          Anagrafica selezionata: <span className="font-medium text-foreground">{tableLabel}</span>
        </div>

        {testResults.selectTest && (
          <Alert>
            {getTestStatusIcon(testResults.selectTest)}
            <AlertDescription>
              <div className="flex items-center justify-between gap-3">
                <span>Test SELECT: {getTestStatusBadge(testResults.selectTest)}</span>
                {testResults.selectTest.error && (
                  <span className="text-sm text-red-600">{testResults.selectTest.error}</span>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {testResults.insertTest && (
          <Alert>
            {getTestStatusIcon(testResults.insertTest)}
            <AlertDescription>
              <div className="flex items-center justify-between gap-3">
                <span>Test INSERT: {getTestStatusBadge(testResults.insertTest)}</span>
                {testResults.insertTest.error && (
                  <span className="text-sm text-red-600">{testResults.insertTest.error}</span>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {testResults.refreshResult && (
          <Alert>
            {testResults.refreshResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <AlertDescription>
              <div className="flex items-center justify-between gap-3">
                <span>Aggiornamento cache: {getTestStatusBadge(testResults.refreshResult)}</span>
                {testResults.refreshResult.error && (
                  <span className="text-sm text-red-600">{testResults.refreshResult.error}</span>
                )}
                {testResults.refreshResult.message && (
                  <span className="text-sm text-green-600">{testResults.refreshResult.message}</span>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {testResults.selectTest?.success && testResults.insertTest?.success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>✅ Tutto OK!</strong> Le colonne selezionate sono accessibili via PostgREST.
            </AlertDescription>
          </Alert>
        )}

        {(!testResults.selectTest?.success || !testResults.insertTest?.success) && (
          <Alert>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription>
              <strong>⚠️ Problema rilevato:</strong> prova a:
              <ul className="list-disc list-inside mt-2 text-sm">
                <li>Cliccare "Aggiorna Cache Schema" e poi rilanciare la diagnostica</li>
                <li>Verificare che la colonna esista fisicamente nella tabella</li>
                <li>Per le rubriche: serve almeno 1 record collegato (cliente/fornitore/punto servizio)</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}