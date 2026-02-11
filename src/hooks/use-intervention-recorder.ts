"use client";

import { UseFormReturn } from "react-hook-form";
import { format } from "date-fns";
import { toast } from "sonner";
import { AlarmEntryFormSchema } from "@/lib/centrale-operativa-schemas";

export function useInterventionRecorder(form: UseFormReturn<AlarmEntryFormSchema>) {
  const record = (type: "start" | "end") => {
    const now = new Date();
    const timeString = format(now, "HH:mm");

    if (type === "start") {
      form.setValue("intervention_start_time", timeString);
      form.setValue("intervention_start_full_timestamp", now);
    } else {
      form.setValue("intervention_end_time", timeString);
      form.setValue("intervention_end_full_timestamp", now);
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (type === "start") {
            form.setValue("intervention_start_lat", latitude);
            form.setValue("intervention_start_long", longitude);
          } else {
            form.setValue("intervention_end_lat", latitude);
            form.setValue("intervention_end_long", longitude);
          }
          toast.success(
            `Posizione acquisita per ${type === "start" ? "inizio" : "fine"} intervento.`
          );
        },
        (error) => {
          console.error("Errore geolocalizzazione:", error);
          toast.error(
            "Impossibile acquisire la posizione. Assicurati che i permessi siano attivi."
          );
        }
      );
    } else {
      toast.error("Geolocalizzazione non supportata dal browser.");
    }
  };

  return {
    recordStart: () => record("start"),
    recordEnd: () => record("end"),
  };
}

export default useInterventionRecorder;