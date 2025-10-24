"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton"; // Importa Skeleton per lo stato di caricamento

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: string;
  registration_status: string;
}

interface SessionContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionContextProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user || null);

        if (currentSession?.user) {
          // Fetch user profile
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", currentSession.user.id)
            .single();

          if (error) {
            console.error("Errore nel recupero del profilo:", error.message); // Logga il messaggio di errore specifico
            toast.error("Errore nel recupero del profilo utente: " + error.message); // Mostra il messaggio di errore nel toast
            setProfile(null);
          } else {
            setProfile(data as Profile);
          }
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    // Initial session check
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user || null);
      if (initialSession?.user) {
        supabase
          .from("profiles")
          .select("*")
          .eq("id", initialSession.user.id)
          .single()
          .then(({ data, error }) => {
            if (error) {
              console.error("Errore nel recupero del profilo iniziale:", error.message); // Logga il messaggio di errore specifico
              toast.error("Errore nel recupero del profilo utente: " + error.message); // Mostra il messaggio di errore nel toast
              setProfile(null);
            } else {
              setProfile(data as Profile);
            }
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const isLoginPage = pathname === "/login";

      if (user && isLoginPage) {
        // Utente autenticato sulla pagina di login, reindirizza alla home
        router.push("/");
      } else if (!user && !isLoginPage) {
        // Utente non autenticato su una pagina protetta, reindirizza al login
        router.push("/login");
      }
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Skeleton className="w-64 h-64 rounded-full" />
      </div>
    );
  }

  return (
    <SessionContext.Provider value={{ session, user, profile, isLoading }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionContextProvider");
  }
  return context;
}