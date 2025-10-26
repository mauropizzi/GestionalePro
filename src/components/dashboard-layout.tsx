"use client";

import React from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { useSession } from "@/components/session-context-provider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Home,
  Users,
  Settings,
  LogOut,
  UserCog,
  Briefcase,
  ShieldCheck,
  Building2, // Icona per Anagrafiche
  ClipboardList, // Icona per Clienti
  Truck, // Icona per Fornitori
  Network, // Icona per Operatori Network
  UserRound, // Icona per Elenco Personale
  FileText, // Icona per Procedure
  MapPin, // Icona per Punti Servizio
  Euro, // Icona per Tariffe
  FileStack, // Icona per Richieste di Servizio
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile, isLoading } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Errore durante la disconnessione: " + error.message);
    } else {
      toast.success("Disconnessione avvenuta con successo!");
      router.push("/login");
    }
  };

  if (isLoading) {
    return null; // Il SessionContextProvider gestisce già lo stato di caricamento iniziale
  }

  // Definizione dei link della sidebar in base al ruolo
  const navLinks = [
    {
      label: "Dashboard",
      href: "/",
      icon: <Home className="h-4 w-4" />,
      roles: ["super_admin", "amministrazione", "responsabile_operativo", "operativo", "pending_approval"],
    },
    {
      label: "Gestione Utenti",
      href: "/admin/users",
      icon: <Users className="h-4 w-4" />,
      roles: ["super_admin", "amministrazione"],
    },
    {
      label: "Approvazione Registrazioni",
      href: "/admin/registrations",
      icon: <UserCog className="h-4 w-4" />,
      roles: ["super_admin", "amministrazione"],
    },
    {
      label: "Operazioni",
      href: "/operations",
      icon: <Briefcase className="h-4 w-4" />,
      roles: ["super_admin", "amministrazione", "responsabile_operativo", "operativo"],
      subLinks: [
        {
          label: "Richieste di Servizio",
          href: "/richieste-servizio",
          icon: <FileStack className="h-4 w-4" />,
          roles: ["super_admin", "amministrazione", "responsabile_operativo", "operativo"],
        },
      ],
    },
    {
      label: "Anagrafiche",
      icon: <Building2 className="h-4 w-4" />,
      roles: ["super_admin", "amministrazione", "responsabile_operativo", "operativo"],
      subLinks: [
        {
          label: "Clienti",
          href: "/anagrafiche/clienti",
          icon: <ClipboardList className="h-4 w-4" />,
          roles: ["super_admin", "amministrazione", "responsabile_operativo", "operativo"],
        },
        {
          label: "Fornitori",
          href: "/anagrafiche/fornitori",
          icon: <Truck className="h-4 w-4" />,
          roles: ["super_admin", "amministrazione", "responsabile_operativo", "operativo"],
        },
        {
          label: "Operatori Network",
          href: "/anagrafiche/operatori-network",
          icon: <Network className="h-4 w-4" />,
          roles: ["super_admin", "amministrazione", "responsabile_operativo", "operativo"],
        },
        {
          label: "Elenco Personale",
          href: "/anagrafiche/personale",
          icon: <UserRound className="h-4 w-4" />,
          roles: ["super_admin", "amministrazione", "responsabile_operativo", "operativo"],
        },
        {
          label: "Procedure",
          href: "/anagrafiche/procedure",
          icon: <FileText className="h-4 w-4" />,
          roles: ["super_admin", "amministrazione", "responsabile_operativo", "operativo"],
        },
        {
          label: "Punti Servizio",
          href: "/anagrafiche/punti-servizio",
          icon: <MapPin className="h-4 w-4" />,
          roles: ["super_admin", "amministrazione", "responsabile_operativo", "operativo"],
        },
        {
          label: "Tariffe",
          href: "/anagrafiche/tariffe",
          icon: <Euro className="h-4 w-4" />,
          roles: ["super_admin", "amministrazione", "responsabile_operativo", "operativo"],
        },
      ],
    },
    {
      label: "Impostazioni",
      href: "/settings",
      icon: <Settings className="h-4 w-4" />,
      roles: ["super_admin", "amministrazione", "responsabile_operativo", "operativo", "pending_approval"],
    },
  ];

  const filteredNavLinks = navLinks.filter((link) =>
    profile?.role && link.roles.includes(profile.role)
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar className="hidden md:flex">
        <SidebarBody className="flex flex-col justify-between">
          <div className="flex flex-col gap-2">
            <div className="p-4 text-lg font-bold text-sidebar-foreground">
              Gestione Accessi
            </div>
            {profile && (
              <div className="p-4 text-sm text-sidebar-foreground border-b border-sidebar-border">
                <p>Benvenuto, {profile.first_name || "Utente"}!</p>
                <p className="text-xs text-muted-foreground">Ruolo: {profile.role}</p>
                {profile.registration_status === 'pending' && (
                  <p className="text-xs text-destructive">Stato: In attesa di approvazione</p>
                )}
              </div>
            )}
            {filteredNavLinks.map((link, idx) => (
              link.subLinks ? (
                <div key={idx} className="flex flex-col">
                  <SidebarLink href="#" className="text-sidebar-foreground font-semibold">
                    {link.icon} {link.label}
                  </SidebarLink>
                  <div className="ml-6 flex flex-col gap-1">
                    {link.subLinks.filter(subLink => profile?.role && subLink.roles.includes(profile.role)).map((subLink, subIdx) => (
                      <SidebarLink key={subIdx} href={subLink.href} className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                        {subLink.icon} {subLink.label}
                      </SidebarLink>
                    ))}
                  </div>
                </div>
              ) : (
                <SidebarLink key={idx} href={link.href} className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                  {link.icon} {link.label}
                </SidebarLink>
              )
            ))}
          </div>
          <div className="p-4">
            <Button
              onClick={handleLogout}
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              variant="ghost"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Esci
            </Button>
          </div>
        </SidebarBody>
      </Sidebar>
      <main className="flex-1 p-8 bg-background text-foreground">
        {profile?.registration_status === 'pending' && profile.role !== 'super_admin' ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <ShieldCheck className="h-16 w-16 text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Registrazione in Attesa di Approvazione</h2>
            <p className="text-muted-foreground">Il tuo account è stato creato e ora è in attesa di approvazione da parte di un amministratore.</p>
            <p className="text-muted-foreground">Riceverai una notifica quando il tuo account sarà attivo.</p>
            <Button onClick={handleLogout} className="mt-6" variant="outline">
              Esci
            </Button>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}