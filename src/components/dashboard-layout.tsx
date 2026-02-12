"use client";

import React from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { useSession } from "@/components/session-context-provider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  Users,
  Settings,
  LogOut,
  UserCog,
  Briefcase,
  ShieldCheck,
  Building2,
  ClipboardList,
  Truck,
  Network,
  UserRound,
  FileText,
  MapPin,
  Euro,
  FileStack,
  Upload,
  Sparkles,
  BellRing,
  Siren,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SERVICE_TYPES } from "@/lib/richieste-servizio-utils"; // Importa SERVICE_TYPES

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile, isLoading } = useSession();
  const router = useRouter();
  const pathname = usePathname();

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
    return null;
  }

  const navLinks = [
    {
      label: "Dashboard",
      href: "/",
      icon: <Home className="h-3.5 w-3.5" />,
      roles: ["super_admin", "amministrazione", "responsabile_operativo", "operativo", "pending_approval"],
    },
    {
      label: "Operazioni",
      href: "/operations",
      icon: <Briefcase className="h-3.5 w-3.5" />,
      roles: ["super_admin", "amministrazione", "responsabile_operativo", "operativo"],
      subLinks: [
        {
          label: "Centrale Operativa",
          href: "/operations/centrale-operativa",
          icon: <BellRing className="h-3.5 w-3.5" />,
          roles: ["super_admin", "amministrazione", "responsabile_operativo", "operativo"],
        },
        {
          label: "Gestione Allarmi",
          href: "/operations/gestione-allarmi",
          icon: <Siren className="h-3.5 w-3.5" />,
          roles: ["super_admin", "amministrazione", "responsabile_operativo", "operativo"],
        },
      ],
    },
    {
      label: "Richieste Servizio",
      href: "/richieste-servizio",
      icon: <Briefcase className="h-3.5 w-3.5" />,
      roles: ["super_admin", "amministrazione", "responsabile_operativo", "operativo"],
      subLinks: [
        {
          label: "Tutte le Richieste",
          href: "/richieste-servizio",
          icon: <FileStack className="h-3.5 w-3.5" />,
          roles: ["super_admin", "amministrazione", "responsabile_operativo", "operativo"],
        },
        {
          label: "Crea da Testo",
          href: "/richieste-servizio/create-from-text",
          icon: <Sparkles className="h-3.5 w-3.5" />,
          roles: ["super_admin", "amministrazione", "responsabile_operativo", "operativo"],
        },
        ...SERVICE_TYPES.map(serviceType => ({
          label: serviceType.label,
          href: `/richieste-servizio?type=${serviceType.value}`,
          icon: <FileStack className="h-3.5 w-3.5" />,
          roles: ["super_admin", "amministrazione", "responsabile_operativo", "operativo"],
        })),
      ],
    },
    {
      label: "Anagrafiche",
      href: "/anagrafiche/clienti",
      icon: <Building2 className="h-3.5 w-3.5" />,
      roles: ["super_admin", "amministrazione", "responsabile_operativo", "operativo"],
      subLinks: [
        {
          label: "Clienti",
          href: "/anagrafiche/clienti",
          icon: <ClipboardList className="h-3.5 w-3.5" />,
          roles: ["super_admin", "amministrazione", "responsabile_operativo", "operativo"],
        },
        {
          label: "Fornitori",
          href: "/anagrafiche/fornitori",
          icon: <Truck className="h-3.5 w-3.5" />,
          roles: ["super_admin", "amministrazione", "responsabile_operativo", "operativo"],
        },
        {
          label: "Operatori Network",
          href: "/anagrafiche/operatori-network",
          icon: <Network className="h-3.5 w-3.5" />,
          roles: ["super_admin", "amministrazione", "responsabile_operativo", "operativo"],
        },
        {
          label: "Elenco Personale",
          href: "/anagrafiche/personale",
          icon: <UserRound className="h-3.5 w-3.5" />,
          roles: ["super_admin", "amministrazione", "responsabile_operativo", "operativo"],
        },
        {
          label: "Procedure",
          href: "/anagrafiche/procedure",
          icon: <FileText className="h-3.5 w-3.5" />,
          roles: ["super_admin", "amministrazione", "responsabile_operativo", "operativo"],
        },
        {
          label: "Punti Servizio",
          href: "/anagrafiche/punti-servizio",
          icon: <MapPin className="h-3.5 w-3.5" />,
          roles: ["super_admin", "amministrazione", "responsabile_operativo", "operativo"],
        },
        {
          label: "Tariffe",
          href: "/anagrafiche/tariffe",
          icon: <Euro className="h-3.5 w-3.5" />,
          roles: ["super_admin", "amministrazione", "responsabile_operativo", "operativo"],
        },
        {
          label: "Importa/Esporta Dati",
          href: "/anagrafiche/import-export",
          icon: <Upload className="h-3.5 w-3.5" />,
          roles: ["super_admin", "amministrazione"],
        },
      ],
    },
    {
      label: "Impostazioni",
      href: "/settings",
      icon: <Settings className="h-3.5 w-3.5" />,
      roles: ["super_admin", "amministrazione", "responsabile_operativo", "operativo", "pending_approval"],
    },
    {
      label: "Gestione Utenti",
      href: "/admin/users",
      icon: <Users className="h-3.5 w-3.5" />,
      roles: ["super_admin", "amministrazione"],
    },
    {
      label: "Approvazione Registrazioni",
      href: "/admin/registrations",
      icon: <UserCog className="h-3.5 w-3.5" />,
      roles: ["super_admin", "amministrazione"],
    },
  ];

  const filteredNavLinks = navLinks.filter((link) =>
    profile?.role && link.roles.includes(profile.role)
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar className="hidden md:flex">
        <SidebarBody className="flex flex-col justify-between">
          <div className="flex flex-col gap-1">
            <div className="p-4 text-base font-bold text-sidebar-foreground">
              Gestione Accessi
            </div>
            {profile && (
              <div className="p-4 text-xs text-sidebar-foreground border-b border-sidebar-border">
                <p>Benvenuto, {profile.first_name || "Utente"}!</p>
                <p className="text-2xs text-muted-foreground">Ruolo: {profile.role}</p>
                {profile.registration_status === 'pending' && (
                  <p className="text-2xs text-destructive">Stato: In attesa di approvazione</p>
                )}
              </div>
            )}
            {filteredNavLinks.map((link, idx) => (
              link.subLinks ? (
                <div key={idx} className="flex flex-col">
                  <SidebarLink href={link.href} className="text-sidebar-foreground font-semibold text-sm">
                    {link.icon} {link.label}
                  </SidebarLink>
                  <div className="ml-4 flex flex-col gap-0.5">
                    {link.subLinks.filter(subLink => profile?.role && subLink.roles.includes(profile.role)).map((subLink, subIdx) => (
                      <SidebarLink
                        key={subIdx}
                        href={subLink.href}
                        className={cn(
                          "text-sidebar-foreground text-xs hover:bg-blue-accent hover:text-blue-accent-foreground",
                          pathname === subLink.href || (subLink.href !== "/" && pathname.startsWith(subLink.href)) ? "bg-blue-accent text-blue-accent-foreground" : "" // Stile per link attivo
                        )}
                      >
                        {subLink.icon} {subLink.label}
                      </SidebarLink>
                    ))}
                  </div>
                </div>
              ) : (
                <SidebarLink
                  key={idx}
                  href={link.href}
                  className={cn(
                    "text-sidebar-foreground text-sm hover:bg-blue-accent hover:text-blue-accent-foreground",
                    pathname === link.href && "bg-blue-accent text-blue-accent-foreground" // Stile per link attivo
                  )}
                >
                  {link.icon} {link.label}
                </SidebarLink>
              )
            ))}
          </div>
          <div className="p-4">
            <Button
              onClick={handleLogout}
              className="w-full justify-start text-sidebar-foreground text-sm hover:bg-blue-accent hover:text-blue-accent-foreground"
              variant="ghost"
            >
              <LogOut className="h-3.5 w-3.5 mr-2" />
              Esci
            </Button>
          </div>
        </SidebarBody>
      </Sidebar>
      <main className="flex-1 p-6 bg-background text-foreground">
        {profile?.registration_status === 'pending' && profile.role !== 'super_admin' ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <ShieldCheck className="h-16 w-16 text-yellow-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Registrazione in Attesa di Approvazione</h2>
            <p className="text-sm text-muted-foreground">Il tuo account è stato creato e ora è in attesa di approvazione da parte di un amministratore.</p>
            <p className="text-sm text-muted-foreground">Riceverai una notifica quando il tuo account sarà attivo.</p>
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