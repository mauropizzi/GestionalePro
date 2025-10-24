"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useSession } from "@/components/session-context-provider";
import { ShieldAlert, Search, Loader2, Trash, KeyRound, Edit } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { USER_ROLES } from "@/lib/constants";
import { EditUserDialog } from "@/components/edit-user-dialog"; // Importa il nuovo componente

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: string;
  registration_status: string;
  email?: string; // Aggiunto per comodità, anche se non direttamente nel profilo
}

export default function AdminUsersPage() {
  const { profile: currentUserProfile, isLoading: isSessionLoading } = useSession();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUserToEdit, setSelectedUserToEdit] = useState<Profile | null>(null);

  const hasAccess =
    currentUserProfile?.role === "super_admin" ||
    currentUserProfile?.role === "amministrazione";

  useEffect(() => {
    if (!isSessionLoading && hasAccess) {
      fetchUsers();
    }
  }, [isSessionLoading, hasAccess]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("*");

    if (profilesError) {
      toast.error("Errore nel recupero dei profili: " + profilesError.message);
      setLoading(false);
      return;
    }

    setUsers(profilesData || []);
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setIsActionLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) {
      toast.error("Errore nell'aggiornamento del ruolo: " + error.message);
    } else {
      toast.success("Ruolo utente aggiornato con successo!");
      fetchUsers(); // Ricarica gli utenti per mostrare il ruolo aggiornato
    }
    setIsActionLoading(false);
  };

  const handlePasswordReset = async (userId: string) => {
    setIsActionLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/reset-user-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${currentUserProfile?.id}`, // Placeholder, in realtà si userebbe un token valido
            "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          },
          body: JSON.stringify({ userId }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Errore nel reset della password");
      }

      toast.success("Link per il reset della password inviato all'utente.");
    } catch (error: any) {
      toast.error("Errore nel reset della password: " + error.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setIsActionLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${currentUserProfile?.id}`, // Placeholder, in realtà si userebbe un token valido
            "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          },
          body: JSON.stringify({ userId }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Errore nell'eliminazione dell'utente");
      }

      toast.success("Utente eliminato con successo!");
      fetchUsers(); // Ricarica gli utenti
    } catch (error: any) {
      toast.error("Errore nell'eliminazione dell'utente: " + error.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEditClick = (user: Profile) => {
    setSelectedUserToEdit(user);
    setIsEditDialogOpen(true);
  };

  const handleUserUpdated = () => {
    fetchUsers(); // Ricarica gli utenti dopo la modifica
  };

  const filteredUsers = users.filter((user) =>
    (user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isSessionLoading) {
    return null; // Il layout gestisce già lo stato di caricamento
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
        <h1 className="text-4xl font-bold mb-6 text-center">Gestione Utenti</h1>

        <div className="mb-6 flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cerca utenti per nome, cognome o ruolo..."
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
                <TableHead>Stato Registrazione</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Nessun utente trovato.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.first_name || "N/A"}</TableCell>
                    <TableCell>{user.last_name || "N/A"}</TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                        disabled={isActionLoading || user.id === currentUserProfile?.id} // Non permettere di cambiare il proprio ruolo
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Seleziona Ruolo" />
                        </SelectTrigger>
                        <SelectContent>
                          {USER_ROLES.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.registration_status === 'approved' ? 'bg-green-100 text-green-800' :
                        user.registration_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {user.registration_status.charAt(0).toUpperCase() + user.registration_status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(user)}
                          disabled={isActionLoading}
                          title="Modifica utente"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePasswordReset(user.id)}
                          disabled={isActionLoading}
                          title="Invia link reset password"
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={isActionLoading || user.id === currentUserProfile?.id} // Non permettere di eliminare se stessi
                              title="Elimina utente"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Sei assolutamente sicuro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Questa azione non può essere annullata. Verrà eliminato permanentemente l'account utente e tutti i dati associati.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
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
      {selectedUserToEdit && (
        <EditUserDialog
          user={selectedUserToEdit}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </DashboardLayout>
  );
}