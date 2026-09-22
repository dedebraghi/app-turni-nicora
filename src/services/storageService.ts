import { INITIAL_EMPLOYEES, INITIAL_REQUESTS } from '../domain/mockData';
import { Employee, LocationId, Shift, ShiftRequest, UserSession } from '../domain/types';
import { generateWeeklySchedule, getSundayOfWeek } from '../engine/schedulerEngine';

const STORAGE_KEYS = {
  LOCATION: 'nicora_v3_location',
  EMPLOYEES: 'nicora_v3_employees',
  SHIFTS: 'nicora_v3_shifts',
  REQUESTS: 'nicora_v3_requests',
  SESSION: 'nicora_v3_session',
  MODE: 'nicora_v3_schedule_mode',
};

export const generateInitialShifts = (): Shift[] => {
  const currentSunday = getSundayOfWeek(new Date());
  const sundayStr = currentSunday.toISOString().split('T')[0];

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
    if (saved) return JSON.parse(saved);
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
    const saved = localStorage.getItem(STORAGE_KEYS.SHIFTS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Errore caricamento turni:', e);
  }
  return generateInitialShifts();
};

export const saveStoredShifts = (shifts: Shift[]) => {
  localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));
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
