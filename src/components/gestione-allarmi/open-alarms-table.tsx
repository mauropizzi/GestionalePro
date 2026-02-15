"use client";

import React, { useMemo, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

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

type ShareState =
  | {
      open: true;
      alarmId: string;
      phone: string;
      waUrl: string;
      manageUrl: string;
      message: string;
    }
  | { open: false };

export function OpenAlarmsTable({ alarms, selectedId, onSelect }: OpenAlarmsTableProps) {
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [share, setShare] = useState<ShareState>({ open: false });

  const canClipboard = useMemo(() => {
    return typeof navigator !== "undefined" && !!navigator.clipboard?.writeText;
  }, []);

  const copyText = async (label: string, text: string) => {
    try {
      if (!navigator.clipboard?.writeText) {
        toast.error("Copia non supportata in questo browser");
        return;
      }
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copiato`);
    } catch {
      toast.error("Impossibile copiare negli appunti");
    }
  };

  return (
    <>
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
                            if (generatingId) return;

                            setGeneratingId(alarm.id);

                            try {
                              const { data, error } = await supabase.functions.invoke(
                                "create-alarm-public-link",
                                { body: { alarm_id: alarm.id } }
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

                              const message = `ALLARME\nPunto servizio: ${ps}\nData: ${dateStr}${timeStr ? ` ${timeStr}` : ""}\nGestione allarme: ${manageUrl}`;
                              const text = encodeURIComponent(message);
                              const waUrl = `https://wa.me/${phone}?text=${text}`;

                              // Mostro un dialog con link/copia.
                              setShare({
                                open: true,
                                alarmId: alarm.id,
                                phone,
                                waUrl,
                                manageUrl,
                                message,
                              });
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

      <Dialog
        open={share.open}
        onOpenChange={(o) => {
          if (!o) setShare({ open: false });
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Invio WhatsApp</DialogTitle>
            <DialogDescription>
              Premi "Apri WhatsApp". Se il browser blocca l'apertura, puoi copiare il testo o il link.
            </DialogDescription>
          </DialogHeader>

          {share.open && (
            <div className="space-y-3">
              <Textarea value={share.message} readOnly className="min-h-[140px]" />
              <div className="text-xs text-muted-foreground break-words">
                Link gestione: {share.manageUrl}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2 sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setShare({ open: false });
              }}
            >
              Chiudi
            </Button>

            {share.open && (
              <div className="flex flex-wrap gap-2 justify-end">
                <Button asChild>
                  <a
                    href={share.waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      // Chiudo subito il dialog così al rientro posso inviare un secondo WhatsApp senza overlay
                      setShare({ open: false });
                    }}
                  >
                    Apri WhatsApp
                  </a>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    if (!share.open) return;
                    setShare({ open: false });
                    window.open(share.manageUrl, "_blank", "noopener,noreferrer");
                  }}
                >
                  Apri Gestione
                </Button>

                <Button
                  variant="outline"
                  disabled={!canClipboard}
                  onClick={() => share.open && copyText("Testo", share.message)}
                >
                  Copia testo
                </Button>

                <Button
                  variant="outline"
                  disabled={!canClipboard}
                  onClick={() => share.open && copyText("Link", share.manageUrl)}
                >
                  Copia link
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}