/**
 * Recupera il valore di un campo da un oggetto riga, provando diverse chiavi e convertendolo al tipo desiderato.
 */
export const getFieldValue = (rowData: any, keys: string[], typeConverter: (value: any) => any) => {
  for (const key of keys) {
    const value = rowData[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return typeConverter(value);
    }
  }
  return null;
};

/** Converte un valore in stringa, rimuovendo gli spazi bianchi. */
export const toString = (value: any) => String(value).trim();

/** Converte un valore in numero. */
export const toNumber = (value: any) => {
  const num = Number(value);
  return isNaN(num) ? null : num;
};

/** Converte un valore in booleano (true per 'true'/'1', false per 'false'/'0'). */
export const toBoolean = (value: any) => {
  if (typeof value === 'boolean') return value;
  const s = String(value).trim().toLowerCase();
  if (s === 'true' || s === '1') return true;
  if (s === 'false' || s === '0') return false;
  return null;
};

/** Converte un valore in stringa data (YYYY-MM-DD), gestendo anche i formati numerici di Excel. */
export const toDateString = (value: any) => {
  if (!value) return null;
  try {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    }
  } catch (e) {
    // Tentativo di interpretare come numero di giorni da epoch Excel
    if (typeof value === 'number' && value > 1) {
      const excelEpoch = new Date('1899-12-30T00:00:00Z'); // Excel epoch (1900-01-01 è giorno 1, ma Excel ha un bug con il 1900)
      const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
  }
  return null;
};

/** Verifica se una stringa è un UUID valido. */
export const isValidUuid = (uuid: any) => typeof uuid === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(uuid.trim());