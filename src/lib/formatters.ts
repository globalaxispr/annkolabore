/**
 * Financial calculation and currency formatting utilities.
 * All monetary amounts are handled internally as integer centavos (1 BRL = 100 centavos)
 * to eliminate floating point rounding errors.
 */

export function formatBRL(centavos: number): string {
  if (isNaN(centavos)) return 'R$ 0,00';
  const isNegative = centavos < 0;
  const absCentavos = Math.abs(Math.round(centavos));
  const reais = Math.floor(absCentavos / 100);
  const cents = absCentavos % 100;

  // Format reais with dots for thousands (Brazilian standard)
  const reaisFormatted = reais.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const centsFormatted = cents.toString().padStart(2, '0');

  const sign = isNegative ? '-' : '';
  return `${sign}R$ ${reaisFormatted},${centsFormatted}`;
}

export function parseBRLInputToCentavos(val: string | number): number {
  if (typeof val === 'number') {
    return Math.round(val * 100);
  }
  if (!val) return 0;
  // Clean string: replace comma with dot or extract digits
  const cleaned = val.replace(/[^0-9,.-]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Haitian Creole Month names
 */
const KREYOL_MONTHS: Record<number, string> = {
  0: 'Janvye',
  1: 'Fevriye',
  2: 'Mas',
  3: 'Avril',
  4: 'Me',
  5: 'Jen',
  6: 'Jiyè',
  7: 'Out',
  8: 'Septanm',
  9: 'Oktòb',
  10: 'Novanm',
  11: 'Desanm',
};

const KREYOL_MONTHS_SHORT: Record<number, string> = {
  0: 'Jan',
  1: 'Fev',
  2: 'Mas',
  3: 'Avr',
  4: 'Me',
  5: 'Jen',
  6: 'Jiy',
  7: 'Out',
  8: 'Sep',
  9: 'Okt',
  10: 'Nov',
  11: 'Des',
};

/**
 * Format a date string (YYYY-MM-DD or ISO) into readable Haitian Creole.
 */
export function formatDateCreole(dateStr: string, format: 'short' | 'long' | 'numeric' = 'short'): string {
  if (!dateStr) return '';
  const date = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00Z`);
  if (isNaN(date.getTime())) return dateStr;

  const day = date.getUTCDate().toString().padStart(2, '0');
  const monthIdx = date.getUTCMonth();
  const year = date.getUTCFullYear();

  if (format === 'numeric') {
    const monthNum = (monthIdx + 1).toString().padStart(2, '0');
    return `${day}/${monthNum}/${year}`;
  }

  if (format === 'long') {
    return `${day} ${KREYOL_MONTHS[monthIdx]} ${year}`;
  }

  return `${day} ${KREYOL_MONTHS_SHORT[monthIdx]} ${year}`;
}

/**
 * Format time in HH:mm
 */
export function formatTime(isoStr: string): string {
  if (!isoStr) return '';
  const date = new Date(isoStr);
  if (isNaN(date.getTime())) return '';
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}
