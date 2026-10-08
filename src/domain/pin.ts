/** Unico PIN provvisorio. I vecchi valori vuoti o '123' vengono trattati come '1234'. */
export const DEFAULT_PIN = '1234';

export const normalizePin = (pin?: string | null): string =>
  !pin || pin === '123' ? DEFAULT_PIN : pin;

export const isProvisionalPin = (pin?: string | null): boolean => normalizePin(pin) === DEFAULT_PIN;

/** Verifica il PIN inserito: confronto semplice con il PIN normalizzato dell'account. */
export const matchesPin = (stored: string | null | undefined, entered: string): boolean =>
  normalizePin(stored) === entered;
