"use client";

import React from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useSession } from "@/components/session-context-provider";
import { ShieldAlert, Palette } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "next-themes";
import { Label } from "@/components/ui/label"; // Import Label component

export default function AppearanceSettingsPage() {
  const { profile, isLoading } = useSession();
  const { setTheme, theme } = useTheme(); // Get setTheme and current theme from next-themes

  if (isLoading) {
    return null;
  }

  const hasAccess =
    profile?.role === "super_admin" ||
    profile?.role === "amministrazione" ||
    profile?.role === "responsabile_operativo" ||
    profile?.role === "operativo" ||
    profile?.role === "pending_approval";

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
          <h1 className="text-2xl font-bold">Aspetto</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Personalizza il tema e l'aspetto dell'interfaccia utente.
        </p>

        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="h-4 w-4 text-muted-foreground" /> Personalizza Aspetto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <Label htmlFor="theme-select" className="text-sm">Tema</Label>
                <Select value={theme} onValueChange={(value) => setTheme(value)}>
                  <SelectTrigger id="theme-select" className="w-[160px]">
                    <SelectValue placeholder="Seleziona tema" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Chiaro</SelectItem>
                    <SelectItem value="dark">Scuro</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
                <CardDescription className="mt-1 text-xs">
                  Scegli il tema dell'applicazione (chiaro, scuro o basato sulle impostazioni di sistema).
                </CardDescription>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}