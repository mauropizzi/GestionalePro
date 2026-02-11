import * as z from "zod";
import { format, setHours, setMinutes, addDays } from "date-fns";
import { it } from "date-fns/locale";

export const timeRegex = /^([01]\d|2[0-3])[.:]([0-5]\d)$/; // Modificato per accettare sia . che :

export const SERVICE_TYPES = [
  { value: "PIANTONAMENTO_ARMATO", label: "Piantonamento Armato" },
  { value: "SERVIZIO_FIDUCIARIO", label: "Servizio Fiduciario" },
  { value: "ISPEZIONI", label: "Ispezioni" },
  { value: "APERTURA_CHIUSURA", label: "Apertura/Chiusura" },
  { value: "BONIFICA", label: "Bonifica" },
  { value: "GESTIONE_CHIAVI", label: "Gestione Chiavi" },
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number]["value"];

export const INSPECTION_TYPES = [
  { value: "PERIMETRALE", label: "Perimetrale" },
  { value: "INTERNA", label: "Interna" },
  { value: "COMPLETA", label: "Completa" },
] as const;

export type InspectionType = (typeof INSPECTION_TYPES)[number]["value"];

export const APERTURA_CHIUSURA_TYPES = [
  { value: "APERTURA_E_CHIUSURA", label: "Apertura e Chiusura" },
  { value: "SOLO_APERTURA", "label": "Solo Apertura" },
  { value: "SOLO_CHIUSURA", "label": "Solo Chiusura" },
] as const;

export type AperturaChiusuraType = (typeof APERTURA_CHIUSURA_TYPES)[number]["value"];

export const BONIFICA_TYPES = [
  { value: "BONIFICA_STANDARD", label: "Bonifica Standard" },
  { value: "BONIFICA_URGENTE", label: "Bonifica Urgente" },
] as const;

export type BonificaType = (typeof BONIFICA_TYPES)[number]["value"];

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
  // Se il giorno è attivo e non H24, ora_inizio è sempre richiesto.
  if (data.attivo && !data.h24 && !data.ora_inizio) {
    return false;
  }
  return true;
}, {
  message: "L'ora di inizio è richiesta se il giorno è attivo e non H24.",
  path: ["ora_inizio"],
}).refine(data => {
  // La validazione ora_fine > ora_inizio si applica solo se entrambi gli orari sono presenti
  if (data.attivo && !data.h24 && data.ora_inizio && data.ora_fine) {
    const [startH, startM] = data.ora_inizio.split(':').map(Number);
    const [endH, endM] = data.ora_fine.split(':').map(Number);
    let startTime = setMinutes(setHours(new Date(2000, 0, 1), startH), startM);
    let endTime = setMinutes(setHours(new Date(2000, 0, 1), endH), endM);

    if (endTime <= startTime) {
      endTime = addDays(endTime, 1);
    }
    return endTime > startTime;
  }
  return true;
}, {
  message: "L'ora di fine deve essere successiva all'ora di inizio (anche per turni notturni).",
  path: ["ora_fine"],
});

const baseRichiestaServizioObjectSchema = z.object({
  client_id: z.string().uuid("Seleziona un cliente valido."),
  punto_servizio_id: z.string().uuid("Seleziona un punto servizio valido.").nullable(),
  fornitore_id: z.string().uuid("Seleziona un fornitore valido.").nullable(),
  note: z.string().nullable(),
});

const piantonamentoArmatoBaseSchema = baseRichiestaServizioObjectSchema.extend({
  tipo_servizio: z.literal(SERVICE_TYPES[0].value),
  data_inizio_servizio: z.date({ required_error: "La data di inizio servizio è richiesta." }),
  data_fine_servizio: z.date({ required_error: "La data di fine servizio è richiesta." }),
  numero_agenti: z.coerce.number().min(1, "Il numero di agenti deve essere almeno 1."),
  daily_schedules: z.array(dailyScheduleSchema).min(8, "Devi definire gli orari per tutti i giorni della settimana e per i festivi."),
});

const servizioFiduciarioBaseSchema = baseRichiestaServizioObjectSchema.extend({
  tipo_servizio: z.literal(SERVICE_TYPES[1].value),
  data_inizio_servizio: z.date({ required_error: "La data di inizio servizio è richiesta." }),
  data_fine_servizio: z.date({ required_error: "La data di fine servizio è richiesta." }),
  numero_agenti: z.coerce.number().min(1, "Il numero di agenti deve essere almeno 1."),
  daily_schedules: z.array(dailyScheduleSchema).min(8, "Devi definire gli orari per tutti i giorni della settimana e per i festivi."),
});

