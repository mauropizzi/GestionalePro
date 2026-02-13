"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, ShieldAlert } from "lucide-react";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

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

const publicUpdateSchema = z.object({
  intervention_start_time: z.string().min(0).optional().nullable(),
  intervention_end_time: z.string().min(0).optional().nullable(),
  service_outcome: z.string().min(0).optional().nullable(),
  delay_minutes: z.number().int().min(0).optional().nullable(),
  anomalies_found: z.string().optional().nullable(),
  client_request_barcode: z.string().optional().nullable(),
});

type PublicUpdateForm = z.infer<typeof publicUpdateSchema>;

export default function PublicGestioneAllarmePage() {
  const { token } = useParams<{ token: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alarm, setAlarm] = useState<PublicAlarm | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const form = useForm<PublicUpdateForm>({
    resolver: zodResolver(publicUpdateSchema),
    defaultValues: {
      intervention_start_time: null,
      intervention_end_time: null,
      service_outcome: null,
      delay_minutes: null,
      anomalies_found: null,
      client_request_barcode: null,
    },
  });

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

  useEffect(() => {
    if (!alarm) return;
    form.reset({
      intervention_start_time: alarm.intervention_start_time,
      intervention_end_time: alarm.intervention_end_time,
      service_outcome: alarm.service_outcome,
      delay_minutes: alarm.delay_minutes ?? null,
      anomalies_found: alarm.anomalies_found ?? null,
      client_request_barcode: alarm.client_request_barcode ?? null,
    });
  }, [alarm, form]);

  const header = useMemo(() => {
    if (!alarm) return null;
    const dateStr = format(parseISO(alarm.registration_date), "dd/MM/yyyy", { locale: it });
    const ps = alarm.punti_servizio?.nome_punto_servizio || "N/A";
    return `${ps} — ${dateStr} ${alarm.request_time_co || ""}`.trim();
  }, [alarm]);

  const onSubmit = async (values: PublicUpdateForm) => {
    if (!token || !alarm) return;
    const { data, error } = await supabase.functions.invoke("update-alarm-public", {
      body: {
        token,
        intervention_start_time: values.intervention_start_time ?? null,
        intervention_end_time: values.intervention_end_time ?? null,
        service_outcome: values.service_outcome ?? null,
        delay_minutes: values.delay_minutes ?? null,
        anomalies_found: values.anomalies_found ?? null,
        client_request_barcode: values.client_request_barcode ?? null,
      },
    });

    if (error) {
      toast.error("Errore nell'aggiornamento: " + error.message);
      return;
    }

    const updated = (data as any)?.alarm ?? null;
    if (updated) {
      setAlarm(updated);
      toast.success("Allarme aggiornato.");
    } else {
      toast.error("Aggiornamento non riuscito.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Gestione Allarme</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Link monouso con scadenza. Consente di aggiornare solo i campi mostrati in questa pagina.
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
            <AlertTitle>Impossibile aprire l'allarme</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : !alarm ? (
          <Alert>
            <AlertTitle>Nessun dato</AlertTitle>
            <AlertDescription>Allarme non trovato.</AlertDescription>
          </Alert>
        ) : (
          <>
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

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Aggiorna dati</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  onSubmit={form.handleSubmit(onSubmit)}
                >
                  <div className="space-y-2">
                    <Label htmlFor="intervention_start_time">Inizio intervento</Label>
                    <Input
                      id="intervention_start_time"
                      type="time"
                      step="1"
                      {...form.register("intervention_start_time")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="intervention_end_time">Fine intervento</Label>
                    <Input
                      id="intervention_end_time"
                      type="time"
                      step="1"
                      {...form.register("intervention_end_time")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="service_outcome">Esito</Label>
                    <Input
                      id="service_outcome"
                      placeholder="Esito servizio"
                      {...form.register("service_outcome")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delay_minutes">Ritardo (min)</Label>
                    <Input
                      id="delay_minutes"
                      type="number"
                      min={0}
                      {...form.register("delay_minutes", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="anomalies_found">Anomalie riscontrate</Label>
                    <Textarea
                      id="anomalies_found"
                      rows={4}
                      placeholder="Descrivi eventuali anomalie..."
                      {...form.register("anomalies_found")}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="client_request_barcode">Barcode richiesta cliente</Label>
                    <Input
                      id="client_request_barcode"
                      placeholder="Codice a barre"
                      {...form.register("client_request_barcode")}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Button type="submit">Salva aggiornamenti</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}