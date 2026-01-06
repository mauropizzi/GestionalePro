"use client";

import React from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useTextToRichiestaForm } from "@/hooks/use-text-to-richiesta-form";
import { TextInputSection } from "@/components/richieste-servizio/text-input-section";
import { GeneratedRequestFormSection } from "@/components/richieste-servizio/generated-request-form-section";

export default function CreateRichiestaFromTextPage() {
  const {
    form,
    inputText,
    setInputText,
    isProcessing,
    showForm,
    handleProcessText,
    onSubmit,
  } = useTextToRichiestaForm();

  return (
    <DashboardLayout>
      <div className="container mx-auto py-4">
        <div className="flex items-center gap-4 mb-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/richieste-servizio">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Crea Richiesta da Testo</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Incolla o digita una descrizione del servizio per generare una bozza di richiesta.
        </p>

        <div className="grid grid-cols-1 gap-6">
          <TextInputSection
            inputText={inputText}
            setInputText={setInputText}
            handleProcessText={handleProcessText}
            isProcessing={isProcessing}
          />

          {showForm && (
            <GeneratedRequestFormSection
              form={form}
              onSubmit={onSubmit}
              isSubmitting={isProcessing}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}