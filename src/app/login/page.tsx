"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CustomSignUpForm } from "@/components/custom-signup-form";

export default function LoginPage() {
  const router = useRouter();
  const [showCustomSignUp, setShowCustomSignUp] = useState(false);

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
    <div
      className="flex items-center justify-center min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/login-background-tech.jpg')" }}
    >
      <div className="w-full max-w-md p-6 space-y-4 bg-card/90 backdrop-blur-sm rounded-lg shadow-lg font-sans"> {/* Aggiunto font-sans qui */}
        <h2 className="text-xl font-bold text-center text-foreground">
          {showCustomSignUp ? "Registrati" : "Accedi"}
        </h2>

        {showCustomSignUp ? (
          <CustomSignUpForm />
        ) : (
          <div className="font-sans"> {/* Aggiunto font-sans per il componente Auth */}
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
                    link_text: "Non hai un account? Registrati", // Corretto per il link di switch alla registrazione
                  },
                  sign_up: { // Aggiunta la sezione di localizzazione per la registrazione
                    email_label: "Indirizzo Email",
                    password_label: "Crea una Password",
                    email_input_placeholder: "La tua email",
                    password_input_placeholder: "Crea la tua password",
                    button_label: "Registrati",
                    social_provider_text: "Registrati con",
                    link_text: "Hai già un account? Accedi", // Link di switch all'accesso
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
        )}

        <Button
          variant="link"
          className="w-full text-xs text-muted-foreground"
          onClick={() => setShowCustomSignUp(!showCustomSignUp)}
        >
          {showCustomSignUp
            ? "Hai già un account? Accedi"
            : "Non hai un account? Registrati"}
        </Button>
      </div>
    </div>
  );
}