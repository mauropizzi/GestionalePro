import * as z from "zod";
import { format, setHours, setMinutes } from "date-fns";
import { it } from "date-fns/locale";

export const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Define SERVICE_TYPES as an array of objects
export const SERVICE_TYPES = [
  { value: "PIANTONAMENTO_ARMATO", label: "Piantonamento Armato" },
  { value: "SERVIZIO_FIDUCIARIO", label: "Servizio Fiduciario" },
  { value: "ISPEZIONI", label: "Ispezioni" },
  { value: "APERTURA_CHIUSURA", label: "Apertura/Chiusura" },
  { value: "BONIFICA", label: "Bonifica" }, // Nuovo tipo di servizio
] as const; // Use 'as const' for better type inference

export type ServiceType = (typeof SERVICE_TYPES)[number]["value"];

// Define INSPECTION_TYPES as an array of objects
export const INSPECTION_TYPES = [
  { value: "PERIMETRALE", label: "Perimetrale" },
  { value: "INTERNA", label: "Interna" },
  { value: "COMPLETA", label: "Completa" },
] as const; // Use 'as const' for better type inference

export type InspectionType = (typeof INSPECTION_TYPES)[number]["value"];

// Define APERTURA_CHIUSURA_TYPES as an array of objects
export const APERTURA_CHIUSURA_TYPES = [
  { value: "APERTURA_E_CHIUSURA", label: "Apertura e Chiusura" },
  { value: "SOLO_APERTURA", label: "Solo Apertura" },
  { value: "SOLO_CHIUSURA", label: "Solo Chiusura" },
] as const;

export type AperturaChiusuraType = (typeof APERTURA_CHIUSURA_TYPES)[number]["value"];

// Original daily schedule schema (for services requiring start AND end time)
export const dailyScheduleSchema = z.object({
  id: z.string().optional(),
  giorno_settimana: z.string(),
  h24: z.boolean(),
  ora_inizio: z.string().regex(timeRegex, "Formato ora non valido (HH:mm)").nullable(),
  ora_fine: z.string().regex(timeRegex, "Formato ora non valido (HH:mm)").nullable(),
  attivo: z.boolean(),
}).refine(data => {
  if (!data.attivo) {
    return data.h24 === false && data.ora_inizio === null && data.ora_fine === null;
  }
  if (data.h24) {
    return data.ora_inizio === null && data.ora_fine === null;
  } else {
    return data.ora_inizio !== null && data.ora_fine !== null; // Requires both start and end
  }
}, {
  message: "Specificare orari di inizio e fine o selezionare h24 se il giorno è attivo.",
  path: ["ora_inizio"],
}).refine(data => {
  if (data.attivo && !data.h24 && data.ora_inizio && data.ora_fine) {
    const [startH, startM] = data.ora_inizio.split(':').map(Number);
    const [endH, endM] = data.ora_fine.split(':').map(Number);
    const startTime = setMinutes(setHours(new Date(), startH), startM);
    const endTime = setMinutes(setHours(new Date(), endM), endM);
    return endTime > startTime;
  }
  return true;
}, {
  message: "L'ora di fine deve essere successiva all'ora di inizio.",
  path: ["ora_fine"],
});

// New daily schedule schema for Bonifica (only requires start time if active and not h24)
export const bonificaDailyScheduleSchema = z.object({
  id: z.string().optional(),
  giorno_settimana: z.string(),
  h24: z.boolean(),
  ora_inizio: z.string().regex(timeRegex, "Formato ora non valido (HH:mm)").nullable(),
  ora_fine: z.string().nullable(), // ora_fine is always nullable for Bonifica
  attivo: z.boolean(),
}).refine(data => {
  if (!data.attivo) {
    return data.h24 === false && data.ora_inizio === null && data.ora_fine === null;
  }
  if (data.h24) {
    return data.ora_inizio === null && data.ora_fine === null;
  } else {
    return data.ora_inizio !== null; // Only requires ora_inizio for Bonifica
  }
}, {
  message: "Specificare un orario di inizio o selezionare h24 se il giorno è attivo.",
  path: ["ora_inizio"],
});


