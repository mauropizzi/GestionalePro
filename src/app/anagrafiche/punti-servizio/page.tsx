"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useSession } from "@/components/session-context-provider";
import { ShieldAlert, Search, Loader2, Trash, Edit, PlusCircle, Phone } from "lucide-react"; // Aggiunto Phone
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

interface PuntoServizio {
  id: string;
  nome_punto_servizio: string;
  id_cliente: string | null;
  indirizzo: string | null;
  citta: string | null;
  cap: string | null;
  provincia: string | null;
  referente: string | null;
  telefono_referente: string | null;
  telefono: string | null;
  email: string | null;
  note: string | null;
  tempo_intervento: string | null;
  fornitore_id: string | null;
  codice_cliente: string | null;
  codice_sicep: string | null;
  codice_fatturazione: string | null;
  latitude: number | null;
  longitude: number | null;
  nome_procedura: string | null;
  created_at: string;
  updated_at: string;
  clienti?: { ragione_sociale: string } | null;
  fornitori?: { ragione_sociale: string } | null;
}

export default function PuntiServizioPage() {
  const { profile: currentUserProfile, isLoading: isSessionLoading } = useSession();
  const [puntiServizio, setPuntiServizio] = useState<PuntoServizio[]>([]);
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
      fetchPuntiServizio();
    }
  }, [isSessionLoading, hasAccess]);

  const fetchPuntiServizio = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("punti_servizio")
      .select(`
        *,
        clienti ( ragione_sociale ),
        fornitori ( ragione_sociale )
      `)
      .order("nome_punto_servizio", { ascending: true });

    if (error) {
      toast.error("Errore nel recupero dei punti di servizio: " + error.message);
    } else {
      setPuntiServizio(data || []);
    }
    setLoading(false);
  };

  const handleDeletePuntoServizio = async (puntoServizioId: string) => {
    setIsActionLoading(true);
    const { error } = await supabase
      .from("punti_servizio")
      .delete()
      .eq("id", puntoServizioId);

    if (error) {
      toast.error("Errore nell'eliminazione del punto di servizio: " + error.message);
    } else {
      toast.success("Punto di servizio eliminato con successo!");
      fetchPuntiServizio();
    }
    setIsActionLoading(false);
  };

  const filteredPuntiServizio = puntiServizio.filter((punto) =>
    punto.nome_punto_servizio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    punto.clienti?.ragione_sociale?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    punto.citta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    punto.referente?.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Gestione Punti Servizio</h1>
          <Button asChild disabled={isActionLoading}>
            <Link href="/anagrafiche/punti-servizio/new">
              <PlusCircle className="h-4 w-4 mr-2" /> Nuovo Punto Servizio
            </Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Gestisci i punti di servizio associati ai clienti.
        </p>

        <div className="mb-4 flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cerca punti servizio per nome, cliente, città, referente..."
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
                <TableHead>Nome Punto Servizio</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Città</TableHead>
                <TableHead>Referente</TableHead>
                <TableHead>Fornitore</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPuntiServizio.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                    Nessun punto di servizio trovato.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPuntiServizio.map((punto) => (
                  <TableRow key={punto.id}>
                    <TableCell className="font-medium">{punto.nome_punto_servizio}</TableCell>
                    <TableCell>{punto.clienti?.ragione_sociale || "N/A"}</TableCell>
                    <TableCell>{punto.citta || "N/A"}</TableCell>
                    <TableCell>{punto.referente || "N/A"}</TableCell>
                    <TableCell>{punto.fornitori?.ragione_sociale || "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          disabled={isActionLoading}
                          title="Visualizza rubrica"
                        >
                          <Link href={`/anagrafiche/punti-servizio/${punto.id}/rubrica`}>
                            <Phone className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          disabled={isActionLoading}
                          title="Modifica punto servizio"
                        >
                          <Link href={`/anagrafiche/punti-servizio/${punto.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={isActionLoading || !(currentUserProfile?.role === "super_admin" || currentUserProfile?.role === "amministrazione")}
                              title="Elimina punto servizio"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Sei assolutamente sicuro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Questa azione non può essere annullata. Verrà eliminato permanentemente il punto di servizio "{punto.nome_punto_servizio}" e tutti i dati associati.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeletePuntoServizio(punto.id)}>
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