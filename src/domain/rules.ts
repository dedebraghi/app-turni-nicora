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
 * A Gazzada: Cassa, Fioreria, Emporio (Area Tecnica), Serra Calda, Serra Fredda.
 * A Varese: Cassa, Fioreria, Decor, Emporio, Serra Calda, Serra Fredda (+ Natale se attiva la stagione autunno/Natale).
 */
export const getLocationDepartments = (
  locationId: LocationId,
  isChristmasSeason: boolean = false
): Department[] => {
  if (locationId === 'gazzada') {
    return ['Cassa', 'Fioreria', 'Emporio', 'Serra Calda', 'Serra Fredda'];
  }
  const vaDepts: Department[] = ['Cassa', 'Fioreria', 'Decor', 'Emporio', 'Serra Calda', 'Serra Fredda'];
  if (isChristmasSeason) {
    vaDepts.push('Natale');
  }
  return vaDepts;
};

/**
 * Normalizza il nome del reparto a seconda della sede:
 * a Gazzada 'Area Tecnica' corrisponde storicamente all'Emporio.
 */
export const normalizeDepartment = (dept?: string, locationId?: LocationId): Department | undefined => {
  if (!dept) return undefined;
  if (locationId === 'gazzada' && dept === 'Area Tecnica') {
    return 'Emporio';
  }
  return dept as Department;
};

/**
 * Livelli di importanza per reparto specificati da Vittore Nicora (Specifiche dipendenti turni.xlsx)
 */
export const DEPARTMENT_IMPORTANCE: Record<LocationId, Record<Department, number | 'STAGIONALE'>> = {
  varese: {
    Cassa: 3,
    Fioreria: 2,
    Decor: 1,
    Natale: 'STAGIONALE',
    Emporio: 2,
    'Serra Calda': 1,
    'Serra Fredda': 2,
    'Area Tecnica': 0,
  },
  gazzada: {
    Cassa: 3,
    Fioreria: 2,
    Decor: 0,
    Natale: 0,
    Emporio: 3,
    'Serra Calda': 3,
    'Serra Fredda': 3,
    'Area Tecnica': 3,
  },
};

/**
 * Fabbisogno minimo giornaliero di presidio per reparto estratto da "Necessità Personale" (Specifiche dipendenti turni.xlsx).
 * 0 = Domenica, 1 = Lunedì, ..., 6 = Sabato.
 */
export const DAILY_DEPARTMENT_REQUIREMENTS: Record<
  LocationId,
  Record<Department, (dayIndex: number, isChristmasSeason?: boolean) => number>
> = {
  varese: {
    Cassa: (day) => (day === 0 || day === 6 ? 2 : 1),
    Fioreria: () => 1,
    Decor: () => 1,
    Natale: (day, isChristmas) => {
      if (!isChristmas) return 0;
      if (day === 0 || day === 6) return 4;
      if (day === 5) return 3;
      return 2;
    },
    Emporio: () => 1,
    'Serra Calda': () => 1,
    'Serra Fredda': () => 1,
    'Area Tecnica': () => 0,
  },
  gazzada: {
    Cassa: () => 1,
    Fioreria: () => 1,
    Decor: () => 0, // A Gazzada l'importanza è 0 e il personale ha 0 competenze sul Decor (incongruenza segnalata)
    Natale: () => 0,
    Emporio: () => 1,
    'Serra Calda': () => 1,
    'Serra Fredda': () => 1,
    'Area Tecnica': () => 1,
  },
};

/**
 * Frequenza storica reale dei turni (Turni_VA_2026.pdf e Turni_GZ_26.pdf) utilizzata come criterio oggettivo
 * di spareggio in caso di parità di punteggio massimo (o punteggio 0, come per Carlo).
 */
