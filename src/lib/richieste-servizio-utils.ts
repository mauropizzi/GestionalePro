import * as z from "zod";
import { format, setHours, setMinutes } from "date-fns";
import { it } from "date-fns/locale";

export const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Define SERVICE_TYPES as an array of objects
export const SERVICE_TYPES = [
  { value: "PIANTONAMENTO_ARMATO", label: "Piantonamento Armato" },
  { value: "SERVIZIO_FIDUCIARIO", label: "Servizio Fiduciario" },
  { value: "ISPEZIONI", label: "Ispezioni" },
] as const; // Use 'as const' for better type inference

export type ServiceType = (typeof SERVICE_TYPES)[number]["value"];

// Define INSPECTION_TYPES as an array of objects
export const INSPECTION_TYPES = [
  { value: "PERIMETRALE", label: "Perimetrale" },
  { value: "INTERNA", label: "Interna" },
  { value: "COMPLETA", label: "Completa" },
] as const; // Use 'as const' for better type inference

export type InspectionType = (typeof INSPECTION_TYPES)[number]["value"];

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
    return data.ora_inizio !== null && data.ora_fine !== null;
  }
}, {
  message: "Specificare orari di inizio e fine o selezionare h24 se il giorno è attivo.",
  path: ["ora_inizio"],
}).refine(data => {
  if (data.attivo && !data.h24 && data.ora_inizio && data.ora_fine) {
    const [startH, startM] = data.ora_inizio.split(':').map(Number);
    const [endH, endM] = data.ora_fine.split(':').map(Number);
    const startTime = setMinutes(setHours(new Date(), startH), startM);
    const endTime = setMinutes(setHours(new Date(), endH), endM);
    return endTime > startTime;
  }
  return true;
}, {
  message: "L'ora di fine deve essere successiva all'ora di inizio.",
  path: ["ora_fine"],
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
  ora_inizio_servizio: z.string().regex(timeRegex, "Formato ora non valido (HH:mm)"),
  data_fine_servizio: z.date({ required_error: "La data di fine servizio è richiesta." }),
  ora_fine_servizio: z.string().regex(timeRegex, "Formato ora non valido (HH:mm)"),
  numero_agenti: z.coerce.number().min(1, "Il numero di agenti deve essere almeno 1."),
  daily_schedules: z.array(dailyScheduleSchema).min(8, "Devi definire gli orari per tutti i giorni della settimana e per i festivi."),
});

// Define schema for SERVIZIO_FIDUCIARIO without refinement
const servizioFiduciarioBaseSchema = baseRichiestaServizioObjectSchema.extend({
  tipo_servizio: z.literal(SERVICE_TYPES[1].value), // Use the value from the object
  data_inizio_servizio: z.date({ required_error: "La data di inizio servizio è richiesta." }),
  ora_inizio_servizio: z.string().regex(timeRegex, "Formato ora non valido (HH:mm)"),
  data_fine_servizio: z.date({ required_error: "La data di fine servizio è richiesta." }),
  ora_fine_servizio: z.string().regex(timeRegex, "Formato ora non valido (HH:mm)"),
  numero_agenti: z.coerce.number().min(1, "Il numero di agenti deve essere almeno 1."),
  daily_schedules: z.array(dailyScheduleSchema).min(8, "Devi definire gli orari per tutti i giorni della settimana e per i festivi."),
});

