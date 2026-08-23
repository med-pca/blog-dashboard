// WhatsApp is turned OFF for now. Every WhatsApp entry point in the UI is gated
// on WHATSAPP_ENABLED, so re-enabling it later is a one-line change here — no
// component edits, no dead links left behind in the meantime.
//
// BEFORE re-enabling: the Privacy Policy (pages/Kvkk.jsx, section 2) no longer
// tells visitors that a WhatsApp conversation is governed by WhatsApp's own
// policy. That disclosure has to go back before any WhatsApp link goes live.
export const WHATSAPP_ENABLED = false;

export const WA_NUMBER = "17065758955";

export function waLink(message: string): string {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
}
