"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useSession } from "@/components/session-context-provider";
import { ShieldAlert, Search, Loader2, Trash, Edit, PlusCircle, User } from "lucide-react";
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

interface NetworkOperator {
  id: string;
  nome: string;
  cognome: string;
  cliente_id: string | null;
  telefono: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
  clienti?: { ragione_sociale: string }[] | null; // Modificato a un array di oggetti
}

export default function OperatoriNetworkPage() {
  const { profile: currentUserProfile, isLoading: isSessionLoading } = useSession();
  const [operators, setOperators] = useState<NetworkOperator[]>([]);
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
      fetchNetworkOperators();
    }
  }, [isSessionLoading, hasAccess]);

  const fetchNetworkOperators = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("operatori_network")
      .select(`
        id,
        nome,
        cognome,
        cliente_id,
        telefono,
        email,
        created_at,
        updated_at,
        clienti ( ragione_sociale )
      `)
      .order("cognome", { ascending: true });

    if (error) {
      toast.error("Errore nel recupero degli operatori network: " + error.message);
    } else {
      setOperators(data as NetworkOperator[] || []); // Cast esplicito
    }
    setLoading(false);
  };

  const handleDeleteOperator = async (operatorId: string) => {
    setIsActionLoading(true);
    const { error } = await supabase
      .from("operatori_network")
      .delete()
      .eq("id", operatorId);

    if (error) {
      toast.error("Errore nell'eliminazione dell'operatore network: " + error.message);
    } else {
      toast.success("Operatore network eliminato con successo!");
      fetchNetworkOperators();
    }
    setIsActionLoading(false);
  };

  const filteredOperators = operators.filter((operator) =>
    operator.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    operator.cognome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    operator.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    operator.clienti?.[0]?.ragione_sociale?.toLowerCase().includes(searchTerm.toLowerCase()) // Accesso al primo elemento dell'array
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
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Gestione Operatori Network</h1>
          <Button asChild disabled={isActionLoading}>
            <Link href="/anagrafiche/operatori-network/new">
              <PlusCircle className="h-4 w-4 mr-2" /> Nuovo Operatore
            </Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Gestisci gli operatori network associati ai clienti.
        </p>

        <div className="mb-4 flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cerca operatori per nome, cognome, email o cliente..."
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
                <TableHead>Cliente</TableHead>
                <TableHead>Telefono</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOperators.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                    Nessun operatore network trovato.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOperators.map((operator) => (
                  <TableRow key={operator.id}>
                    <TableCell className="font-medium">{operator.nome}</TableCell>
                    <TableCell>{operator.cognome}</TableCell>
                    <TableCell>{operator.clienti?.[0]?.ragione_sociale || "N/A"}</TableCell> {/* Accesso al primo elemento dell'array */}
                    <TableCell>{operator.telefono || "N/A"}</TableCell>
                    <TableCell>{operator.email || "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          disabled={isActionLoading}
                          title="Modifica operatore"
                        >
                          <Link href={`/anagrafiche/operatori-network/${operator.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={isActionLoading || !(currentUserProfile?.role === "super_admin" || currentUserProfile?.role === "amministrazione")}
                              title="Elimina operatore"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Sei assolutamente sicuro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Questa azione non può essere annullata. Verrà eliminato permanentemente l'operatore "{operator.nome} {operator.cognome}" e tutti i dati associati.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteOperator(operator.id)}>
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