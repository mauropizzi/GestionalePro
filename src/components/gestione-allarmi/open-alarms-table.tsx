"use client";

import React, { useState } from "react";
import { AlarmEntry } from "@/types/centrale-operativa";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OpenAlarmsTableProps {
  alarms: AlarmEntry[];
  selectedId: string | null;
  onSelect: (alarm: AlarmEntry) => void;
}

function normalizeWhatsappNumber(input: string) {
  // WhatsApp wa.me richiede solo cifre e prefisso paese.
  let n = input.trim().replace(/[^\d+]/g, "");
  if (n.startsWith("00")) n = n.slice(2);
  if (n.startsWith("+")) n = n.slice(1);
  return n.replace(/\D/g, "");
}

export function OpenAlarmsTable({ alarms, selectedId, onSelect }: OpenAlarmsTableProps) {
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [lastTokenPrefix, setLastTokenPrefix] = useState<string | null>(null);
  const [lastWaUrl, setLastWaUrl] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Punto Servizio</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alarms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  Nessun allarme aperto.
                </TableCell>
              </TableRow>
            ) : (
              alarms.map((alarm) => {
                const phoneRaw = alarm.pattuglia?.telefono;
                const phone = phoneRaw ? normalizeWhatsappNumber(phoneRaw) : null;
                const canSend = Boolean(phone);

                return (
                  <TableRow
                    key={alarm.id}
                    className={selectedId === alarm.id ? "bg-accent" : undefined}
                  >
                    <TableCell>
                      {format(parseISO(alarm.registration_date), "dd/MM/yyyy", { locale: it })}
                    </TableCell>
                    <TableCell>{alarm.punti_servizio?.nome_punto_servizio || "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!canSend || generatingId !== null}
                          title={
                            generatingId === alarm.id
                              ? "Generazione link in corso..."
                              : canSend
                              ? "Invia allarme via WhatsApp"
                              : "Seleziona una Pattuglia (GPG) nell'allarme per inviare via WhatsApp"
                          }
                          onClick={async () => {
                            if (!phone) return;

                            // prevent duplicate concurrent generations
                            if (generatingId) return;
                            setGeneratingId(alarm.id);
                            setLastError(null);

                            console.debug("[open-alarms] preparing to create public link", { alarmId: alarm.id, phone });

                            // Use a unique window name so each click opens a fresh tab/window.
                            const windowName = `wa_${alarm.id}_${Date.now()}`;
                            // Open a redirecting helper route synchronously to avoid popup blockers.
                            // This route will call the function server-side and then redirect the window to wa.me.
                            const helperUrl = `${window.location.origin}/public/wa-redirect/${alarm.id}?phone=${phone}`;
                            const newWin = window.open(helperUrl, windowName);

                            try {
                              // Now that we opened the helper route, we don't need to wait here; the helper will
                              // create the token server-side and redirect this window to wa.me. We just surface success.
                              console.debug("[open-alarms] helper route opened, delegating token creation to it", { helperUrl });
                              setLastTokenPrefix("delegated");
                              setLastWaUrl(helperUrl);
                              toast.success("Aperta finestra di invio WhatsApp...");
                            } catch (err: any) {
                              try { newWin?.close(); } catch (e) { /* ignore */ }
                              console.error("Errore nell'apertura della route di redirect:", err);
                              setLastError(String(err));
                              toast.error("Errore nell'apertura della finestra di invio.");
                            } finally {
                              setGeneratingId(null);
                            }
                          }}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>

                        <Button size="sm" variant="outline" onClick={() => onSelect(alarm)}>
                          Gestisci
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Diagnostic panel for debugging send flow */}
      <div className="mt-2 text-xs text-muted-foreground">
        <div>debug: alarms={alarms.length} selected={selectedId}</div>
        <div>generatingId: {generatingId ?? "-"}</div>
        <div>lastTokenPrefix: {lastTokenPrefix ?? "-"}</div>
        <div className="break-words">lastWaUrl: {lastWaUrl ?? "-"}</div>
        <div className="text-destructive">lastError: {lastError ?? "-"}</div>
      </div>
    </div>
  );
}