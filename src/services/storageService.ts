import { INITIAL_EMPLOYEES, INITIAL_REQUESTS } from '../domain/mockData';
import { Employee, LocationId, Shift, ShiftRequest, UserSession } from '../domain/types';
import { formatLocalDate, generateWeeklySchedule, getSundayOfWeek } from '../engine/schedulerEngine';

const STORAGE_KEYS = {
  LOCATION: 'nicora_v4_location',
  EMPLOYEES: 'nicora_v4_employees',
  SHIFTS: 'nicora_v5_shifts',
  REQUESTS: 'nicora_v5_requests',
  SESSION: 'nicora_v4_session',
  MODE: 'nicora_v4_schedule_mode',
  DRAFTS: 'nicora_v2_generated_drafts',
  PUBLISHED_MONTHS: 'nicora_v2_published_months',
};

export const generateInitialShifts = (): Shift[] => {
  const currentSunday = getSundayOfWeek(new Date());
  const sundayStr = formatLocalDate(currentSunday);

  const gzRes = generateWeeklySchedule({
    locationId: 'gazzada',
    employees: INITIAL_EMPLOYEES,
    weekStartDate: sundayStr,
    requests: INITIAL_REQUESTS,
    mode: 'standard',
  });

  const vaRes = generateWeeklySchedule({
    locationId: 'varese',
    employees: INITIAL_EMPLOYEES,
    weekStartDate: sundayStr,
    requests: INITIAL_REQUESTS,
    mode: 'standard',
  });

  return [...gzRes.shifts, ...vaRes.shifts];
};

export const loadStoredLocation = (): LocationId => {
  const saved = localStorage.getItem(STORAGE_KEYS.LOCATION) as LocationId | null;
  return saved === 'gazzada' || saved === 'varese' ? saved : 'gazzada';
};

export const saveStoredLocation = (location: LocationId) => {
  localStorage.setItem(STORAGE_KEYS.LOCATION, location);
};

export const loadStoredEmployees = (): Employee[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    if (saved) {
      const list: Employee[] = JSON.parse(saved);
      return list.map((e) => {
        let updated = e;
        if (updated.id === 'emp-gz-5' && updated.contractHours === 30) {
          updated = { ...updated, contractHours: 40 };
        }
        if (updated.id === 'emp-gz-4' || updated.email === 'vittore@nicoragarden.it') {
          updated = { ...updated, isOwner: true, contractHours: 0 };
        }
        return updated;
      });
    }
  } catch (e) {
    console.error('Errore caricamento impiegati:', e);
  }
  return INITIAL_EMPLOYEES;
};

export const saveStoredEmployees = (employees: Employee[]) => {
  localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
};

export const loadStoredShifts = (): Shift[] => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem(STORAGE_KEYS.SHIFTS);
      if (saved) {
        const shifts: Shift[] = JSON.parse(saved);
        return shifts.filter((s) => s.employeeId !== 'emp-gz-4');
      }
    }
  } catch (e) {
    console.error('Errore caricamento turni:', e);
  }
  // Di base restituisce array vuoto per iniziare da zero e visualizzare l'effetto della generazione
  return [];
};

export const clearStoredShifts = (locationId?: LocationId, year?: number, month?: number): Shift[] => {
  if (!locationId && !year && !month) {
    localStorage.removeItem(STORAGE_KEYS.SHIFTS);
    return [];
  }
  const current = loadStoredShifts();
  let remaining: Shift[];
  if (locationId && year && month) {
    const prefix = `${year}-${month.toString().padStart(2, '0')}`;
    remaining = current.filter((s) => !(s.locationId === locationId && s.date.startsWith(prefix)));
  } else if (locationId) {
    remaining = current.filter((s) => s.locationId !== locationId);
  } else {
    remaining = [];
  }
  saveStoredShifts(remaining);
  return remaining;
};

export const saveStoredShifts = (shifts: Shift[]) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));
  }
};

export const loadStoredRequests = (): ShiftRequest[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.REQUESTS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Errore caricamento richieste:', e);
  }
  return INITIAL_REQUESTS;
};

export const saveStoredRequests = (requests: ShiftRequest[]) => {
  localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
};

export const loadStoredSession = (): UserSession | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Errore caricamento sessione:', e);
  }
  return null;
};

export const saveStoredSession = (session: UserSession | null) => {
  if (session) {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  } else {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }
};

/**
 * Esporta tutti i dati in formato JSON per backup
 */
