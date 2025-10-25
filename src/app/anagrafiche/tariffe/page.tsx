"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useSession } from "@/components/session-context-provider";
import { ShieldAlert, Search, Loader2, Trash, Edit, PlusCircle, Euro } from "lucide-react";
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
import Link from "next/link";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface Tariffa {
  id: string;
  client_id: string | null;
  tipo_servizio: string;
  importo: number;
  supplier_rate: number | null;
  unita_misura: string | null;
  punto_servizio_id: string | null;
  fornitore_id: string | null;
  data_inizio_validita: string | null;
  data_fine_validita: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  clienti?: { ragione_sociale: string } | null;
  punti_servizio?: { nome_punto_servizio: string } | null;
  fornitori?: { ragione_sociale: string } | null;
}

export default function TariffePage() {
  const { profile: currentUserProfile, isLoading: isSessionLoading } = useSession();
  const [tariffe, setTariffe] = useState<Tariffa[]>([]);
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
      fetchTariffe();
    }
  }, [isSessionLoading, hasAccess]);

  const fetchTariffe = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tariffe")
      .select(`
        *,
        clienti ( ragione_sociale ),
        punti_servizio ( nome_punto_servizio ),
        fornitori ( ragione_sociale )
      `)
      .order("tipo_servizio", { ascending: true });

    if (error) {
      toast.error("Errore nel recupero delle tariffe: " + error.message);
    } else {
      setTariffe(data || []);
    }
    setLoading(false);
  };

  const handleDeleteTariffa = async (tariffaId: string) => {
    setIsActionLoading(true);
    const { error } = await supabase
      .from("tariffe")
      .delete()
      .eq("id", tariffaId);

    if (error) {
      toast.error("Errore nell'eliminazione della tariffa: " + error.message);
    } else {
      toast.success("Tariffa eliminata con successo!");
      fetchTariffe();
    }
    setIsActionLoading(false);
  };

  const filteredTariffe = tariffe.filter((tariffa) =>
    tariffa.tipo_servizio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tariffa.clienti?.ragione_sociale?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tariffa.punti_servizio?.nome_punto_servizio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tariffa.fornitori?.ragione_sociale?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-4xl font-bold">Gestione Tariffe</h1>
          <Button asChild disabled={isActionLoading}>
            <Link href="/anagrafiche/tariffe/new">
              <PlusCircle className="h-4 w-4 mr-2" /> Nuova Tariffa
            </Link>
          </Button>
        </div>
        <p className="text-lg text-muted-foreground mb-8">
          Gestisci le tariffe dei servizi offerti.
        </p>

        <div className="mb-6 flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cerca tariffe per tipo servizio, cliente, punto servizio, fornitore..."
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
                <TableHead>Tipo Servizio</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Punto Servizio</TableHead>
                <TableHead>Fornitore</TableHead>
                <TableHead>Importo</TableHead>
                <TableHead>Validità</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTariffe.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Nessuna tariffa trovata.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTariffe.map((tariffa) => (
                  <TableRow key={tariffa.id}>
                    <TableCell className="font-medium">{tariffa.tipo_servizio}</TableCell>
                    <TableCell>{tariffa.clienti?.ragione_sociale || "N/A"}</TableCell>
                    <TableCell>{tariffa.punti_servizio?.nome_punto_servizio || "N/A"}</TableCell>
                    <TableCell>{tariffa.fornitori?.ragione_sociale || "N/A"}</TableCell>
                    <TableCell>{tariffa.importo} {tariffa.unita_misura || "€"}</TableCell>
                    <TableCell>
                      {tariffa.data_inizio_validita ? format(new Date(tariffa.data_inizio_validita), "dd/MM/yyyy", { locale: it }) : "N/A"} -{" "}
                      {tariffa.data_fine_validita ? format(new Date(tariffa.data_fine_validita), "dd/MM/yyyy", { locale: it }) : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          disabled={isActionLoading}
                          title="Modifica tariffa"
                        >
                          <Link href={`/anagrafiche/tariffe/${tariffa.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={isActionLoading || !(currentUserProfile?.role === "super_admin" || currentUserProfile?.role === "amministrazione")}
                              title="Elimina tariffa"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Sei assolutamente sicuro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Questa azione non può essere annullata. Verrà eliminata permanentemente la tariffa "{tariffa.tipo_servizio}" e tutti i dati associati.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteTariffa(tariffa.id)}>
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