const ispezioniBaseSchema = baseRichiestaServizioObjectSchema.extend({
  tipo_servizio: z.literal(SERVICE_TYPES[2].value),
  data_inizio_servizio: z.date({ required_error: "La data di inizio servizio è richiesta." }),
  data_fine_servizio: z.date({ required_error: "La data di fine servizio è richiesta." }),
  numero_agenti: z.coerce.number().min(1, "Il numero di agenti deve essere almeno 1."),
  daily_schedules: z.array(dailyScheduleSchema).min(8, "Devi definire gli orari per tutti i giorni della settimana e per i festivi."),
  cadenza_ore: z.coerce.number().min(0.5, "La cadenza deve essere almeno 0.5 ore."),
  tipo_ispezione: z.enum(INSPECTION_TYPES.map(t => t.value) as [string, ...string[]], { required_error: "Il tipo di ispezione è richiesto." }),
});

const aperturaChiusuraBaseSchema = baseRichiestaServizioObjectSchema.extend({
  tipo_servizio: z.literal(SERVICE_TYPES.find(t => t.value === "APERTURA_CHIUSURA")!.value),
  data_inizio_servizio: z.date({ required_error: "La data di inizio servizio è richiesta." }),
  data_fine_servizio: z.date({ required_error: "La data di fine servizio è richiesta." }),
  numero_agenti: z.coerce.number().min(1, "Il numero di agenti deve essere almeno 1."),
  daily_schedules: z.array(dailyScheduleSchema).min(8, "Devi definire gli orari per tutti i giorni della settimana e per i festivi."),
  tipo_apertura_chiusura: z.enum(APERTURA_CHIUSURA_TYPES.map(t => t.value) as [string, ...string[]], { required_error: "Il tipo di attività è richiesto." }),
});

const bonificaBaseSchema = baseRichiestaServizioObjectSchema.extend({
  tipo_servizio: z.literal(SERVICE_TYPES.find(t => t.value === "BONIFICA")!.value),
  data_inizio_servizio: z.date({ required_error: "La data di inizio servizio è richiesta." }),
  data_fine_servizio: z.date({ required_error: "La data di fine servizio è richiesta." }),
  numero_agenti: z.coerce.number().min(1, "Il numero di agenti deve essere almeno 1."),
  daily_schedules: z.array(dailyScheduleSchema).min(8, "Devi definire gli orari per tutti i giorni della settimana e per i festivi."),
  tipo_bonifica: z.enum(BONIFICA_TYPES.map(t => t.value) as [string, ...string[]], { required_error: "Il tipo di bonifica è richiesto." }),
});

const gestioneChiaviBaseSchema = baseRichiestaServizioObjectSchema.extend({
  tipo_servizio: z.literal(SERVICE_TYPES.find(t => t.value === "GESTIONE_CHIAVI")!.value),
  data_inizio_servizio: z.date({ required_error: "La data di inizio servizio è richiesta." }),
  data_fine_servizio: z.date({ required_error: "La data di fine servizio è richiesta." }),
  numero_agenti: z.coerce.number().min(1, "Il numero di agenti deve essere almeno 1."),
  daily_schedules: z.array(dailyScheduleSchema).min(8, "Devi definire gli orari per tutti i giorni della settimana e per i festivi."),
  tipo_gestione_chiavi: z.enum(GESTIONE_CHIAVI_TYPES.map(t => t.value) as [string, ...string[]], { required_error: "Il tipo di gestione chiavi è richiesto." }),
});


