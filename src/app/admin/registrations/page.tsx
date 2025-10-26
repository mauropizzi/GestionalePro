"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useSession } from "@/components/session-context-provider";
import { ShieldAlert, CheckCircle, XCircle, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { USER_ROLES, REGISTRATION_STATUSES } from "@/lib/constants";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: string;
  registration_status: string;
  email?: string;
}

export default function AdminRegistrationsPage() {
  const { profile: currentUserProfile, isLoading: isSessionLoading } = useSession();
  const [pendingUsers, setPendingUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("operativo"); // Ruolo predefinito per l'approvazione

  const hasAccess =
    currentUserProfile?.role === "super_admin" ||
    currentUserProfile?.role === "amministrazione";

  useEffect(() => {
    if (!isSessionLoading && hasAccess) {
      fetchPendingUsers();
    }
  }, [isSessionLoading, hasAccess]);

  const fetchPendingUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("registration_status", "pending");

    if (error) {
      toast.error("Errore nel recupero delle registrazioni in attesa: " + error.message);
    } else {
      setPendingUsers(data || []);
    }
    setLoading(false);
  };

  const handleApproveUser = async (userId: string) => {
    setIsActionLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ registration_status: "approved", role: selectedRole })
      .eq("id", userId);

    if (error) {
      toast.error("Errore nell'approvazione dell'utente: " + error.message);
    } else {
      toast.success("Utente approvato con successo e ruolo assegnato!");
      fetchPendingUsers();
    }
    setIsActionLoading(false);
  };

  const handleRejectUser = async (userId: string) => {
    setIsActionLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ registration_status: "rejected" })
      .eq("id", userId);

    if (error) {
      toast.error("Errore nel rifiuto dell'utente: " + error.message);
    } else {
      toast.success("Registrazione utente rifiutata.");
      fetchPendingUsers();
    }
    setIsActionLoading(false);
  };

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
        <h1 className="text-2xl font-bold mb-4 text-center">Approvazione Registrazioni</h1>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
            <CheckCircle className="h-10 w-10 text-green-500 mb-3" />
            <p className="text-sm">Nessuna registrazione in attesa di approvazione.</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cognome</TableHead>
                  <TableHead>Ruolo Attuale</TableHead>
                  <TableHead>Stato Registrazione</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.first_name || "N/A"}</TableCell>
                    <TableCell>{user.last_name || "N/A"}</TableCell>
                    <TableCell>{user.role.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.registration_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''
                      }`}>
                        {user.registration_status.charAt(0).toUpperCase() + user.registration_status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isActionLoading}
                              title="Approva utente"
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Approva Registrazione</AlertDialogTitle>
                              <AlertDialogDescription>
                                Seleziona il ruolo da assegnare a {user.first_name} {user.last_name} e conferma l'approvazione.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="py-3">
                              <Select
                                value={selectedRole}
                                onValueChange={setSelectedRole}
                                disabled={isActionLoading}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Seleziona Ruolo" />
                                </SelectTrigger>
                                <SelectContent>
                                  {USER_ROLES.filter(role => role !== 'pending_approval').map((role) => (
                                    <SelectItem key={role} value={role}>
                                      {role.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleApproveUser(user.id)}>
                                Approva
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={isActionLoading}
                              title="Rifiuta utente"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Sei assolutamente sicuro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Questa azione rifiuterà la registrazione di {user.first_name} {user.last_name}. L'utente non potrà accedere all'applicazione.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleRejectUser(user.id)}>
                                Rifiuta
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