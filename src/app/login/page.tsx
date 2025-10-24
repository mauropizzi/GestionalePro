"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" && session) {
          router.push("/");
          toast.success("Accesso effettuato con successo!");
        } else if (event === "SIGNED_OUT") {
          toast.info("Disconnessione avvenuta.");
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
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center text-foreground">
          Accedi o Registrati
        </h2>
        <Auth
          supabaseClient={supabase}
          providers={[]}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: "hsl(var(--primary))",
                  brandAccent: "hsl(var(--primary-foreground))",
                },
              },
            },
          }}
          theme="light"
          localization={{
            variables: {
              sign_in: {
                email_label: "Indirizzo Email",
                password_label: "Password",
                email_input_placeholder: "La tua email",
                password_input_placeholder: "La tua password",
                button_label: "Accedi",
                social_provider_text: "Accedi con",
                link_text: "Hai già un account? Accedi",
                // confirmation_text rimosso
              },
              sign_up: {
                email_label: "Indirizzo Email",
                password_label: "Password",
                email_input_placeholder: "La tua email",
                password_input_placeholder: "Crea una password",
                button_label: "Registrati",
                social_provider_text: "Registrati con",
                link_text: "Non hai un account? Registrati",
                confirmation_text: "Controlla la tua email per il link di conferma.",
              },
              forgotten_password: {
                email_label: "Indirizzo Email",
                button_label: "Invia istruzioni per il reset",
                link_text: "Password dimenticata?",
                email_input_placeholder: "La tua email",
                confirmation_text: "Controlla la tua email per il link di reset della password.",
              },
              update_password: {
                password_label: "Nuova Password",
                password_input_placeholder: "La tua nuova password",
                button_label: "Aggiorna Password",
                confirmation_text: "La tua password è stata aggiornata.",
              },
              magic_link: {
                email_input_placeholder: "La tua email",
                button_label: "Invia Magic Link",
                link_text: "Invia un Magic Link",
                confirmation_text: "Controlla la tua email per il Magic Link.",
              },
              verify_otp: {
                email_input_placeholder: "Il tuo codice OTP",
                button_label: "Verifica OTP",
              },
            },
          }}
        />
      </div>
    </div>
  );
}