export const richiestaServizioFormSchema = z.discriminatedUnion("tipo_servizio", [
  piantonamentoArmatoBaseSchema,
  servizioFiduciarioBaseSchema,
  ispezioniBaseSchema,
  aperturaChiusuraBaseSchema,
  bonificaBaseSchema,
  gestioneChiaviBaseSchema,
]).superRefine((data, ctx) => {
  const isSingleTimeService = data.tipo_servizio === "BONIFICA" ||
    (data.tipo_servizio === "APERTURA_CHIUSURA" && (data.tipo_apertura_chiusura === "SOLO_APERTURA" || data.tipo_apertura_chiusura === "SOLO_CHIUSURA")) ||
    data.tipo_servizio === "GESTIONE_CHIAVI";

  data.daily_schedules.forEach((schedule, index) => {
    if (schedule.attivo) {
      if (isSingleTimeService) {
        // Per servizi a orario singolo, H24 non è permesso e ora_fine deve essere null
        if (schedule.h24) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Per il servizio ${data.tipo_servizio.replace(/_/g, ' ')}, il giorno ${schedule.giorno_settimana} non può essere H24.`,
            path: [`daily_schedules`, index, `h24`],
          });
        }
        if (schedule.ora_fine !== null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Per il servizio ${data.tipo_servizio.replace(/_/g, ' ')}, il giorno ${schedule.giorno_settimana} deve avere solo un orario di inizio.`,
            path: [`daily_schedules`, index, `ora_fine`],
          });
        }
      } else {
        // Per altri servizi, se attivo e non H24, ora_fine è richiesto
        if (!schedule.h24 && !schedule.ora_fine) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `L'ora di fine è richiesta per il giorno ${schedule.giorno_settimana} se il servizio non è H24.`,
            path: [`daily_schedules`, index, `ora_fine`],
          });
        }
      }
    }
  });
});

export type RichiestaServizioFormSchema = z.infer<typeof richiestaServizioFormSchema>;
export type IspezioniFormSchema = z.infer<typeof ispezioniBaseSchema>;
export type AperturaChiusuraFormSchema = z.infer<typeof aperturaChiusuraBaseSchema>;
export type BonificaFormSchema = z.infer<typeof bonificaBaseSchema>;
export type GestioneChiaviFormSchema = z.infer<typeof gestioneChiaviBaseSchema>;

export const calculateTotalHours = (
  serviceStartDate: Date,
  serviceEndDate: Date,
  dailySchedules: z.infer<typeof dailyScheduleSchema>[],
  numAgents: number
): number => {
  let totalHours = 0;
  let currentDate = new Date(serviceStartDate);
  currentDate.setHours(0, 0, 0, 0);

  const endServiceDateNormalized = new Date(serviceEndDate);
  endServiceDateNormalized.setHours(0, 0, 0, 0);

  while (currentDate <= endServiceDateNormalized) {
    const dayOfWeek = format(currentDate, 'EEEE', { locale: it });
    const schedule = dailySchedules.find(s => s.giorno_settimana.toLowerCase() === dayOfWeek.toLowerCase());

    if (schedule && schedule.attivo) {
      if (schedule.h24) {
        totalHours += 24;
      } else if (schedule.ora_inizio && schedule.ora_fine) {
        const [startH, startM] = schedule.ora_inizio.split(':').map(Number);
        const [endH, endM] = schedule.ora_fine.split(':').map(Number);

        let durationMinutes = 0;
        let dayStartMinutes = startH * 60 + startM;
        let dayEndMinutes = endH * 60 + endM;

        if (dayEndMinutes > dayStartMinutes) {
          durationMinutes = dayEndMinutes - dayStartMinutes;
        } else {
          durationMinutes = (24 * 60 - dayStartMinutes) + dayEndMinutes;
        }
        totalHours += durationMinutes / 60;
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return parseFloat((totalHours * numAgents).toFixed(2));
};

export const calculateTotalInspections = (
  serviceStartDate: Date,
  serviceEndDate: Date,
  dailySchedules: z.infer<typeof dailyScheduleSchema>[],
  cadenzaOre: number,
  numAgents: number
): number => {
  if (cadenzaOre <= 0) return 0;

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
        let dayStartMinutes = startH * 60 + startM;
        let dayEndMinutes = endH * 60 + endM;

        let durationMinutes = 0;
        if (dayEndMinutes > dayStartMinutes) {
          durationMinutes = dayEndMinutes - dayStartMinutes;
        } else {
          durationMinutes = (24 * 60 - dayStartMinutes) + dayEndMinutes;
        }
        durationHours = durationMinutes / 60;
      }
      totalInspections += Math.floor(durationHours / cadenzaOre);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
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
  return parseFloat((totalCount * numAgents).toFixed(2));
};

export const calculateBonificaCount = (
  serviceStartDate: Date,
  serviceEndDate: Date,
  dailySchedules: z.infer<typeof dailyScheduleSchema>[],
  tipoBonifica: BonificaType,
  numAgents: number
): number => {
  let countPerDay = 1;

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
  let countPerDay = 1;

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