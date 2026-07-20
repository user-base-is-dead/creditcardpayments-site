// ─────────────────────────────────────────────────────────────
// Official company contact details — SINGLE SOURCE OF TRUTH.
//
// IMPORTANT (compliance): keep these BLANK until the official,
// RBI-registered business numbers are confirmed. The app must never
// embed or display a fabricated / personal phone number.
//
// • While WHATSAPP_NUMBER is blank, WhatsApp CTAs open the WhatsApp
//   contact picker (no preset recipient) instead of dialing a made-up
//   number — the buttons still work, but no number is hard-coded.
// • While CONTACT_PHONE_DISPLAY is blank, the Contact/Footer show a
//   neutral "Available on request" instead of a phone number.
// ─────────────────────────────────────────────────────────────

// Digits only, including country code, e.g. '9180XXXXXXXX'.
export const WHATSAPP_NUMBER = '';

// Human-readable phone to display, e.g. '+91 80 XXXX XXXX'. Blank = hidden.
export const CONTACT_PHONE_DISPLAY = '';

/**
 * Build a wa.me URL. With no configured number it opens WhatsApp's contact
 * picker (no fabricated recipient), so the CTA keeps working and no number
 * is ever embedded in the shipped app.
 */
export function whatsAppUrl(message = '') {
  const base = WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}` : 'https://wa.me/';
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
