export interface WhatsAppMessageData {
  groupName: string;
  eventName: string;
  tableName: string;
  qrUrl: string;
}

export const DEFAULT_WHATSAPP_TEMPLATE = `Hola {GRUPO}! 👋

Te compartimos tu código QR para el evento "{EVENTO}".

Por favor preséntalo al ingresar en la recepción.
📍 Enlace a tu código QR: {ENLACE_QR}
🍽️ Mesa asignada: {MESA}

¡Te esperamos!`;

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
