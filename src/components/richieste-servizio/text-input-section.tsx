"use client";

import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";

interface TextInputSectionProps {
  inputText: string;
  setInputText: (text: string) => void;
  handleProcessText: () => Promise<void>;
  isProcessing: boolean;
}

export function TextInputSection({
  inputText,
  setInputText,
  handleProcessText,
  isProcessing,
}: TextInputSectionProps) {
  return (
    <div className="space-y-4">
      <Label htmlFor="service-description">Descrizione del Servizio</Label>
      <Textarea
        id="service-description"
        placeholder="Es: 'Richiesta di piantonamento armato per il cliente XYZ presso il punto servizio principale dal 10/07/2024 al 15/07/2024 con 2 agenti, dalle 08:00 alle 18:00 tutti i giorni feriali.'"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        rows={8}
        disabled={isProcessing}
      />
      <Button onClick={handleProcessText} disabled={isProcessing || !inputText.trim()}>
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Elaborazione...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Elabora Testo
          </>
        )}
      </Button>
    </div>
  );
}