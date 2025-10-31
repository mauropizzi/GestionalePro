import * as z from "zod";

export const puntoServizioFormSchema = z.object({
  nome_punto_servizio: z.string().min(1, "Il nome del punto servizio è richiesto."),
  id_cliente: z.string().uuid("Seleziona un cliente valido.").nullable(),
  indirizzo: z.string().nullable(),
  citta: z.string().nullable(),
  cap: z.string().nullable(),
  provincia: z.string().nullable(),
  referente: z.string().nullable(),
  telefono_referente: z.string().nullable(),
  telefono: z.string().nullable(),
  email: z.string().email("Inserisci un indirizzo email valido.").nullable().or(z.literal("")),
  note: z.string().nullable(),
  tempo_intervento: z.string().nullable(),
  fornitore_id: z.string().uuid("Seleziona un fornitore valido.").nullable(),
  codice_cliente: z.string().nullable(),
  codice_sicep: z.string().nullable(),
  codice_fatturazione: z.string().nullable(),
  latitude: z.coerce.number().nullable(),
  longitude: z.coerce.number().nullable(),
  nome_procedura: z.string().nullable(),
});

export type PuntoServizioFormSchema = z.infer<typeof puntoServizioFormSchema>;