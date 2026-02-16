"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "./react-query-hooks";

export interface Profile {
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
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Use React Query for profile fetching with caching
  const { data: profile } = useProfile(user?.id);

  // Optimize auth state management - single source of truth
  useEffect(() => {
    let mounted = true;

    // Get initial session once
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!mounted) return;

      setSession(initialSession);
      setUser(initialSession?.user || null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!mounted) return;

        console.debug("[SessionContext] Auth state changed", { event, hasSession: !!currentSession });
        
        setSession(currentSession);
        setUser(currentSession?.user || null);

        // Handle specific events
        if (event === "SIGNED_IN" && currentSession) {
          toast.success("Accesso effettuato con successo!");
        } else if (event === "SIGNED_OUT") {
          toast.info("Disconnessione avvenuta.");
          setUser(null);
          setSession(null);
        } else if (event === "USER_UPDATED") {
          toast.success("Profilo aggiornato con successo!");
        } else if (event === "PASSWORD_RECOVERY") {
          toast.info("Controlla la tua email per reimpostare la password.");
        } else if (event === "MFA_CHALLENGE_VERIFIED") {
          toast.success("Verifica MFA completata.");
        }
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Route protection
  useEffect(() => {
    if (!isLoading) {
      const isLoginPage = pathname === "/login";
      const isPublicPage = pathname.startsWith("/public/");

      if (user && isLoginPage) {
        router.push("/");
      } else if (!user && !isLoginPage && !isPublicPage) {
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
    <SessionContext.Provider value={{ session, user, profile: profile || null, isLoading }}>
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