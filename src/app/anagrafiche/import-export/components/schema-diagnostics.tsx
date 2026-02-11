import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { testOperatoriNetworkNoteColumn, testInsertOperatoriNetworkWithNote } from "@/utils/test-schema-cache";

interface SchemaDiagnosticsProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export function SchemaDiagnostics({ loading, setLoading }: SchemaDiagnosticsProps) {
  const [testResults, setTestResults] = useState<{
    noteColumnTest: { success: boolean; error?: string; data?: any } | null;
    insertTest: { success: boolean; error?: string; data?: any } | null;
    refreshResult: { success: boolean; error?: string; message?: string } | null;
  }>({
    noteColumnTest: null,
    insertTest: null,
    refreshResult: null,
  });

  const runDiagnostics = async () => {
    setLoading(true);
    setTestResults({ noteColumnTest: null, insertTest: null, refreshResult: null });

    try {
      // Test 1: Check if note column can be selected
      const noteTest = await testOperatoriNetworkNoteColumn();
      setTestResults(prev => ({ ...prev, noteColumnTest: noteTest }));

      // Test 2: Check if record with note can be inserted
      const insertTest = await testInsertOperatoriNetworkWithNote();
      setTestResults(prev => ({ ...prev, insertTest: insertTest }));

      if (noteTest.success && insertTest.success) {
        toast.success("Diagnostica completata: Il campo 'note' funziona correttamente");
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
    setTestResults(prev => ({ ...prev, refreshResult: null }));

    try {
      const response = await fetch(
        "https://mlkahaedxpwkhheqwsjc.supabase.co/functions/v1/refresh-schema",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sa2FoYWVkeHB3a2hoZXF3c2pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNzgyNTksImV4cCI6MjA3Njg1NDI1OX0._QR-tTUw-NPhjCv9boDDQAsewgyDzMhwiXNIlxIBCjQ",
          },
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        setTestResults(prev => ({ ...prev, refreshResult: { success: true, message: result.message } }));
        toast.success("Cache dello schema aggiornata con successo");
        
        // Auto-run diagnostics after refresh
        setTimeout(() => runDiagnostics(), 1000);
      } else {
        setTestResults(prev => ({ ...prev, refreshResult: { success: false, error: result.error || "Errore sconosciuto" } }));
        toast.error("Errore nell'aggiornare la cache dello schema");
      }
    } catch (error: any) {
      setTestResults(prev => ({ ...prev, refreshResult: { success: false, error: error.message } }));
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
          Diagnostica Cache Schema PostgREST
        </CardTitle>
        <CardDescription>
          Strumenti per diagnosticare e risolvere problemi con la cache dello schema di PostgREST, in particolare con il campo 'note' della tabella operatori_network.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Button onClick={runDiagnostics} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Esegui Diagnostica
          </Button>
          <Button onClick={refreshSchemaCache} disabled={loading} variant="outline">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Aggiorna Cache Schema
          </Button>
        </div>

        {testResults.noteColumnTest && (
          <Alert>
            {getTestStatusIcon(testResults.noteColumnTest)}
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>
                  Test selezione campo 'note': {getTestStatusBadge(testResults.noteColumnTest)}
                </span>
                {testResults.noteColumnTest.error && (
                  <span className="text-sm text-red-600">{testResults.noteColumnTest.error}</span>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {testResults.insertTest && (
          <Alert>
            {getTestStatusIcon(testResults.insertTest)}
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>
                  Test inserimento con campo 'note': {getTestStatusBadge(testResults.insertTest)}
                </span>
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
              <div className="flex items-center justify-between">
                <span>
                  Aggiornamento cache: {getTestStatusBadge(testResults.refreshResult)}
                </span>
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

        {testResults.noteColumnTest?.success && testResults.insertTest?.success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>✅ Problema risolto!</strong> Il campo 'note' è ora riconosciuto da PostgREST. Puoi procedere con l'importazione dei dati.
            </AlertDescription>
          </Alert>
        )}

        {(!testResults.noteColumnTest?.success || !testResults.insertTest?.success) && (
          <Alert>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription>
              <strong>⚠️ Problema rilevato:</strong> Se i test falliscono, prova a:
              <ul className="list-disc list-inside mt-2 text-sm">
                <li>Eseguire "Aggiorna Cache Schema" più volte</li>
                <li>Attendere qualche secondo tra i tentativi</li>
                <li>Controllare i log per dettagli specifici</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}