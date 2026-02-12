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
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";

interface OpenAlarmsTableProps {
  alarms: AlarmEntry[];
  selectedId: string | null;
  onSelect: (alarm: AlarmEntry) => void;
}

export function OpenAlarmsTable({ alarms, selectedId, onSelect }: OpenAlarmsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Punto Servizio</TableHead>
            <TableHead>Operatore C.O.</TableHead>
            <TableHead className="text-right">Azione</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alarms.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                Nessun allarme aperto.
              </TableCell>
            </TableRow>
          ) : (
            alarms.map((alarm) => (
              <TableRow
                key={alarm.id}
                className={selectedId === alarm.id ? "bg-accent" : undefined}
              >
                <TableCell>
                  {format(parseISO(alarm.registration_date), "dd/MM/yyyy", { locale: it })}
                </TableCell>
                <TableCell>{alarm.punti_servizio?.nome_punto_servizio || "N/A"}</TableCell>
                <TableCell>
                  {alarm.personale ? `${alarm.personale.nome} ${alarm.personale.cognome}` : "N/A"}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => onSelect(alarm)}>
                    Gestisci
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
