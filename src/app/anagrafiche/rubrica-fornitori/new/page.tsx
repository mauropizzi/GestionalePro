"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RubricaFornitoriContactForm, RubricaFornitoriContactFormSchema } from "@/components/fornitori/rubrica-fornitori-contact-form";

interface Fornitore {
  id: string;
  ragione_sociale: string;
}

export default function NewRubricaFornitoriContactPage() {
  const params = useParams();
  const fornitoreId = params.id as string;
  const router = useRouter();

  const [fornitoreName, setFornitoreName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchFornitoreName() {
      if (!fornitoreId) return;
      const { data, error } = await supabase
        .from("fornitori")
        .select("ragione_sociale")
        .eq("id", fornitoreId)
        .single();

      if (error) {
        console.error("Supabase fetch fornitore name error:", error);
        toast.error("Errore nel recupero del nome del fornitore: " + error.message);
        router.push("/anagrafiche/fornitori");
      } else if (data) {
        setFornitoreName(data.ragione_sociale);
      }
      setIsLoading(false);
    }
    fetchFornitoreName();
  }, [fornitoreId, router]);

  const handleAddContact = async (values: RubricaFornitoriContactFormSchema) => {
    setIsSubmitting(true);
    const now = new Date().toISOString();
    const contactData = {
      ...values,
      fornitore_id: fornitoreId,
      nome_persona: values.nome_persona === "" ? null : values.nome_persona,
      telefono_fisso: values.telefono_fisso === "" ? null : values.telefono_fisso,
      telefono_cellulare: values.telefono_cellulare === "" ? null : values.telefono_cellulare,
      email_recapito: values.email_recapito === "" ? null : values.email_recapito,
      note: values.note === "" ? null : values.note,
      created_at: now,
      updated_at: now,
    };

    const { error } = await supabase
      .from("rubrica_fornitori")
      .insert(contactData);

    if (error) {
      console.error("Supabase insert error:", error);
      toast.error("Errore durante il salvataggio del recapito: " + error.message);
    } else {
      toast.success("Recapito aggiunto con successo!");
      router.push(`/anagrafiche/fornitori/${fornitoreId}/rubrica`);
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4 mb-3">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/anagrafiche/fornitori/${fornitoreId}/rubrica`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Aggiungi Recapito per {fornitoreName}</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Aggiungi un nuovo contatto alla rubrica del fornitore.
        </p>

        <RubricaFornitoriContactForm
          onSubmit={handleAddContact}
          isLoading={isSubmitting}
        />
      </div>
    </DashboardLayout>
  );
}