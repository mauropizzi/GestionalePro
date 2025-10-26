"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useSession } from "@/components/session-context-provider";
import { ShieldAlert, Search, Loader2, Trash, Edit, PlusCircle } from "lucide-react";
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

interface Supplier {
  id: string;
  ragione_sociale: string;
  partita_iva: string | null;
  codice_fiscale: string | null;
  indirizzo: string | null;
  cap: string | null;
  citta: string | null;
  provincia: string | null;
  telefono: string | null;
  email: string | null;
  pec: string | null;
  tipo_servizio: string | null;
  attivo: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export default function FornitoriPage() {
  const { profile: currentUserProfile, isLoading: isSessionLoading } = useSession();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
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
      fetchSuppliers();
    }
  }, [isSessionLoading, hasAccess]);

  const fetchSuppliers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("fornitori")
      .select("*")
      .order("ragione_sociale", { ascending: true });

    if (error) {
      toast.error("Errore nel recupero dei fornitori: " + error.message);
    } else {
      setSuppliers(data || []);
    }
    setLoading(false);
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    setIsActionLoading(true);
    const { error } = await supabase
      .from("fornitori")
      .delete()
      .eq("id", supplierId);

    if (error) {
      toast.error("Errore nell'eliminazione del fornitore: " + error.message);
    } else {
      toast.success("Fornitore eliminato con successo!");
      fetchSuppliers();
    }
    setIsActionLoading(false);
  };

  const handleToggleActive = async (supplierId: string, currentStatus: boolean) => {
    setIsActionLoading(true);
    const { error } = await supabase
      .from("fornitori")
      .update({ attivo: !currentStatus, updated_at: new Date().toISOString() })
      .eq("id", supplierId);

    if (error) {
      toast.error("Errore nell'aggiornamento dello stato: " + error.message);
    } else {
      toast.success("Stato fornitore aggiornato con successo!");
      fetchSuppliers();
    }
    setIsActionLoading(false);
  };

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.ragione_sociale?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.codice_fiscale?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.partita_iva?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.citta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.tipo_servizio?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-2xl font-bold">Gestione Fornitori</h1>
          <Button asChild disabled={isActionLoading}>
            <Link href="/anagrafiche/fornitori/new">
              <PlusCircle className="h-4 w-4 mr-2" /> Nuovo Fornitore
            </Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Gestisci le anagrafiche dei tuoi fornitori.
        </p>

        <div className="mb-4 flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cerca fornitori per ragione sociale, P.IVA, città, tipo servizio..."
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
                <TableHead>Partita IVA</TableHead>
                <TableHead>Tipo Servizio</TableHead>
                <TableHead>Città</TableHead>
                <TableHead>Attivo</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                    Nessun fornitore trovato.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.ragione_sociale}</TableCell>
                    <TableCell>{supplier.partita_iva || "N/A"}</TableCell>
                    <TableCell>{supplier.tipo_servizio || "N/A"}</TableCell>
                    <TableCell>{supplier.citta || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 text-xs">
                        <Switch
                          id={`attivo-${supplier.id}`}
                          checked={supplier.attivo}
                          onCheckedChange={() => handleToggleActive(supplier.id, supplier.attivo)}
                          disabled={isActionLoading}
                        />
                        <Label htmlFor={`attivo-${supplier.id}`}>
                          {supplier.attivo ? "Sì" : "No"}
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
                          title="Modifica fornitore"
                        >
                          <Link href={`/anagrafiche/fornitori/${supplier.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={isActionLoading || !(currentUserProfile?.role === "super_admin" || currentUserProfile?.role === "amministrazione")}
                              title="Elimina fornitore"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Sei assolutamente sicuro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Questa azione non può essere annullata. Verrà eliminato permanentemente il fornitore "{supplier.ragione_sociale}" e tutti i dati associati.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteSupplier(supplier.id)}>
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