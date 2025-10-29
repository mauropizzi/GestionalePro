import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, FileDown } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

interface AnagraficaOption {
  value: string;
  label: string;
  icon: React.ReactNode;
}

interface TemplateDownloadSectionProps {
  anagraficaOptions: AnagraficaOption[];
  templateHeaders: { [key: string]: string[] };
  loading: boolean;
}

export function TemplateDownloadSection({ anagraficaOptions, templateHeaders, loading }: TemplateDownloadSectionProps) {

  const handleExportTemplate = (anagraficaType: string) => {
    const headers = templateHeaders[anagraficaType];
    if (!headers) {
      toast.error("Template non disponibile per questo tipo di anagrafica.");
      return;
    }

    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `${anagraficaType}_template.xlsx`);
    toast.success(`Template ${anagraficaType} scaricato con successo!`);
  };

  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-2 flex items-center">
        <FileDown className="h-4 w-4 mr-2" /> Scarica Template
      </h3>
      <p className="text-sm text-muted-foreground mb-3">
        Scarica un file Excel pre-formattato con le intestazioni corrette per il tipo di anagrafica selezionato.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {anagraficaOptions.map((option) => (
          <Button
            key={`template-${option.value}`}
            onClick={() => handleExportTemplate(option.value)}
            disabled={loading}
            variant="outline"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              option.icon
            )}
            Template {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}