// WhatsApp is turned OFF for now. Every WhatsApp entry point in the UI is gated
// on WHATSAPP_ENABLED, so re-enabling it later is a one-line change here — no
// component edits, no dead links left behind in the meantime.
export const WHATSAPP_ENABLED = false;

export const WA_NUMBER = "17065758955";

export function waLink(message: string): string {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
}
