"use client";

import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { AlarmEntryFormSchema } from "@/lib/centrale-operativa-schemas";

export function useAutoDelay(form: UseFormReturn<AlarmEntryFormSchema>) {
  useEffect(() => {
    const regDate = form.getValues("registration_date");
    const dueBy = form.getValues("intervention_due_by");
    const startFull = form.getValues("intervention_start_full_timestamp");
    const startTimeStr = form.getValues("intervention_start_time");

    if (!regDate || (startFull == null && !startTimeStr) || dueBy == null) {
      return;
    }

    const startDate = startFull
      ? new Date(startFull as Date)
      : (() => {
          const d = new Date(regDate as Date);
          if (startTimeStr) {
            const [h, m] = String(startTimeStr).split(":").map(Number);
            if (!isNaN(h) && !isNaN(m)) {
              d.setHours(h, m, 0, 0);
            }
          }
          return d;
        })();

    const reg = new Date(regDate as Date);
    const diffMs = startDate.getTime() - reg.getTime();
    const elapsedMin = Math.max(0, Math.round(diffMs / 60000));
    const due = Number(dueBy);

    if (isNaN(due)) {
      return;
    }

    const delay = Math.max(0, elapsedMin - due);
    const currentDelay = form.getValues("delay_minutes");

    if (currentDelay !== delay) {
      form.setValue("delay_minutes", delay, { shouldValidate: true, shouldDirty: true });
    }
  }, [
    form.watch("registration_date"),
    form.watch("intervention_start_time"),
    form.watch("intervention_start_full_timestamp"),
    form.watch("intervention_due_by"),
  ]);
}

export default useAutoDelay;