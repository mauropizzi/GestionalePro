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

  return (
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

                          console.debug("[open-alarms] preparing to create public link", { alarmId: alarm.id, phone });

                          // Use a unique window name so each click opens a fresh tab/window.
                          const windowName = `wa_${alarm.id}_${Date.now()}`;
                          // Open a blank window synchronously to avoid popup blockers.
                          const newWin = window.open("about:blank", windowName);

                          try {
                            const { data, error } = await supabase.functions.invoke(
                              "create-alarm-public-link",
                              {
                                body: { alarm_id: alarm.id },
                              }
                            );

                            if (error) {
                              // Close the opened window on error to avoid leaving a blank tab.
                              newWin?.close();
                              console.error("[open-alarms] create-alarm-public-link error", error);
                              toast.error("Impossibile generare il link: " + error.message);
                              setGeneratingId(null);
                              return;
                            }

                            const token = (data as any)?.token as string | undefined;
                            if (!token) {
                              newWin?.close();
                              console.error("[open-alarms] no token returned", data);
                              toast.error("Link non valido");
                              setGeneratingId(null);
                              return;
                            }

                            const origin = window.location.origin;
                            const manageUrl = `${origin}/public/gestione-allarme/${token}`;

                            const ps = alarm.punti_servizio?.nome_punto_servizio || "N/A";
                            const dateStr = format(parseISO(alarm.registration_date), "dd/MM/yyyy", {
                              locale: it,
                            });
                            const timeStr = alarm.request_time_co || "";

                            const msg = `ALLARME\nPunto servizio: ${ps}\nData: ${dateStr}${timeStr ? ` ${timeStr}` : ""}\nGestione allarme: ${manageUrl}`;
                            const text = encodeURIComponent(msg);

                            const waUrl = `https://wa.me/${phone}?text=${text}`;

                            console.debug("[open-alarms] token and waUrl ready", { token: token?.slice(0, 8) + "...", waUrl });

                            // Navigate the previously opened window to the WhatsApp URL.
                            try {
                              if (newWin) {
                                newWin.location.href = waUrl;
                                try { newWin.focus(); } catch (focusErr) { /* ignore */ }
                              } else {
                                window.open(waUrl, "_blank", "noopener,noreferrer");
                              }
                            } catch (navErr) {
                              console.error("[open-alarms] navigation to waUrl failed", navErr);
                              window.open(waUrl, "_blank", "noopener,noreferrer");
                            }

                            // Optional: surface the manageUrl in a non-sensitive way for debugging
                            toast.success("Link generato e pronto per l'invio");
                          } catch (err: any) {
                            // Ensure the window is closed on unexpected errors
                            newWin?.close();
                            console.error("Errore nella generazione link pubblico:", err);
                            toast.error("Errore nella generazione del link pubblico.");
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
  );
}