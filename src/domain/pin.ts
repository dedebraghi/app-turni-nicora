/** PIN provvisori/predefiniti storici: chi li ha ancora deve sceglierne uno personale. */
const PROVISIONAL_PINS = ['1234', '123'];

export const isProvisionalPin = (pin?: string | null): boolean =>
  !pin || PROVISIONAL_PINS.includes(pin);

/**
 * Verifica il PIN inserito. Se l'account è ancora provvisorio (mai personalizzato o appena
 * resettato) accetta i codici provvisori storici; altrimenti SOLO il PIN personale.
 */
export const matchesPin = (stored: string | null | undefined, entered: string): boolean =>
  isProvisionalPin(stored) ? PROVISIONAL_PINS.includes(entered) : stored === entered;
