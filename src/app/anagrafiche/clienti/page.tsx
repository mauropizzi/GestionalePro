"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useSession } from "@/components/session-context-provider";
import { ShieldAlert, Search, Loader2, Trash, Edit, PlusCircle, CheckCircle, XCircle, Phone } from "lucide-react";
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
import Link from "next/link"; // Import Link for navigation

interface Client {
  id: string;
  ragione_sociale: string;
  codice_fiscale: string | null;
  partita_iva: string | null;
  indirizzo: string | null;
  citta: string | null;
  cap: string | null;
  provincia: string | null;
  telefono: string | null;
  email: string | null;
  pec: string | null;
  sdi: string | null;
  attivo: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
  codice_cliente_custom: string | null; // Nuovo campo
}

export default function ClientiPage() {
  const { profile: currentUserProfile, isLoading: isSessionLoading } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
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
      fetchClients();
    }
  }, [isSessionLoading, hasAccess]);

  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("clienti")
      .select("*")
      .order("ragione_sociale", { ascending: true });

    if (error) {
      toast.error("Errore nel recupero dei clienti: " + error.message);
    } else {
      setClients(data || []);
    }
    setLoading(false);
  };

  const handleDeleteClient = async (clientId: string) => {
    setIsActionLoading(true);
    const { error } = await supabase
      .from("clienti")
      .delete()
      .eq("id", clientId);

    if (error) {
      toast.error("Errore nell'eliminazione del cliente: " + error.message);
    } else {
      toast.success("Cliente eliminato con successo!");
      fetchClients();
    }
    setIsActionLoading(false);
  };

  const handleToggleActive = async (clientId: string, currentStatus: boolean) => {
    setIsActionLoading(true);
    const { error } = await supabase
      .from("clienti")
      .update({ attivo: !currentStatus, updated_at: new Date().toISOString() })
      .eq("id", clientId);

    if (error) {
      toast.error("Errore nell'aggiornamento dello stato: " + error.message);
    } else {
      toast.success("Stato cliente aggiornato con successo!");
      fetchClients();
    }
    setIsActionLoading(false);
  };

  const filteredClients = clients.filter((client) =>
    client.ragione_sociale?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.codice_fiscale?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.partita_iva?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.citta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.codice_cliente_custom?.toLowerCase().includes(searchTerm.toLowerCase()) // Include custom code in search
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
          <h1 className="text-2xl font-bold">Gestione Clienti</h1>
          <Button asChild disabled={isActionLoading}>
            <Link href="/anagrafiche/clienti/new">
              <PlusCircle className="h-4 w-4 mr-2" /> Nuovo Cliente
            </Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Gestisci le anagrafiche dei tuoi clienti.
        </p>

        <div className="mb-4 flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cerca clienti per ragione sociale, codice fiscale, P.IVA, città, codice personalizzato..."
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
                <TableHead>Ragione Sociale</TableHead>
                <TableHead>Codice Personalizzato</TableHead> {/* Nuova colonna */}
                <TableHead>Codice Fiscale</TableHead>
                <TableHead>Partita IVA</TableHead>
                <TableHead>Città</TableHead>
                <TableHead>Attivo</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-20 text-center text-muted-foreground">
                    Nessun cliente trovato.
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.ragione_sociale}</TableCell>
                    <TableCell>{client.codice_cliente_custom || "N/A"}</TableCell> {/* Mostra il nuovo campo */}
                    <TableCell>{client.codice_fiscale || "N/A"}</TableCell>
                    <TableCell>{client.partita_iva || "N/A"}</TableCell>
                    <TableCell>{client.citta || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 text-xs">
                        <Switch
                          id={`attivo-${client.id}`}
                          checked={client.attivo}
                          onCheckedChange={() => handleToggleActive(client.id, client.attivo)}
                          disabled={isActionLoading}
                        />
                        <Label htmlFor={`attivo-${client.id}`}>
                          {client.attivo ? "Sì" : "No"}
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
                          title="Visualizza rubrica"
                        >
                          <Link href={`/anagrafiche/clienti/${client.id}/rubrica`}>
                            <Phone className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          disabled={isActionLoading}
                          title="Modifica cliente"
                        >
                          <Link href={`/anagrafiche/clienti/${client.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={isActionLoading || !(currentUserProfile?.role === "super_admin" || currentUserProfile?.role === "amministrazione")}
                              title="Elimina cliente"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Sei assolutamente sicuro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Questa azione non può essere annullata. Verrà eliminato permanentemente il cliente "{client.ragione_sociale}" e tutti i dati associati.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteClient(client.id)}>
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