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
  { value: "BONIFICA", label: "Bonifica" },
  { value: "GESTIONE_CHIAVI", label: "Gestione Chiavi" }, // Nuovo tipo di servizio
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
  { value: "SOLO_APERTURA", "label": "Solo Apertura" },
  { value: "SOLO_CHIUSURA", "label": "Solo Chiusura" },
] as const;

export type AperturaChiusuraType = (typeof APERTURA_CHIUSURA_TYPES)[number]["value"];

// Define BONIFICA_TYPES as an array of objects (for future expansion, currently simple)
export const BONIFICA_TYPES = [
  { value: "BONIFICA_STANDARD", label: "Bonifica Standard" },
  { value: "BONIFICA_URGENTE", label: "Bonifica Urgente" },
] as const;

export type BonificaType = (typeof BONIFICA_TYPES)[number]["value"];

// Define GESTIONE_CHIAVI_TYPES as an array of objects
export const GESTIONE_CHIAVI_TYPES = [
  { value: "RITIRO_CHIAVI", label: "Ritiro Chiavi" },
  { value: "CONSEGNA_CHIAVI", label: "Consegna Chiavi" },
  { value: "VERIFICA_CHIAVI", label: "Verifica Chiavi" },
] as const;

export type GestioneChiaviType = (typeof GESTIONE_CHIAVI_TYPES)[number]["value"];


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
    const endTime = setMinutes(setHours(new Date(), endH), endM); // Corretto: setMinutes(setHours(new Date(), endH), endM)
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

// Define schema for BONIFICA
const bonificaBaseSchema = baseRichiestaServizioObjectSchema.extend({
  tipo_servizio: z.literal(SERVICE_TYPES.find(t => t.value === "BONIFICA")!.value),
  data_inizio_servizio: z.date({ required_error: "La data di inizio servizio è richiesta." }),
  data_fine_servizio: z.date({ required_error: "La data di fine servizio è richiesta." }),
  numero_agenti: z.coerce.number().min(1, "Il numero di agenti deve essere almeno 1."),
  daily_schedules: z.array(dailyScheduleSchema).min(8, "Devi definire gli orari per tutti i giorni della settimana e per i festivi."),
  tipo_bonifica: z.enum(BONIFICA_TYPES.map(t => t.value) as [string, ...string[]], { required_error: "Il tipo di bonifica è richiesto." }), // Campo specifico per Bonifica
});

// Define schema for GESTIONE_CHIAVI
const gestioneChiaviBaseSchema = baseRichiestaServizioObjectSchema.extend({
  tipo_servizio: z.literal(SERVICE_TYPES.find(t => t.value === "GESTIONE_CHIAVI")!.value),
  data_inizio_servizio: z.date({ required_error: "La data di inizio servizio è richiesta." }),
  data_fine_servizio: z.date({ required_error: "La data di fine servizio è richiesta." }),
  numero_agenti: z.coerce.number().min(1, "Il numero di agenti deve essere almeno 1."),
  daily_schedules: z.array(dailyScheduleSchema).min(8, "Devi definire gli orari per tutti i giorni della settimana e per i festivi."),
  tipo_gestione_chiavi: z.enum(GESTIONE_CHIAVI_TYPES.map(t => t.value) as [string, ...string[]], { required_error: "Il tipo di gestione chiavi è richiesto." }), // Campo specifico per Gestione Chiavi
});


