"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RubricaClientiContactForm, RubricaClientiContactFormSchema } from "@/components/clienti/rubrica-clienti-contact-form";

interface Client {
  id: string;
  ragione_sociale: string;
}

export default function NewRubricaClientiContactPage() {
  const params = useParams();
  const clientId = params.id as string;
  const router = useRouter();

  const [clientName, setClientName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchClientName() {
      if (!clientId) return;
      const { data, error } = await supabase
        .from("clienti")
        .select("ragione_sociale")
        .eq("id", clientId)
        .single();

      if (error) {
        console.error("Supabase fetch client name error:", error);
        toast.error("Errore nel recupero del nome del cliente: " + error.message);
        router.push("/anagrafiche/clienti");
      } else if (data) {
        setClientName(data.ragione_sociale);
      }
      setIsLoading(false);
    }
    fetchClientName();
  }, [clientId, router]);

  const handleAddContact = async (values: RubricaClientiContactFormSchema) => {
    setIsSubmitting(true);
    const now = new Date().toISOString();
    const contactData = {
      ...values,
      client_id: clientId,
      nome_persona: values.nome_persona === "" ? null : values.nome_persona,
      telefono_fisso: values.telefono_fisso === "" ? null : values.telefono_fisso,
      telefono_cellulare: values.telefono_cellulare === "" ? null : values.telefono_cellulare,
      email_recapito: values.email_recapito === "" ? null : values.email_recapito,
      note: values.note === "" ? null : values.note,
      created_at: now,
      updated_at: now,
    };

    const { error } = await supabase
      .from("rubrica_clienti")
      .insert(contactData);

    if (error) {
      console.error("Supabase insert error:", error);
      toast.error("Errore durante il salvataggio del recapito: " + error.message);
    } else {
      toast.success("Recapito aggiunto con successo!");
      router.push(`/anagrafiche/clienti/${clientId}/rubrica`);
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
            <Link href={`/anagrafiche/clienti/${clientId}/rubrica`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Aggiungi Recapito per {clientName}</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Aggiungi un nuovo contatto alla rubrica del cliente.
        </p>

        <RubricaClientiContactForm
          onSubmit={handleAddContact}
          isLoading={isSubmitting}
        />
      </div>
    </DashboardLayout>
  );
}