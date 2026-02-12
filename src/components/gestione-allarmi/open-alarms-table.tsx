"use client";

import React from "react";
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
                        disabled={!canSend}
                        title={
                          canSend
                            ? "Invia allarme via WhatsApp"
                            : "Seleziona una Pattuglia (GPG) nell'allarme per inviare via WhatsApp"
                        }
                        onClick={async () => {
                          if (!phone) return;

                          const { data, error } = await supabase.functions.invoke(
                            "create-alarm-public-link",
                            {
                              body: { alarm_id: alarm.id },
                            }
                          );

                          if (error) {
                            toast.error("Impossibile generare il link: " + error.message);
                            return;
                          }

                          const token = (data as any)?.token as string | undefined;
                          if (!token) {
                            toast.error("Link non valido");
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
                          window.open(waUrl, "_blank", "noopener,noreferrer");
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