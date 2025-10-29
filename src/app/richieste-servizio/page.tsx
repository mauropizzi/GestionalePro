"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useSession } from "@/components/session-context-provider";
import { ShieldAlert, Search, Loader2, Trash, Edit, PlusCircle, Briefcase } from "lucide-react";
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
import { ServiceType } from "@/lib/richieste-servizio-utils";
import { InspectionDetails } from "@/types/richieste-servizio";

interface RichiestaServizio {
  id: string;
  client_id: string | null;
  punto_servizio_id: string | null;
  fornitore_id: string | null;
  tipo_servizio: ServiceType;
  data_inizio_servizio: string | null;
  data_fine_servizio: string | null;
  numero_agenti: number | null;
  note: string | null;
  status: string;
  total_hours_calculated: number | null;
  created_at: string;
  updated_at: string;
  clienti?: { ragione_sociale: string } | null;
  punti_servizio?: { nome_punto_servizio: string } | null;
  fornitori?: { ragione_sociale: string } | null;
  inspection_details?: InspectionDetails[];
}

export default function RichiesteServizioPage() {
  const { profile: currentUserProfile, isLoading: isSessionLoading } = useSession();
  const [richieste, setRichieste] = useState<RichiestaServizio[]>([]);
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
      fetchRichiesteServizio();
    }
  }, [isSessionLoading, hasAccess]);

  const fetchRichiesteServizio = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("richieste_servizio")
      .select(`
        *,
        clienti ( ragione_sociale ),
        punti_servizio ( nome_punto_servizio ),
        fornitori ( ragione_sociale ),
        inspection_details:richieste_servizio_ispezioni(*)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Errore nel recupero delle richieste di servizio: " + error.message);
    } else {
      setRichieste(data || []);
    }
    setLoading(false);
  };

  const handleDeleteRichiesta = async (richiestaId: string) => {
    setIsActionLoading(true);
    const { error } = await supabase
      .from("richieste_servizio")
      .delete()
      .eq("id", richiestaId);

    if (error) {
      toast.error("Errore nell'eliminazione della richiesta di servizio: " + error.message);
    } else {
      toast.success("Richiesta di servizio eliminata con successo!");
      fetchRichiesteServizio();
    }
    setIsActionLoading(false);
  };

  const filteredRichieste = richieste.filter((richiesta) =>
    richiesta.tipo_servizio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    richiesta.clienti?.ragione_sociale?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    richiesta.punti_servizio?.nome_punto_servizio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    richiesta.fornitori?.ragione_sociale?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    richiesta.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (richiesta.tipo_servizio === "ISPEZIONI" && richiesta.inspection_details?.[0]?.tipo_ispezione?.toLowerCase().includes(searchTerm.toLowerCase()))
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
          <h1 className="text-2xl font-bold">Gestione Richieste di Servizio</h1>
          <Button asChild disabled={isActionLoading}>
            <Link href="/richieste-servizio/new">
              <PlusCircle className="h-4 w-4 mr-2" /> Nuova Richiesta
            </Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Gestisci le richieste di servizio dei clienti.
        </p>

        <div className="mb-4 flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cerca richieste per tipo servizio, cliente, punto servizio, fornitore, stato..."
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
                <TableHead>Dettagli Servizio</TableHead> {/* Nuova colonna per i dettagli */}
                <TableHead>Stato</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRichieste.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-20 text-center text-muted-foreground">
                    Nessuna richiesta di servizio trovata.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRichieste.map((richiesta) => (
                  <TableRow key={richiesta.id}>
                    <TableCell className="font-medium">
                      {richiesta.tipo_servizio.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </TableCell>
                    <TableCell>{richiesta.clienti?.ragione_sociale || "N/A"}</TableCell>
                    <TableCell>{richiesta.punti_servizio?.nome_punto_servizio || "N/A"}</TableCell>
                    <TableCell>{richiesta.fornitori?.ragione_sociale || "N/A"}</TableCell>
                    <TableCell className="text-xs">
                      {richiesta.tipo_servizio === "ISPEZIONI" && richiesta.inspection_details?.[0] ? (
                        <>
                          <div>Data: {format(new Date(richiesta.inspection_details[0].data_servizio), "dd/MM/yyyy", { locale: it })}</div>
                          <div>Fascia: {richiesta.inspection_details[0].ora_inizio_fascia} - {richiesta.inspection_details[0].ora_fine_fascia}</div>
                          <div>Cadenza: {richiesta.inspection_details[0].cadenza_ore}h, Tipo: {richiesta.inspection_details[0].tipo_ispezione}</div>
                        </>
                      ) : (
                        <>
                          <div>Inizio: {richiesta.data_inizio_servizio ? format(new Date(richiesta.data_inizio_servizio), "dd/MM/yyyy HH:mm", { locale: it }) : "N/A"}</div>
                          <div>Fine: {richiesta.data_fine_servizio ? format(new Date(richiesta.data_fine_servizio), "dd/MM/yyyy HH:mm", { locale: it }) : "N/A"}</div>
                          <div>Agenti: {richiesta.numero_agenti || "N/A"}</div>
                        </>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        richiesta.status === 'approved' ? 'bg-green-100 text-green-800' :
                        richiesta.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {richiesta.status.charAt(0).toUpperCase() + richiesta.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          disabled={isActionLoading}
                          title="Modifica richiesta"
                        >
                          <Link href={`/richieste-servizio/${richiesta.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={isActionLoading || !(currentUserProfile?.role === "super_admin" || currentUserProfile?.role === "amministrazione")}
                              title="Elimina richiesta"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Sei assolutamente sicuro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Questa azione non può essere annullata. Verrà eliminata permanentemente la richiesta di servizio e tutti i dati associati.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteRichiesta(richiesta.id)}>
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