// Define a base schema for common fields as a plain ZodObject
const baseRichiestaServizioObjectSchema = z.object({
  client_id: z.string().uuid("Seleziona un cliente valido."),
  punto_servizio_id: z.string().uuid("Seleziona un punto servizio valido.").nullable(),
  fornitore_id: z.string().uuid("Seleziona un fornitore valido.").nullable(),
  note: z.string().nullable(),
});

// Define schema for PIANTONAMENTO_ARMATO without refinement
const piantonamentoArmatoBaseSchema = baseRichiestaServizioObjectSchema.extend({
  tipo_servizio: z.literal(SERVICE_TYPES[0].value), // Use the value from the object
  data_inizio_servizio: z.date({ required_error: "La data di inizio servizio è richiesta." }),
  data_fine_servizio: z.date({ required_error: "La data di fine servizio è richiesta." }),
  numero_agenti: z.coerce.number().min(1, "Il numero di agenti deve essere almeno 1."),
  daily_schedules: z.array(dailyScheduleSchema).min(8, "Devi definire gli orari per tutti i giorni della settimana e per i festivi."),
});

// Define schema for SERVIZIO_FIDUCIARIO without refinement
const servizioFiduciarioBaseSchema = baseRichiestaServizioObjectSchema.extend({
  tipo_servizio: z.literal(SERVICE_TYPES[1].value), // Use the value from the object
  data_inizio_servizio: z.date({ required_error: "La data di inizio servizio è richiesta." }),
  data_fine_servizio: z.date({ required_error: "La data di fine servizio è richiesta." }),
  numero_agenti: z.coerce.number().min(1, "Il numero di agenti deve essere almeno 1."),
  daily_schedules: z.array(dailyScheduleSchema).min(8, "Devi definire gli orari per tutti i giorni della settimana e per i festivi."),
});

// Define schema for ISPEZIONI without refinement
const ispezioniBaseSchema = baseRichiestaServizioObjectSchema.extend({
  tipo_servizio: z.literal(SERVICE_TYPES[2].value), // Use the value from the object
  data_inizio_servizio: z.date({ required_error: "La data di inizio servizio è richiesta." }),
  data_fine_servizio: z.date({ required_error: "La data di fine servizio è richiesta." }),
  numero_agenti: z.coerce.number().min(1, "Il numero di agenti deve essere almeno 1."), // Keep numero_agenti for ISPEZIONI as well, as per current schema
  daily_schedules: z.array(dailyScheduleSchema).min(8, "Devi definire gli orari per tutti i giorni della settimana e per i festivi."),
  // Retain inspection-specific fields
  cadenza_ore: z.coerce.number().min(0.5, "La cadenza deve essere almeno 0.5 ore."),
  tipo_ispezione: z.enum(INSPECTION_TYPES.map(t => t.value) as [string, ...string[]], { required_error: "Il tipo di ispezione è richiesto." }),
});

// Define schema for APERTURA_CHIUSURA
const aperturaChiusuraBaseSchema = baseRichiestaServizioObjectSchema.extend({
  tipo_servizio: z.literal(SERVICE_TYPES.find(t => t.value === "APERTURA_CHIUSURA")!.value),
  data_inizio_servizio: z.date({ required_error: "La data di inizio servizio è richiesta." }),
  data_fine_servizio: z.date({ required_error: "La data di fine servizio è richiesta." }),
  numero_agenti: z.coerce.number().min(1, "Il numero di agenti deve essere almeno 1."),
  daily_schedules: z.array(dailyScheduleSchema).min(8, "Devi definire gli orari per tutti i giorni della settimana e per i festivi."),
  tipo_apertura_chiusura: z.enum(APERTURA_CHIUSURA_TYPES.map(t => t.value) as [string, ...string[]], { required_error: "Il tipo di attività è richiesto." }),
});

