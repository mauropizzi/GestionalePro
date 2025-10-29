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
import { RubricaContactForm, RubricaContactFormSchema } from "@/components/punti-servizio/rubrica-contact-form.tsx";
import { useSession } from "@/components/session-context-provider";

interface RubricaContact {
  id: string;
  punto_servizio_id: string;
  nome_contatto: string;
  ruolo_contatto: string | null;
  telefono: string | null;
  email: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export default function PuntoServizioRubricaPage() {
  const params = useParams();
  const puntoServizioId = params.id as string;
  const { profile: currentUserProfile, isLoading: isSessionLoading } = useSession();

  const [contacts, setContacts] = useState<RubricaContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<RubricaContact | null>(null);

  const hasWriteAccess =
    currentUserProfile?.role === "super_admin" ||
    currentUserProfile?.role === "amministrazione" ||
    currentUserProfile?.role === "responsabile_operativo";

  const hasDeleteAccess =
    currentUserProfile?.role === "super_admin" ||
    currentUserProfile?.role === "amministrazione";

  useEffect(() => {
    if (!isSessionLoading && puntoServizioId) {
      fetchContacts();
    }
  }, [isSessionLoading, puntoServizioId]);

  const fetchContacts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("rubrica_punti_servizio")
      .select("*")
      .eq("punto_servizio_id", puntoServizioId)
      .order("nome_contatto", { ascending: true });

    if (error) {
      toast.error("Errore nel recupero dei contatti della rubrica: " + error.message);
      setContacts([]);
    } else {
      setContacts(data || []);
    }
    setLoading(false);
  };

  const handleAddContact = async (values: RubricaContactFormSchema) => {
    setIsSubmitting(true);
    const now = new Date().toISOString();
    const contactData = {
      ...values,
      punto_servizio_id: puntoServizioId,
      email: values.email === "" ? null : values.email,
      telefono: values.telefono === "" ? null : values.telefono,
      ruolo_contatto: values.ruolo_contatto === "" ? null : values.ruolo_contatto,
      note: values.note === "" ? null : values.note,
      created_at: now,
      updated_at: now,
    };

    const { error } = await supabase
      .from("rubrica_punti_servizio")
      .insert(contactData);

    if (error) {
      toast.error("Errore durante il salvataggio del contatto: " + error.message);
    } else {
      toast.success("Contatto aggiunto con successo!");
      fetchContacts();
      // Close dialog if it was opened for adding
      setIsEditDialogOpen(false);
    }
    setIsSubmitting(false);
  };

  const handleUpdateContact = async (values: RubricaContactFormSchema) => {
    if (!selectedContact) return;

    setIsSubmitting(true);
    const now = new Date().toISOString();
    const contactData = {
      ...values,
      email: values.email === "" ? null : values.email,
      telefono: values.telefono === "" ? null : values.telefono,
      ruolo_contatto: values.ruolo_contatto === "" ? null : values.ruolo_contatto,
      note: values.note === "" ? null : values.note,
      updated_at: now,
    };

    const { error } = await supabase
      .from("rubrica_punti_servizio")
      .update(contactData)
      .eq("id", selectedContact.id);

    if (error) {
      toast.error("Errore durante l'aggiornamento del contatto: " + error.message);
    } else {
      toast.success("Contatto aggiornato con successo!");
      fetchContacts();
      setIsEditDialogOpen(false);
      setSelectedContact(null);
    }
    setIsSubmitting(false);
  };

  const handleDeleteContact = async (contactId: string) => {
    setIsSubmitting(true);
    const { error } = await supabase
      .from("rubrica_punti_servizio")
      .delete()
      .eq("id", contactId);

    if (error) {
      toast.error("Errore durante l'eliminazione del contatto: " + error.message);
    } else {
      toast.success("Contatto eliminato con successo!");
      fetchContacts();
    }
    setIsSubmitting(false);
  };

  if (isSessionLoading) {
    return null; // SessionContextProvider gestisce lo stato di caricamento
  }

  // Access check for the page itself (any authenticated user can view)
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
            <Link href="/anagrafiche/punti-servizio">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Rubrica Punto Servizio</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Gestisci i contatti della rubrica per il punto servizio con ID: <span className="font-semibold">{puntoServizioId}</span>.
        </p>

        <div className="flex justify-end mb-4">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={isSubmitting || !hasWriteAccess} onClick={() => setSelectedContact(null)}>
                <PlusCircle className="h-4 w-4 mr-2" /> Aggiungi Contatto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{selectedContact ? "Modifica Contatto" : "Aggiungi Nuovo Contatto"}</DialogTitle>
                <DialogDescription>
                  {selectedContact ? "Apporta modifiche al contatto selezionato." : "Aggiungi un nuovo contatto alla rubrica di questo punto servizio."}
                </DialogDescription>
              </DialogHeader>
              <RubricaContactForm
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
            <p className="text-lg font-medium">Nessun contatto trovato per questo punto servizio.</p>
            <p className="text-sm">Utilizza il pulsante "Aggiungi Contatto" per iniziare.</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome Contatto</TableHead>
                  <TableHead>Ruolo</TableHead>
                  <TableHead>Telefono</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">{contact.nome_contatto}</TableCell>
                    <TableCell>{contact.ruolo_contatto || "N/A"}</TableCell>
                    <TableCell>{contact.telefono || "N/A"}</TableCell>
                    <TableCell>{contact.email || "N/A"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
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
                          title="Modifica contatto"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={isSubmitting || !hasDeleteAccess}
                              title="Elimina contatto"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Sei assolutamente sicuro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Questa azione non può essere annullata. Verrà eliminato permanentemente il contatto "{contact.nome_contatto}" dalla rubrica.
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