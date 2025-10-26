"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useSession } from "@/components/session-context-provider";
import { ShieldAlert, Search, Loader2, Trash, Edit, PlusCircle, UserRound } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { format } from "date-fns";
import { it } from "date-fns/locale"; // Importa la locale italiana

interface Personale {
  id: string;
  nome: string;
  cognome: string;
  codice_fiscale: string | null;
  ruolo: string | null;
  telefono: string | null;
  email: string | null;
  data_nascita: string | null; // ISO string for date
  luogo_nascita: string | null;
  indirizzo: string | null;
  cap: string | null;
  citta: string | null;
  provincia: string | null;
  data_assunzione: string | null; // ISO string for date
  data_cessazione: string | null; // ISO string for date
  attivo: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export default function PersonalePage() {
  const { profile: currentUserProfile, isLoading: isSessionLoading } = useSession();
  const [personale, setPersonale] = useState<Personale[]>([]);
  const [loading, setLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const hasAccess =
    currentUserProfile?.role === "super_admin" ||
    currentUserProfile?.role === "amministrazione" ||
    currentUserProfile?.role === "responsabile_operativo" ||
    currentUserProfile?.role === "operativo";

  useEffect(() => {
    if (!isSessionLoading && hasAccess) {
      fetchPersonale();
    }
  }, [isSessionLoading, hasAccess]);

  const fetchPersonale = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("personale")
      .select("*")
      .order("cognome", { ascending: true });

    if (error) {
      toast.error("Errore nel recupero del personale: " + error.message);
    } else {
      setPersonale(data || []);
    }
    setLoading(false);
  };

  const handleDeletePersonale = async (personaleId: string) => {
    setIsActionLoading(true);
    const { error } = await supabase
      .from("personale")
      .delete()
      .eq("id", personaleId);

    if (error) {
      toast.error("Errore nell'eliminazione del personale: " + error.message);
    } else {
      toast.success("Personale eliminato con successo!");
      fetchPersonale();
    }
    setIsActionLoading(false);
  };

  const handleToggleActive = async (personaleId: string, currentStatus: boolean) => {
    setIsActionLoading(true);
    const { error } = await supabase
      .from("personale")
      .update({ attivo: !currentStatus, updated_at: new Date().toISOString() })
      .eq("id", personaleId);

    if (error) {
      toast.error("Errore nell'aggiornamento dello stato: " + error.message);
    } else {
      toast.success("Stato personale aggiornato con successo!");
      fetchPersonale();
    }
    setIsActionLoading(false);
  };

  const filteredPersonale = personale.filter((p) =>
    p.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cognome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.ruolo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isSessionLoading) {
    return null;
  }

  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full text-center">
          <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Accesso Negato</h2>
          <p className="text-sm text-muted-foreground">Non hai i permessi necessari per visualizzare questa pagina.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Gestione Personale</h1>
          <Button asChild disabled={isActionLoading}>
            <Link href="/anagrafiche/personale/new">
              <PlusCircle className="h-4 w-4 mr-2" /> Nuovo Personale
            </Link>
          </Button>
        </div>
        <p className="text-base text-muted-foreground mb-8">
          Gestisci l'elenco del personale.
        </p>

        <div className="mb-6 flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cerca personale per nome, cognome, ruolo o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          {loading && <Loader2 className="h-6 w-6 animate-spin text-primary ml-4" />}
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cognome</TableHead>
                <TableHead>Ruolo</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Attivo</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPersonale.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Nessun personale trovato.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPersonale.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nome}</TableCell>
                    <TableCell>{p.cognome}</TableCell>
                    <TableCell>{p.ruolo || "N/A"}</TableCell>
                    <TableCell>{p.email || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 text-sm">
                        <Switch
                          id={`attivo-${p.id}`}
                          checked={p.attivo}
                          onCheckedChange={() => handleToggleActive(p.id, p.attivo)}
                          disabled={isActionLoading}
                        />
                        <Label htmlFor={`attivo-${p.id}`}>
                          {p.attivo ? "Sì" : "No"}
                        </Label>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          disabled={isActionLoading}
                          title="Modifica personale"
                        >
                          <Link href={`/anagrafiche/personale/${p.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={isActionLoading || !(currentUserProfile?.role === "super_admin" || currentUserProfile?.role === "amministrazione")}
                              title="Elimina personale"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Sei assolutamente sicuro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Questa azione non può essere annullata. Verrà eliminato permanentemente il personale "{p.nome} {p.cognome}" e tutti i dati associati.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeletePersonale(p.id)}>
                                Elimina
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}