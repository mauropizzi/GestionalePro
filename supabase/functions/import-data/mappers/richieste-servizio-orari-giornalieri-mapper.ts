// @ts-nocheck
// supabase/functions/import-data/mappers/richieste-servizio-orari-giornalieri-mapper.ts
import { getFieldValue, toString, toBoolean, isValidUuid } from '../utils/data-mapping.ts';
import { daysOfWeek } from '../utils/supabase-constants.ts';

export function mapRichiesteServizioOrariGiornalieriData(rowData: any) {
  let richiesta_servizio_id = getFieldValue(rowData, ['ID Richiesta Servizio', 'richiesta_servizio_id', 'richiestaServizioId', 'ID Richiesta Servizio (UUID)'], toString);
  richiesta_servizio_id = (richiesta_servizio_id && isValidUuid(richiesta_servizio_id)) ? richiesta_servizio_id : null;
  if (!richiesta_servizio_id) {
    throw new Error('ID Richiesta Servizio is required and must be a valid UUID.');
  }

  const giorno_settimana_raw = getFieldValue(rowData, ['Giorno Settimana', 'giorno_settimana', 'giornoSettimana'], toString);
  const giorno_settimana = daysOfWeek.find(day => day.toLowerCase() === giorno_settimana_raw?.toLowerCase()) || giorno_settimana_raw;

  if (!giorno_settimana) {
    throw new Error('Giorno Settimana is required and must be a valid day of the week (Lunedì-Domenica, Festivo).');
  }

  const attivo = getFieldValue(rowData, ['Attivo', 'attivo', 'Attivo (TRUE/FALSE)'], toBoolean);
  if (attivo === null) {
    throw new Error('Attivo (TRUE/FALSE) is required.');
  }

  const h24 = getFieldValue(rowData, ['H24', 'h24', 'H24 (TRUE/FALSE)'], toBoolean);
  const ora_inizio = getFieldValue(rowData, ['Ora Inizio', 'ora_inizio', 'oraInizio', 'Ora Inizio (HH:mm)'], toString);
  const ora_fine = getFieldValue(rowData, ['Ora Fine', 'ora_fine', 'oraFine', 'Ora Fine (HH:mm)'], toString);

  if (attivo) {
    if (h24) {
      if (ora_inizio !== null || ora_fine !== null) {
        throw new Error('If H24 is true, Ora Inizio and Ora Fine must be empty.');
      }
    } else {
      if (!ora_inizio) {
        throw new Error('If not H24, Ora Inizio is required.');
      }
    }
  } else {
    if (h24 !== false || ora_inizio !== null || ora_fine !== null) {
      throw new Error('If not active, H24 must be false, and Ora Inizio/Ora Fine must be empty.');
    }
  }

  return {
    richiesta_servizio_id: richiesta_servizio_id,
    giorno_settimana: giorno_settimana,
    h24: h24,
    ora_inizio: ora_inizio,
    ora_fine: ora_fine,
    attivo: attivo,
  };
}