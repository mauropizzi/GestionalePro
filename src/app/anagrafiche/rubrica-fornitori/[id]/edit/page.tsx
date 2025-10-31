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

interface RubricaFornitoriContact {
  id: string;
  fornitore_id: string;
  tipo_recapito: string;
  nome_persona: string | null;
  telefono_fisso: string | null;
  telefono_cellulare: string | null;
  email_recapito: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

interface Fornitore {
  id: string;
  ragione_sociale: string;
}

export default function EditRubricaFornitoriContactPage() {
  const params = useParams();
  const contactId = params.id as string;
  const router = useRouter();

  const [fornitoreName, setFornitoreName] = useState<string | null>(null);
  const [contact, setContact] = useState<RubricaFornitoriContact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchContactAndFornitore() {
      if (!contactId) return;

      const { data: contactData, error: contactError } = await supabase
        .from("rubrica_fornitori")
        .select("*")
        .eq("id", contactId)
        .single();

      if (contactError) {
        console.error("Supabase fetch contact error:", contactError);
        toast.error("Errore nel recupero del recapito: " + contactError.message);
        router.push("/anagrafiche/fornitori"); // Redirect to fornitori list if contact not found
        return;
      }

      setContact(contactData);

      const { data: fornitoreData, error: fornitoreError } = await supabase
        .from("fornitori")
        .select("ragione_sociale")
        .eq("id", contactData.fornitore_id)
        .single();

      if (fornitoreError) {
        console.error("Supabase fetch fornitore name error:", fornitoreError);
        toast.error("Errore nel recupero del nome del fornitore: " + fornitoreError.message);
      } else if (fornitoreData) {
        setFornitoreName(fornitoreData.ragione_sociale);
      }

      setIsLoading(false);
    }
    fetchContactAndFornitore();
  }, [contactId, router]);

  const handleUpdateContact = async (values: RubricaFornitoriContactFormSchema) => {
    if (!contact) return;

    setIsSubmitting(true);
    const now = new Date().toISOString();
    const contactData = {
      ...values,
      nome_persona: values.nome_persona === "" ? null : values.nome_persona,
      telefono_fisso: values.telefono_fisso === "" ? null : values.telefono_fisso,
      telefono_cellulare: values.telefono_cellulare === "" ? null : values.telefono_cellulare,
      email_recapito: values.email_recapito === "" ? null : values.email_recapito,
      note: values.note === "" ? null : values.note,
      updated_at: now,
    };

    const { error } = await supabase
      .from("rubrica_fornitori")
      .update(contactData)
      .eq("id", contact.id);

    if (error) {
      console.error("Supabase update error:", error);
      toast.error("Errore durante l'aggiornamento del recapito: " + error.message);
    } else {
      toast.success("Recapito aggiornato con successo!");
      router.push(`/anagrafiche/fornitori/${contact.fornitore_id}/rubrica`);
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

  if (!contact) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h2 className="text-2xl font-bold mb-2">Recapito non trovato</h2>
          <p className="text-muted-foreground">Il recapito che stai cercando non esiste o non è accessibile.</p>
          <Button asChild className="mt-4">
            <Link href="/anagrafiche/fornitori">Torna ai Fornitori</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4 mb-3">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/anagrafiche/fornitori/${contact.fornitore_id}/rubrica`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Modifica Recapito per {fornitoreName}</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Apporta modifiche al recapito selezionato.
        </p>

        <RubricaFornitoriContactForm
          onSubmit={handleUpdateContact}
          isLoading={isSubmitting}
          defaultValues={contact}
        />
      </div>
    </DashboardLayout>
  );
}