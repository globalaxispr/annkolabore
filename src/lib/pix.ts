import QRCode from 'qrcode';

/**
 * Validates a Brazilian CPF number according to the official Receita Federal check digit algorithm.
 * Treats CPF strictly as a string to preserve leading zeroes.
 */
export function validateCpf(cpf: string): boolean {
  if (!cpf) return false;
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;

  // Reject all known repetitive invalid patterns (000.000.000-00, 111.111.111-11, etc.)
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  // Calculate 1st check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i), 10) * (10 - i);
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(cleaned.charAt(9), 10)) return false;

  // Calculate 2nd check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i), 10) * (11 - i);
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(cleaned.charAt(10), 10)) return false;

  return true;
}

/**
 * Formats an 11-digit CPF string into 000.000.000-00 display format.
 */
export function formatCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Normalizes text for EMVCo / BR Code standard:
 * Removes accents, limits length, replaces invalid characters with ASCII equivalents.
 */
function normalizeEmvText(text: string, maxLength: number): string {
  if (!text) return '';
  const normalized = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .trim()
    .toUpperCase();
  return normalized.slice(0, maxLength);
}

/**
 * Helper to construct an EMV TLV (Tag-Length-Value) chunk:
 * Format: [Tag 2 digits][Length 2 digits padded][Value]
 */
function formatTlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

/**
 * Calculates CRC-16/CCITT-FALSE checksum for EMVCo BR Code (Polynomial 0x1021, Init 0xFFFF).
 */
export function calculateCrc16(payload: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
}

export interface PixPayloadParams {
  key: string;
  keyType: string;
  name: string;
  city?: string;
  amount?: number; // In BRL, e.g. 10.00
  txId?: string;
  description?: string;
}

/**
 * Generates a valid Brazilian PIX BR Code payload (EMVCo QRCPS-MPM).
 * Complies strictly with the Banco Central do Brasil (BCB) specifications.
 */
export function generatePixPayload(params: PixPayloadParams): string {
  const rawKey = params.key?.trim() || '';
  if (!rawKey) {
    throw new Error('Kle PIX la manke.');
  }

  // Sanitize key based on type
  let sanitizedKey = rawKey;
  if (params.keyType?.toUpperCase() === 'CPF' || params.keyType?.toUpperCase() === 'CNPJ') {
    sanitizedKey = rawKey.replace(/\D/g, '');
  }

  // 1. Merchant Account Information (Tag 26)
  const gui = formatTlv('00', 'br.gov.bcb.pix');
  const keyField = formatTlv('01', sanitizedKey);
  const descField = params.description ? formatTlv('02', normalizeEmvText(params.description, 40)) : '';
  const merchantAccountInfo = formatTlv('26', `${gui}${keyField}${descField}`);

  // 2. Standard EMVCo Static Fields
  const payloadFormat = formatTlv('00', '01');
  const merchantCategoryCode = formatTlv('52', '0000');
  const transactionCurrency = formatTlv('53', '986'); // BRL

  // Optional Amount (Tag 54)
  let amountField = '';
  if (params.amount && params.amount > 0) {
    amountField = formatTlv('54', params.amount.toFixed(2));
  }

  const countryCode = formatTlv('58', 'BR');
  const merchantName = formatTlv('59', normalizeEmvText(params.name || 'CHOFE LEGLIZ', 25) || 'CHOFE LEGLIZ');
  const merchantCity = formatTlv('60', normalizeEmvText(params.city || 'SAO PAULO', 15) || 'SAO PAULO');

  // Tag 62 (Additional Data Field Template - Reference Label / TxID)
  const txIdValue = params.txId ? normalizeEmvText(params.txId, 25) : '***';
  const additionalData = formatTlv('62', formatTlv('05', txIdValue));

  // Assemble before CRC
  const rawPayload = `${payloadFormat}${merchantAccountInfo}${merchantCategoryCode}${transactionCurrency}${amountField}${countryCode}${merchantName}${merchantCity}${additionalData}6304`;

  // Compute Checksum
  const crc = calculateCrc16(rawPayload);
  return `${rawPayload}${crc}`;
}

/**
 * Renders the generated PIX BR Code payload into a High-Resolution PNG Data URL
 */
export async function generatePixQrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 2,
    scale: 8,
    color: {
      dark: '#0f172a', // Deep slate for high contrast
      light: '#ffffff',
    },
  });
}