// Define schema for BONIFICA (only requires start time)
const bonificaBaseSchema = baseRichiestaServizioObjectSchema.extend({
  tipo_servizio: z.literal(SERVICE_TYPES.find(t => t.value === "BONIFICA")!.value),
  data_inizio_servizio: z.date({ required_error: "La data di inizio servizio è richiesta." }),
  data_fine_servizio: z.date({ required_error: "La data di fine servizio è richiesta." }),
  numero_agenti: z.coerce.number().min(1, "Il numero di agenti deve essere almeno 1."),
  daily_schedules: z.array(bonificaDailyScheduleSchema).min(8, "Devi definire gli orari per tutti i giorni della settimana e per i festivi."), // Use bonificaDailyScheduleSchema
});


export const richiestaServizioFormSchema = z.discriminatedUnion("tipo_servizio", [
  piantonamentoArmatoBaseSchema,
  servizioFiduciarioBaseSchema,
  ispezioniBaseSchema,
  aperturaChiusuraBaseSchema,
  bonificaBaseSchema, // Aggiunto il nuovo schema
]);
// IMPORTANT: Conditional refinements for date/time ranges (e.g., data_fine_servizio > data_inizio_servizio,
// ora_fine_fascia > ora_inizio_fascia) must now be implemented at the form level
// using `form.superRefine` or within the `onSubmit` handler.

export type RichiestaServizioFormSchema = z.infer<typeof richiestaServizioFormSchema>;
export type IspezioniFormSchema = z.infer<typeof ispezioniBaseSchema>; // Nuovo tipo esportato
export type AperturaChiusuraFormSchema = z.infer<typeof aperturaChiusuraBaseSchema>; // Nuovo tipo esportato
export type BonificaFormSchema = z.infer<typeof bonificaBaseSchema>; // Nuovo tipo esportato

