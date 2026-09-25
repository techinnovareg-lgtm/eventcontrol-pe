export interface WhatsAppMessageData {
  groupName: string;
  eventName: string;
  tableName: string;
  qrUrl: string;
}

export const DEFAULT_WHATSAPP_TEMPLATE = `Hola {GRUPO}! 👋

Te compartimos tu pase de ingreso para el evento "{EVENTO}".

📍 Enlace a tu pase QR: {ENLACE_QR}
🍽️ Mesa asignada: {MESA}

¿Nos acompañan? Avísame por este medio para confirmar tus pases y mesa. ¡Te esperamos!`;

export const FIRST_GREETING_SAFE_TEMPLATE = `¡Hola {GRUPO}! 👋

Te escribimos del equipo organizador de "{EVENTO}".

Estamos preparando la asignación de mesas y pases de ingreso. ¿Nos acompañarán en este gran día? Avísanos por este medio para enviarte tu pase QR y ubicación de mesa. ¡Muchas gracias!`;

const WA_LOGS_STORAGE_KEY = 'eventcontrol_wa_logs_v2';

export interface WALogItem {
  groupId: string;
  phone: string;
  sentAt: string;
  messageType: 'FULL_INVITATION' | 'FIRST_GREETING';
}

/**
 * Sanitizes phone numbers into clean international digits format
 */
export function sanitizePhoneForWhatsApp(phone: string, defaultCountryCode = '51'): string {
  if (!phone) return '';
  const digitsOnly = phone.replace(/\D/g, '');

  if (digitsOnly.length === 9) {
    return `${defaultCountryCode}${digitsOnly}`;
  }
  return digitsOnly;
}

/**
 * Formats template placeholders with actual group details
 */
export function formatWhatsAppMessage(template: string, data: WhatsAppMessageData): string {
  return template
    .replace(/{GRUPO}/g, data.groupName)
    .replace(/{EVENTO}/g, data.eventName)
    .replace(/{MESA}/g, data.tableName)
    .replace(/{ENLACE_QR}/g, data.qrUrl);
}

/**
 * Generates wa.me deep link that opens WhatsApp Web or App with pre-filled message
 */
export function generateWhatsAppLink(phone: string, message: string): string {
  const sanitizedPhone = sanitizePhoneForWhatsApp(phone);
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${sanitizedPhone}?text=${encodedText}`;
}

/**
 * Records sent timestamp (sent_at) for a guest group invitation
 */
export function recordWhatsAppSent(
  eventId: string,
  groupId: string,
  phone: string,
  messageType: 'FULL_INVITATION' | 'FIRST_GREETING' = 'FULL_INVITATION'
): string {
  const sentAt = new Date().toISOString();
  if (typeof window === 'undefined') return sentAt;

  try {
    const raw = localStorage.getItem(WA_LOGS_STORAGE_KEY);
    let logs: Record<string, Record<string, WALogItem>> = {};
    if (raw) logs = JSON.parse(raw);

    if (!logs[eventId]) logs[eventId] = {};
    logs[eventId][groupId] = {
      groupId,
      phone,
      sentAt,
      messageType,
    };

    localStorage.setItem(WA_LOGS_STORAGE_KEY, JSON.stringify(logs));
  } catch (err) {
    console.warn('[WhatsAppStore] Error recording sent timestamp', err);
  }

  return sentAt;
}

/**
 * Retrieves map of groupId -> WALogItem for an event
 */
export function getWhatsAppSentLogMap(eventId: string): Record<string, WALogItem> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(WA_LOGS_STORAGE_KEY);
    if (raw) {
      const logs = JSON.parse(raw);
      return logs[eventId] || {};
    }
  } catch (err) {
    console.warn('[WhatsAppStore] Error reading sent log map', err);
  }
  return {};
}
