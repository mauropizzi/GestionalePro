"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, ShieldAlert } from "lucide-react";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";

type PublicAlarm = {
  id: string;
  registration_date: string;
  request_time_co: string;
  punti_servizio?: { nome_punto_servizio: string } | null;
  intervention_start_time: string | null;
  intervention_end_time: string | null;
  anomalies_found: string | null;
  delay_minutes: number | null;
  service_outcome: string | null;
  client_request_barcode: string | null;
};

export default function PublicGestioneAllarmePage() {
  const { token } = useParams<{ token: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alarm, setAlarm] = useState<PublicAlarm | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.functions.invoke("get-alarm-public", {
        body: { token },
      });

      if (cancelled) return;

      if (error) {
        setError(error.message);
        setAlarm(null);
        setExpiresAt(null);
        setLoading(false);
        return;
      }

      setAlarm((data as any)?.alarm ?? null);
      setExpiresAt((data as any)?.expires_at ?? null);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const header = useMemo(() => {
    if (!alarm) return null;
    const dateStr = format(parseISO(alarm.registration_date), "dd/MM/yyyy", { locale: it });
    const ps = alarm.punti_servizio?.nome_punto_servizio || "N/A";
    return `${ps} — ${dateStr} ${alarm.request_time_co || ""}`.trim();
  }, [alarm]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Gestione Allarme</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Link monouso con scadenza. Non consente l’accesso alle altre pagine dell’app.
            </p>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Caricamento...
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Impossibile aprire l’allarme</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : !alarm ? (
          <Alert>
            <AlertTitle>Nessun dato</AlertTitle>
            <AlertDescription>Allarme non trovato.</AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{header}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Inizio intervento</div>
                <div className="text-sm font-medium">{alarm.intervention_start_time || "N/A"}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Fine intervento</div>
                <div className="text-sm font-medium">{alarm.intervention_end_time || "N/A"}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Esito</div>
                <div className="text-sm font-medium">{alarm.service_outcome || "N/A"}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Ritardo (min)</div>
                <div className="text-sm font-medium">{alarm.delay_minutes ?? "N/A"}</div>
              </div>
              <div className="rounded-md border p-3 md:col-span-2">
                <div className="text-xs text-muted-foreground">Anomalie</div>
                <div className="text-sm font-medium whitespace-pre-wrap">
                  {alarm.anomalies_found || "N/A"}
                </div>
              </div>
              <div className="rounded-md border p-3 md:col-span-2">
                <div className="text-xs text-muted-foreground">Barcode</div>
                <div className="text-sm font-medium">{alarm.client_request_barcode || "N/A"}</div>
              </div>
              {expiresAt && (
                <div className="text-xs text-muted-foreground md:col-span-2">
                  Scadenza link: {format(parseISO(expiresAt), "dd/MM/yyyy HH:mm", { locale: it })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}