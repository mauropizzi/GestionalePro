"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function WaRedirectPage({ params }: { params: { alarmId: string } }) {
  const { alarmId } = params;
  const search = useSearchParams();
  const phone = search.get("phone");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        // Create public link for the alarm
        const { data, error } = await supabase.functions.invoke("create-alarm-public-link", {
          body: { alarm_id: alarmId },
        });

        if (error) {
          console.error("[wa-redirect] create-alarm-public-link error", error);
          if (!cancelled) setError(error.message || "Errore generico");
          return;
        }

        const token = (data as any)?.token as string | undefined;
        if (!token) {
          console.error("[wa-redirect] no token returned", data);
          if (!cancelled) setError("Link non generato");
          return;
        }

        if (!phone) {
          // If phone not provided, just open the management link
          const origin = window.location.origin;
          const manageUrl = `${origin}/public/gestione-allarme/${token}`;
          window.location.href = manageUrl;
          return;
        }

        const origin = window.location.origin;
        const manageUrl = `${origin}/public/gestione-allarme/${token}`;

        const msg = `ALLARME\nGestione allarme: ${manageUrl}`;
        const text = encodeURIComponent(msg);
        const normalized = phone.replace(/[^0-9]/g, "");
        const waUrl = `https://wa.me/${normalized}?text=${text}`;

        // Redirect to WhatsApp
        window.location.href = waUrl;
      } catch (err: any) {
        console.error("[wa-redirect] unexpected error", err);
        if (!cancelled) setError(String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [alarmId, phone]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="p-6 rounded-md bg-card shadow">Generazione link, attendere...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-4">
          <div className="p-4 rounded-md bg-destructive/10 text-destructive">Si è verificato un errore: {error}</div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                // try again
                window.location.reload();
              }}
            >
              Riprova
            </Button>
            <Button
              onClick={() => {
                // open management link without redirection
                const origin = window.location.origin;
                window.open(`${origin}/public/gestione-allarme/${alarmId}`, "_blank");
              }}
            >
              Apri Gestione (fallback)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
