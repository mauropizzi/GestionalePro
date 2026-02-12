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
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { getOutcomeBadgeVariant } from "@/lib/centrale-operativa-utils";
import { Button } from "@/components/ui/button";
import { Eye, Pencil } from "lucide-react";
import { Personale, NetworkOperator } from "@/types/anagrafiche";
import { HistoricalAlarmDialog } from "@/components/centrale-operativa/historical-alarm-dialog";

interface HistoricalAlarmsTableProps {
  alarms: AlarmEntry[];
  personaleOptions: Personale[];
  networkOperatorsOptions: NetworkOperator[];
  onRefresh: () => void;
}

export function HistoricalAlarmsTable({
  alarms,
  personaleOptions,
  networkOperatorsOptions,
  onRefresh,
}: HistoricalAlarmsTableProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [selected, setSelected] = useState<AlarmEntry | null>(null);

  const openView = (alarm: AlarmEntry) => {
    setSelected(alarm);
    setMode("view");
    setOpen(true);
  };

  const openEdit = (alarm: AlarmEntry) => {
    setSelected(alarm);
    setMode("edit");
    setOpen(true);
  };

  return (
    <div className="rounded-md border mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data Reg.</TableHead>
            <TableHead>Punto Servizio</TableHead>
            <TableHead>Operatore C.O.</TableHead>
            <TableHead>Inizio Intervento</TableHead>
            <TableHead>Fine Intervento</TableHead>
            <TableHead>Esito</TableHead>
            <TableHead>Ritardo</TableHead>
            <TableHead>Anomalie</TableHead>
            <TableHead className="text-right">Azioni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alarms.map((alarm) => (
            <TableRow key={alarm.id}>
              <TableCell>
                {format(parseISO(alarm.registration_date), "dd/MM/yyyy", { locale: it })}
              </TableCell>
              <TableCell>{alarm.punti_servizio?.nome_punto_servizio || "N/A"}</TableCell>
              <TableCell>
                {alarm.personale ? `${alarm.personale.nome} ${alarm.personale.cognome}` : "N/A"}
              </TableCell>
              <TableCell>{alarm.intervention_start_time || "N/A"}</TableCell>
              <TableCell>{alarm.intervention_end_time || "N/A"}</TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${getOutcomeBadgeVariant(
                    alarm.service_outcome
                  )}`}
                >
                  {alarm.service_outcome || "N/A"}
                </span>
              </TableCell>
              <TableCell>
                {alarm.delay_minutes !== null ? `${alarm.delay_minutes} min` : "N/A"}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                {alarm.anomalies_found || "N/A"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => openView(alarm)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(alarm)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <HistoricalAlarmDialog
        alarm={selected}
        mode={mode}
        open={open}
        onOpenChange={setOpen}
        personaleOptions={personaleOptions}
        networkOperatorsOptions={networkOperatorsOptions}
        onUpdated={onRefresh}
      />
    </div>
  );
}