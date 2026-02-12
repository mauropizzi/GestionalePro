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

function buildWhatsappUrl(alarm: AlarmEntry) {
  const phoneRaw = (alarm as any).pattuglia?.telefono as string | null | undefined;
  if (!phoneRaw) return null;

  const phone = normalizeWhatsappNumber(phoneRaw);
  if (!phone) return null;

  const ps = alarm.punti_servizio?.nome_punto_servizio || "N/A";
  const dateStr = format(parseISO(alarm.registration_date), "dd/MM/yyyy", { locale: it });
  const timeStr = alarm.request_time_co || "";

  const msg = `ALLARME\nPunto servizio: ${ps}\nData: ${dateStr}${timeStr ? ` ${timeStr}` : ""}\n`;
  const text = encodeURIComponent(msg);

  return `https://wa.me/${phone}?text=${text}`;
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
              const waUrl = buildWhatsappUrl(alarm);

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
                        disabled={!waUrl}
                        title={
                          waUrl
                            ? "Invia allarme via WhatsApp"
                            : "Seleziona una Pattuglia (GPG) nell'allarme per inviare via WhatsApp"
                        }
                        onClick={() => {
                          if (!waUrl) return;
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