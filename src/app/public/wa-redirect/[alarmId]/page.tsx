"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type ParamsPromise = Promise<{ alarmId: string }>;

export default function WaRedirectPage({ params }: { params: ParamsPromise }) {
  const search = useSearchParams();
  const phone = search.get("phone");

  const [alarmId, setAlarmId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manageUrl, setManageUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    params
      .then((p) => {
        if (!cancelled) setAlarmId(p.alarmId);
      })
      .catch((e) => {
        console.error("[wa-redirect] params error", e);
        if (!cancelled) setError("Parametri non validi");
      });

    return () => {
      cancelled = true;
    };
  }, [params]);

  const normalizedPhone = useMemo(() => {
    if (!phone) return null;
    return phone.replace(/[^0-9]/g, "");
  }, [phone]);

  useEffect(() => {
    if (!alarmId) return;

    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);

      try {
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

        const origin = window.location.origin;
        const mUrl = `${origin}/public/gestione-allarme/${token}`;
        if (!cancelled) setManageUrl(mUrl);

        // If no phone provided, just open management link
        if (!normalizedPhone) {
          window.location.href = mUrl;
          return;
        }

        const msg = `ALLARME\nGestione allarme: ${mUrl}`;
        const text = encodeURIComponent(msg);
        const waUrl = `https://wa.me/${normalizedPhone}?text=${text}`;

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
  }, [alarmId, normalizedPhone]);

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
          <div className="p-4 rounded-md bg-destructive/10 text-destructive">
            Si è verificato un errore: {error}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => window.location.reload()}>Riprova</Button>
            {manageUrl && (
              <Button variant="outline" onClick={() => window.location.assign(manageUrl)}>
                Apri Gestione (fallback)
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}