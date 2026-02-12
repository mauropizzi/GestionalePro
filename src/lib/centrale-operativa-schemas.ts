import * as z from "zod";

export const alarmEntryFormSchema = z.object({
  registration_date: z.date({ required_error: "La data di registrazione è richiesta." }),
  punto_servizio_id: z.string().uuid("Seleziona un punto servizio valido.").nullable(),
  // intervention_due_by è espresso in minuti (numero intero, >= 0)
  intervention_due_by: z.coerce
    .number()
    .int()
    .min(0, "Il tempo di intervento deve essere un numero di minuti positivo.")
    .nullable(),
  operator_co_id: z.string().uuid("Seleziona un operatore valido.").nullable(),
  request_time_co: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato orario non valido (HH:mm)"),
  intervention_start_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato orario non valido (HH:mm)")
    .nullable(),
  intervention_end_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato orario non valido (HH:mm)")
    .nullable(),
  intervention_start_lat: z.number().nullable(),
  intervention_start_long: z.number().nullable(),
  intervention_start_full_timestamp: z.date().nullable(),
  intervention_end_lat: z.number().nullable(),
  intervention_end_long: z.number().nullable(),
  intervention_end_full_timestamp: z.date().nullable(),
  full_site_access: z.boolean(),
  caveau_access: z.boolean(),
  network_operator_id: z.string().uuid("Seleziona un operatore network valido.").nullable(),

  // Nuovo: selezione GPG da elenco personale (ruolo: Pattuglia)
  gpg_personale_id: z.string().uuid("Seleziona una GPG valida.").nullable(),
  // Rimane nel DB: viene impostato automaticamente in base a gpg_personale_id
  gpg_intervention_made: z.boolean(),

  anomalies_found: z.string().nullable(),
  delay_minutes: z.coerce.number().int().min(0, "Il ritardo non può essere negativo.").nullable(),
  service_outcome: z.enum(["Risolto", "Non Risolto", "Falso Allarme", "Annullato"]).nullable(),
  client_request_barcode: z.string().nullable(),
});

export const historicalSearchSchema = z.object({
  from_date: z.date().nullable(),
  to_date: z.date().nullable(),
  punto_servizio_id: z.string().uuid("Seleziona un punto servizio valido.").nullable(),
});

export type AlarmEntryFormSchema = z.infer<typeof alarmEntryFormSchema>;
export type HistoricalSearchSchema = z.infer<typeof historicalSearchSchema>;