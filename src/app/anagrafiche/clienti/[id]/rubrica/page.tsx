"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { ArrowLeft, Phone, PlusCircle, Edit, Trash, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RubricaClientiContactForm, RubricaClientiContactFormSchema } from "@/components/clienti/rubrica-clienti-contact-form.tsx";
import { useSession } from "@/components/session-context-provider";

interface RubricaClientiContact {
  id: string;
  client_id: string;
  tipo_recapito: string;
  nome_persona: string | null;
  telefono_fisso: string | null;
  telefono_cellulare: string | null;
  email_recapito: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export default function ClientiRubricaPage() {
  const params = useParams();
  const clientId = params.id as string;
  const { profile: currentUserProfile, isLoading: isSessionLoading } = useSession();

  const [contacts, setContacts] = useState<RubricaClientiContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<RubricaClientiContact | null>(null);

  const hasWriteAccess =
    currentUserProfile?.role === "super_admin" ||
    currentUserProfile?.role === "amministrazione" ||
    currentUserProfile?.role === "responsabile_operativo";

  const hasDeleteAccess =
    currentUserProfile?.role === "super_admin" ||
    currentUserProfile?.role === "amministrazione";

  useEffect(() => {
    if (!isSessionLoading && clientId) {
      fetchContacts();
    }
  }, [isSessionLoading, clientId]);

  const fetchContacts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("rubrica_clienti")
      .select("*")
      .eq("client_id", clientId)
      .order("tipo_recapito", { ascending: true });

    if (error) {
      toast.error("Errore nel recupero dei recapiti della rubrica clienti: " + error.message);
      setContacts([]);
    } else {
      setContacts(data || []);
    }
    setLoading(false);
  };

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
      toast.error("Errore durante il salvataggio del recapito: " + error.message);
    } else {
      toast.success("Recapito aggiunto con successo!");
      fetchContacts();
      setIsEditDialogOpen(false);
    }
    setIsSubmitting(false);
  };

  const handleUpdateContact = async (values: RubricaClientiContactFormSchema) => {
    if (!selectedContact) return;

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
      .from("rubrica_clienti")
      .update(contactData)
      .eq("id", selectedContact.id);

    if (error) {
      toast.error("Errore durante l'aggiornamento del recapito: " + error.message);
    } else {
      toast.success("Recapito aggiornato con successo!");
      fetchContacts();
      setIsEditDialogOpen(false);
      setSelectedContact(null);
    }
    setIsSubmitting(false);
  };

  const handleDeleteContact = async (contactId: string) => {
    setIsSubmitting(true);
    const { error } = await supabase
      .from("rubrica_clienti")
      .delete()
      .eq("id", contactId);

    if (error) {
      toast.error("Errore durante l'eliminazione del recapito: " + error.message);
    } else {
      toast.success("Recapito eliminato con successo!");
      fetchContacts();
    }
    setIsSubmitting(false);
  };

  if (isSessionLoading) {
    return null;
  }

  const hasViewAccess = currentUserProfile?.role && currentUserProfile.role !== "pending_approval";
  if (!hasViewAccess) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full text-center">
          <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Accesso Negato</h2>
          <p className="text-muted-foreground">Non hai i permessi necessari per visualizzare questa pagina.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4 mb-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/anagrafiche/clienti">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Rubrica Cliente</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Gestisci i recapiti per il cliente con ID: <span className="font-semibold">{clientId}</span>.
        </p>

        <div className="flex justify-end mb-4">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={isSubmitting || !hasWriteAccess} onClick={() => setSelectedContact(null)}>
                <PlusCircle className="h-4 w-4 mr-2" /> Aggiungi Recapito
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{selectedContact ? "Modifica Recapito" : "Aggiungi Nuovo Recapito"}</DialogTitle>
                <DialogDescription>
                  {selectedContact ? "Apporta modifiche al recapito selezionato." : "Aggiungi un nuovo recapito alla rubrica di questo cliente."}
                </DialogDescription>
              </DialogHeader>
              <RubricaClientiContactForm
                onSubmit={selectedContact ? handleUpdateContact : handleAddContact}
                isLoading={isSubmitting}
                defaultValues={selectedContact || undefined}
              />
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground">
            <Phone className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">Nessun recapito trovato per questo cliente.</p>
            <p className="text-sm">Utilizza il pulsante "Aggiungi Recapito" per iniziare.</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo Recapito</TableHead>
                  <TableHead>Nome Persona</TableHead>
                  <TableHead>Telefono Fisso</TableHead>
                  <TableHead>Telefono Cellulare</TableHead>
                  <TableHead>Email Recapito</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">{contact.tipo_recapito}</TableCell>
                    <TableCell>{contact.nome_persona || "N/A"}</TableCell>
                    <TableCell>{contact.telefono_fisso || "N/A"}</TableCell>
                    <TableCell>{contact.telefono_cellulare || "N/A"}</TableCell>
                    <TableCell>{contact.email_recapito || "N/A"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                      {contact.note || "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedContact(contact);
                            setIsEditDialogOpen(true);
                          }}
                          disabled={isSubmitting || !hasWriteAccess}
                          title="Modifica recapito"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={isSubmitting || !hasDeleteAccess}
                              title="Elimina recapito"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Sei assolutamente sicuro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Questa azione non può essere annullata. Verrà eliminato permanentemente il recapito "{contact.tipo_recapito}" dalla rubrica.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteContact(contact.id)}>
                                Elimina
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}