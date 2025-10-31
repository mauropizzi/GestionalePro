import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Download } from "lucide-react";
import { toast } from "sonner";

interface AnagraficaOption {
  value: string;
  label: string;
  icon: React.ReactNode;
}

interface ExportSectionProps {
  anagraficaOptions: AnagraficaOption[];
  loading: boolean;
}

export function ExportSection({ anagraficaOptions, loading }: ExportSectionProps) {

  const handleExportData = async (anagraficaType: string) => {
    // This loading state should ideally be managed by the parent or a global context
    // For now, we'll use a local loading state if needed, or rely on the parent's.
    // For simplicity, we'll assume the parent's `loading` prop is sufficient for disabling buttons.
    toast.info(`Esportazione di ${anagraficaType} in corso...`);
    try {
      const response = await fetch(
        "https://mlkahaedxpwkhheqwsjc.supabase.co/functions/v1/export-data", // URL della tua Edge Function di esportazione
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sa2FoYWVkeHB3a2hoZXF3c2pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNzgyNTU5LCJleHAiOjIwNzY4NTQyNTl9._QR-tTUw-NPhCcv9boDDQAsewgyDzMhwiXNIlxIBCjQ", // Aggiunto l'apikey
          },
          body: JSON.stringify({ anagraficaType }),
        }
      );

      if (!response.ok) {
        let errorMessage = `Errore durante l'esportazione di ${anagraficaType}.`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          const textError = await response.text();
          errorMessage = `Errore durante l'esportazione di ${anagraficaType}: ${textError}`;
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition && contentDisposition.match(/filename="(.+)"/);
      const filename = filenameMatch ? filename[1] : `${anagraficaType}_export.xlsx`;

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
      toast.error(`Errore nell'esportazione: ${error.message}`);
    }
  };

  return (
    <div className="p-6 border rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Download className="h-5 w-5 mr-2" /> Esporta Dati Esistenti
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
  );
}