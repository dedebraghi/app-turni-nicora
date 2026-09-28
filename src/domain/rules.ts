import { Department, LocationId, ShiftType } from './types';

export const ALL_DEPARTMENTS: Department[] = [
  'Cassa',
  'Fioreria',
  'Serra Fredda',
  'Serra Calda',
  'Area Tecnica',
  'Decor',
  'Emporio',
  'Natale',
];

export const DEPARTMENTS = ALL_DEPARTMENTS;

/**
 * Restituisce i reparti effettivi e presidiabili per la sede specificata.
 * A Gazzada: Cassa, Fioreria, Serra Fredda, Serra Calda, Area Tecnica.
 * A Varese: Cassa, Fioreria, Decor, Emporio, Serra Calda, Serra Fredda (+ Natale se attiva la stagione autunno/Natale).
 */
export const getLocationDepartments = (
  locationId: LocationId,
  isChristmasSeason: boolean = false
): Department[] => {
  if (locationId === 'gazzada') {
    return ['Cassa', 'Fioreria', 'Serra Fredda', 'Serra Calda', 'Area Tecnica'];
  }
  const vaDepts: Department[] = ['Cassa', 'Fioreria', 'Decor', 'Emporio', 'Serra Calda', 'Serra Fredda'];
  if (isChristmasSeason) {
    vaDepts.push('Natale');
  }
  return vaDepts;
};

export const SHIFT_TYPES: ShiftType[] = [
  'mattina',
  'pomeriggio',
  'giornata',
  'riposo',
  'ferie',
  'malattia',
];

export const SHIFT_COLORS: Record<ShiftType, { bg: string; text: string; border: string }> = {
  mattina: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  pomeriggio: {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
  },
  giornata: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-300',
  },
  riposo: {
    bg: 'bg-neutral-100',
    text: 'text-neutral-500',
    border: 'border-neutral-200',
  },
  ferie: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  malattia: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
};

export const DEPARTMENT_COLORS: Record<Department, { bg: string; text: string; border: string; badge: string }> = {
  Cassa: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    badge: 'bg-rose-600 text-white',
  },
  Fioreria: {
    bg: 'bg-pink-50',
    text: 'text-pink-700',
    border: 'border-pink-200',
    badge: 'bg-pink-600 text-white',
  },
  'Serra Fredda': {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    badge: 'bg-sky-600 text-white',
  },
  'Serra Calda': {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    badge: 'bg-emerald-600 text-white',
  },
  'Area Tecnica': {
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
    badge: 'bg-cyan-600 text-white',
  },
  Decor: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    badge: 'bg-purple-600 text-white',
  },
  Emporio: {
    bg: 'bg-stone-50',
    text: 'text-stone-700',
    border: 'border-stone-200',
    badge: 'bg-amber-700 text-white',
  },
  Natale: {
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    border: 'border-orange-300',
    badge: 'bg-orange-700 text-white',
  },
};

// Default hours for standard operation
export const STANDARD_HOURS = {
  mattina: { start: '08:30', end: '12:30' },
  pomeriggio: { start: '14:30', end: '19:30' },
  giornata: { start: '08:30', end: '19:30' },
};

// Staggered hours for "Orario Continuato" (Mid-October through Christmas)
export const CONTINUATO_SLOTS = [
  { start: '09:00', end: '17:30', label: '09:00 - 17:30' },
  { start: '10:00', end: '18:30', label: '10:00 - 18:30' },
  { start: '11:00', end: '19:00', label: '11:00 - 19:00' },
];

export const WORK_RULES = {
  WEEK_START_DAY: 0, // Domenica
  WEEK_END_DAY: 6,   // Sabato
  DAYS_WORKED_PER_WEEK: 5,
  REST_DAYS_PER_WEEK: 2,
  DAYS_IN_WEEK: 7,
  PEAK_DAYS: [0, 6], // Domenica e Sabato
  MERCHANDISE_DAYS: [4, 5], // Giovedì e Venerdì (arrivo bilici/piante)
  QUIET_DAYS: [1, 2, 3], // Lunedì, Martedì, Mercoledì (~11% del fatturato cad.)
};
