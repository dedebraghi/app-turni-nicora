export type Role = 'Cassa' | 'Serre e Piante' | 'Vivaio Esterno' | 'Decor & Vasi' | 'Logistica / Consegne';

export type ShiftType = 'mattina' | 'pomeriggio' | 'giornata' | 'riposo' | 'ferie';

export interface Employee {
  id: string;
  name: string;
  role: Role;
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
  date: string; // Formato YYYY-MM-DD
  type: ShiftType;
  startTime?: string; // es. '08:30'
  endTime?: string;   // es. '12:30'
  areaNote?: string;  // es. 'Reparto Bonsai & Cassa 1'
}

export interface ShiftRequest {
  id: string;
  requesterId: string;
  type: 'swap' | 'leave'; // Scambio turno o Permesso/Ferie
  targetEmployeeId?: string; // Per scambio turno
  shiftDate: string;
  targetShiftDate?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export type ActiveTab = 'today' | 'week' | 'requests';