export const calculateTotalHours = (
  serviceStartDate: Date,
  serviceEndDate: Date,
  dailySchedules: z.infer<typeof dailyScheduleSchema>[],
  numAgents: number
): number => {
  let totalHours = 0;
  let currentDate = new Date(serviceStartDate);
  currentDate.setHours(0, 0, 0, 0); // Normalize to start of local day for iteration

  const endServiceDateNormalized = new Date(serviceEndDate);
  endServiceDateNormalized.setHours(0, 0, 0, 0); // Normalize to start of local day for comparison

  while (currentDate <= endServiceDateNormalized) {
    const dayOfWeek = format(currentDate, 'EEEE', { locale: it }); // e.g., "lunedì"
    const schedule = dailySchedules.find(s => s.giorno_settimana.toLowerCase() === dayOfWeek.toLowerCase());

    if (schedule && schedule.attivo) {
      if (schedule.h24) {
        totalHours += 24;
      } else if (schedule.ora_inizio && schedule.ora_fine) {
        const [startH, startM] = schedule.ora_inizio.split(':').map(Number);
        const [endH, endM] = schedule.ora_fine.split(':').map(Number);

        // Calculate start and end times in minutes from midnight for the current day
        let dayStartMinutes = startH * 60 + startM;
        let dayEndMinutes = endH * 60 + endM;

        // For the first day of the service period, consider the global service start time if it's later than the daily schedule start
        // For the last day of the service period, consider the global service end time if it's earlier than the daily schedule end
        // Since global times are removed, we assume the daily schedule times are the effective boundaries.
        // The `serviceStartDate` and `serviceEndDate` now only define the range of days.

        if (dayEndMinutes > dayStartMinutes) {
          totalHours += (dayEndMinutes - dayStartMinutes) / 60; // Convert minutes difference to hours
        }
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  // Round final result to two decimal places for display
  return parseFloat((totalHours * numAgents).toFixed(2));
};

export const calculateTotalInspections = (
  serviceStartDate: Date,
  serviceEndDate: Date,
  dailySchedules: z.infer<typeof dailyScheduleSchema>[],
  cadenzaOre: number,
  numAgents: number
): number => {
  if (cadenzaOre <= 0) return 0; // Avoid division by zero

  let totalInspections = 0;
  let currentDate = new Date(serviceStartDate);
  currentDate.setHours(0, 0, 0, 0);

  const endServiceDateNormalized = new Date(serviceEndDate);
  endServiceDateNormalized.setHours(0, 0, 0, 0);

  while (currentDate <= endServiceDateNormalized) {
    const dayOfWeek = format(currentDate, 'EEEE', { locale: it });
    const schedule = dailySchedules.find(s => s.giorno_settimana.toLowerCase() === dayOfWeek.toLowerCase());

    if (schedule && schedule.attivo) {
      let durationHours = 0;
      if (schedule.h24) {
        durationHours = 24;
      } else if (schedule.ora_inizio && schedule.ora_fine) {
        const [startH, startM] = schedule.ora_inizio.split(':').map(Number);
        const [endH, endM] = schedule.ora_fine.split(':').map(Number);
        const dayStartMinutes = startH * 60 + startM;
        const dayEndMinutes = endH * 60 + endM;

        if (dayEndMinutes > dayStartMinutes) {
          durationHours = (dayEndMinutes - dayStartMinutes) / 60;
        }
      }
      totalInspections += Math.floor(durationHours / cadenzaOre);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  // Multiply by number of agents as per previous logic for total calculated value
  return parseFloat((totalInspections * numAgents).toFixed(2));
};

export const calculateAperturaChiusuraCount = (
  serviceStartDate: Date,
  serviceEndDate: Date,
  dailySchedules: (z.infer<typeof dailyScheduleSchema> | z.infer<typeof bonificaDailyScheduleSchema>)[], // Allow both schemas
  tipoAperturaChiusura: AperturaChiusuraType | "BONIFICA_SINGLE_START", // Add a specific type for Bonifica
  numAgents: number
): number => {
  let countPerDay = 0;
  if (tipoAperturaChiusura === "APERTURA_E_CHIUSURA") {
    countPerDay = 2;
  } else if (tipoAperturaChiusura === "SOLO_APERTURA" || tipoAperturaChiusura === "SOLO_CHIUSURA") {
    countPerDay = 1;
  } else if (tipoAperturaChiusura === "BONIFICA_SINGLE_START") { // Handle Bonifica with single start time
    countPerDay = 1;
  }
  else {
    return 0;
  }

  let totalCount = 0;
  let currentDate = new Date(serviceStartDate);
  currentDate.setHours(0, 0, 0, 0);

  const endServiceDateNormalized = new Date(serviceEndDate);
  endServiceDateNormalized.setHours(0, 0, 0, 0);

  while (currentDate <= endServiceDateNormalized) {
    const dayOfWeek = format(currentDate, 'EEEE', { locale: it });
    const schedule = dailySchedules.find(s => s.giorno_settimana.toLowerCase() === dayOfWeek.toLowerCase());

    if (schedule && schedule.attivo) {
      totalCount += countPerDay;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  // Multiply by number of agents if the business logic requires it for total calculated value
  return parseFloat((totalCount * numAgents).toFixed(2));
};


export const defaultDailySchedules = [
  { giorno_settimana: "Lunedì", h24: false, ora_inizio: "09:00", ora_fine: "18:00", attivo: true },
  { giorno_settimana: "Martedì", h24: false, ora_inizio: "09:00", ora_fine: "18:00", attivo: true },
  { giorno_settimana: "Mercoledì", h24: false, ora_inizio: "09:00", ora_fine: "18:00", attivo: true },
  { giorno_settimana: "Giovedì", h24: false, ora_inizio: "09:00", ora_fine: "18:00", attivo: true },
  { giorno_settimana: "Venerdì", h24: false, ora_inizio: "09:00", ora_fine: "18:00", attivo: true },
  { giorno_settimana: "Sabato", h24: false, ora_inizio: "09:00", ora_fine: "13:00", attivo: true },
  { giorno_settimana: "Domenica", h24: false, ora_inizio: "09:00", ora_fine: "18:00", attivo: true },
  { giorno_settimana: "Festivo", h24: false, ora_inizio: "09:00", ora_fine: "18:00", attivo: true },
];

export const daysOfWeek = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica", "Festivo"];