// Define schema for ISPEZIONI without refinement
const ispezioniBaseSchema = baseRichiestaServizioObjectSchema.extend({
  tipo_servizio: z.literal(SERVICE_TYPES[2].value), // Use the value from the object
  data_inizio_servizio: z.date({ required_error: "La data di inizio servizio è richiesta." }),
  ora_inizio_servizio: z.string().regex(timeRegex, "Formato ora non valido (HH:mm)"),
  data_fine_servizio: z.date({ required_error: "La data di fine servizio è richiesta." }),
  ora_fine_servizio: z.string().regex(timeRegex, "Formato ora non valido (HH:mm)"),
  numero_agenti: z.coerce.number().min(1, "Il numero di agenti deve essere almeno 1."), // Keep numero_agenti for ISPEZIONI as well, as per current schema
  daily_schedules: z.array(dailyScheduleSchema).min(8, "Devi definire gli orari per tutti i giorni della settimana e per i festivi."),
  // Retain inspection-specific fields
  ora_inizio_fascia: z.string().regex(timeRegex, "Formato ora non valido (HH:mm)"),
  ora_fine_fascia: z.string().regex(timeRegex, "Formato ora non valido (HH:mm)"),
  cadenza_ore: z.coerce.number().min(0.5, "La cadenza deve essere almeno 0.5 ore."),
  tipo_ispezione: z.enum(INSPECTION_TYPES.map(t => t.value) as [string, ...string[]], { required_error: "Il tipo di ispezione è richiesto." }),
});

export const richiestaServizioFormSchema = z.discriminatedUnion("tipo_servizio", [
  piantonamentoArmatoBaseSchema,
  servizioFiduciarioBaseSchema,
  ispezioniBaseSchema,
]);
// IMPORTANT: Conditional refinements for date/time ranges (e.g., data_fine_servizio > data_inizio_servizio,
// ora_fine_fascia > ora_inizio_fascia) must now be implemented at the form level
// using `form.superRefine` or within the `onSubmit` handler.

export type RichiestaServizioFormSchema = z.infer<typeof richiestaServizioFormSchema>;
export type IspezioniFormSchema = z.infer<typeof ispezioniBaseSchema>; // Nuovo tipo esportato

export const calculateTotalHours = (
  serviceStartDateTime: Date,
  serviceEndDateTime: Date,
  dailySchedules: z.infer<typeof dailyScheduleSchema>[],
  numAgents: number
): number => {
  let totalHours = 0;
  let currentDate = new Date(serviceStartDateTime);
  currentDate.setHours(0, 0, 0, 0); // Normalize to start of local day for iteration

  const endServiceDate = new Date(serviceEndDateTime);
  endServiceDate.setHours(0, 0, 0, 0); // Normalize to start of local day for comparison

  while (currentDate <= endServiceDate) {
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

        // Adjust for overall service start/end times on the first/last day of the service period
        if (currentDate.toDateString() === serviceStartDateTime.toDateString()) {
          const serviceStartHour = serviceStartDateTime.getHours();
          const serviceStartMinute = serviceStartDateTime.getMinutes();
          const actualServiceStartMinutes = serviceStartHour * 60 + serviceStartMinute;
          if (actualServiceStartMinutes > dayStartMinutes) {
            dayStartMinutes = actualServiceStartMinutes;
          }
        }
        if (currentDate.toDateString() === serviceEndDateTime.toDateString()) {
          const serviceEndHour = serviceEndDateTime.getHours();
          const serviceEndMinute = serviceEndDateTime.getMinutes();
          const actualServiceEndMinutes = serviceEndHour * 60 + serviceEndMinute;
          if (actualServiceEndMinutes < dayEndMinutes) {
            dayEndMinutes = actualServiceEndMinutes;
          }
        }

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

export const calculateNumberOfInspections = (
  oraInizioFascia: string,
  oraFineFascia: string,
  cadenzaOre: number
): number => {
  const [startH, startM] = oraInizioFascia.split(':').map(Number);
  const [endH, endM] = oraFineFascia.split(':').map(Number);

  const startTimeInMinutes = startH * 60 + startM;
  const endTimeInMinutes = endH * 60 + endM;

  const durationInMinutes = endTimeInMinutes - startTimeInMinutes;
  if (durationInMinutes <= 0) return 0;

  const cadenzaInMinutes = cadenzaOre * 60;

  // Number of inspections is the floor of the total duration divided by the cadence
  // This counts the number of full intervals that can start within the timeframe.
  return Math.floor(durationInMinutes / cadenzaInMinutes);
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