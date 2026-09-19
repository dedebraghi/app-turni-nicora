export type Department = 'Cassa' | 'Fioreria' | 'Decor' | 'Serra Calda' | 'Serra Fredda';

// Alias per compatibilità
export type Role = Department;

export type LocationId = 'gazzada' | 'varese';

export interface LocationInfo {
  id: LocationId;
  name: string;
  shortName: string;
  city: string;
  defaultStaffCount: number;
}

export type SkillScores = Record<Department, number>; // Punteggio 1-10 per reparto

export type ShiftType = 'mattina' | 'pomeriggio' | 'giornata' | 'riposo' | 'ferie';

export type ScheduleMode = 'standard' | 'continuato';

export interface Employee {
  id: string;
  name: string;
  locationId: LocationId;
  role: Department; // Reparto primario di riferimento
  skills: SkillScores; // Matrice competenze (1-10 per ciascuno dei 5 reparti)
  avatar: string;
  email: string;
  password?: string;
  color?: string;
  isManager?: boolean;
}

export interface UserSession {
  user: Employee;
  role: 'employee' | 'manager';
}

export interface Shift {
  id: string;
  employeeId: string;
  locationId: LocationId;
  date: string; // Formato YYYY-MM-DD
  type: ShiftType;
  department?: Department; // Reparto effettivo assegnato per questo turno
  startTime?: string; // es. '08:30' o '09:00'
  endTime?: string;   // es. '12:30' o '19:00'
  areaNote?: string;  // es. 'Cassa Principale' o 'Scarico Merci'
}

export interface ShiftRequest {
  id: string;
  requesterId: string;
  locationId: LocationId;
  type: 'swap' | 'leave'; // Scambio turno o Permesso/Ferie
  targetEmployeeId?: string; // Per scambio turno
  shiftDate: string;
  targetShiftDate?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export type ActiveTab = 'today' | 'week' | 'requests';
