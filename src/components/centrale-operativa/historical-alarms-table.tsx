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
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { getOutcomeBadgeVariant } from "@/lib/centrale-operativa-utils";

interface HistoricalAlarmsTableProps {
  alarms: AlarmEntry[];
}

export function HistoricalAlarmsTable({ alarms }: HistoricalAlarmsTableProps) {
  return (
    <div className="rounded-md border mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data Reg.</TableHead>
            <TableHead>Punto Servizio</TableHead>
            <TableHead>Tipo Servizio</TableHead>
            <TableHead>Operatore C.O.</TableHead>
            <TableHead>Inizio Intervento</TableHead>
            <TableHead>Fine Intervento</TableHead>
            <TableHead>Esito</TableHead>
            <TableHead>Ritardo</TableHead>
            <TableHead>Anomalie</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alarms.map((alarm) => (
            <TableRow key={alarm.id}>
              <TableCell>{format(parseISO(alarm.registration_date), "dd/MM/yyyy", { locale: it })}</TableCell>
              <TableCell>{alarm.punti_servizio?.nome_punto_servizio || "N/A"}</TableCell>
              <TableCell>{alarm.service_type_requested}</TableCell>
              <TableCell>{alarm.personale ? `${alarm.personale.nome} ${alarm.personale.cognome}` : "N/A"}</TableCell>
              <TableCell>{alarm.intervention_start_time || "N/A"}</TableCell>
              <TableCell>{alarm.intervention_end_time || "N/A"}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getOutcomeBadgeVariant(alarm.service_outcome)}`}>
                  {alarm.service_outcome || "N/A"}
                </span>
              </TableCell>
              <TableCell>{alarm.delay_minutes !== null ? `${alarm.delay_minutes} min` : "N/A"}</TableCell>
              <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{alarm.anomalies_found || "N/A"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}