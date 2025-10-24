"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useSession } from "@/components/session-context-provider";
import { ShieldAlert, Search, Loader2, Trash, Edit, PlusCircle, FileText } from "lucide-react";
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

interface Procedura {
  id: string;
  nome_procedura: string;
  descrizione: string | null;
  versione: string | null;
  data_ultima_revisione: string | null; // ISO string for date
  responsabile: string | null;
  documento_url: string | null;
  attivo: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export default function ProcedurePage() {
  const { profile: currentUserProfile, isLoading: isSessionLoading } = useSession();
  const [procedure, setProcedure] = useState<Procedura[]>([]);
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
      fetchProcedure();
    }
  }, [isSessionLoading, hasAccess]);

  const fetchProcedure = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("procedure")
      .select("*")
      .order("nome_procedura", { ascending: true });

    if (error) {
      toast.error("Errore nel recupero delle procedure: " + error.message);
    } else {
      setProcedure(data || []);
    }
    setLoading(false);
  };

  const handleDeleteProcedura = async (proceduraId: string) => {
    setIsActionLoading(true);
    const { error } = await supabase
      .from("procedure")
      .delete()
      .eq("id", proceduraId);

    if (error) {
      toast.error("Errore nell'eliminazione della procedura: " + error.message);
    } else {
      toast.success("Procedura eliminata con successo!");
      fetchProcedure();
    }
    setIsActionLoading(false);
  };

  const handleToggleActive = async (proceduraId: string, currentStatus: boolean) => {
    setIsActionLoading(true);
    const { error } = await supabase
      .from("procedure")
      .update({ attivo: !currentStatus, updated_at: new Date().toISOString() })
      .eq("id", proceduraId);

    if (error) {
      toast.error("Errore nell'aggiornamento dello stato: " + error.message);
    } else {
      toast.success("Stato procedura aggiornato con successo!");
      fetchProcedure();
    }
    setIsActionLoading(false);
  };

  const filteredProcedure = procedure.filter((p) =>
    p.nome_procedura?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.descrizione?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.responsabile?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.versione?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isSessionLoading) {
    return null;
  }

  if (!hasAccess) {
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
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold">Gestione Procedure</h1>
          <Button asChild disabled={isActionLoading}>
            <Link href="/anagrafiche/procedure/new">
              <PlusCircle className="h-4 w-4 mr-2" /> Nuova Procedura
            </Link>
          </Button>
        </div>
        <p className="text-lg text-muted-foreground mb-8">
          Gestisci l'elenco delle procedure aziendali.
        </p>

        <div className="mb-6 flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cerca procedure per nome, descrizione, responsabile o versione..."
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
                <TableHead>Nome Procedura</TableHead>
                <TableHead>Versione</TableHead>
                <TableHead>Responsabile</TableHead>
                <TableHead>Ultima Revisione</TableHead>
                <TableHead>Attivo</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProcedure.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Nessuna procedura trovata.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProcedure.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nome_procedura}</TableCell>
                    <TableCell>{p.versione || "N/A"}</TableCell>
                    <TableCell>{p.responsabile || "N/A"}</TableCell>
                    <TableCell>
                      {p.data_ultima_revisione ? format(new Date(p.data_ultima_revisione), "PPP", { locale: it }) : "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
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
                          title="Modifica procedura"
                        >
                          <Link href={`/anagrafiche/procedure/${p.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={isActionLoading || !(currentUserProfile?.role === "super_admin" || currentUserProfile?.role === "amministrazione")}
                              title="Elimina procedura"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Sei assolutamente sicuro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Questa azione non può essere annullata. Verrà eliminata permanentemente la procedura "{p.nome_procedura}" e tutti i dati associati.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteProcedura(p.id)}>
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