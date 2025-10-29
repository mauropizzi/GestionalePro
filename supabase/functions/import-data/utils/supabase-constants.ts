// @ts-nocheck
// supabase/functions/import-data/utils/supabase-constants.ts

export const SERVICE_TYPES = [
  { value: "PIANTONAMENTO_ARMATO", label: "Piantonamento Armato" },
  { value: "SERVIZIO_FIDUCIARIO", label: "Servizio Fiduciario" },
  { value: "ISPEZIONI", label: "Ispezioni" },
  { value: "APERTURA_CHIUSURA", label: "Apertura/Chiusura" },
  { value: "BONIFICA", label: "Bonifica" },
];

export const INSPECTION_TYPES = [
  { value: "PERIMETRALE", label: "Perimetrale" },
  { value: "INTERNA", label: "Interna" },
  { value: "COMPLETA", label: "Completa" },
];

export const APERTURA_CHIUSURA_TYPES = [
  { value: "APERTURA_E_CHIUSURA", label: "Apertura e Chiusura" },
  { value: "SOLO_APERTURA", label: "Solo Apertura" },
  { value: "SOLO_CHIUSURA", label: "Solo Chiusura" },
];

export const daysOfWeek = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica", "Festivo"];