export const HISTORICAL_PREFERRED_DEPARTMENT: Record<string, Department> = {
  // Varese
  'emp-va-1': 'Cassa',        // Stefania: Cassa 10
  'stefania': 'Cassa',
  'emp-va-2': 'Fioreria',     // Katja: Fioreria 10
  'katja': 'Fioreria',
  'emp-va-3': 'Fioreria',     // Luisa: Fioreria 8
  'luisa': 'Fioreria',
  'emp-va-4': 'Decor',        // Giancarla: Decor 10, Natale 10 -> storico: Decor presidiato tutto l'anno
  'giancarla': 'Decor',
  'emp-va-5': 'Decor',        // Giovanna: Decor 8, Natale 8 -> storico: Decor presidiato tutto l'anno
  'giovanna': 'Decor',
  'emp-va-6': 'Emporio',      // Matteo Z.: Emporio 10, Natale 10 -> storico: Emporio permanente
  'matteo z.': 'Emporio',
  'matteo': 'Emporio',
  'emp-va-7': 'Serra Fredda', // Stefano: Serra Fredda 8, Natale 8 -> storico: 8 mesi in Serra Fredda
  'stefano': 'Serra Fredda',
  'emp-va-8': 'Emporio',      // Andrea: Emporio 8
  'andrea': 'Emporio',
  'emp-va-9': 'Serra Calda',  // Francesca: Serra Calda 10
  'francesca': 'Serra Calda',
  'emp-va-10': 'Serra Calda', // Cinzia: Serra Calda 8, Decor 8, Natale 8 -> storico: Serra Calda
  'cinzia': 'Serra Calda',
  'emp-va-11': 'Serra Fredda',// Elina: Serra Fredda 6, Serra Calda 6 -> storico: Serra Fredda (anche in prestito a GZ)
  'elina': 'Serra Fredda',
  'emp-va-12': 'Serra Fredda',// Gionata: Serra Fredda 10
  'gionata': 'Serra Fredda',
  'emp-va-13': 'Serra Fredda',// Giulio: Serra Fredda 9
  'giulio': 'Serra Fredda',
  'emp-va-14': 'Serra Fredda',// Carlo: 0 in tutte le competenze -> storico: Supporto corsia / vivaio piante esterne
  'carlo': 'Serra Fredda',
  'emp-va-15': 'Natale',      // Luigi: Natale 6
  'luigi': 'Natale',
  'emp-va-16': 'Natale',      // Ivan: Natale 6
  'ivan': 'Natale',
  // Gazzada
  'emp-gz-1': 'Cassa',        // Sabrina: Cassa 10
  'sabrina': 'Cassa',
  'emp-gz-2': 'Fioreria',     // Eleonora: Fioreria 10
  'eleonora': 'Fioreria',
  'emp-gz-3': 'Fioreria',     // Matteo F. (Teo): Fioreria 8
  'matteo f.': 'Fioreria',
  'teo': 'Fioreria',
  'emp-gz-5': 'Serra Fredda', // Daniela: Serra Fredda 9
  'daniela': 'Serra Fredda',
  'emp-gz-6': 'Serra Fredda', // Ginevra: Serra Fredda 8
  'ginevra': 'Serra Fredda',
  'emp-gz-7': 'Serra Calda',  // Denis: Emporio 9, Serra Calda 9, Serra Fredda 9 -> storico: Serra Calda
  'denis': 'Serra Calda',
  'emp-gz-8': 'Serra Calda',  // Laura: Serra Calda 10
  'laura': 'Serra Calda',
  'emp-gz-9': 'Emporio',      // Ivano: Emporio 10 (Area Tecnica)
  'ivano': 'Emporio',
  'emp-gz-10': 'Serra Fredda',// Marco: Serra Fredda 10
  'marco': 'Serra Fredda',
};

/**
 * Calcola in modo univoco e dinamico il "Reparto Primario" di un collaboratore in base alla sua abilità più alta:
 * abilità più alta = reparto primario.
 * Se le abilità vengono modificate, il reparto primario si adegua immediatamente.
 * In caso di parità (o 0 su tutto come Carlo), applica la frequenza storica dimostrata nei turni PDF ufficiali.
 */
export const computePrimaryRole = (
  skills: Partial<Record<Department, number>> = {},
  locationId: LocationId,
  employeeId?: string,
  employeeName?: string
): Department => {
  const validDepts = getLocationDepartments(locationId, true);

  let maxScore = -1;
  const topDepts: Department[] = [];

  validDepts.forEach((dept) => {
    // Normalizzazione: a Gazzada accetta anche 'Area Tecnica' se presente per mappare 'Emporio'
    let score = skills[dept] ?? 0;
    if (locationId === 'gazzada' && dept === 'Emporio' && (skills['Area Tecnica'] ?? 0) > score) {
      score = skills['Area Tecnica'] ?? 0;
    }

    if (score > maxScore) {
      maxScore = score;
      topDepts.length = 0;
      topDepts.push(dept);
    } else if (score === maxScore && score > 0) {
      topDepts.push(dept);
    }
  });

  // 1. Vincitore univoco con punteggio positivo: assegnazione immediata
  if (topDepts.length === 1 && maxScore > 0) {
    return topDepts[0];
  }

  // 2. Parità o tutti 0: verifica lo storico documentale del dipendente
  const lookupKeyId = employeeId ? employeeId.toLowerCase() : '';
  const lookupKeyName = employeeName ? employeeName.toLowerCase().trim() : '';
  const historical = HISTORICAL_PREFERRED_DEPARTMENT[lookupKeyId] || HISTORICAL_PREFERRED_DEPARTMENT[lookupKeyName];

  if (historical) {
    // Se lo storico è tra i candidati a pari merito o se tutte le abilità sono 0, vince lo storico
    if (topDepts.includes(historical) || maxScore <= 0) {
      return historical;
    }
  }

  // 3. Tra pari merito contenenti Natale (stagionale) e reparti ordinari, privilegia il reparto ordinario
  const nonNataleTops = topDepts.filter((d) => d !== 'Natale');
  if (nonNataleTops.length === 1) {
    return nonNataleTops[0];
  }

  return nonNataleTops[0] || topDepts[0] || validDepts[0] || 'Cassa';
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