export const richiestaServizioFormSchema = z.discriminatedUnion("tipo_servizio", [
  piantonamentoArmatoBaseSchema,
  servizioFiduciarioBaseSchema,
  ispezioniBaseSchema,
  aperturaChiusuraBaseSchema,
  bonificaBaseSchema,
  gestioneChiaviBaseSchema, // Aggiunto il nuovo schema per Gestione Chiavi
]).superRefine((data, ctx) => { // Spostato qui il superRefine per la bonifica
  if (data.tipo_servizio === "BONIFICA") {
    data.daily_schedules.forEach((schedule, index) => {
      if (schedule.attivo) {
        if (schedule.h24) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Per il servizio Bonifica, il giorno ${schedule.giorno_settimana} non può essere H24.`,
            path: [`daily_schedules`, index, `h24`],
          });
        }
        if (!schedule.ora_inizio) { // Solo ora_inizio è richiesto
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Per il servizio Bonifica, il giorno ${schedule.giorno_settimana} deve avere un orario.`,
            path: [`daily_schedules`, index, `ora_inizio`],
          });
        }
        if (schedule.ora_fine !== null) { // ora_fine deve essere null
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Per il servizio Bonifica, il giorno ${schedule.giorno_settimana} deve avere solo un orario di inizio.`,
            path: [`daily_schedules`, index, `ora_fine`],
          });
        }
      }
    });
  } else if (data.tipo_servizio === "APERTURA_CHIUSURA" && (data.tipo_apertura_chiusura === "SOLO_APERTURA" || data.tipo_apertura_chiusura === "SOLO_CHIUSURA")) {
    data.daily_schedules.forEach((schedule, index) => {
      if (schedule.attivo) {
        if (schedule.h24) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Per il servizio ${data.tipo_apertura_chiusura.replace(/_/g, ' ')}, il giorno ${schedule.giorno_settimana} non può essere H24.`,
            path: [`daily_schedules`, index, `h24`],
          });
        }
        if (!schedule.ora_inizio) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Per il servizio ${data.tipo_apertura_chiusura.replace(/_/g, ' ')}, il giorno ${schedule.giorno_settimana} deve avere un orario.`,
            path: [`daily_schedules`, index, `ora_inizio`],
          });
        }
        if (schedule.ora_fine !== null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Per il servizio ${data.tipo_apertura_chiusura.replace(/_/g, ' ')}, il giorno ${schedule.giorno_settimana} deve avere solo un orario di inizio.`,
            path: [`daily_schedules`, index, `ora_fine`],
          });
        }
      }
    });
  } else if (data.tipo_servizio === "GESTIONE_CHIAVI") { // Nuova logica per GESTIONE_CHIAVI
    data.daily_schedules.forEach((schedule, index) => {
      if (schedule.attivo) {
        if (schedule.h24) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Per il servizio Gestione Chiavi, il giorno ${schedule.giorno_settimana} non può essere H24.`,
            path: [`daily_schedules`, index, `h24`],
          });
        }
        if (!schedule.ora_inizio) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Per il servizio Gestione Chiavi, il giorno ${schedule.giorno_settimana} deve avere un orario.`,
            path: [`daily_schedules`, index, `ora_inizio`],
          });
        }
        if (schedule.ora_fine !== null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Per il servizio Gestione Chiavi, il giorno ${schedule.giorno_settimana} deve avere solo un orario di inizio.`,
            path: [`daily_schedules`, index, `ora_fine`],
          });
        }
      }
    });
  }
});
// IMPORTANT: Conditional refinements for date/time ranges (e.g., data_fine_servizio > data_inizio_servizio,
// ora_fine_fascia > ora_inizio_fascia) must now be implemented at the form level
// using `form.superRefine` or within the `onSubmit` handler.

export type RichiestaServizioFormSchema = z.infer<typeof richiestaServizioFormSchema>;
export type IspezioniFormSchema = z.infer<typeof ispezioniBaseSchema>;
export type AperturaChiusuraFormSchema = z.infer<typeof aperturaChiusuraBaseSchema>;
export type BonificaFormSchema = z.infer<typeof bonificaBaseSchema>;
export type GestioneChiaviFormSchema = z.infer<typeof gestioneChiaviBaseSchema>; // Nuovo tipo esportato

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
  dailySchedules: z.infer<typeof dailyScheduleSchema>[],
  tipoAperturaChiusura: AperturaChiusuraType,
  numAgents: number
): number => {
  let countPerDay = 0;
  if (tipoAperturaChiusura === "APERTURA_E_CHIUSURA") {
    countPerDay = 2;
  } else if (tipoAperturaChiusura === "SOLO_APERTURA" || tipoAperturaChiusura === "SOLO_CHIUSURA") {
    countPerDay = 1;
  } else {
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

export const calculateBonificaCount = (
  serviceStartDate: Date,
  serviceEndDate: Date,
  dailySchedules: z.infer<typeof dailyScheduleSchema>[],
  tipoBonifica: BonificaType,
  numAgents: number
): number => {
  // Per ora, assumiamo che ogni giorno attivo con bonifica standard o urgente conti come 1 attività.
  // Questa logica può essere raffinata in base a requisiti specifici (es. durata, complessità).
  let countPerDay = 1; // Default 1 attività per giorno attivo

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
  return parseFloat((totalCount * numAgents).toFixed(2));
};

export const calculateGestioneChiaviCount = (
  serviceStartDate: Date,
  serviceEndDate: Date,
  dailySchedules: z.infer<typeof dailyScheduleSchema>[],
  tipoGestioneChiavi: GestioneChiaviType,
  numAgents: number
): number => {
  // Simile a Bonifica, ogni giorno attivo conta come 1 attività.
  let countPerDay = 1; // Default 1 attività per giorno attivo

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