export const exportFullBackupJson = (): string => {
  const data = {
    version: '2.0.0',
    exportDate: new Date().toISOString(),
    employees: loadStoredEmployees(),
    shifts: loadStoredShifts(),
    requests: loadStoredRequests(),
    activeLocation: loadStoredLocation(),
  };
  return JSON.stringify(data, null, 2);
};

/**
 * Ripristina i dati da file JSON di backup
 */
export const restoreFromBackupJson = (jsonString: string): boolean => {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.employees) saveStoredEmployees(parsed.employees);
    if (parsed.shifts) saveStoredShifts(parsed.shifts);
    if (parsed.requests) saveStoredRequests(parsed.requests);
    if (parsed.activeLocation) saveStoredLocation(parsed.activeLocation);
    return true;
  } catch (e) {
    console.error('Errore ripristino backup:', e);
    return false;
  }
};

/**
 * Gestione dello stato di generazione bozze per sede e mese.
 * La chiave è nel formato: `${locationId}_${year}-${String(month).padStart(2, '0')}` (es. 'gazzada_2026-09')
 */
export const getGeneratedDraftsMap = (): Record<string, boolean> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DRAFTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Errore caricamento bozze generate:', e);
  }
  return {};
};

export const hasDraftGenerated = (locationId: string, year: number, month: number): boolean => {
  const map = getGeneratedDraftsMap();
  const key = `${locationId}_${year}-${String(month).padStart(2, '0')}`;
  return !!map[key];
};

export const recordDraftGenerated = (locationId: string, year: number, month: number): void => {
  try {
    const map = getGeneratedDraftsMap();
    const key = `${locationId}_${year}-${String(month).padStart(2, '0')}`;
    map[key] = true;
    localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(map));
  } catch (e) {
    console.error('Errore salvataggio stato bozza generata:', e);
  }
};

export const resetDraftGenerated = (locationId?: string, year?: number, month?: number): void => {
  try {
    if (!locationId) {
      localStorage.removeItem(STORAGE_KEYS.DRAFTS);
      return;
    }
    const map = getGeneratedDraftsMap();
    if (year !== undefined && month !== undefined) {
      const key = `${locationId}_${year}-${String(month).padStart(2, '0')}`;
      delete map[key];
    } else {
      // Rimuovi tutte le bozze della sede indicata
      Object.keys(map).forEach((k) => {
        if (k.startsWith(`${locationId}_`)) {
          delete map[k];
        }
      });
    }
    localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(map));
  } catch (e) {
    console.error('Errore reset stato bozze generate:', e);
  }
};

/**
 * Gestione dello stato di pubblicazione dei turni per sede e mese.
 * Quando un mese è generato come bozza, isMonthPublished restituirà false finché
 * la Direzione non preme esplicitamente "Pubblica Turni".
 */
export const getPublishedMonthsMap = (): Record<string, boolean> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PUBLISHED_MONTHS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Errore caricamento mesi pubblicati:', e);
  }
  return {};
};

export const isMonthPublished = (locationId: string, year: number, month: number): boolean => {
  const draftMap = getGeneratedDraftsMap();
  const pubMap = getPublishedMonthsMap();
  const key = `${locationId}_${year}-${String(month).padStart(2, '0')}`;
  
  // Se non è mai stata generata una bozza (es. turni storici o standard di default), è considerato visibile
  if (!draftMap[key]) {
    return true;
  }
  // Se è stata generata una bozza, è pubblico solo se esplicitamente marcato come pubblicato
  return !!pubMap[key];
};

export const recordMonthPublished = (locationId: string, year: number, month: number): void => {
  try {
    const map = getPublishedMonthsMap();
    const key = `${locationId}_${year}-${String(month).padStart(2, '0')}`;
    map[key] = true;
    localStorage.setItem(STORAGE_KEYS.PUBLISHED_MONTHS, JSON.stringify(map));
  } catch (e) {
    console.error('Errore registrazione mese pubblicato:', e);
  }
};

export const recordMonthUnpublished = (locationId: string, year: number, month: number): void => {
  try {
    const map = getPublishedMonthsMap();
    const key = `${locationId}_${year}-${String(month).padStart(2, '0')}`;
    delete map[key];
    localStorage.setItem(STORAGE_KEYS.PUBLISHED_MONTHS, JSON.stringify(map));
  } catch (e) {
    console.error('Errore registrazione mese in bozza:', e);
  }
};

