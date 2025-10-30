// @ts-nocheck
// supabase/functions/import-data/utils/data-mapping.ts

export const getFieldValue = (rowData: any, keys: string[], typeConverter: (value: any) => any) => {
  for (const key of keys) {
    const value = rowData[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return typeConverter(value);
    }
  }
  return null;
};

export const toString = (value: any) => String(value).trim();
export const toNumber = (value: any) => {
  const num = Number(value);
  return isNaN(num) ? null : num;
};
export const toBoolean = (value: any) => {
  if (typeof value === 'boolean') return value;
  const s = String(value).trim().toLowerCase();
  if (s === 'true' || s === '1') return true;
  if (s === 'false' || s === '0') return false;
  return null;
};
export const toDateString = (value: any) => {
  if (!value) return null;
  try {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    }
  } catch (e) {
    if (typeof value === 'number' && value > 1) {
      const excelEpoch = new Date('1899-12-30T00:00:00Z');
      const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
  }
  return null;
};

export const isValidUuid = (uuid: any) => typeof uuid === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(uuid.trim());